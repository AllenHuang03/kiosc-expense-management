// src/pages/SupplierManagement.js
import React from 'react';
import { Box, Typography, Paper, Button, CircularProgress } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useData } from '../contexts/DataContext';

const SupplierManagement = () => {
  const { loading } = useData();
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Supplier Management</Typography>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
        >
          New Supplier
        </Button>
      </Box>
      
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Coming in Sprint 2
        </Typography>
        <Typography variant="body1">
          Supplier management functionality will be implemented in the next sprint.
        </Typography>
      </Paper>
    </Box>
  );
};

export default SupplierManagement;