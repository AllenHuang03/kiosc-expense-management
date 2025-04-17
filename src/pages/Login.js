// src/pages/Login.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Alert, 
  InputAdornment, 
  IconButton,
  CircularProgress
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  LockOutlined as LockIcon 
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, error: authError, loading: authLoading } = useAuth();
  const { loading: dataLoading, initialized } = useData();
  
  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  
  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setFormError('');
    
    // Check if username and password are provided
    if (!username.trim() || !password.trim()) {
      setFormError('Please enter both username and password');
      return;
    }
    
    // Attempt login
    const success = await login(username, password);
    
    if (success) {
      // Navigate to dashboard on success
      navigate('/');
    }
  };
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);
  
  // Show loading state if data is still loading
  if (dataLoading || !initialized) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '300px'
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Initializing system...
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Box 
          sx={{ 
            display: 'inline-flex', 
            p: 2, 
            borderRadius: '50%', 
            bgcolor: 'primary.main', 
            color: 'primary.contrastText', 
            mb: 2 
          }}
        >
          <LockIcon fontSize="large" />
        </Box>
        <Typography variant="h4" gutterBottom>
          Sign In
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Enter your credentials to access the KIOSC Finance System
        </Typography>
      </Box>

      <form onSubmit={handleSubmit}>
        {/* Error messages */}
        {(formError || authError) && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {formError || authError}
          </Alert>
        )}
        
        {/* Username field */}
        <TextField
          fullWidth
          label="Username"
          variant="outlined"
          margin="normal"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoFocus
        />
        
        {/* Password field */}
        <TextField
          fullWidth
          label="Password"
          variant="outlined"
          margin="normal"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        
        {/* Submit button */}
        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          sx={{ mt: 3, mb: 2 }}
          disabled={authLoading}
        >
          {authLoading ? (
            <>
              <CircularProgress size={24} sx={{ mr: 1 }} color="inherit" />
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </Button>
      </form>
      
      <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 3 }}>
        Demo credentials: username - admin, password - any value
      </Typography>
    </Box>
  );
};

export default Login;