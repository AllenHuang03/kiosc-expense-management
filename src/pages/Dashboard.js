// src/pages/Dashboard.js
import React, { useState, useEffect, useMemo } from 'react';
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
  Tooltip,
  Tab,
  Tabs,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  TableContainer,
  MenuItem,
  Select,
  FormControl,
  InputLabel
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
  MoreVert as MoreVertIcon,
  MonetizationOn as MoneyIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  BarChart as ChartIcon,
  PieChart as PieChartIcon,
  DateRange as DateRangeIcon,
  Book as JournalIcon
} from '@mui/icons-material';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip as ChartTooltip, 
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  TimeScale
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { useData } from '../contexts/DataContext';
import { format, parseISO, subMonths } from 'date-fns';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  TimeScale,
  Title,
  ChartTooltip,
  Legend
);

// TabPanel component
function TabPanel(props) {
    const { children, value, index, ...other } = props;
    
    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`dashboard-tabpanel-${index}`}
        aria-labelledby={`dashboard-tab-${index}`}
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

// Dashboard period options
const periods = [
  { value: 'month', label: 'This Month' },
  { value: '3months', label: 'Last 3 Months' },
  { value: '6months', label: 'Last 6 Months' },
  { value: 'year', label: 'This Year' },
  { value: 'all', label: 'All Time' }
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { data, loading, error, initializeData } = useData();
  
  // Dashboard state
  const [period, setPeriod] = useState('month');
  const [tabValue, setTabValue] = useState(0);
  
  // Refresh data
  const handleRefresh = () => {
    initializeData();
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(amount);
  };
  
  // Handle period change
  const handlePeriodChange = (event) => {
    setPeriod(event.target.value);
  };
  
  // Get start date based on selected period
  const getStartDate = () => {
    const now = new Date();
    
    switch (period) {
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case '3months':
        return subMonths(now, 3);
      case '6months':
        return subMonths(now, 6);
      case 'year':
        return new Date(now.getFullYear(), 0, 1);
      case 'all':
      default:
        return new Date(2000, 0, 1); // Arbitrary old date
    }
  };
  
  // Filter expenses by date
  const filteredExpenses = useMemo(() => {
    if (!data.Expenses) return [];
    
    const startDate = getStartDate();
    
    return data.Expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= startDate;
    });
  }, [data.Expenses, period]);
  
  // Filter journal entries by date
  const filteredJournals = useMemo(() => {
    if (!data.JournalEntries) return [];
    
    const startDate = getStartDate();
    
    return data.JournalEntries.filter(journal => {
      if (journal.id === 'dummy-journal') return false;
      
      const journalDate = new Date(journal.date);
      return journalDate >= startDate;
    });
  }, [data.JournalEntries, period]);
  
  // Calculate totals by payment center
  const paymentCenterTotals = useMemo(() => {
    if (!data.PaymentCenters || !filteredExpenses.length) return [];
    
    const centers = {};
    
    // Initialize centers
    data.PaymentCenters.forEach(center => {
      centers[center.id] = {
        id: center.id,
        name: center.name,
        total: 0,
        // Generate a random budget for demo purposes
        budget: Math.round((Math.random() * 50000 + 20000) / 1000) * 1000
      };
    });
    
    // Sum expenses by payment center
    filteredExpenses.forEach(expense => {
      if (centers[expense.paymentCenter]) {
        centers[expense.paymentCenter].total += parseFloat(expense.amount) || 0;
      }
    });
    
    return Object.values(centers);
  }, [data.PaymentCenters, filteredExpenses]);
  
  // Calculate totals by program
  const programTotals = useMemo(() => {
    if (!data.Programs || !filteredExpenses.length) return [];
    
    const programs = {};
    
    // Initialize programs
    data.Programs.forEach(program => {
      programs[program.id] = {
        id: program.id,
        name: program.name,
        total: 0,
        budget: program.budget || 0
      };
    });
    
    // Sum expenses by program
    filteredExpenses.forEach(expense => {
      if (programs[expense.program]) {
        programs[expense.program].total += parseFloat(expense.amount) || 0;
      }
    });
    
    return Object.values(programs);
  }, [data.Programs, filteredExpenses]);
  
  // Calculate expense status counts
  const expenseStatusCounts = useMemo(() => {
    if (!filteredExpenses.length) return {};
    
    const counts = {
      Committed: 0,
      Invoiced: 0,
      Paid: 0
    };
    
    filteredExpenses.forEach(expense => {
      if (counts[expense.status] !== undefined) {
        counts[expense.status]++;
      }
    });
    
    return counts;
  }, [filteredExpenses]);
  
  // Calculate expense status amounts
  const expenseStatusAmounts = useMemo(() => {
    if (!filteredExpenses.length) return {};
    
    const amounts = {
      Committed: 0,
      Invoiced: 0,
      Paid: 0
    };
    
    filteredExpenses.forEach(expense => {
      if (amounts[expense.status] !== undefined) {
        amounts[expense.status] += parseFloat(expense.amount) || 0;
      }
    });
    
    return amounts;
  }, [filteredExpenses]);
  
  // Calculate journal status counts
  const journalStatusCounts = useMemo(() => {
    if (!filteredJournals.length) return {};
    
    const counts = {
      Pending: 0,
      Approved: 0,
      Rejected: 0,
      Cancelled: 0
    };
    
    filteredJournals.forEach(journal => {
      if (counts[journal.status] !== undefined) {
        counts[journal.status]++;
      }
    });
    
    return counts;
  }, [filteredJournals]);
  
  // Expense by payment center chart data
  const paymentCenterChartData = useMemo(() => {
    return {
      labels: paymentCenterTotals.map(center => center.name),
      datasets: [
        {
          label: 'Expenses',
          data: paymentCenterTotals.map(center => center.total),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        },
        {
          label: 'Budget',
          data: paymentCenterTotals.map(center => center.budget),
          backgroundColor: 'rgba(255, 206, 86, 0.6)',
          borderColor: 'rgba(255, 206, 86, 1)',
          borderWidth: 1
        }
      ]
    };
  }, [paymentCenterTotals]);
  
  // Expense by program chart data
  const programChartData = useMemo(() => {
    return {
      labels: programTotals.map(program => program.name),
      datasets: [
        {
          label: 'Expenses',
          data: programTotals.map(program => program.total),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        },
        {
          label: 'Budget',
          data: programTotals.map(program => program.budget),
          backgroundColor: 'rgba(153, 102, 255, 0.6)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1
        }
      ]
    };
  }, [programTotals]);
  
  // Expense status pie chart data
  const expenseStatusPieData = useMemo(() => {
    return {
      labels: Object.keys(expenseStatusAmounts),
      datasets: [
        {
          data: Object.values(expenseStatusAmounts),
          backgroundColor: [
            'rgba(255, 159, 64, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)'
          ],
          borderColor: [
            'rgba(255, 159, 64, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)'
          ],
          borderWidth: 1
        }
      ]
    };
  }, [expenseStatusAmounts]);
  
  // Monthly expenses line chart data
  const monthlyExpenseData = useMemo(() => {
    if (!data.Expenses) return { labels: [], datasets: [] };
    
    // Group expenses by month
    const monthlyData = {};
    const now = new Date();
    let startMonth = new Date(now.getFullYear(), now.getMonth() - 5, 1); // Last 6 months
    
    if (period === 'year') {
      startMonth = new Date(now.getFullYear(), 0, 1); // Start of the year
    } else if (period === 'all') {
      // Find the earliest expense date
      const dates = data.Expenses.map(e => new Date(e.date));
      if (dates.length > 0) {
        startMonth = new Date(Math.min(...dates));
        startMonth.setDate(1);
      }
    }
    
    // Initialize all months with zero
    let currentMonth = new Date(startMonth);
    while (currentMonth <= now) {
      const monthKey = format(currentMonth, 'yyyy-MM');
      monthlyData[monthKey] = { total: 0, count: 0 };
      currentMonth.setMonth(currentMonth.getMonth() + 1);
    }
    
    // Fill in actual expense data
    data.Expenses.forEach(expense => {
      if (!expense.date) return;
      
      const expenseDate = new Date(expense.date);
      if (expenseDate >= startMonth) {
        const monthKey = format(expenseDate, 'yyyy-MM');
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].total += parseFloat(expense.amount) || 0;
          monthlyData[monthKey].count += 1;
        }
      }
    });
    
    // Convert to arrays for chart
    const labels = Object.keys(monthlyData).map(key => {
      const [year, month] = key.split('-');
      return `${month}/${year}`;
    });
    
    const amounts = Object.values(monthlyData).map(data => data.total);
    const counts = Object.values(monthlyData).map(data => data.count);
    
    return {
      labels,
      datasets: [
        {
          label: 'Total Amount',
          data: amounts,
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          yAxisID: 'y',
          tension: 0.1
        },
        {
          label: 'Number of Expenses',
          data: counts,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          yAxisID: 'y1',
          tension: 0.1
        }
      ]
    };
  }, [data.Expenses, period]);
  
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
        <Typography variant="h4">Financial Dashboard</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 150, mr: 2 }}>
            <InputLabel>Time Period</InputLabel>
            <Select
              value={period}
              onChange={handlePeriodChange}
              label="Time Period"
            >
              {periods.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
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
      
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Expenses
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box 
                  sx={{ 
                    p: 1, 
                    borderRadius: 1, 
                    bgcolor: 'primary.light', 
                    color: 'primary.dark',
                    mr: 2
                  }}
                >
                  <MoneyIcon />
                </Box>
                <Box>
                  <Typography variant="h4" component="div">
                    {formatCurrency(filteredExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0))}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      {filteredExpenses.length} expense records
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Pending Approval
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box 
                  sx={{ 
                    p: 1, 
                    borderRadius: 1, 
                    bgcolor: 'warning.light', 
                    color: 'warning.dark',
                    mr: 2
                  }}
                >
                  <WarningIcon />
                </Box>
                <Box>
                  <Typography variant="h4" component="div">
                    {formatCurrency(
                      filteredExpenses
                        .filter(e => e.status === 'Committed')
                        .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)
                    )}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      {expenseStatusCounts.Committed || 0} committed expenses
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Journal Entries
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box 
                  sx={{ 
                    p: 1, 
                    borderRadius: 1, 
                    bgcolor: 'info.light', 
                    color: 'info.dark',
                    mr: 2
                  }}
                >
                  <JournalIcon />
                </Box>
                <Box>
                  <Typography variant="h4" component="div">
                    {filteredJournals.length}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      {journalStatusCounts.Pending || 0} pending
                    </Typography>
                    <Typography variant="body2" color="success.main" sx={{ ml: 1 }}>
                      {journalStatusCounts.Approved || 0} approved
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Budget Utilization
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box 
                  sx={{ 
                    p: 1, 
                    borderRadius: 1, 
                    bgcolor: 'success.light', 
                    color: 'success.dark',
                    mr: 2
                  }}
                >
                  <AccountBalanceIcon />
                </Box>
                <Box>
                  <Typography variant="h4" component="div">
                    {programTotals.length > 0 
                      ? Math.round(
                          (programTotals.reduce((sum, p) => sum + p.total, 0) / 
                           programTotals.reduce((sum, p) => sum + p.budget, 0)) * 100
                        ) + '%'
                      : '0%'
                    }
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      color={
                        programTotals.some(p => p.total > p.budget) 
                          ? 'error.main' 
                          : 'success.main'
                      }
                    >
                      {programTotals.some(p => p.total > p.budget) 
                        ? 'Over budget in some programs' 
                        : 'Within budget for all programs'
                      }
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Charts Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
        >
          <Tab 
            icon={<ChartIcon />} 
            iconPosition="start"
            label="Budget Utilization" 
          />
          <Tab 
            icon={<PieChartIcon />} 
            iconPosition="start"
            label="Expense Status" 
          />
          <Tab 
            icon={<DateRangeIcon />} 
            iconPosition="start"
            label="Monthly Trend" 
          />
        </Tabs>
        
        {/* Budget Utilization by Payment Center Chart */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Budget Utilization by Payment Center
            </Typography>
            <Box sx={{ height: 400 }}>
              <Bar 
                data={paymentCenterChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Amount (AUD)'
                      }
                    }
                  },
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          let label = context.dataset.label || '';
                          if (label) {
                            label += ': ';
                          }
                          if (context.parsed.y !== null) {
                            label += formatCurrency(context.parsed.y);
                          }
                          return label;
                        }
                      }
                    }
                  }
                }}
              />
            </Box>
            
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Budget Utilization by Program
              </Typography>
              <Box sx={{ height: 400 }}>
                <Bar 
                  data={programChartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'Amount (AUD)'
                        }
                      }
                    },
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                              label += ': ';
                            }
                            if (context.parsed.y !== null) {
                              label += formatCurrency(context.parsed.y);
                            }
                            return label;
                          }
                        }
                      }
                    }
                  }}
                />
              </Box>
            </Box>
          </Box>
        </TabPanel>
        
        {/* Expense Status Pie Chart */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Expense Status Distribution
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={5}>
                <Box sx={{ height: 400, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Pie 
                    data={expenseStatusPieData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'right',
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              const label = context.label || '';
                              const value = context.raw || 0;
                              const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                              const percentage = Math.round(value / total * 100);
                              return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                            }
                          }
                        }
                      }
                    }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={7}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Count</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell align="right">Percentage</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(expenseStatusCounts).map(([status, count]) => {
                        const amount = expenseStatusAmounts[status] || 0;
                        const total = Object.values(expenseStatusAmounts).reduce((a, b) => a + b, 0);
                        const percentage = total > 0 ? (amount / total * 100).toFixed(1) : '0.0';
                        
                        return (
                          <TableRow key={status}>
                            <TableCell>
                              <Chip 
                                label={status} 
                                size="small" 
                                color={
                                  status === 'Paid' ? 'success' : 
                                  status === 'Invoiced' ? 'warning' : 
                                  'default'
                                } 
                              />
                            </TableCell>
                            <TableCell align="right">{count}</TableCell>
                            <TableCell align="right">{formatCurrency(amount)}</TableCell>
                            <TableCell align="right">{percentage}%</TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          {Object.values(expenseStatusCounts).reduce((a, b) => a + b, 0)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          {formatCurrency(Object.values(expenseStatusAmounts).reduce((a, b) => a + b, 0))}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>100%</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
        
        {/* Monthly Trend Chart */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Monthly Expense Trend
            </Typography>
            <Box sx={{ height: 400 }}>
              <Line 
                data={monthlyExpenseData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  interaction: {
                    mode: 'index',
                    intersect: false,
                  },
                  scales: {
                    y: {
                      type: 'linear',
                      display: true,
                      position: 'left',
                      title: {
                        display: true,
                        text: 'Amount (AUD)'
                      }
                    },
                    y1: {
                      type: 'linear',
                      display: true,
                      position: 'right',
                      grid: {
                        drawOnChartArea: false,
                      },
                      title: {
                        display: true,
                        text: 'Number of Expenses'
                      }
                    },
                  },
                  plugins: {
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          let label = context.dataset.label || '';
                          if (label) {
                            label += ': ';
                          }
                          if (context.dataset.label === 'Total Amount') {
                            label += formatCurrency(context.parsed.y);
                          } else {
                            label += context.parsed.y;
                          }
                          return label;
                        }
                      }
                    }
                  }
                }}
              />
            </Box>
          </Box>
        </TabPanel>
      </Paper>
      
      {/* Recent Activity */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Recent Activity</Typography>
          <Box>
            <Button
              size="small"
              variant="outlined"
              onClick={() => navigate('/expenses')}
              sx={{ mr: 1 }}
            >
              View All Expenses
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => navigate('/journal')}
            >
              View All Journals
            </Button>
          </Box>
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Latest Expenses
            </Typography>
            {filteredExpenses.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="center">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredExpenses
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .slice(0, 5)
                      .map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell>{expense.date}</TableCell>
                          <TableCell>{expense.description}</TableCell>
                          <TableCell align="right">{formatCurrency(expense.amount)}</TableCell>
                          <TableCell align="center">
                            <Chip
                              label={expense.status}
                              size="small"
                              color={
                                expense.status === 'Paid' ? 'success' :
                                expense.status === 'Invoiced' ? 'warning' :
                                'default'
                              }
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">No expenses found in the selected period.</Alert>
            )}
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Latest Journal Entries
            </Typography>
            {filteredJournals.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="center">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredJournals
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .slice(0, 5)
                      .map((journal) => (
                        <TableRow key={journal.id}>
                          <TableCell>{journal.date}</TableCell>
                          <TableCell>{journal.description}</TableCell>
                          <TableCell align="right">{formatCurrency(journal.amount)}</TableCell>
                          <TableCell align="center">
                            <Chip
                              label={journal.status}
                              size="small"
                              color={
                                journal.status === 'Approved' ? 'success' :
                                journal.status === 'Pending' ? 'warning' :
                                journal.status === 'Rejected' ? 'error' :
                                'default'
                              }
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">No journal entries found in the selected period.</Alert>
            )}
          </Grid>
        </Grid>
      </Paper>
      
      {/* Alerts */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <WarningIcon color="warning" sx={{ mr: 1 }} />
          <Typography variant="h6">Alerts & Notifications</Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
        
        <List>
          {programTotals.some(p => p.total > p.budget) && (
            <ListItem>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ArrowUpIcon color="error" sx={{ mr: 1 }} />
                    <Typography color="error.main">Budget Exceeded</Typography>
                  </Box>
                }
                secondary={
                  <>
                    {programTotals
                      .filter(p => p.total > p.budget)
                      .map(p => (
                        <Typography key={p.id} variant="body2" sx={{ mt: 0.5 }}>
                          {p.name} has exceeded its budget by {formatCurrency(p.total - p.budget)}
                        </Typography>
                      ))}
                  </>
                }
              />
            </ListItem>
          )}
          
          {journalStatusCounts.Pending > 0 && (
            <ListItem>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <JournalIcon color="warning" sx={{ mr: 1 }} />
                    <Typography color="warning.main">Pending Journal Approvals</Typography>
                  </Box>
                }
                secondary={`${journalStatusCounts.Pending} journal entries pending approval`}
              />
            </ListItem>
          )}
          
          {expenseStatusCounts.Committed > 0 && (
            <ListItem>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ReceiptIcon color="warning" sx={{ mr: 1 }} />
                    <Typography color="warning.main">Committed Expenses</Typography>
                  </Box>
                }
                secondary={`${expenseStatusCounts.Committed} expenses (${formatCurrency(expenseStatusAmounts.Committed)}) are committed but not yet paid`}
              />
            </ListItem>
          )}
          
          {paymentCenterTotals.some(c => c.total / c.budget > 0.8 && c.total / c.budget < 1) && (
            <ListItem>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ArrowUpIcon color="warning" sx={{ mr: 1 }} />
                    <Typography color="warning.main">Budget Threshold Warning</Typography>
                  </Box>
                }
                secondary={
                  <>
                    {paymentCenterTotals
                      .filter(c => c.total / c.budget > 0.8 && c.total / c.budget < 1)
                      .map(c => (
                        <Typography key={c.id} variant="body2" sx={{ mt: 0.5 }}>
                          {c.name} has reached {Math.round(c.total / c.budget * 100)}% of its budget
                        </Typography>
                      ))}
                  </>
                }
              />
            </ListItem>
          )}
          
          {!programTotals.some(p => p.total > p.budget) && 
           journalStatusCounts.Pending === 0 && 
           expenseStatusCounts.Committed === 0 && 
           !paymentCenterTotals.some(c => c.total / c.budget > 0.8 && c.total / c.budget < 1) && (
            <ListItem>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                    <Typography color="success.main">All Clear</Typography>
                  </Box>
                }
                secondary="No pending issues or alerts at this time"
              />
            </ListItem>
          )}
        </List>
      </Paper>
    </Box>
  );
};

export default Dashboard;