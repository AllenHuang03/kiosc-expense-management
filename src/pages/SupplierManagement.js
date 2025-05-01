// src/pages/SupplierManagement.js
import React, { useState, useEffect, useMemo } from 'react';
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
  Divider,
  Alert,
  CircularProgress,
  Tooltip,
  Snackbar,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  ListItemIcon,
  ListItemText,
  Card,
  CardContent,
  Tab,
  Tabs
} from '@mui/material';
import { 
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Business as BusinessIcon,
  SaveAlt as SaveIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  CloudUpload as CloudUploadIcon,
  Download as DownloadIcon,
  ContactPage as ContactIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Payment as PaymentIcon,
  Check as CheckIcon,
  Block as BlockIcon,
  PictureAsPdf as PdfIcon,
  Description as CsvIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import pdfExporter from '../utils/PdfExporter';
import dataValidator from '../utils/DataValidator';

// Supplier status colors
const statusColors = {
  'Active': 'success',
  'Inactive': 'error',
  'Pending': 'warning',
  'Blocked': 'default'
};

// TabPanel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`supplier-tabpanel-${index}`}
      aria-labelledby={`supplier-tab-${index}`}
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

const SupplierManagement = () => {
  const { data, loading, error, addEntity, updateEntity, deleteEntity, saveData, exportToExcel, exportToPdf, exportToCsv } = useData();
  const { currentUser, hasPermission } = useAuth();
  
  // State
  const [suppliers, setSuppliers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([
    { id: 1, name: 'Service Provider' },
    { id: 2, name: 'Goods Supplier' },
    { id: 3, name: 'Contractor' },
    { id: 4, name: 'Government' },
    { id: 5, name: 'Educational' },
    { id: 6, name: 'Other' }
  ]);
  
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState(null); // 'add', 'edit', 'view'
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuSupplier, setMenuSupplier] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Table state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Filter state
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  
  // Form state
  const [supplierForm, setSupplierForm] = useState({
    id: '',
    name: '',
    code: '',
    category: '',
    status: 'Active',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    abn: '',
    paymentTerms: '30',
    notes: '',
    createdAt: new Date().toISOString().split('T')[0]
  });
  
  // Form validation
  const [validationErrors, setValidationErrors] = useState([]);
  
  // Load data from context
  useEffect(() => {
    if (data) {
      // Set suppliers with deduplication
      if (data.Suppliers) {
        // Use a Map to ensure unique entries by ID
        const uniqueSuppliers = Array.from(
          new Map(data.Suppliers.map(supplier => [supplier.id, supplier])).values()
        );
        
        console.log("Suppliers loaded (unique):", uniqueSuppliers.length);
        setSuppliers(uniqueSuppliers);
      }
      
      // Set expenses for transaction history
      if (data.Expenses) {
        // Deduplicate expenses as well
        const uniqueExpenses = Array.from(
          new Map(data.Expenses.map(expense => [expense.id, expense])).values()
        );
        setExpenses(uniqueExpenses);
      }
    }
  }, [data]);
  
  // Reset form when adding new supplier
  useEffect(() => {
    if (dialogMode === 'add') {
      setSupplierForm({
        id: uuidv4(),
        name: '',
        code: generateSupplierCode(),
        category: filterCategory !== 'All' ? filterCategory : '',
        status: 'Active',
        contactName: '',
        email: '',
        phone: '',
        address: '',
        abn: '',
        paymentTerms: '30',
        notes: '',
        createdAt: new Date().toISOString().split('T')[0]
      });
    }
  }, [dialogMode, filterCategory]);
  
  // Generate a unique supplier code
  const generateSupplierCode = () => {
    const prefix = 'SUP';
    // Find the highest code number and increment by 1
    let maxCodeNumber = 0;
    suppliers.forEach(supplier => {
      if (supplier.code && supplier.code.startsWith(prefix)) {
        const codeNumber = parseInt(supplier.code.substring(prefix.length), 10);
        if (!isNaN(codeNumber) && codeNumber > maxCodeNumber) {
          maxCodeNumber = codeNumber;
        }
      }
    });
    const nextNumber = maxCodeNumber + 1;
    return `${prefix}${String(nextNumber).padStart(4, '0')}`;
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Open dialog for adding a new supplier
  const handleAddSupplier = () => {
    setDialogMode('add');
    setSelectedSupplier(null);
    setDialogOpen(true);
  };
  
  // Open dialog to edit a supplier
  const handleEditSupplier = (supplier) => {
    setSelectedSupplier(supplier);
    setSupplierForm({ ...supplier });
    setDialogMode('edit');
    setDialogOpen(true);
  };
  
  // Open dialog to view supplier details
  const handleViewSupplier = (supplier) => {
    setSelectedSupplier(supplier);
    setSupplierForm({ ...supplier });
    setDialogMode('view');
    setDialogOpen(true);
  };
  
  // Open menu for supplier actions
  const handleOpenMenu = (event, supplier) => {
    setAnchorEl(event.currentTarget);
    setMenuSupplier(supplier);
  };
  
  // Close menu
  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuSupplier(null);
  };
  
  // Close dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setDialogMode(null);
    setSelectedSupplier(null);
    setValidationErrors([]);
  };
  
  // Handle form field changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setSupplierForm(prev => ({ ...prev, [name]: value }));
    
    // Clear validation errors when field is updated
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };
  
  // Check if supplier is a duplicate
  const isDuplicateSupplier = (newSupplier) => {
    // Consider a supplier duplicate if it has the same name and category
    return suppliers.some(supplier => 
      supplier.name?.toLowerCase() === newSupplier.name?.toLowerCase() &&
      supplier.category === newSupplier.category &&
      supplier.id !== newSupplier.id
    );
  };
  
  // Handle supplier save (add/edit)
  const handleSaveSupplier = () => {
    // Validate the form data
    const validation = dataValidator.validateSupplier(supplierForm);
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }
    
    // Check for duplicates
    if (dialogMode === 'add' && isDuplicateSupplier(supplierForm)) {
      setValidationErrors(['A supplier with this name and category already exists.']);
      return;
    }
    
    try {
      // Format data
      const formattedSupplier = {
        ...supplierForm,
        modifiedBy: currentUser?.username || 'anonymous',
        modifiedAt: new Date().toISOString()
      };
      
      // Save to data context
      if (dialogMode === 'add') {
        const result = addEntity('Suppliers', formattedSupplier);
        
        if (result) {
          // Don't update state directly - the data context useEffect will handle this
          setSnackbar({
            open: true,
            message: 'Supplier added successfully',
            severity: 'success'
          });
        } else {
          setSnackbar({
            open: true,
            message: 'Error adding supplier',
            severity: 'error'
          });
        }
      } else {
        const success = updateEntity('Suppliers', selectedSupplier.id, formattedSupplier);
        
        if (success) {
          // Don't update state directly - the data context useEffect will handle this
          setSnackbar({
            open: true,
            message: 'Supplier updated successfully',
            severity: 'success'
          });
        } else {
          setSnackbar({
            open: true,
            message: 'Error updating supplier',
            severity: 'error'
          });
        }
      }
      
      setDialogOpen(false);
      setValidationErrors([]);
    } catch (err) {
      console.error('Error saving supplier:', err);
      setSnackbar({
        open: true,
        message: `Error: ${err.message}`,
        severity: 'error'
      });
    }
  };
  
  // Handle supplier deletion
  const handleDeleteSupplier = (supplier) => {
    setSelectedSupplier(supplier);
    setConfirmDeleteOpen(true);
  };
  
  // Confirm delete action
  const handleConfirmDelete = () => {
    if (selectedSupplier) {
      const success = deleteEntity('Suppliers', selectedSupplier.id);
      
      if (success) {
        setSnackbar({
          open: true,
          message: 'Supplier deleted successfully',
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: 'Error deleting supplier',
          severity: 'error'
        });
      }
    }
    
    setConfirmDeleteOpen(false);
    setSelectedSupplier(null);
  };
  
  // Handle status change
  const handleStatusChange = (supplier, newStatus) => {
    // Create updated supplier object
    const updatedSupplier = { 
      ...supplier, 
      status: newStatus,
      modifiedBy: currentUser?.username || 'anonymous',
      modifiedAt: new Date().toISOString()
    };
    
    // Save changes
    const success = updateEntity('Suppliers', supplier.id, updatedSupplier);
    
    if (success) {
      setSnackbar({
        open: true,
        message: `Supplier status updated to ${newStatus}`,
        severity: 'success'
      });
    } else {
      setSnackbar({
        open: true,
        message: 'Error updating supplier status',
        severity: 'error'
      });
    }
    
    // Close the menu
    handleCloseMenu();
  };
  
  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
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
      
      const success = exportToExcel('KIOSC_Suppliers_Export.xlsx');
      
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
  
  // Export to PDF
  const handleExportToPdf = () => {
    try {
      setSnackbar({
        open: true,
        message: 'Generating PDF...',
        severity: 'info'
      });
      
      // Get filtered suppliers for export
      const suppliersToExport = filteredSuppliers;
      
      // Generate PDF document
      const doc = pdfExporter.exportSuppliersToPdf(
        suppliersToExport, 
        categories,
        `${tabValue === 0 ? 'All' : 
           tabValue === 1 ? 'Active' : 
           tabValue === 2 ? 'Inactive' : 
           'Pending'} Suppliers`
      );
      
      // Save the PDF
      doc.save('KIOSC_Suppliers_Report.pdf');
      
      setSnackbar({
        open: true,
        message: 'PDF generated successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error('PDF export error:', err);
      setSnackbar({
        open: true,
        message: `PDF export failed: ${err.message}`,
        severity: 'error'
      });
    }
  };
  
  // Export to CSV
  const handleExportToCsv = () => {
    try {
      setSnackbar({
        open: true,
        message: 'Exporting data to CSV...',
        severity: 'info'
      });
      
      const success = exportToCsv('suppliers', {
        categories: categories,
        filename: 'KIOSC_Suppliers.csv'
      });
      
      if (success) {
        setSnackbar({
          open: true,
          message: 'Data exported to CSV successfully',
          severity: 'success'
        });
      } else {
        throw new Error('Failed to export to CSV');
      }
    } catch (err) {
      console.error('CSV export error:', err);
      setSnackbar({
        open: true,
        message: `CSV export failed: ${err.message}`,
        severity: 'error'
      });
    }
  };
  
  // Export supplier details to PDF
  const handleExportSupplierDetailsToPdf = (supplier) => {
    try {
      setSnackbar({
        open: true,
        message: 'Generating supplier details PDF...',
        severity: 'info'
      });
      
      // Get transactions for the supplier
      const transactions = getSupplierTransactions(supplier.id);
      
      // Generate PDF document
      const doc = pdfExporter.exportSupplierDetailsToPdf(
        supplier,
        categories,
        transactions
      );
      
      // Save the PDF
      doc.save(`Supplier_${supplier.code}_Details.pdf`);
      
      setSnackbar({
        open: true,
        message: 'Supplier details PDF generated successfully',
        severity: 'success'
      });
      
      // Close menu if open
      if (Boolean(anchorEl)) {
        handleCloseMenu();
      }
    } catch (err) {
      console.error('PDF export error:', err);
      setSnackbar({
        open: true,
        message: `PDF export failed: ${err.message}`,
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
  
  // Get supplier transactions
  const getSupplierTransactions = (supplierId) => {
    return expenses.filter(expense => expense.supplier === supplierId);
  };
  
  // Calculate total transactions for a supplier
  const getSupplierTotalTransactions = (supplierId) => {
    const transactions = getSupplierTransactions(supplierId);
    return transactions.reduce((total, expense) => total + (parseFloat(expense.amount) || 0), 0);
  };
  
  // Get category name by ID
  const getCategoryName = (id) => {
    if (!id) return 'Unknown';
    const category = categories.find(c => c.id === parseInt(id) || c.id === id);
    return category ? category.name : 'Unknown';
  };
  
  // Filter suppliers based on filters and search
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(supplier => {
      // Search filter
      const searchMatch = !searchTerm ||
        (supplier.name && supplier.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (supplier.code && supplier.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (supplier.contactName && supplier.contactName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (supplier.email && supplier.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (supplier.phone && supplier.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (supplier.abn && supplier.abn.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Category filter
      const categoryMatch = filterCategory === 'All' || 
        supplier.category == filterCategory; // Using loose equality to match string and number
      
      // Status filter
      const statusMatch = filterStatus === 'All' || 
        supplier.status === filterStatus;
      
      // Tab filter
      let tabMatch = true;
      if (tabValue === 1) { // Active
        tabMatch = supplier.status === 'Active';
      } else if (tabValue === 2) { // Inactive
        tabMatch = supplier.status === 'Inactive';
      } else if (tabValue === 3) { // Pending
        tabMatch = supplier.status === 'Pending';
      }
      
      return searchMatch && categoryMatch && statusMatch && tabMatch;
    });
  }, [suppliers, searchTerm, filterCategory, filterStatus, tabValue]);
  
  // Get paginated data
  const paginatedSuppliers = useMemo(() => {
    return filteredSuppliers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredSuppliers, page, rowsPerPage]);
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(amount || 0);
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
        <Typography variant="h4">Supplier Management</Typography>
        
        <Box>
          <Tooltip title="Export to CSV">
            <Button
              variant="outlined"
              startIcon={<CsvIcon />}
              onClick={handleExportToCsv}
              sx={{ mr: 1 }}
            >
              CSV
            </Button>
          </Tooltip>
          
          <Tooltip title="Export to PDF">
            <Button
              variant="outlined"
              startIcon={<PdfIcon />}
              onClick={handleExportToPdf}
              sx={{ mr: 1 }}
            >
              PDF
            </Button>
          </Tooltip>
          
          <Tooltip title="Export to Excel">
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportToExcel}
              sx={{ mr: 1 }}
            >
              Excel
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
              onClick={handleAddSupplier}
            >
              New Supplier
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
              label="Search Suppliers"
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
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={filterCategory}
                    label="Category"
                    onChange={(e) => setFilterCategory(e.target.value)}
                  >
                    <MenuItem value="All">All Categories</MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filterStatus}
                    label="Status"
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <MenuItem value="All">All Statuses</MenuItem>
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="Blocked">Blocked</MenuItem>
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
              <Chip 
                label={`All Suppliers (${suppliers.length})`} 
                color="primary"
              />
            } 
          />
          <Tab 
            label={
              <Chip 
                label={`Active (${suppliers.filter(s => s.status === 'Active').length})`} 
                color="success"
              />
            } 
          />
          <Tab 
            label={
              <Chip 
                label={`Inactive (${suppliers.filter(s => s.status === 'Inactive').length})`} 
                color="error"
              />
            } 
          />
          <Tab 
            label={
              <Chip 
                label={`Pending (${suppliers.filter(s => s.status === 'Pending').length})`} 
                color="warning"
              />
            } 
          />
        </Tabs>
        
        {/* Tab Panels */}
        <TabPanel value={tabValue} index={tabValue}>
          {paginatedSuppliers.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Email/Phone</TableCell>
                    <TableCell align="right">Transactions</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                
                <TableBody>
                  {paginatedSuppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell>{supplier.code}</TableCell>
                      <TableCell>
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            cursor: 'pointer'
                          }}
                          onClick={() => handleViewSupplier(supplier)}
                        >
                          <BusinessIcon fontSize="small" color="primary" sx={{ mr: 1 }} />
                          {supplier.name}
                        </Box>
                      </TableCell>
                      <TableCell>{getCategoryName(supplier.category)}</TableCell>
                      <TableCell>{supplier.contactName}</TableCell>
                      <TableCell>
                        {supplier.email && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            <EmailIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                            {supplier.email}
                          </Box>
                        )}
                        {supplier.phone && (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <PhoneIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                            {supplier.phone}
                          </Box>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(getSupplierTotalTransactions(supplier.id))}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={supplier.status}
                          size="small"
                          color={statusColors[supplier.status] || 'default'}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Actions">
                          <IconButton
                            size="small"
                            onClick={(e) => handleOpenMenu(e, supplier)}
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
                count={filteredSuppliers.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </TableContainer>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                No suppliers found matching your filters.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try changing your search criteria or create a new supplier.
              </Typography>
              {hasPermission('write') && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddSupplier}
                  sx={{ mt: 2 }}
                >
                  Create New Supplier
                </Button>
              )}
            </Box>
          )}
        </TabPanel>
      </Paper>
      
      {/* Supplier Actions Menu */}
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
          handleViewSupplier(menuSupplier);
          handleCloseMenu();
        }}>
          <ListItemIcon>
            <BusinessIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => handleExportSupplierDetailsToPdf(menuSupplier)}>
          <ListItemIcon>
            <PdfIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export to PDF</ListItemText>
        </MenuItem>
        
        {hasPermission('write') && (
          <>
            <MenuItem onClick={() => {
              handleEditSupplier(menuSupplier);
              handleCloseMenu();
            }}>
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Edit Supplier</ListItemText>
            </MenuItem>
            
            <Divider />
            
            {/* Status change options */}
            {menuSupplier?.status !== 'Active' && (
              <MenuItem onClick={() => handleStatusChange(menuSupplier, 'Active')}>
                <ListItemIcon>
                  <CheckIcon fontSize="small" color="success" />
                </ListItemIcon>
                <ListItemText>Mark as Active</ListItemText>
              </MenuItem>
            )}
            
            {menuSupplier?.status !== 'Inactive' && (
              <MenuItem onClick={() => handleStatusChange(menuSupplier, 'Inactive')}>
                <ListItemIcon>
                  <BlockIcon fontSize="small" color="error" />
                </ListItemIcon>
                <ListItemText>Mark as Inactive</ListItemText>
              </MenuItem>
            )}
            
            {menuSupplier?.status !== 'Pending' && (
              <MenuItem onClick={() => handleStatusChange(menuSupplier, 'Pending')}>
                <ListItemIcon>
                  <MoreVertIcon fontSize="small" color="warning" />
                </ListItemIcon>
                <ListItemText>Mark as Pending</ListItemText>
              </MenuItem>
            )}
            
            <Divider />
            
            <MenuItem onClick={() => {
              handleDeleteSupplier(menuSupplier);
              handleCloseMenu();
            }}>
              <ListItemIcon>
                <DeleteIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Delete Supplier</ListItemText>
            </MenuItem>
          </>
        )}
      </Menu>
      
      {/* Add/Edit Supplier Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'add' ? 'Add New Supplier' : 
           dialogMode === 'edit' ? 'Edit Supplier' : 'Supplier Details'}
        </DialogTitle>
        
        <DialogContent dividers>
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert 
              severity="error" 
              sx={{ mb: 2 }}
              icon={<ErrorIcon />}
            >
              <Typography variant="subtitle2" gutterBottom>
                Please fix the following errors:
              </Typography>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </Alert>
          )}
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Supplier Name"
                name="name"
                value={supplierForm.name}
                onChange={handleFormChange}
                margin="normal"
                required
                disabled={dialogMode === 'view'}
                error={validationErrors.some(error => error.includes('name'))}
                helperText={validationErrors.find(error => error.includes('name'))}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Supplier Code"
                name="code"
                value={supplierForm.code}
                onChange={handleFormChange}
                margin="normal"
                required
                disabled={dialogMode === 'view' || dialogMode === 'edit'}
                helperText={dialogMode === 'add' ? "Auto-generated, can be modified" : ""}
                error={validationErrors.some(error => error.includes('code'))}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal" required error={validationErrors.some(error => error.includes('Category'))}>
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={supplierForm.category}
                  onChange={handleFormChange}
                  label="Category"
                  disabled={dialogMode === 'view'}
                >
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
                {validationErrors.some(error => error.includes('Category')) && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                    {validationErrors.find(error => error.includes('Category'))}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={supplierForm.status}
                  onChange={handleFormChange}
                  label="Status"
                  disabled={dialogMode === 'view'}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Blocked">Blocked</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }}>
                <Chip label="Contact Information" />
              </Divider>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Contact Name"
                name="contactName"
                value={supplierForm.contactName || ''}
                onChange={handleFormChange}
                margin="normal"
                disabled={dialogMode === 'view'}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={supplierForm.email || ''}
                onChange={handleFormChange}
                margin="normal"
                disabled={dialogMode === 'view'}
                error={validationErrors.some(error => error.includes('email'))}
                helperText={validationErrors.find(error => error.includes('email'))}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={supplierForm.phone || ''}
                onChange={handleFormChange}
                margin="normal"
                disabled={dialogMode === 'view'}
                error={validationErrors.some(error => error.includes('phone'))}
                helperText={validationErrors.find(error => error.includes('phone'))}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="ABN/Tax ID"
                name="abn"
                value={supplierForm.abn || ''}
                onChange={handleFormChange}
                margin="normal"
                disabled={dialogMode === 'view'}
                error={validationErrors.some(error => error.includes('ABN'))}
                helperText={validationErrors.find(error => error.includes('ABN'))}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                name="address"
                value={supplierForm.address || ''}
                onChange={handleFormChange}
                margin="normal"
                multiline
                rows={2}
                disabled={dialogMode === 'view'}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }}>
                <Chip label="Payment Details" />
              </Divider>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Payment Terms (Days)</InputLabel>
                <Select
                  name="paymentTerms"
                  value={supplierForm.paymentTerms || '30'}
                  onChange={handleFormChange}
                  label="Payment Terms (Days)"
                  disabled={dialogMode === 'view'}
                >
                  <MenuItem value="7">7 days</MenuItem>
                  <MenuItem value="14">14 days</MenuItem>
                  <MenuItem value="30">30 days</MenuItem>
                  <MenuItem value="45">45 days</MenuItem>
                  <MenuItem value="60">60 days</MenuItem>
                  <MenuItem value="90">90 days</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                value={supplierForm.notes || ''}
                onChange={handleFormChange}
                margin="normal"
                multiline
                rows={3}
                disabled={dialogMode === 'view'}
              />
            </Grid>
            
            {/* Transaction history for 'view' mode */}
            {dialogMode === 'view' && selectedSupplier && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }}>
                    <Chip label="Transaction History" />
                  </Divider>
                </Grid>
                
                <Grid item xs={12}>
                  {getSupplierTransactions(selectedSupplier.id).length > 0 ? (
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Amount</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {getSupplierTransactions(selectedSupplier.id)
                            .sort((a, b) => new Date(b.date) - new Date(a.date))
                            .slice(0, 5)
                            .map((transaction) => (
                              <TableRow key={transaction.id}>
                                <TableCell>{transaction.date}</TableCell>
                                <TableCell>{transaction.description}</TableCell>
                                <TableCell>
                                  <Chip 
                                    label={transaction.status} 
                                    size="small" 
                                    color={
                                      transaction.status === 'Paid' ? 'success' :
                                      transaction.status === 'Invoiced' ? 'warning' :
                                      'default'
                                    } 
                                  />
                                </TableCell>
                                <TableCell align="right">{formatCurrency(transaction.amount)}</TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Alert severity="info">No transaction history available for this supplier.</Alert>
                  )}
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseDialog} startIcon={<CloseIcon />}>
            {dialogMode === 'view' ? 'Close' : 'Cancel'}
          </Button>
          
          {dialogMode !== 'view' && hasPermission('write') && (
            <Button 
              onClick={handleSaveSupplier} 
              variant="contained" 
              color="primary"
              startIcon={<SaveIcon />}
            >
              {dialogMode === 'add' ? 'Add Supplier' : 'Save Changes'}
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
            Are you sure you want to delete this supplier? This action cannot be undone.
          </Typography>
          
          {getSupplierTransactions(selectedSupplier?.id)?.length > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              This supplier has associated transactions. Deleting it may affect expense records.
            </Alert>
          )}
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

export default SupplierManagement;