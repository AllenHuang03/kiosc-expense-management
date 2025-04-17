// src/pages/ExpenseManagement.js
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Paper, 
  Typography, 
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Grid,
  Chip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Tabs,
  Tab,
  Divider,
  Alert,
  CircularProgress,
  Tooltip,
  Badge,
  Snackbar,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination
} from '@mui/material';
import { 
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Receipt as ReceiptIcon,
  SaveAlt as SaveIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  CloudUpload as CloudUploadIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';

// Status colors
const statusColors = {
  'Committed': 'default',
  'Invoiced': 'warning',
  'Paid': 'success',
  'Cancelled': 'error'
};

// TabPanel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`expense-tabpanel-${index}`}
      aria-labelledby={`expense-tab-${index}`}
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

const ExpenseManagement = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data, loading, error, addEntity, updateEntity, deleteEntity, saveData, exportToExcel } = useData();
  const { currentUser, hasPermission } = useAuth();
  
  // Parse URL parameters
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const showNewExpense = queryParams.get('action') === 'new';
  
  // State
  const [expenses, setExpenses] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [paymentCenters, setPaymentCenters] = useState([]);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [expenseStatuses, setExpenseStatuses] = useState([]);
  
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(showNewExpense);
  const [dialogMode, setDialogMode] = useState(showNewExpense ? 'add' : null); // 'add', 'edit', 'view'
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuExpense, setMenuExpense] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Table state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Filter state
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPaymentCenter, setFilterPaymentCenter] = useState('All');
  const [filterProgram, setFilterProgram] = useState('All');
  const [filterPaymentType, setFilterPaymentType] = useState('All');
  
  // Form state
  const [expenseForm, setExpenseForm] = useState({
    id: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    supplier: '',
    amount: '',
    paymentType: '',
    paymentCenter: '',
    program: '',
    status: 'Committed',
    notes: '',
    invoiceDate: '',
    paymentDate: ''
  });
  
  // Load data from context
  useEffect(() => {
    if (data) {
      // Set expenses
      if (data.Expenses) {
        setExpenses(data.Expenses);
      }
      
      // Set suppliers
      if (data.Suppliers) {
        setSuppliers(data.Suppliers);
      }
      
      // Set programs
      if (data.Programs) {
        setPrograms(data.Programs);
      }
      
      // Set payment centers
      if (data.PaymentCenters) {
        setPaymentCenters(data.PaymentCenters);
      }
      
      // Set payment types
      if (data.PaymentTypes) {
        setPaymentTypes(data.PaymentTypes);
      }
      
      // Set expense statuses
      if (data.ExpenseStatus) {
        setExpenseStatuses(data.ExpenseStatus);
      }
    }
  }, [data]);
  
  // Reset form when adding new expense
  useEffect(() => {
    if (dialogMode === 'add') {
      setExpenseForm({
        id: uuidv4(),
        date: new Date().toISOString().split('T')[0],
        description: '',
        supplier: '',
        amount: '',
        paymentType: filterPaymentType !== 'All' ? filterPaymentType : '',
        paymentCenter: filterPaymentCenter !== 'All' ? filterPaymentCenter : '',
        program: filterProgram !== 'All' ? filterProgram : '',
        status: 'Committed',
        notes: '',
        invoiceDate: '',
        paymentDate: ''
      });
    }
  }, [dialogMode, filterPaymentCenter, filterProgram, filterPaymentType]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Open dialog for adding a new expense
  const handleAddExpense = () => {
    setDialogMode('add');
    setSelectedExpense(null);
    setDialogOpen(true);
    
    // Clear URL parameter
    if (showNewExpense) {
      navigate('/expenses', { replace: true });
    }
  };
  
  // Open dialog to edit an expense
  const handleEditExpense = (expense) => {
    setSelectedExpense(expense);
    setExpenseForm({
      ...expense,
      // Convert empty strings to actual empty values
      invoiceDate: expense.invoiceDate || '',
      paymentDate: expense.paymentDate || ''
    });
    setDialogMode('edit');
    setDialogOpen(true);
  };
  
  // Open dialog to view expense details
  const handleViewExpense = (expense) => {
    setSelectedExpense(expense);
    setExpenseForm({
      ...expense,
      // Convert empty strings to actual empty values
      invoiceDate: expense.invoiceDate || '',
      paymentDate: expense.paymentDate || ''
    });
    setDialogMode('view');
    setDialogOpen(true);
  };
  
  // Open menu for expense actions
  const handleOpenMenu = (event, expense) => {
    setAnchorEl(event.currentTarget);
    setMenuExpense(expense);
  };
  
  // Close menu
  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuExpense(null);
  };
  
  // Close dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setDialogMode(null);
    setSelectedExpense(null);
  };
  
  // Handle form field changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setExpenseForm(prev => ({ ...prev, [name]: value }));
    
    // Special handling for payment type
    if (name === 'paymentType') {
      // If Credit Card, set status to 'Paid'
      if (value === '2') { // Assuming '2' is the Credit Card payment type ID
        setExpenseForm(prev => ({ 
          ...prev, 
          [name]: value,
          status: 'Paid',
          paymentDate: new Date().toISOString().split('T')[0]
        }));
      }
    }
  };
  
  // Handle expense save (add/edit)
  const handleSaveExpense = () => {
    // Validate required fields
    if (!expenseForm.description || !expenseForm.amount || !expenseForm.supplier || 
        !expenseForm.paymentType || !expenseForm.paymentCenter || !expenseForm.program) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields',
        severity: 'error'
      });
      return;
    }
    
    try {
      // Format data
      const formattedExpense = {
        ...expenseForm,
        amount: parseFloat(expenseForm.amount),
        createdBy: currentUser?.username || 'anonymous',
        createdAt: new Date().toISOString()
      };
      
      // Save to data context
      if (dialogMode === 'add') {
        const result = addEntity('Expenses', formattedExpense);
        
        if (result) {
          setSnackbar({
            open: true,
            message: 'Expense added successfully',
            severity: 'success'
          });
        } else {
          setSnackbar({
            open: true,
            message: 'Error adding expense',
            severity: 'error'
          });
        }
      } else {
        const success = updateEntity('Expenses', selectedExpense.id, formattedExpense);
        
        if (success) {
          setSnackbar({
            open: true,
            message: 'Expense updated successfully',
            severity: 'success'
          });
        } else {
          setSnackbar({
            open: true,
            message: 'Error updating expense',
            severity: 'error'
          });
        }
      }
      
      setDialogOpen(false);
    } catch (err) {
      console.error('Error saving expense:', err);
      setSnackbar({
        open: true,
        message: `Error: ${err.message}`,
        severity: 'error'
      });
    }
  };
  
  // Handle expense deletion
  const handleDeleteExpense = (expense) => {
    setSelectedExpense(expense);
    setConfirmDeleteOpen(true);
  };
  
  // Confirm delete action
  const handleConfirmDelete = () => {
    if (selectedExpense) {
      const success = deleteEntity('Expenses', selectedExpense.id);
      
      if (success) {
        setSnackbar({
          open: true,
          message: 'Expense deleted successfully',
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: 'Error deleting expense',
          severity: 'error'
        });
      }
    }
    
    setConfirmDeleteOpen(false);
    setSelectedExpense(null);
  };
  
  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  
  // Handle status change
  const handleStatusChange = (expense, newStatus) => {
    // Create updated expense object
    const updatedExpense = { ...expense, status: newStatus };
    
    // Add dates based on status
    if (newStatus === 'Invoiced' && !updatedExpense.invoiceDate) {
      updatedExpense.invoiceDate = new Date().toISOString().split('T')[0];
    } else if (newStatus === 'Paid' && !updatedExpense.paymentDate) {
      updatedExpense.paymentDate = new Date().toISOString().split('T')[0];
    }
    
    // Save changes
    const success = updateEntity('Expenses', expense.id, updatedExpense);
    
    if (success) {
      setSnackbar({
        open: true,
        message: `Expense status updated to ${newStatus}`,
        severity: 'success'
      });
    } else {
      setSnackbar({
        open: true,
        message: 'Error updating expense status',
        severity: 'error'
      });
    }
    
    // Close the menu
    handleCloseMenu();
  };
  
  // Save to GitHub
  const handleSaveToGitHub = async () => {
    try {
      setSnackbar({
        open: true,
        message: 'Saving data to GitHub...',
        severity: 'info'
      });
      
      const success = await saveData();
      
      if (success) {
        setSnackbar({
          open: true,
          message: 'Data saved to GitHub successfully',
          severity: 'success'
        });
      } else {
        throw new Error('Failed to save to GitHub');
      }
    } catch (err) {
      console.error('GitHub save error:', err);
      setSnackbar({
        open: true,
        message: `GitHub save failed: ${err.message}`,
        severity: 'error'
      });
    }
  };
  
  // Export to Excel
  const handleExportToExcel = () => {
    try {
      setSnackbar({
        open: true,
        message: 'Exporting data to Excel...',
        severity: 'info'
      });
      
      const success = exportToExcel('KIOSC_Expenses_Export.xlsx');
      
      if (success) {
        setSnackbar({
          open: true,
          message: 'Data exported to Excel successfully',
          severity: 'success'
        });
      } else {
        throw new Error('Failed to export to Excel');
      }
    } catch (err) {
      console.error('Excel export error:', err);
      setSnackbar({
        open: true,
        message: `Excel export failed: ${err.message}`,
        severity: 'error'
      });
    }
  };
  
  // Handle table pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Filter expenses based on filters and search
  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      // Search filter
      const searchMatch = searchTerm === '' || 
        expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        suppliers.find(s => s.id === expense.supplier)?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Payment center filter
      const centerMatch = filterPaymentCenter === 'All' || 
        expense.paymentCenter === filterPaymentCenter;
      
      // Program filter
      const programMatch = filterProgram === 'All' || 
        expense.program === filterProgram;
      
      // Payment type filter
      const typeMatch = filterPaymentType === 'All' || 
        expense.paymentType === filterPaymentType;
      
      // Tab filter
      let tabMatch = true;
      if (tabValue === 1) { // Committed
        tabMatch = expense.status === 'Committed';
      } else if (tabValue === 2) { // Invoiced
        tabMatch = expense.status === 'Invoiced';
      } else if (tabValue === 3) { // Paid
        tabMatch = expense.status === 'Paid';
      }
      
      return searchMatch && centerMatch && programMatch && typeMatch && tabMatch;
    });
  }, [expenses, searchTerm, filterPaymentCenter, filterProgram, filterPaymentType, tabValue, suppliers]);
  
  // Get paginated data
  const paginatedExpenses = useMemo(() => {
    return filteredExpenses.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredExpenses, page, rowsPerPage]);
  
  // Get supplier name by ID
  const getSupplierName = (id) => {
    const supplier = suppliers.find(s => s.id === id);
    return supplier ? supplier.name : 'Unknown';
  };
  
  // Get payment center name by ID
  const getPaymentCenterName = (id) => {
    const center = paymentCenters.find(c => c.id === id);
    return center ? center.name : 'Unknown';
  };
  
  // Get program name by ID
  const getProgramName = (id) => {
    const program = programs.find(p => p.id === id);
    return program ? program.name : 'Unknown';
  };
  
  // Get payment type name by ID
  const getPaymentTypeName = (id) => {
    const type = paymentTypes.find(t => t.id === id);
    return type ? type.name : 'Unknown';
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(amount);
  };
  
  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }
  
  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Expense Management</Typography>
        
        <Box>
          <Tooltip title="Export to Excel">
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportToExcel}
              sx={{ mr: 1 }}
            >
              Export
            </Button>
          </Tooltip>
          
          <Tooltip title="Save to GitHub">
            <Button
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              onClick={handleSaveToGitHub}
              sx={{ mr: 1 }}
            >
              Save
            </Button>
          </Tooltip>
          
          {hasPermission('write') && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddExpense}
            >
              New Expense
            </Button>
          )}
        </Box>
      </Box>
      
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search Expenses"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Payment Center</InputLabel>
                  <Select
                    value={filterPaymentCenter}
                    label="Payment Center"
                    onChange={(e) => setFilterPaymentCenter(e.target.value)}
                  >
                    <MenuItem value="All">All Centers</MenuItem>
                    {paymentCenters.map((center) => (
                      <MenuItem key={center.id} value={center.id}>
                        {center.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Program</InputLabel>
                  <Select
                    value={filterProgram}
                    label="Program"
                    onChange={(e) => setFilterProgram(e.target.value)}
                  >
                    <MenuItem value="All">All Programs</MenuItem>
                    {programs.map((program) => (
                      <MenuItem key={program.id} value={program.id}>
                        {program.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Payment Type</InputLabel>
                  <Select
                    value={filterPaymentType}
                    label="Payment Type"
                    onChange={(e) => setFilterPaymentType(e.target.value)}
                  >
                    <MenuItem value="All">All Types</MenuItem>
                    {paymentTypes.map((type) => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab 
            label={
              <Badge badgeContent={filteredExpenses.length} color="primary">
                All Expenses
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge 
                badgeContent={filteredExpenses.filter(e => e.status === 'Committed').length} 
                color="default"
              >
                Committed
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge 
                badgeContent={filteredExpenses.filter(e => e.status === 'Invoiced').length} 
                color="warning"
              >
                Invoiced
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge 
                badgeContent={filteredExpenses.filter(e => e.status === 'Paid').length} 
                color="success"
              >
                Paid
              </Badge>
            } 
          />
        </Tabs>
        
        {/* Tab Panels */}
        <TabPanel value={tabValue} index={tabValue}>
          {paginatedExpenses.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Description</TableCell>
                    <TableCell>Supplier</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Payment Center</TableCell>
                    <TableCell>Program</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                
                <TableBody>
                  {paginatedExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>{getSupplierName(expense.supplier)}</TableCell>
                      <TableCell>{expense.date}</TableCell>
                      <TableCell>{getPaymentCenterName(expense.paymentCenter)}</TableCell>
                      <TableCell>{getProgramName(expense.program)}</TableCell>
                      <TableCell align="right">{formatCurrency(expense.amount)}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={expense.status}
                          size="small"
                          color={statusColors[expense.status] || 'default'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Actions">
                          <IconButton
                            size="small"
                            onClick={(e) => handleOpenMenu(e, expense)}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredExpenses.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </TableContainer>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                No expenses found matching your filters.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try changing your search criteria or create a new expense.
              </Typography>
              {hasPermission('write') && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddExpense}
                  sx={{ mt: 2 }}
                >
                  Create New Expense
                </Button>
              )}
            </Box>
          )}
        </TabPanel>
      </Paper>
      
      {/* Expense Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => {
          handleViewExpense(menuExpense);
          handleCloseMenu();
        }}>
          <ListItemIcon>
            <ReceiptIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        
        {hasPermission('write') && (
          <>
            <MenuItem onClick={() => {
              handleEditExpense(menuExpense);
              handleCloseMenu();
            }}>
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Edit Expense</ListItemText>
            </MenuItem>
            
            <Divider />
            
            {/* Status change options */}
            {menuExpense?.status === 'Committed' && (
              <MenuItem onClick={() => handleStatusChange(menuExpense, 'Invoiced')}>
                <ListItemIcon>
                  <ReceiptIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Mark as Invoiced</ListItemText>
              </MenuItem>
            )}
            
            {(menuExpense?.status === 'Committed' || menuExpense?.status === 'Invoiced') && (
              <MenuItem onClick={() => handleStatusChange(menuExpense, 'Paid')}>
                <ListItemIcon>
                  <CheckCircleIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Mark as Paid</ListItemText>
              </MenuItem>
            )}
            
            <Divider />
            
            <MenuItem onClick={() => {
              handleDeleteExpense(menuExpense);
              handleCloseMenu();
            }}>
              <ListItemIcon>
                <DeleteIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Delete Expense</ListItemText>
            </MenuItem>
          </>
        )}
      </Menu>
      
      {/* Add/Edit Expense Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'add' ? 'Add New Expense' : 
           dialogMode === 'edit' ? 'Edit Expense' : 'Expense Details'}
        </DialogTitle>
        
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={expenseForm.description}
                onChange={handleFormChange}
                margin="normal"
                required
                disabled={dialogMode === 'view'}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Date"
                name="date"
                type="date"
                value={expenseForm.date}
                onChange={handleFormChange}
                margin="normal"
                required
                disabled={dialogMode === 'view'}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Supplier</InputLabel>
                <Select
                  name="supplier"
                  value={expenseForm.supplier}
                  onChange={handleFormChange}
                  label="Supplier"
                  disabled={dialogMode === 'view'}
                >
                  {suppliers.map((supplier) => (
                    <MenuItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Amount"
                name="amount"
                type="number"
                value={expenseForm.amount}
                onChange={handleFormChange}
                margin="normal"
                required
                disabled={dialogMode === 'view'}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Payment Type</InputLabel>
                <Select
                  name="paymentType"
                  value={expenseForm.paymentType}
                  onChange={handleFormChange}
                  label="Payment Type"
                  disabled={dialogMode === 'view'}
                >
                  {paymentTypes.map((type) => (
                    <MenuItem key={type.id} value={type.id}>
                      {type.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Payment Center</InputLabel>
                <Select
                  name="paymentCenter"
                  value={expenseForm.paymentCenter}
                  onChange={handleFormChange}
                  label="Payment Center"
                  disabled={dialogMode === 'view'}
                >
                  {paymentCenters.map((center) => (
                    <MenuItem key={center.id} value={center.id}>
                      {center.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Program</InputLabel>
                <Select
                  name="program"
                  value={expenseForm.program}
                  onChange={handleFormChange}
                  label="Program"
                  disabled={dialogMode === 'view'}
                >
                  {programs.map((program) => (
                    <MenuItem key={program.id} value={program.id}>
                      {program.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={expenseForm.status}
                  onChange={handleFormChange}
                  label="Status"
                  disabled={dialogMode === 'view' || (expenseForm.paymentType === '2')} // Disable for Credit Card
                >
                  {expenseStatuses.map((status) => (
                    <MenuItem key={status.id} value={status.name}>
                      {status.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Show invoice date if status is Invoiced or Paid */}
            {(expenseForm.status === 'Invoiced' || expenseForm.status === 'Paid') && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Invoice Date"
                  name="invoiceDate"
                  type="date"
                  value={expenseForm.invoiceDate || ''}
                  onChange={handleFormChange}
                  margin="normal"
                  disabled={dialogMode === 'view'}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            )}
            
            {/* Show payment date if status is Paid */}
            {expenseForm.status === 'Paid' && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Payment Date"
                  name="paymentDate"
                  type="date"
                  value={expenseForm.paymentDate || ''}
                  onChange={handleFormChange}
                  margin="normal"
                  disabled={dialogMode === 'view'}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            )}
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                value={expenseForm.notes || ''}
                onChange={handleFormChange}
                margin="normal"
                multiline
                rows={3}
                disabled={dialogMode === 'view'}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseDialog} startIcon={<CloseIcon />}>
            {dialogMode === 'view' ? 'Close' : 'Cancel'}
          </Button>
          
          {dialogMode !== 'view' && hasPermission('write') && (
            <Button 
              onClick={handleSaveExpense} 
              variant="contained" 
              color="primary"
              startIcon={<SaveIcon />}
            >
              {dialogMode === 'add' ? 'Add Expense' : 'Save Changes'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this expense? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error" 
            variant="contained"
            startIcon={<DeleteIcon />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
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

export default ExpenseManagement;