// src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Button,
  Card,
  CardContent, 
  CardHeader,
  Divider, 
  List, 
  ListItem, 
  ListItemText,
  CircularProgress,
  Chip,
  IconButton,
  Alert,
  Tooltip
} from '@mui/material';
import { 
  Add as AddIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  Receipt as ReceiptIcon,
  Business as BusinessIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { useData } from '../contexts/DataContext';

// Budget utilization component
const BudgetUtilization = ({ title, amount, total, color }) => {
  const percentage = total > 0 ? Math.round((amount / total) * 100) : 0;
  
  return (
    <Card variant="outlined">
      <CardHeader
        title={title}
        action={
          <Tooltip title="More options">
            <IconButton size="small">
              <MoreVertIcon />
            </IconButton>
          </Tooltip>
        }
      />
      <CardContent>
        <Box sx={{ position: 'relative', display: 'inline-flex', width: '100%', justifyContent: 'center', mb: 1 }}>
          <CircularProgress
            variant="determinate"
            value={percentage}
            size={80}
            thickness={5}
            sx={{ color }}
          />
          <Box
            sx={{
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="h6" component="div" color="text.secondary">
              {`${percentage}%`}
            </Typography>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary" align="center">
          ${amount.toLocaleString()} of ${total.toLocaleString()}
        </Typography>
      </CardContent>
    </Card>
  );
};

// Key metric component
const KeyMetric = ({ title, value, previousValue, icon, color }) => {
  const change = previousValue ? ((value - previousValue) / previousValue) * 100 : 0;
  const isPositive = change >= 0;
  
  return (
    <Card variant="outlined">
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box 
            sx={{ 
              p: 1, 
              borderRadius: 1, 
              bgcolor: `${color}.light`, 
              color: `${color}.dark`,
              mr: 2
            }}
          >
            {icon}
          </Box>
          <Typography variant="h6" component="div" noWrap>
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" component="div" gutterBottom>
          ${value.toLocaleString()}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {isPositive ? (
            <TrendingUpIcon fontSize="small" color="success" />
          ) : (
            <TrendingDownIcon fontSize="small" color="error" />
          )}
          <Typography 
            variant="body2" 
            component="span" 
            sx={{ ml: 0.5, color: isPositive ? 'success.main' : 'error.main' }}
          >
            {Math.abs(change).toFixed(1)}%
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
            vs previous period
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { data, loading, error, initializeData } = useData();
  
  // Dashboard data
  const [dashboardData, setDashboardData] = useState({
    totalExpenses: 0,
    recentExpenses: [],
    paymentCenters: [],
    supplierCount: 0
  });
  
  // Refresh data
  const handleRefresh = () => {
    initializeData();
  };
  
  // Calculate dashboard data
  useEffect(() => {
    if (data?.Expenses) {
      // Calculate total expenses
      const total = data.Expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
      
      // Get recent expenses (last 5)
      const recent = [...data.Expenses]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
      
      // Calculate per payment center
      const centers = {};
      
      data.PaymentCenters?.forEach(center => {
        centers[center.id] = {
          id: center.id,
          name: center.name,
          total: 0,
          budget: Math.random() * 100000 + 50000 // Random budget for demo
        };
      });
      
      data.Expenses.forEach(expense => {
        if (centers[expense.paymentCenter]) {
          centers[expense.paymentCenter].total += (expense.amount || 0);
        }
      });
      
      // Count suppliers
      const supplierCount = data.Suppliers?.length || 0;
      
      setDashboardData({
        totalExpenses: total,
        recentExpenses: recent,
        paymentCenters: Object.values(centers),
        supplierCount
      });
    }
  }, [data]);
  
  // If loading
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // If error
  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Dashboard</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/expenses?action=new')}
          >
            New Expense
          </Button>
        </Box>
      </Box>
      
      {/* Key metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6} lg={3}>
          <KeyMetric
            title="Total Expenses"
            value={dashboardData.totalExpenses}
            previousValue={dashboardData.totalExpenses * 0.9}
            icon={<ReceiptIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <KeyMetric
            title="Committed Expenses"
            value={dashboardData.totalExpenses * 0.3}
            previousValue={dashboardData.totalExpenses * 0.25}
            icon={<AccountBalanceIcon />}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <KeyMetric
            title="Paid Expenses"
            value={dashboardData.totalExpenses * 0.7}
            previousValue={dashboardData.totalExpenses * 0.65}
            icon={<CheckCircleIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <KeyMetric
            title="Active Suppliers"
            value={dashboardData.supplierCount * 100} // Multiply for demo value
            previousValue={dashboardData.supplierCount * 90}
            icon={<BusinessIcon />}
            color="warning"
          />
        </Grid>
      </Grid>
      
      {/* Budget utilization by payment center */}
      <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
        Budget Utilization by Payment Center
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {dashboardData.paymentCenters.map((center, index) => (
          <Grid item xs={12} sm={6} md={3} key={center.id}>
            <BudgetUtilization
              title={center.name}
              amount={center.total}
              total={center.budget}
              color={
                index === 0 ? 'primary.main' :
                index === 1 ? 'secondary.main' :
                index === 2 ? 'success.main' :
                'warning.main'
              }
            />
          </Grid>
        ))}
      </Grid>
      
      {/* Recent Expenses */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Recent Expenses</Typography>
          <Button
            size="small"
            endIcon={<MoreVertIcon />}
            onClick={() => navigate('/expenses')}
          >
            View All
          </Button>
        </Box>
        <Divider sx={{ mb: 2 }} />
        {dashboardData.recentExpenses.length > 0 ? (
          <List>
            {dashboardData.recentExpenses.map((expense, index) => (
              <React.Fragment key={expense.id || index}>
                <ListItem
                  secondaryAction={
                    <Chip 
                      label={expense.status || 'Pending'} 
                      size="small"
                      color={
                        expense.status === 'Paid' ? 'success' :
                        expense.status === 'Invoiced' ? 'warning' :
                        'default'
                      }
                    />
                  }
                >
                  <ListItemText
                    primary={expense.description || 'Expense'}
                    secondary={
                      <>
                        {expense.date || new Date().toISOString().split('T')[0]} | 
                        ${(expense.amount || 0).toLocaleString()}
                      </>
                    }
                  />
                </ListItem>
                {index < dashboardData.recentExpenses.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Typography variant="body1" color="text.secondary">
              No recent expenses found
            </Typography>
          </Box>
        )}
      </Paper>
      
      {/* Alerts */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <WarningIcon color="warning" sx={{ mr: 1 }} />
          <Typography variant="h6">Alerts & Notifications</Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
        <List>
          <ListItem>
            <ListItemText
              primary="Budget threshold reached for GDC Payment Center"
              secondary="85% of allocated budget has been utilized"
            />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText
              primary="3 invoices pending approval"
              secondary="Invoices require action before payment processing"
            />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemText
              primary="New supplier registration request"
              secondary="Review and approve new supplier: Tech Solutions Inc."
            />
          </ListItem>
        </List>
      </Paper>
    </Box>
  );
};

export default Dashboard;