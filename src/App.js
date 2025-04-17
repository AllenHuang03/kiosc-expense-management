// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { DataProvider } from './contexts/DataContext';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import ExpenseManagement from './pages/ExpenseManagement';
import SupplierManagement from './pages/SupplierManagement';
import JournalEntry from './pages/JournalEntry';
import UserManagement from './pages/UserManagement';
import NotFound from './pages/NotFound';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  // Show loading state
  if (loading) {
    return <div>Loading...</div>;
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // Render children if authenticated
  return children;
};

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: 14,
    h1: {
      fontSize: '2.2rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '1.8rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
    h4: {
      fontSize: '1.3rem',
      fontWeight: 500,
    },
    h5: {
      fontSize: '1.1rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

// App component
const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <DataProvider>
        <AuthProvider>
          <Router>
            <Routes>
              {/* Auth routes */}
              <Route path="/login" element={
                <AuthLayout>
                  <Login />
                </AuthLayout>
              } />
              
              {/* Protected routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <MainLayout>
                    <Dashboard />
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/expenses" element={
                <ProtectedRoute>
                  <MainLayout>
                    <ExpenseManagement />
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/suppliers" element={
                <ProtectedRoute>
                  <MainLayout>
                    <SupplierManagement />
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/journal" element={
                <ProtectedRoute>
                  <MainLayout>
                    <JournalEntry />
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/users" element={
                <ProtectedRoute>
                  <MainLayout>
                    <UserManagement />
                  </MainLayout>
                </ProtectedRoute>
              } />
              
              {/* Fallback route */}
              <Route path="*" element={
                <AuthLayout>
                  <NotFound />
                </AuthLayout>
              } />
            </Routes>
          </Router>
        </AuthProvider>
      </DataProvider>
    </ThemeProvider>
  );
};

export default App; 