// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useData } from './DataContext';

// Create context
const AuthContext = createContext();

// Custom hook for using the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;

// Context provider component
export const AuthProvider = ({ children }) => {
  // Get data context for user information
  const { data, loading: dataLoading, initialized } = useData();
  
  // Auth state
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Login function
  const login = useCallback((username, password) => {
    try {
      // In a real app, we'd validate the password here
      // For this demo, we'll just check if the user exists
      
      const users = data.Users || [];
      const user = users.find(u => u.username === username);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Store user in state
      setCurrentUser(user);
      setIsAuthenticated(true);
      
      // Store in session storage for persistence
      sessionStorage.setItem('currentUser', JSON.stringify(user));
      
      setError(null);
      return true;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message);
      return false;
    }
  }, [data]);
  
  // Logout function
  const logout = useCallback(() => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    sessionStorage.removeItem('currentUser');
  }, []);
  
  // Check if user has a specific permission
  const hasPermission = useCallback((permission) => {
    if (!currentUser) return false;
    return currentUser.permissions && currentUser.permissions.includes(permission);
  }, [currentUser]);
  
  // Check if user is admin
  const isAdmin = useCallback(() => {
    return hasPermission('admin');
  }, [hasPermission]);
  
  // Initialize auth state from session storage
  useEffect(() => {
    try {
      // Wait for data to be initialized
      if (!dataLoading && initialized) {
        setLoading(true);
        
        // Check for existing session
        const storedUser = sessionStorage.getItem('currentUser');
        
        if (storedUser) {
          const user = JSON.parse(storedUser);
          
          // Verify user still exists in data
          const users = data.Users || [];
          const validUser = users.find(u => u.username === user.username);
          
          if (validUser) {
            setCurrentUser(validUser);
            setIsAuthenticated(true);
          } else {
            // User no longer exists, clear session
            sessionStorage.removeItem('currentUser');
          }
        }
        
        setLoading(false);
      }
    } catch (err) {
      console.error('Auth initialization error:', err);
      setError('Failed to initialize authentication');
      setLoading(false);
    }
  }, [data, dataLoading, initialized]);
  
  // Context value
  const contextValue = {
    currentUser,
    isAuthenticated,
    loading: loading || dataLoading,
    error,
    login,
    logout,
    hasPermission,
    isAdmin
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};