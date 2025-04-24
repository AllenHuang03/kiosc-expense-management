// src/contexts/AuthContext.js - Fixed version with proper exports
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Create context
const AuthContext = createContext();

// Context provider component
export const AuthProvider = ({ children }) => {
  // Auth state
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  
  // Session timeout settings
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  const [lastActivity, setLastActivity] = useState(Date.now());
  
  // Update last activity time
  const updateActivity = useCallback(() => {
    setLastActivity(Date.now());
    if (currentUser) {
      sessionStorage.setItem('lastActivity', Date.now().toString());
    }
  }, [currentUser]);
  
  // Handle activity events
  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      updateActivity();
    };
    
    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });
    
    // Remove event listeners on cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [updateActivity]);
  
  // Check for session timeout
  useEffect(() => {
    const checkTimeout = () => {
      if (isAuthenticated) {
        const storedLastActivity = sessionStorage.getItem('lastActivity');
        const lastActivityTime = storedLastActivity ? parseInt(storedLastActivity) : lastActivity;
        
        if (Date.now() - lastActivityTime > SESSION_TIMEOUT) {
          // Session timeout - logout user
          logout();
          setError('Session expired due to inactivity. Please login again.');
        }
      }
    };
    
    // Check every minute
    const timeoutInterval = setInterval(checkTimeout, 60000);
    
    return () => clearInterval(timeoutInterval);
  }, [isAuthenticated, lastActivity]);
  
  // Add this function to handle CSV-formatted permissions
  const parseCSVPermissions = (permissionsString) => {
    if (!permissionsString) return [];
    if (Array.isArray(permissionsString)) return permissionsString;
    
    return permissionsString.split(',').map(perm => perm.trim());
  };
  
  // Set user data (to be called from DataProvider)
  const setAuthUserData = useCallback((data) => {
    setUserData(data);
  }, []);
  
  // Login function
  const login = useCallback((username, password) => {
    try {
      console.log('Login attempt for user:', username);
      
      const users = userData?.Users || [];
      console.log('Available users:', users);
      
      // Case-insensitive username check
      const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
      
      if (!user) {
        console.error('User not found:', username);
        throw new Error('User not found');
      }
      
      // Parse permissions from CSV format
      const userWithPermissions = {
        ...user,
        permissions: parseCSVPermissions(user.permissions)
      };
      
      // For demo purposes, hardcode admin access
      if (username.toLowerCase() === 'admin') {
        // Ensure admin has the correct permissions
        if (!userWithPermissions.permissions.includes('admin')) {
          userWithPermissions.permissions.push('admin');
        }
        if (!userWithPermissions.permissions.includes('write')) {
          userWithPermissions.permissions.push('write');
        }
        if (!userWithPermissions.permissions.includes('read')) {
          userWithPermissions.permissions.push('read');
        }
        
        console.log('Admin login successful with permissions:', userWithPermissions.permissions);
      }
      
      // Store user in state
      setCurrentUser(userWithPermissions);
      setIsAuthenticated(true);
      setLastActivity(Date.now());
      
      // Store in session storage for persistence
      sessionStorage.setItem('currentUser', JSON.stringify(userWithPermissions));
      sessionStorage.setItem('lastActivity', Date.now().toString());
      
      console.log('Login successful for user:', userWithPermissions.username, 'with permissions:', userWithPermissions.permissions);
      
      setError(null);
      return true;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message);
      return false;
    }
  }, [userData]);
  
  // Logout function
  const logout = useCallback(() => {
    console.log('Logging out current user');
    setCurrentUser(null);
    setIsAuthenticated(false);
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('lastActivity');
  }, []);
  
  // Check if user has a specific permission
  const hasPermission = useCallback((permission) => {
    if (!currentUser) {
      console.log('No current user, permission check failed for:', permission);
      return false;
    }
    
    const hasPermission = currentUser.permissions && currentUser.permissions.includes(permission);
    console.log(`Permission check for ${permission}:`, hasPermission, 'Current permissions:', currentUser.permissions);
    return hasPermission;
  }, [currentUser]);
  
  // Check if user is admin
  const isAdmin = useCallback(() => {
    const adminStatus = hasPermission('admin');
    console.log('Admin check result:', adminStatus);
    return adminStatus;
  }, [hasPermission]);
  
  // Initialize auth state from session storage
  useEffect(() => {
    try {
      console.log('Initializing auth state');
      
      // Check for existing session
      const storedUser = sessionStorage.getItem('currentUser');
      const storedLastActivity = sessionStorage.getItem('lastActivity');
      console.log('Stored user found in session:', !!storedUser);
      
      if (storedUser && storedLastActivity) {
        const lastActivityTime = parseInt(storedLastActivity);
        
        // Check if session is still valid
        if (Date.now() - lastActivityTime < SESSION_TIMEOUT) {
          const user = JSON.parse(storedUser);
          console.log('Retrieved user from session:', user.username);
          
          // Parse permissions
          const userWithPermissions = {
            ...user,
            permissions: parseCSVPermissions(user.permissions)
          };
          
          console.log('Valid session found, setting current user with permissions:', userWithPermissions.permissions);
          setCurrentUser(userWithPermissions);
          setIsAuthenticated(true);
          setLastActivity(Date.now());
          
          // Update session with refreshed data
          sessionStorage.setItem('currentUser', JSON.stringify(userWithPermissions));
          sessionStorage.setItem('lastActivity', Date.now().toString());
        } else {
          // Session expired
          console.log('Session expired, clearing session');
          sessionStorage.removeItem('currentUser');
          sessionStorage.removeItem('lastActivity');
          setError('Session expired. Please login again.');
        }
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Auth initialization error:', err);
      setError('Failed to initialize authentication');
      setLoading(false);
    }
  }, []);
  
  // Update user information
  const updateUser = useCallback((updatedUser) => {
    if (currentUser && updatedUser) {
      console.log('Updating user information for:', currentUser.username);
      
      // Create updated user object with original permissions intact
      const newUser = {
        ...currentUser,
        ...updatedUser,
        // Ensure permissions are not lost when updating user info
        permissions: updatedUser.permissions || currentUser.permissions
      };
      
      // Update state
      setCurrentUser(newUser);
      
      // Update session storage
      sessionStorage.setItem('currentUser', JSON.stringify(newUser));
      sessionStorage.setItem('lastActivity', Date.now().toString());
      
      return true;
    }
    return false;
  }, [currentUser]);
  
  // Context value
  const contextValue = {
    currentUser,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    hasPermission,
    isAdmin,
    updateUser,
    updateActivity,
    sessionTimeout: SESSION_TIMEOUT,
    setAuthUserData
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;