// src/pages/UserManagement.js
import React from 'react';
import { Box, Typography, Paper, Button, CircularProgress, Alert } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

const UserManagement = () => {
  const { loading } = useData();
  const { isAdmin } = useAuth();
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Check admin permission
  if (!isAdmin()) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        You don't have permission to access this page. This area is restricted to administrators only.
      </Alert>
    );
  }
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">User Management</Typography>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
        >
          New User
        </Button>
      </Box>
      
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Coming in Sprint 4
        </Typography>
        <Typography variant="body1">
          User management functionality will be implemented in a future sprint. This module will allow administrators 
          to manage users, roles, and permissions for the finance system.
        </Typography>
      </Paper>
    </Box>
  );
};

export default UserManagement;