// src/layouts/MainLayout.js - Updated with dynamic notifications
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Button,
  Badge,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Receipt as ExpenseIcon,
  Business as SupplierIcon,
  Book as JournalIcon,
  People as UserIcon,
  AccountCircle as AccountIcon,
  Notifications as NotificationIcon,
  Help as HelpIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  ChevronLeft as ChevronLeftIcon,
  ArrowUpward as ArrowUpIcon
} from '@mui/icons-material';

// Drawer width
const drawerWidth = 240;

const MainLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout, isAdmin } = useAuth();
  const { data } = useData();
  
  // State for mobile drawer
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // State for user menu
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  
  // State for help dialog
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  
  // State for notifications dialog
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  // Calculate dynamic notifications
  const notifications = useMemo(() => {
    const alerts = [];
    
    // Get pending journal entries
    if (data.JournalEntries) {
      const pendingJournals = data.JournalEntries.filter(journal => 
        journal.status === 'Pending' && journal.id !== 'dummy-journal'
      );
      if (pendingJournals.length > 0) {
        alerts.push({
          type: 'warning',
          message: `${pendingJournals.length} pending journal ${pendingJournals.length === 1 ? 'entry' : 'entries'} for approval`
        });
      }
    }
    
    // Check budget utilization
    if (data.Programs && data.Expenses) {
      data.Programs.forEach(program => {
        if (program.budget && parseFloat(program.budget) > 0) {
          const programExpenses = data.Expenses.filter(
            expense => String(expense.program) === String(program.id)
          );
          const totalSpent = programExpenses.reduce(
            (sum, expense) => sum + parseFloat(expense.amount || 0), 
            0
          );
          const utilization = (totalSpent / parseFloat(program.budget)) * 100;
          
          if (utilization > 100) {
            alerts.push({
              type: 'error',
              message: `${program.name} has exceeded its budget by ${Math.round(utilization - 100)}%`
            });
          } else if (utilization > 90) {
            alerts.push({
              type: 'warning',
              message: `${program.name} budget utilization is at ${Math.round(utilization)}%`
            });
          }
        }
      });
    }
    
    // Check committed expenses
    if (data.Expenses) {
      const committedExpenses = data.Expenses.filter(
        expense => expense.status === 'Committed'
      );
      if (committedExpenses.length > 0) {
        const totalCommitted = committedExpenses.reduce(
          (sum, expense) => sum + parseFloat(expense.amount || 0), 
          0
        );
        alerts.push({
          type: 'info',
          message: `${committedExpenses.length} committed expenses totaling $${totalCommitted.toLocaleString()}`
        });
      }
    }
    
    // If no alerts, add a success message
    if (alerts.length === 0) {
      alerts.push({
        type: 'success',
        message: 'All clear - no pending issues'
      });
    }
    
    return alerts;
  }, [data]);
  
  // Handle drawer toggle
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  
  // Handle user menu
  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };
  
  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };
  
  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
    handleUserMenuClose();
  };
  
  // Handle profile click
  const handleProfileClick = () => {
    // For now, show a simple alert. In production, this would navigate to a profile page
    alert('Profile management coming soon!');
    handleUserMenuClose();
  };
  
  // Handle help dialog
  const handleHelpDialog = () => {
    setHelpDialogOpen(!helpDialogOpen);
  };
  
  // Handle notifications
  const handleNotifications = () => {
    setNotificationsOpen(!notificationsOpen);
  };
  
  // Handle settings click
  const handleSettingsClick = () => {
    // For now, show a simple alert. In production, this would navigate to settings page
    alert('Settings management coming soon!');
  };
  
  // Navigation items
  const navItems = [
    { name: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { name: 'Expenses', icon: <ExpenseIcon />, path: '/expenses' },
    { name: 'Suppliers', icon: <SupplierIcon />, path: '/suppliers' },
    { name: 'Journal Entries', icon: <JournalIcon />, path: '/journal' },
  ];
  
  // Admin nav items - only show if user is actually admin
  const adminNavItems = isAdmin() ? [
    { name: 'User Management', icon: <UserIcon />, path: '/users' },
  ] : [];
  
  // Drawer content
  const drawer = (
    <div>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography variant="h6" noWrap component="div">
          KIOSC Finance
        </Typography>
        <IconButton onClick={handleDrawerToggle} sx={{ display: { sm: 'none' } }}>
          <ChevronLeftIcon />
        </IconButton>
      </Toolbar>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem key={item.name} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
              }}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      {adminNavItems.length > 0 && (
        <>
          <Divider />
          <List>
            {adminNavItems.map((item) => (
              <ListItem key={item.name} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => {
                    navigate(item.path);
                    setMobileOpen(false);
                  }}
                >
                  <ListItemIcon>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.name} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </>
      )}
    </div>
  );
  
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* App bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ flexGrow: 1 }}
          >
            {/* Page title based on path */}
            {navItems.find(item => item.path === location.pathname)?.name || 
             adminNavItems.find(item => item.path === location.pathname)?.name ||
             'Dashboard'}
          </Typography>
          
          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton
              size="large"
              color="inherit"
              onClick={handleNotifications}
            >
              <Badge badgeContent={notifications.length} color="error">
                <NotificationIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          
          {/* Help */}
          <Tooltip title="Help">
            <IconButton
              size="large"
              color="inherit"
              onClick={handleHelpDialog}
            >
              <HelpIcon />
            </IconButton>
          </Tooltip>
          
          {/* Settings */}
          <Tooltip title="Settings">
            <IconButton
              size="large"
              color="inherit"
              onClick={handleSettingsClick}
            >
              <SettingsIcon />
            </IconButton>
          </Tooltip>
          
          {/* User menu */}
          <Box sx={{ ml: 2 }}>
            <Button
              onClick={handleUserMenuOpen}
              color="inherit"
              startIcon={
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: 'secondary.main',
                  }}
                >
                  {currentUser?.name?.charAt(0) || 'U'}
                </Avatar>
              }
            >
              {currentUser?.name || 'User'}
            </Button>
            
            <Menu
              anchorEl={userMenuAnchor}
              open={Boolean(userMenuAnchor)}
              onClose={handleUserMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <MenuItem onClick={handleProfileClick}>
                <ListItemIcon>
                  <AccountIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Profile</ListItemText>
              </MenuItem>
              
              <Divider />
              
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Logout</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      
      {/* Help Dialog */}
      <Dialog open={helpDialogOpen} onClose={handleHelpDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Help</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Welcome to KIOSC Finance Management System!
          </Typography>
          <Typography paragraph>
            <strong>Features:</strong>
          </Typography>
          <ul>
            <li>Expense Management - Track and manage all expenses</li>
            <li>Supplier Management - Manage supplier information</li>
            <li>Journal Entries - Create and approve fund transfers</li>
            {isAdmin() && <li>User Management - Manage system users and permissions</li>}
          </ul>
          <Typography paragraph>
            <strong>Quick Tips:</strong>
          </Typography>
          <ul>
            <li>Use the dashboard to get an overview of your financial status</li>
            <li>All changes are saved to Excel automatically</li>
            <li>You can export data to PDF or CSV from each page</li>
          </ul>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleHelpDialog}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* Notifications Dialog */}
      <Dialog open={notificationsOpen} onClose={handleNotifications} maxWidth="sm" fullWidth>
        <DialogTitle>Notifications</DialogTitle>
        <DialogContent>
          {notifications.map((notification, index) => (
            <Alert 
              key={index} 
              severity={notification.type} 
              sx={{ mb: 2 }}
              icon={notification.type === 'error' ? <ArrowUpIcon /> : undefined}
            >
              {notification.message}
            </Alert>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleNotifications}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          marginTop: '64px', // Account for app bar height
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout;