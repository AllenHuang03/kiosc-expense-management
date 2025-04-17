// src/pages/JournalEntry.js
import React from 'react';
import { Box, Typography, Paper, Button, CircularProgress } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useData } from '../contexts/DataContext';

const JournalEntry = () => {
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
        <Typography variant="h4">Journal Entry</Typography>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
        >
          New Journal Entry
        </Button>
      </Box>
      
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Coming in Sprint 3
        </Typography>
        <Typography variant="body1">
          Journal entry functionality will be implemented in a future sprint. This module will allow for inter-account 
          and inter-program fund transfers with a complete audit trail.
        </Typography>
      </Paper>
    </Box>
  );
};

export default JournalEntry;