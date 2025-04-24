// src/components/Sidebar.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  Typography
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Receipt as ExpenseIcon,
  Business as SupplierIcon,
  Book as JournalIcon,
  Category as ProgramIcon,
  AccountBalance as AccountIcon,
  Settings as SettingsIcon,
  SupervisorAccount as AdminIcon,
  PieChart as ReportIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/logo.png'; // Assuming you have a logo file

const drawerWidth = 240;

const menuItems = [
  { path: '/dashboard', name: 'Dashboard', icon: <DashboardIcon /> },
  { path: '/expenses', name: 'Expenses', icon: <ExpenseIcon /> },
  { path: '/suppliers', name: 'Suppliers', icon: <SupplierIcon /> },
  { path: '/journal', name: 'Journal Entries', icon: <JournalIcon /> },
  { path: '/programs', name: 'Programs', icon: <ProgramIcon /> },
  { path: '/accounts', name: 'Accounts', icon: <AccountIcon /> },
  { path: '/reports', name: 'Reports', icon: <ReportIcon /> },
  { divider: true },
  { path: '/settings', name: 'Settings', icon: <SettingsIcon /> },
  { 
    path: '/users', 
    name: 'User Management', 
    icon: <AdminIcon />, 
    adminOnly: true // This indicates the item is for admins only
  }
];

const Sidebar = ({ open, onClose, variant = 'permanent' }) => {
  const location = useLocation();
  const { isAdmin } = useAuth();
  
  // Filter out admin-only items if user is not an admin
  const filteredMenuItems = menuItems.filter(item => !item.adminOnly || isAdmin());
  
  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo and App Name */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
        <img src={logo} alt="KIOSC Logo" style={{ width: 40, marginRight: 10 }} />
        <Typography variant="h6" color="primary">KIOSC Finance</Typography>
      </Box>
      
      <Divider />
      
      {/* Menu Items */}
      <List component="nav" sx={{ flexGrow: 1 }}>
        {filteredMenuItems.map((item, index) => (
          item.divider ? (
            <Divider key={`divider-${index}`} sx={{ my: 1 }} />
          ) : (
            <ListItem key={item.path} disablePadding>
              <ListItemButton 
                component={Link} 
                to={item.path}
                selected={location.pathname === item.path}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'primary.light',
                    '&:hover': {
                      backgroundColor: 'primary.light',
                    }
                  }
                }}
              >
                <Tooltip title={item.name} placement="right" arrow>
                  <ListItemIcon>
                    {item.icon}
                  </ListItemIcon>
                </Tooltip>
                <ListItemText primary={item.name} />
              </ListItemButton>
            </ListItem>
          )
        ))}
      </List>
      
      <Divider />
      
      {/* Application Version */}
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          KIOSC Finance v1.0.0
        </Typography>
      </Box>
    </Box>
  );
  
  // For mobile (temporary drawer)
  if (variant === 'temporary') {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
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
    );
  }
  
  // For desktop (permanent drawer)
  return (
    <Drawer
      variant={variant}
      open={open}
      sx={{
        display: { xs: 'none', sm: 'block' },
        '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
      }}
    >
      {drawer}
    </Drawer>
  );
};