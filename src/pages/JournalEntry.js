// src/pages/JournalEntry.js - Updated with double-entry accounting
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
  Badge,
  Snackbar,
  Card,
  CardContent,
  ListItemIcon,
  ListItemText,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  FormControlLabel,
  Radio,
  RadioGroup
} from '@mui/material';
import { 
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Book as JournalIcon,
  SaveAlt as SaveIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  CloudUpload as CloudUploadIcon,
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  Description as CsvIcon,
  Error as ErrorIcon,
  Visibility as ViewIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  SwapHoriz as TransferIcon,
  AddCircle as AddLineIcon,
  RemoveCircle as RemoveLineIcon
} from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import dataValidator from '../utils/DataValidator';
import { format } from 'date-fns';

// Journal entry status colors
const statusColors = {
  'Pending': 'warning',
  'Approved': 'success',
  'Rejected': 'error',
  'Cancelled': 'default'
};

const JournalEntry = () => {
  const { data, loading, error, addEntity, updateEntity, deleteEntity, saveData, exportToExcel, exportToPdf, exportToCsv } = useData();
  const { currentUser, hasPermission, isAdmin } = useAuth();
  
  // State
  const [journals, setJournals] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [paymentCenters, setPaymentCenters] = useState([]);
  
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState(null); // 'add', 'edit', 'view', 'approve'
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuJournal, setMenuJournal] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Table state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDateRange, setFilterDateRange] = useState({ start: '', end: '' });
  const [filterStatus, setFilterStatus] = useState('All');
  
  // Journal entry lines for double-entry accounting
  const [journalLines, setJournalLines] = useState([]);
  
  // Form state
  const [journalForm, setJournalForm] = useState({
    id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
    reference: '',
    status: 'Pending',
    notes: '',
    createdBy: currentUser?.username || 'anonymous',
    createdAt: new Date().toISOString(),
    approvedBy: '',
    approvedAt: '',
    rejectedBy: '',
    rejectedAt: '',
    reason: ''
  });
  
  // Form validation
  const [validationErrors, setValidationErrors] = useState([]);
  
  // Load data from context
  useEffect(() => {
    if (data) {
      // Set journal entries - prevent duplicates
      if (data.JournalEntries) {
        // Use a Map to ensure unique entries by ID
        const uniqueJournals = Array.from(
          new Map(data.JournalEntries.map(journal => [journal.id, journal])).values()
        );
        
        // Ensure each journal has its lines loaded
        uniqueJournals.forEach(journal => {
          if (!journal.lines && data.JournalLines) {
            // Find lines for this journal
            const journalLines = data.JournalLines.filter(line => line.journalId === journal.id);
            if (journalLines.length > 0) {
              // Remove duplicates from journal lines based on lineNumber and journalId
              const uniqueLines = Array.from(
                new Map(journalLines.map(line => [`${line.journalId}-${line.lineNumber}`, line])).values()
              );
              
              // Sort by line number
              const sortedLines = uniqueLines.sort((a, b) => a.lineNumber - b.lineNumber);
              
              // Attach lines to journal
              journal.lines = sortedLines.map(line => ({
                id: line.id,
                type: line.type,
                program: line.program,
                paymentCenter: line.paymentCenter,
                amount: line.amount
              }));
            }
          }
        });
        
        setJournals(uniqueJournals);
      }
      
      // Set programs
      if (data.Programs) {
        setPrograms(data.Programs);
      }
      
      // Set payment centers
      if (data.PaymentCenters) {
        setPaymentCenters(data.PaymentCenters);
      }
    }
  }, [data]);
  // Reset form when adding new journal
  useEffect(() => {
    if (dialogMode === 'add') {
      const referenceNum = `JE-${format(new Date(), 'yyyyMMdd')}-${String(journals.length + 1).padStart(3, '0')}`;
      
      setJournalForm({
        id: uuidv4(),
        date: format(new Date(), 'yyyy-MM-dd'),
        description: '',
        reference: referenceNum,
        status: 'Pending',
        notes: '',
        createdBy: currentUser?.username || 'anonymous',
        createdAt: new Date().toISOString()
      });
      
      // Initialize with two empty lines (one debit, one credit)
      setJournalLines([
        { id: uuidv4(), type: 'debit', program: '', paymentCenter: '', amount: '' },
        { id: uuidv4(), type: 'credit', program: '', paymentCenter: '', amount: '' }
      ]);
    }
  }, [dialogMode, journals.length, currentUser]);
  
  // Handle add journal line
  const handleAddLine = (type) => {
    setJournalLines([
      ...journalLines,
      { id: uuidv4(), type, program: '', paymentCenter: '', amount: '' }
    ]);
  };
  
  // Handle remove journal line
  const handleRemoveLine = (lineId) => {
    // Don't allow removing if it would leave only one line
    if (journalLines.length <= 2) {
      setSnackbar({
        open: true,
        message: 'A journal entry must have at least one debit and one credit line',
        severity: 'error'
      });
      return;
    }
    
    setJournalLines(journalLines.filter(line => line.id !== lineId));
  };
  
  // Handle line change
  const handleLineChange = (lineId, field, value) => {
    setJournalLines(journalLines.map(line => 
      line.id === lineId ? { ...line, [field]: value } : line
    ));
  };
  
  // Handle open dialog for adding a new journal
  const handleAddJournal = () => {
    // First check if user has write permission
    if (!hasPermission('write')) {
      setSnackbar({
        open: true,
        message: 'You do not have permission to create journal entries',
        severity: 'error'
      });
      return;
    }
    
    setDialogMode('add');
    setSelectedJournal(null);
    setDialogOpen(true);
  };
  
  // Open dialog to edit a journal
  const handleEditJournal = (journal) => {
    if (journal.status !== 'Pending') {
      setSnackbar({
        open: true,
        message: `Only pending journal entries can be edited`,
        severity: 'warning'
      });
      return;
    }
    
    setSelectedJournal(journal);
    setJournalForm({ ...journal });
    
    // Convert existing journal to lines format
    const lines = [];
    if (journal.lines) {
      // If the journal already has lines structure
      setJournalLines(journal.lines);
    } else {
      // Convert old format to new format
      if (journal.fromPaymentCenter) {
        lines.push({
          id: uuidv4(),
          type: 'credit',
          program: journal.fromProgram || '',
          paymentCenter: journal.fromPaymentCenter,
          amount: journal.amount
        });
      }
      if (journal.toPaymentCenter) {
        lines.push({
          id: uuidv4(),
          type: 'debit',
          program: journal.toProgram || '',
          paymentCenter: journal.toPaymentCenter,
          amount: journal.amount
        });
      }
      setJournalLines(lines.length > 0 ? lines : [
        { id: uuidv4(), type: 'debit', program: '', paymentCenter: '', amount: '' },
        { id: uuidv4(), type: 'credit', program: '', paymentCenter: '', amount: '' }
      ]);
    }
    
    setDialogMode('edit');
    setDialogOpen(true);
  };
  
  // Open dialog to view journal details
  const handleViewJournal = (journal) => {
    setSelectedJournal(journal);
    setJournalForm({ ...journal });
    
    // Convert existing journal to lines format for viewing
    if (journal.lines) {
      setJournalLines(journal.lines);
    } else {
      // Convert old format to new format for viewing
      const lines = [];
      if (journal.fromPaymentCenter) {
        lines.push({
          id: uuidv4(),
          type: 'credit',
          program: journal.fromProgram || '',
          paymentCenter: journal.fromPaymentCenter,
          amount: journal.amount
        });
      }
      if (journal.toPaymentCenter) {
        lines.push({
          id: uuidv4(),
          type: 'debit',
          program: journal.toProgram || '',
          paymentCenter: journal.toPaymentCenter,
          amount: journal.amount
        });
      }
      setJournalLines(lines);
    }
    
    setDialogMode('view');
    setDialogOpen(true);
  };
  
  // Open dialog to approve/reject journal
  const handleApproveRejectJournal = (journal) => {
    if (journal.status !== 'Pending') {
      setSnackbar({
        open: true,
        message: `Only pending journal entries can be approved or rejected`,
        severity: 'warning'
      });
      return;
    }
    
    // Check if user has admin permission
    if (!isAdmin()) {
      setSnackbar({
        open: true,
        message: 'Only administrators can approve or reject journal entries',
        severity: 'error'
      });
      return;
    }
    
    setSelectedJournal(journal);
    setJournalForm({ ...journal, reason: '' });
    setDialogMode('approve');
    setDialogOpen(true);
  };
  
  // Open menu for journal actions
  const handleOpenMenu = (event, journal) => {
    setAnchorEl(event.currentTarget);
    setMenuJournal(journal);
  };
  
  // Close menu
  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuJournal(null);
  };
  
  // Close dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setDialogMode(null);
    setSelectedJournal(null);
    setValidationErrors([]);
    setJournalLines([]);
  };
  
  // Handle form field changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setJournalForm(prev => ({ ...prev, [name]: value }));
    
    // Clear validation errors when field is updated
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };
  
  // Validate journal entry
  const validateJournalEntry = () => {
    const errors = [];
    
    // Basic form validation
    if (!journalForm.description) {
      errors.push('Description is required');
    }
    if (!journalForm.date) {
      errors.push('Date is required');
    }
    if (!journalForm.reference) {
      errors.push('Reference is required');
    }
    
    // Validate journal lines
    const debitLines = journalLines.filter(line => line.type === 'debit');
    const creditLines = journalLines.filter(line => line.type === 'credit');
    
    if (debitLines.length === 0) {
      errors.push('At least one debit line is required');
    }
    if (creditLines.length === 0) {
      errors.push('At least one credit line is required');
    }
    
    // Check if all lines have required data
    journalLines.forEach((line, index) => {
      if (!line.paymentCenter) {
        errors.push(`Line ${index + 1}: Payment center is required`);
      }
      if (!line.amount || parseFloat(line.amount) <= 0) {
        errors.push(`Line ${index + 1}: Valid amount is required`);
      }
    });
    
    // Check if debits and credits balance
    const totalDebits = debitLines.reduce((sum, line) => sum + parseFloat(line.amount || 0), 0);
    const totalCredits = creditLines.reduce((sum, line) => sum + parseFloat(line.amount || 0), 0);
    
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      errors.push(`Debits (${totalDebits.toFixed(2)}) and credits (${totalCredits.toFixed(2)}) must balance`);
    }
    
    return errors;
  };
  
  // Handle journal save (add/edit)
  const handleSaveJournal = () => {
    // Validate the journal entry
    const errors = validateJournalEntry();
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    try {
      // Format data with the new lines structure
      const formattedJournal = {
        ...journalForm,
        lines: journalLines.map(line => ({
          ...line,
          amount: parseFloat(line.amount)
        })),
        totalAmount: journalLines
          .filter(line => line.type === 'debit')
          .reduce((sum, line) => sum + parseFloat(line.amount || 0), 0),
        modifiedBy: currentUser?.username || 'anonymous',
        modifiedAt: new Date().toISOString()
      };
      
      // For backward compatibility, also store old format
      const firstDebitLine = journalLines.find(line => line.type === 'debit');
      const firstCreditLine = journalLines.find(line => line.type === 'credit');
      
      if (firstDebitLine && firstCreditLine) {
        formattedJournal.fromPaymentCenter = firstCreditLine.paymentCenter;
        formattedJournal.toPaymentCenter = firstDebitLine.paymentCenter;
        formattedJournal.fromProgram = firstCreditLine.program;
        formattedJournal.toProgram = firstDebitLine.program;
        formattedJournal.amount = firstDebitLine.amount;
      }
      
      // Save to data context
      if (dialogMode === 'add') {
        const result = addEntity('JournalEntries', formattedJournal);
        
        if (result) {
          setSnackbar({
            open: true,
            message: 'Journal entry created successfully',
            severity: 'success'
          });
        } else {
          setSnackbar({
            open: true,
            message: 'Error creating journal entry',
            severity: 'error'
          });
        }
      } else {
        const success = updateEntity('JournalEntries', selectedJournal.id, formattedJournal);
        
        if (success) {
          setSnackbar({
            open: true,
            message: 'Journal entry updated successfully',
            severity: 'success'
          });
        } else {
          setSnackbar({
            open: true,
            message: 'Error updating journal entry',
            severity: 'error'
          });
        }
      }
      
      setDialogOpen(false);
      setValidationErrors([]);
    } catch (err) {
      console.error('Error saving journal entry:', err);
      setSnackbar({
        open: true,
        message: `Error: ${err.message}`,
        severity: 'error'
      });
    }
  };
  
  // Handle journal approve
  const handleApproveJournal = () => {
    try {
      // Update journal status
      const updatedJournal = {
        ...selectedJournal,
        status: 'Approved',
        approvedBy: currentUser?.username || 'anonymous',
        approvedAt: new Date().toISOString()
      };
      
      const success = updateEntity('JournalEntries', selectedJournal.id, updatedJournal);
      
      if (success) {
        setSnackbar({
          open: true,
          message: 'Journal entry approved successfully',
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: 'Error approving journal entry',
          severity: 'error'
        });
      }
      
      setDialogOpen(false);
    } catch (err) {
      console.error('Error approving journal:', err);
      setSnackbar({
        open: true,
        message: `Error: ${err.message}`,
        severity: 'error'
      });
    }
  };
  
  // Handle journal reject
  const handleRejectJournal = () => {
    // Check if reason is provided
    if (!journalForm.reason) {
      setValidationErrors(['Reason for rejection is required']);
      return;
    }
    
    try {
      // Update journal status
      const updatedJournal = {
        ...selectedJournal,
        status: 'Rejected',
        rejectedBy: currentUser?.username || 'anonymous',
        rejectedAt: new Date().toISOString(),
        reason: journalForm.reason
      };
      
      const success = updateEntity('JournalEntries', selectedJournal.id, updatedJournal);
      
      if (success) {
        setSnackbar({
          open: true,
          message: 'Journal entry rejected successfully',
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: 'Error rejecting journal entry',
          severity: 'error'
        });
      }
      
      setDialogOpen(false);
      setValidationErrors([]);
    } catch (err) {
      console.error('Error rejecting journal:', err);
      setSnackbar({
        open: true,
        message: `Error: ${err.message}`,
        severity: 'error'
      });
    }
  };
  
  // Handle journal deletion
  const handleDeleteJournal = (journal) => {
    if (journal.status !== 'Pending') {
      setSnackbar({
        open: true,
        message: `Only pending journal entries can be deleted`,
        severity: 'warning'
      });
      return;
    }
    
    setSelectedJournal(journal);
    setConfirmDeleteOpen(true);
  };
  
  // Confirm delete action
  const handleConfirmDelete = () => {
    if (selectedJournal) {
      const success = deleteEntity('JournalEntries', selectedJournal.id);
      
      if (success) {
        setSnackbar({
          open: true,
          message: 'Journal entry deleted successfully',
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: 'Error deleting journal entry',
          severity: 'error'
        });
      }
    }
    
    setConfirmDeleteOpen(false);
    setSelectedJournal(null);
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
      
      const success = exportToExcel('KIOSC_JournalEntries_Export.xlsx');
      
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
      
      // Call exportToPdf with the appropriate type
      const success = exportToPdf('journalEntries', {
        journals: filteredJournals,
        programs,
        paymentCenters,
        filename: 'KIOSC_JournalEntries_Report.pdf'
      });
      
      if (success) {
        setSnackbar({
          open: true,
          message: 'PDF generated successfully',
          severity: 'success'
        });
      } else {
        throw new Error('Failed to generate PDF');
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
  
  // Export to CSV
  const handleExportToCsv = () => {
    try {
      setSnackbar({
        open: true,
        message: 'Exporting data to CSV...',
        severity: 'info'
      });
      
      const success = exportToCsv('journalEntries', {
        programs,
        paymentCenters,
        filename: 'KIOSC_JournalEntries.csv'
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
  
  // Handle table pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Get program name by ID
  const getProgramName = (id) => {
    if (!id) return 'Not Specified';
    const program = programs.find(p => String(p.id) === String(id));
    return program ? program.name : 'Unknown';
  };
  
  // Get payment center name by ID
  const getPaymentCenterName = (id) => {
    if (!id) return 'Not Specified';
    const center = paymentCenters.find(c => String(c.id) === String(id));
    return center ? center.name : 'Unknown';
  };
  
  // Filter journals based on filters and search
  const filteredJournals = useMemo(() => {
    if (!journals) return [];
    
    return journals.filter(journal => {
      // Skip dummy journal
      if (journal.id === 'dummy-journal') return false;
      
      // Search filter
      const searchMatch = searchTerm === '' || 
        journal.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        journal.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        journal.notes?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Date range filter
      let dateMatch = true;
      if (filterDateRange.start && filterDateRange.end) {
        const journalDate = new Date(journal.date);
        const startDate = new Date(filterDateRange.start);
        const endDate = new Date(filterDateRange.end);
        
        dateMatch = journalDate >= startDate && journalDate <= endDate;
      } else if (filterDateRange.start) {
        const journalDate = new Date(journal.date);
        const startDate = new Date(filterDateRange.start);
        
        dateMatch = journalDate >= startDate;
      } else if (filterDateRange.end) {
        const journalDate = new Date(journal.date);
        const endDate = new Date(filterDateRange.end);
        
        dateMatch = journalDate <= endDate;
      }
      
      // Status filter
      const statusMatch = filterStatus === 'All' || journal.status === filterStatus;
      
      return searchMatch && dateMatch && statusMatch;
    });
  }, [journals, searchTerm, filterDateRange, filterStatus]);
  
  // Get paginated data
  const paginatedJournals = useMemo(() => {
    return filteredJournals.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredJournals, page, rowsPerPage]);
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(amount);
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy');
  };
  
  // Calculate totals for journal lines
  const calculateLineTotals = () => {
    const debitTotal = journalLines
      .filter(line => line.type === 'debit')
      .reduce((sum, line) => sum + parseFloat(line.amount || 0), 0);
      
    const creditTotal = journalLines
      .filter(line => line.type === 'credit')
      .reduce((sum, line) => sum + parseFloat(line.amount || 0), 0);
      
    return { debitTotal, creditTotal };
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
        <Typography variant="h4">Journal Entries</Typography>
        
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
          
            <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddJournal}
                disabled={!hasPermission('write')}
                >
                New Journal Entry
            </Button>
          
        </Box>
      </Box>
      
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search Journal Entries"
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
          
          <Grid item xs={12} md={4}>
            <Grid container spacing={1} alignItems="center">
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="From Date"
                  type="date"
                  variant="outlined"
                  size="small"
                  value={filterDateRange.start}
                  onChange={(e) => setFilterDateRange(prev => ({ ...prev, start: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="To Date"
                  type="date"
                  variant="outlined"
                  size="small"
                  value={filterDateRange.end}
                  onChange={(e) => setFilterDateRange(prev => ({ ...prev, end: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="All">All Statuses</MenuItem>
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="Approved">Approved</MenuItem>
                <MenuItem value="Rejected">Rejected</MenuItem>
                <MenuItem value="Cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Journal Entries Table */}
      <Paper sx={{ mb: 3 }}>
        {paginatedJournals.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Reference</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Lines</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              
              <TableBody>
                {paginatedJournals.map((journal) => (
                  <TableRow key={journal.id}>
                    <TableCell>
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          cursor: 'pointer'
                        }}
                        onClick={() => handleViewJournal(journal)}
                      >
                        <JournalIcon fontSize="small" color="primary" sx={{ mr: 1 }} />
                        {journal.reference}
                      </Box>
                    </TableCell>
                    <TableCell>{formatDate(journal.date)}</TableCell>
                    <TableCell>{journal.description}</TableCell>
                    <TableCell>
                      {journal.lines ? (
                        <Typography variant="body2">
                          {journal.lines.filter(l => l.type === 'debit').length} DR / {journal.lines.filter(l => l.type === 'credit').length} CR
                        </Typography>
                      ) : (
                        <Typography variant="body2">
                          From: {getPaymentCenterName(journal.fromPaymentCenter)}<br/>
                          To: {getPaymentCenterName(journal.toPaymentCenter)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(journal.totalAmount || journal.amount || 0)}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={journal.status}
                        size="small"
                        color={statusColors[journal.status] || 'default'}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Actions">
                        <IconButton
                          size="small"
                          onClick={(e) => handleOpenMenu(e, journal)}
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
              count={filteredJournals.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </TableContainer>
        ) : (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              No journal entries found matching your filters.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Try changing your search criteria or create a new journal entry.
            </Typography>
            <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddJournal}
                disabled={!hasPermission('write')}
                >
                Create New Journal Entry
                </Button>
          </Box>
        )}
      </Paper>
      
      {/* Journal Actions Menu */}
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
          handleViewJournal(menuJournal);
          handleCloseMenu();
        }}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        
        {hasPermission('write') && menuJournal?.status === 'Pending' && (
          <>
            <MenuItem onClick={() => {
              handleEditJournal(menuJournal);
              handleCloseMenu();
            }}>
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Edit Entry</ListItemText>
            </MenuItem>
            
            {isAdmin() && (
              <MenuItem onClick={() => {
                handleApproveRejectJournal(menuJournal);
                handleCloseMenu();
              }}>
                <ListItemIcon>
                  <ApproveIcon fontSize="small" color="success" />
              </ListItemIcon>
              <ListItemText>Approve/Reject</ListItemText>
            </MenuItem>
            )}
            
            <Divider />
            
            <MenuItem onClick={() => {
              handleDeleteJournal(menuJournal);
              handleCloseMenu();
            }}>
              <ListItemIcon>
                <DeleteIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Delete Entry</ListItemText>
            </MenuItem>
          </>
        )}
      </Menu>
      
      {/* Add/Edit Journal Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'add' ? 'Create New Journal Entry' : 
           dialogMode === 'edit' ? 'Edit Journal Entry' : 
           dialogMode === 'approve' ? 'Approve/Reject Journal Entry' : 
           'Journal Entry Details'}
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
          
          {/* Approval/Rejection Dialog */}
          {dialogMode === 'approve' ? (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Card variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Journal Entry Details
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Reference:
                          </Typography>
                          <Typography variant="body1" gutterBottom>
                            {journalForm.reference}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Date:
                          </Typography>
                          <Typography variant="body1" gutterBottom>
                            {formatDate(journalForm.date)}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">
                            Description:
                          </Typography>
                          <Typography variant="body1" gutterBottom>
                            {journalForm.description}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">
                            Amount:
                          </Typography>
                          <Typography variant="body1" fontWeight="bold" gutterBottom>
                            {formatCurrency(journalForm.totalAmount || journalForm.amount)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Reason for Rejection (required if rejecting)"
                    name="reason"
                    value={journalForm.reason || ''}
                    onChange={handleFormChange}
                    multiline
                    rows={3}
                    margin="normal"
                  />
                </Grid>
              </Grid>
            </Box>
          ) : (
            /* Regular Form for Add/Edit/View */
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Date"
                  name="date"
                  type="date"
                  value={journalForm.date}
                  onChange={handleFormChange}
                  margin="normal"
                  required
                  disabled={dialogMode === 'view'}
                  InputLabelProps={{ shrink: true }}
                  error={validationErrors.some(error => error.includes('date'))}
                  helperText={validationErrors.find(error => error.includes('date'))}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Reference"
                  name="reference"
                  value={journalForm.reference}
                  onChange={handleFormChange}
                  margin="normal"
                  required
                  disabled={dialogMode === 'view'}
                  error={validationErrors.some(error => error.includes('reference'))}
                  helperText={validationErrors.find(error => error.includes('reference'))}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={journalForm.description}
                  onChange={handleFormChange}
                  margin="normal"
                  required
                  disabled={dialogMode === 'view'}
                  error={validationErrors.some(error => error.includes('description'))}
                  helperText={validationErrors.find(error => error.includes('description'))}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }}>
                  <Chip label="Journal Lines" icon={<TransferIcon />} />
                </Divider>
              </Grid>
              
              {/* Journal Lines Table */}
              <Grid item xs={12}>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell width="15%">Type</TableCell>
                        <TableCell width="25%">Program (Optional)</TableCell>
                        <TableCell width="25%">Payment Center</TableCell>
                        <TableCell width="20%" align="right">Amount</TableCell>
                        {dialogMode !== 'view' && (
                          <TableCell width="15%" align="center">Actions</TableCell>
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {journalLines.map((line, index) => (
                        <TableRow key={line.id}>
                          <TableCell>
                            <Chip 
                              label={line.type.toUpperCase()} 
                              size="small"
                              color={line.type === 'debit' ? 'primary' : 'secondary'}
                            />
                          </TableCell>
                          <TableCell>
                            <FormControl fullWidth size="small">
                              <Select
                                value={line.program || ''}
                                onChange={(e) => handleLineChange(line.id, 'program', e.target.value)}
                                disabled={dialogMode === 'view'}
                                displayEmpty
                              >
                                <MenuItem value="">None</MenuItem>
                                {programs.map((program) => (
                                  <MenuItem key={program.id} value={String(program.id)}>
                                    {program.name}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </TableCell>
                          <TableCell>
                            <FormControl fullWidth size="small" required>
                              <Select
                                value={line.paymentCenter || ''}
                                onChange={(e) => handleLineChange(line.id, 'paymentCenter', e.target.value)}
                                disabled={dialogMode === 'view'}
                                displayEmpty
                                error={validationErrors.some(error => error.includes(`Line ${index + 1}`))}
                              >
                                <MenuItem value="">Select Payment Center</MenuItem>
                                {paymentCenters.map((center) => (
                                  <MenuItem key={center.id} value={String(center.id)}>
                                    {center.name}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              type="number"
                              value={line.amount || ''}
                              onChange={(e) => handleLineChange(line.id, 'amount', e.target.value)}
                              disabled={dialogMode === 'view'}
                              size="small"
                              InputProps={{
                                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                              }}
                              error={validationErrors.some(error => error.includes(`Line ${index + 1}`))}
                            />
                          </TableCell>
                          {dialogMode !== 'view' && (
                            <TableCell align="center">
                              {journalLines.length > 2 && (
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleRemoveLine(line.id)}
                                  color="error"
                                >
                                  <RemoveLineIcon />
                                </IconButton>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                      
                      {/* Totals Row */}
                      <TableRow>
                        <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>
                          Totals:
                        </TableCell>
                        <TableCell align="right">
                          <Box>
                            <Typography variant="body2" color="primary">
                              DR: {formatCurrency(calculateLineTotals().debitTotal)}
                            </Typography>
                            <Typography variant="body2" color="secondary">
                              CR: {formatCurrency(calculateLineTotals().creditTotal)}
                            </Typography>
                            {Math.abs(calculateLineTotals().debitTotal - calculateLineTotals().creditTotal) > 0.01 && (
                              <Typography variant="body2" color="error">
                                Difference: {formatCurrency(Math.abs(calculateLineTotals().debitTotal - calculateLineTotals().creditTotal))}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        {dialogMode !== 'view' && <TableCell />}
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
                
                {dialogMode !== 'view' && (
                  <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<AddLineIcon />}
                      onClick={() => handleAddLine('debit')}
                      size="small"
                    >
                      Add Debit Line
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<AddLineIcon />}
                      onClick={() => handleAddLine('credit')}
                      size="small"
                    >
                      Add Credit Line
                    </Button>
                  </Box>
                )}
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  name="notes"
                  value={journalForm.notes || ''}
                  onChange={handleFormChange}
                  margin="normal"
                  multiline
                  rows={3}
                  disabled={dialogMode === 'view'}
                />
              </Grid>
              
              {/* Approval/Rejection details if viewing an approved/rejected entry */}
              {dialogMode === 'view' && journalForm.status === 'Approved' && (
                <Grid item xs={12}>
                  <Alert severity="success" sx={{ mt: 1 }}>
                    <Typography variant="subtitle2">
                      Approved by {journalForm.approvedBy} on {formatDate(journalForm.approvedAt)}
                    </Typography>
                  </Alert>
                </Grid>
              )}
              
              {dialogMode === 'view' && journalForm.status === 'Rejected' && (
                <Grid item xs={12}>
                  <Alert severity="error" sx={{ mt: 1 }}>
                    <Typography variant="subtitle2">
                      Rejected by {journalForm.rejectedBy} on {formatDate(journalForm.rejectedAt)}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Reason: {journalForm.reason || 'No reason provided'}
                    </Typography>
                  </Alert>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseDialog} startIcon={<CloseIcon />}>
            {dialogMode === 'view' ? 'Close' : 'Cancel'}
          </Button>
          
          {dialogMode === 'approve' && (
            <>
              <Button 
                onClick={handleRejectJournal} 
                variant="outlined" 
                color="error"
                startIcon={<RejectIcon />}
              >
                Reject
              </Button>
              
              <Button 
                onClick={handleApproveJournal} 
                variant="contained" 
                color="success"
                startIcon={<ApproveIcon />}
              >
                Approve
              </Button>
            </>
          )}
          
          {(dialogMode === 'add' || dialogMode === 'edit') && hasPermission('write') && (
            <Button 
              onClick={handleSaveJournal} 
              variant="contained" 
              color="primary"
              startIcon={<SaveIcon />}
            >
              {dialogMode === 'add' ? 'Create Journal Entry' : 'Save Changes'}
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
            Are you sure you want to delete this journal entry? This action cannot be undone.
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

export default JournalEntry;