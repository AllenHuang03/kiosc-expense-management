// src/pages/Settings.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Divider,
  Alert,
  TextField,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Switch,
  FormControlLabel,
  CircularProgress,
  Snackbar,
  InputAdornment,
  IconButton,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  Select,
  MenuItem
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Palette as PaletteIcon,
  Notifications as NotificationsIcon,
  Storage as StorageIcon,
  Security as SecurityIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import githubService from '../services/GitHubService';

// TabPanel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Settings = () => {
  const { currentUser, updateUser } = useAuth();
  const { saveData } = useData();
  
  // Tab state
  const [tabValue, setTabValue] = useState(0);
  
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: ''
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    showPassword: false
  });
  
  const [appSettings, setAppSettings] = useState({
    darkMode: false,
    compactView: false,
    enableNotifications: true,
    alertThreshold: 80
  });
  
  const [dataSettings, setDataSettings] = useState({
    autoSave: false,
    backupFrequency: 'weekly',
    exportFormat: 'excel'
  });
  
  const [gitHubSettings, setGitHubSettings] = useState({
    repository: '',
    branch: '',
    token: '',
    showToken: false
  });
  
  // Initialize forms with user data
  useEffect(() => {
    if (currentUser) {
      setProfileForm({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || ''
      });
    }
    
    // Load GitHub settings from config
    const loadGitHubSettings = async () => {
      try {
        const config = await githubService.getConfig();
        setGitHubSettings({
          repository: `${config.owner}/${config.repository}` || '',
          branch: config.branch || 'main',
          token: '••••••••••••••••', // mask token
          showToken: false
        });
      } catch (error) {
        console.error('Error loading GitHub settings:', error);
      }
    };
    
    loadGitHubSettings();
    
    // Load app settings from localStorage
    const savedAppSettings = localStorage.getItem('kioscAppSettings');
    if (savedAppSettings) {
      try {
        setAppSettings(JSON.parse(savedAppSettings));
      } catch (e) {
        console.error('Error parsing saved app settings:', e);
      }
    }
    
    // Load data settings from localStorage
    const savedDataSettings = localStorage.getItem('kioscDataSettings');
    if (savedDataSettings) {
      try {
        setDataSettings(JSON.parse(savedDataSettings));
      } catch (e) {
        console.error('Error parsing saved data settings:', e);
      }
    }
  }, [currentUser]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Handle profile form change
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle password form change
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };
  
  // Toggle password visibility
  const handleTogglePasswordVisibility = () => {
    setPasswordForm(prev => ({ ...prev, showPassword: !prev.showPassword }));
  };
  
  // Handle app settings change
  const handleAppSettingChange = (name, value) => {
    setAppSettings(prev => {
      const newSettings = { ...prev, [name]: value };
      // Save to localStorage
      localStorage.setItem('kioscAppSettings', JSON.stringify(newSettings));
      return newSettings;
    });
  };
  
  // Handle data settings change
  const handleDataSettingChange = (name, value) => {
    setDataSettings(prev => {
      const newSettings = { ...prev, [name]: value };
      // Save to localStorage
      localStorage.setItem('kioscDataSettings', JSON.stringify(newSettings));
      return newSettings;
    });
  };
  
  // Handle GitHub settings change
  const handleGitHubSettingChange = (e) => {
    const { name, value } = e.target;
    setGitHubSettings(prev => ({ ...prev, [name]: value }));
  };
  
  // Toggle GitHub token visibility
  const handleToggleTokenVisibility = () => {
    setGitHubSettings(prev => ({ ...prev, showToken: !prev.showToken }));
  };
  
  // Save profile
  const handleSaveProfile = async () => {
    setLoading(true);
    
    try {
      // In a real app, this would be an API call
      // For this demo, we'll just use a timeout to simulate an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update auth context
      updateUser({
        ...currentUser,
        name: profileForm.name,
        email: profileForm.email,
        phone: profileForm.phone
      });
      
      setSnackbar({
        open: true,
        message: 'Profile updated successfully',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error updating profile: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Change password
  const handleChangePassword = async () => {
    // Validate passwords
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setSnackbar({
        open: true,
        message: 'Passwords do not match',
        severity: 'error'
      });
      return;
    }
    
    if (passwordForm.newPassword.length < 8) {
      setSnackbar({
        open: true,
        message: 'Password must be at least 8 characters long',
        severity: 'error'
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // In a real app, this would be an API call
      // For this demo, we'll just use a timeout to simulate an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSnackbar({
        open: true,
        message: 'Password changed successfully',
        severity: 'success'
      });
      
      // Reset form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        showPassword: false
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error changing password: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Save GitHub settings
  const handleSaveGitHubSettings = async () => {
    setLoading(true);
    
    try {
      // In a real app, this would update the config
      // For this demo, we'll just save to GitHub
      await saveData();
      
      setSnackbar({
        open: true,
        message: 'GitHub settings saved successfully',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error saving GitHub settings: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Test GitHub connection
  const handleTestGitHubConnection = async () => {
    setLoading(true);
    
    try {
      const connected = await githubService.testConnection();
      
      if (connected) {
        setSnackbar({
          open: true,
          message: 'Successfully connected to GitHub',
          severity: 'success'
        });
      } else {
        throw new Error('Connection failed');
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: `GitHub connection failed: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  
  // If loading
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
        <Typography variant="h4">Settings</Typography>
      </Box>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<PersonIcon />} iconPosition="start" label="Profile" />
          <Tab icon={<LockIcon />} iconPosition="start" label="Password" />
          <Tab icon={<PaletteIcon />} iconPosition="start" label="Appearance" />
          <Tab icon={<StorageIcon />} iconPosition="start" label="Data" />
          <Tab icon={<CloudUploadIcon />} iconPosition="start" label="GitHub" />
        </Tabs>
        
        {/* Profile Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              User Profile
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Update your personal information
            </Typography>
            
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="name"
                  value={profileForm.name}
                  onChange={handleProfileChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={profileForm.email}
                  onChange={handleProfileChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  name="phone"
                  value={profileForm.phone}
                  onChange={handleProfileChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveProfile}
                  >
                    Save Profile
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
        
        {/* Password Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Change Password
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Update your password to keep your account secure
            </Typography>
            
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Current Password"
                  name="currentPassword"
                  type={passwordForm.showPassword ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  margin="normal"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleTogglePasswordVisibility}
                          edge="end"
                        >
                          {passwordForm.showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="New Password"
                  name="newPassword"
                  type={passwordForm.showPassword ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Confirm New Password"
                  name="confirmPassword"
                  type={passwordForm.showPassword ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<LockIcon />}
                    onClick={handleChangePassword}
                  >
                    Change Password
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
        
        {/* Appearance Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Appearance Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Customize the application's appearance
            </Typography>
            
            <List sx={{ mt: 2 }}>
              <ListItem>
                <ListItemIcon>
                  <PaletteIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Dark Mode" 
                  secondary="Use dark theme across the application"
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={appSettings.darkMode}
                    onChange={(e) => handleAppSettingChange('darkMode', e.target.checked)}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
              
              <ListItem>
                <ListItemIcon>
                  <PaletteIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Compact View" 
                  secondary="Use a more compact layout to fit more content on screen"
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={appSettings.compactView}
                    onChange={(e) => handleAppSettingChange('compactView', e.target.checked)}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
              
              <ListItem>
                <ListItemIcon>
                  <NotificationsIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Enable Notifications" 
                  secondary="Receive notifications about important events"
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={appSettings.enableNotifications}
                    onChange={(e) => handleAppSettingChange('enableNotifications', e.target.checked)}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
              
              <ListItem>
                <ListItemIcon>
                  <NotificationsIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Budget Alert Threshold" 
                  secondary="Receive alerts when budget utilization exceeds this percentage"
                />
                <ListItemSecondaryAction>
                  <TextField
                    type="number"
                    size="small"
                    value={appSettings.alertThreshold}
                    onChange={(e) => handleAppSettingChange('alertThreshold', parseInt(e.target.value) || 0)}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      inputProps: { min: 0, max: 100 }
                    }}
                    sx={{ width: 100 }}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </Box>
        </TabPanel>
        
        {/* Data Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Data Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Configure data management settings
            </Typography>
            
            <List sx={{ mt: 2 }}>
              <ListItem>
                <ListItemIcon>
                  <StorageIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Auto Save" 
                  secondary="Automatically save data changes to GitHub"
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={dataSettings.autoSave}
                    onChange={(e) => handleDataSettingChange('autoSave', e.target.checked)}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
              
              <ListItem>
                <ListItemIcon>
                  <StorageIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Backup Frequency" 
                  secondary="How often to create data backups"
                />
                <ListItemSecondaryAction>
                  <Select
                    value={dataSettings.backupFrequency}
                    onChange={(e) => handleDataSettingChange('backupFrequency', e.target.value)}
                    size="small"
                    sx={{ width: 120 }}
                  >
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                    <MenuItem value="never">Never</MenuItem>
                  </Select>
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
              
              <ListItem>
                <ListItemIcon>
                  <StorageIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Default Export Format" 
                  secondary="Default format for exporting data"
                />
                <ListItemSecondaryAction>
                  <Select
                    value={dataSettings.exportFormat}
                    onChange={(e) => handleDataSettingChange('exportFormat', e.target.value)}
                    size="small"
                    sx={{ width: 120 }}
                  >
                    <MenuItem value="excel">Excel</MenuItem>
                    <MenuItem value="pdf">PDF</MenuItem>
                    <MenuItem value="csv">CSV</MenuItem>
                  </Select>
                </ListItemSecondaryAction>
              </ListItem>
            </List>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={() => {
                  localStorage.setItem('kioscDataSettings', JSON.stringify(dataSettings));
                  setSnackbar({
                    open: true,
                    message: 'Data settings saved successfully',
                    severity: 'success'
                  });
                }}
              >
                Save Data Settings
              </Button>
            </Box>
          </Box>
        </TabPanel>
        
        {/* GitHub Tab */}
        <TabPanel value={tabValue} index={4}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              GitHub Integration
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Configure GitHub repository settings for data storage
            </Typography>
            
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Repository"
                  name="repository"
                  value={gitHubSettings.repository}
                  onChange={handleGitHubSettingChange}
                  margin="normal"
                  helperText="Format: owner/repository"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Branch"
                  name="branch"
                  value={gitHubSettings.branch}
                  onChange={handleGitHubSettingChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Personal Access Token"
                  name="token"
                  type={gitHubSettings.showToken ? 'text' : 'password'}
                  value={gitHubSettings.token}
                  onChange={handleGitHubSettingChange}
                  margin="normal"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleToggleTokenVisibility}
                          edge="end"
                        >
                          {gitHubSettings.showToken ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  helperText="GitHub Personal Access Token with repo scope"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  The GitHub integration allows you to store your financial data in a private repository.
                  Make sure your access token has the necessary permissions to read and write to the repository.
                </Alert>
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 2 }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<RefreshIcon />}
                    onClick={handleTestGitHubConnection}
                  >
                    Test Connection
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveGitHubSettings}
                  >
                    Save GitHub Settings
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
      </Paper>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;