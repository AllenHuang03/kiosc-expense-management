// src/layouts/MainLayout.js
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
  Tooltip
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
  ChevronLeft as ChevronLeftIcon
} from '@mui/icons-material';

// Drawer width
const drawerWidth = 240;

const MainLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout, isAdmin } = useAuth();
  
  // State for mobile drawer
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // State for user menu
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  
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
  
  // Navigation items
  const navItems = [
    { name: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { name: 'Expenses', icon: <ExpenseIcon />, path: '/expenses' },
    { name: 'Suppliers', icon: <SupplierIcon />, path: '/suppliers' },
    { name: 'Journal Entries', icon: <JournalIcon />, path: '/journal' },
  ];
  
  // Admin nav items
  const adminNavItems = [
    { name: 'User Management', icon: <UserIcon />, path: '/users' },
  ];
  
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
      
      {isAdmin() && (
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
            >
              <Badge badgeContent={3} color="error">
                <NotificationIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          
          {/* Help */}
          <Tooltip title="Help">
            <IconButton
              size="large"
              color="inherit"
            >
              <HelpIcon />
            </IconButton>
          </Tooltip>
          
          {/* Settings */}
          <Tooltip title="Settings">
            <IconButton
              size="large"
              color="inherit"
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
              <MenuItem onClick={handleUserMenuClose}>
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