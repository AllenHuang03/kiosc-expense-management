// src/layouts/AuthLayout.js
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Link,
  Paper
} from '@mui/material';

const AuthLayout = ({ children }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: 'background.default'
      }}
    >
      {/* Header */}
      <Box
        component="header"
        sx={{
          py: 2,
          bgcolor: 'primary.main',
          color: 'primary.contrastText'
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{
              textDecoration: 'none',
              color: 'inherit',
              fontWeight: 'bold'
            }}
          >
            KIOSC Finance Management
          </Typography>
        </Container>
      </Box>
      
      {/* Main content */}
      <Container 
        maxWidth="sm" 
        sx={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          py: 4
        }}
      >
        <Paper
          elevation={3}
          sx={{
            py: 4,
            px: 3,
            borderRadius: 2
          }}
        >
          {children}
        </Paper>
      </Container>
      
      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 2,
          backgroundColor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider'
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
          >
            © {new Date().getFullYear()} KIOSC Finance Management System
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
          >
            <Link component={RouterLink} to="/" color="inherit">
              Home
            </Link>{' | '}
            <Link href="#" color="inherit">
              Privacy Policy
            </Link>{' | '}
            <Link href="#" color="inherit">
              Terms of Service
            </Link>
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default AuthLayout;