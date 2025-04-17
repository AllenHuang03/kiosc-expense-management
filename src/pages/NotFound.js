// src/pages/NotFound.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button,
  Container
} from '@mui/material';
import { 
  SentimentDissatisfied as SadIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';

const NotFound = () => {
  const navigate = useNavigate();
  
  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 6
        }}
      >
        <SadIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
        
        <Typography variant="h2" align="center" gutterBottom>
          404
        </Typography>
        
        <Typography variant="h4" align="center" gutterBottom>
          Page Not Found
        </Typography>
        
        <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4, maxWidth: 500 }}>
          The page you are looking for might have been removed, had its name changed, 
          or is temporarily unavailable.
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          size="large"
        >
          Back to Home
        </Button>
      </Box>
    </Container>
  );
};

export default NotFound;