// src/components/PaymentCenterBudgetForm.js - Updated version
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TextField,
  Button,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Save as SaveIcon,
  Edit as EditIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useData } from '../contexts/DataContext';
import excelService from '../services/ExcelService';

const PaymentCenterBudgetForm = ({ open, onClose, onSaveToGitHub }) => {
  const { data, addEntity, updateEntity, getEntities } = useData();
  const [budgets, setBudgets] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  
  // Create an array of years
  const currentYear = new Date().getFullYear();
  const years = [
    (currentYear - 1).toString(),
    currentYear.toString(),
    (currentYear + 1).toString()
  ];
  
  // Debug data
  console.log("PaymentCenterBudgetForm Data:", {
    paymentCenters: data.PaymentCenters,
    budgets: data.PaymentCenterBudgets
  });
  
  // Initialize budgets for all payment centers
  const initializeBudgets = useCallback(() => {
    if (data.PaymentCenters) {
      const paymentCenters = data.PaymentCenters || [];
      const budgetEntries = data.PaymentCenterBudgets || [];
      
      console.log("Initializing budgets for year:", selectedYear);
      console.log("Payment Centers:", paymentCenters);
      console.log("Budget Entries:", budgetEntries);
      
      // Get budgets for the selected year
      const yearBudgets = budgetEntries.filter(budget => 
        budget.year === selectedYear
      );
      
      console.log("Year Budgets:", yearBudgets);
      
      // Map payment centers with their budgets
      const mappedBudgets = paymentCenters.map(center => {
        // Convert center.id to string for comparison
        const centerId = center.id.toString();
        
        // Find existing budget
        const existingBudget = yearBudgets.find(
          budget => budget.paymentCenterId === centerId
        );
        
        console.log(`Processing center ${center.name} (ID: ${centerId})`, {
          existingBudget
        });
        
        return {
          paymentCenterId: centerId,
          paymentCenterName: center.name,
          year: selectedYear,
          budget: existingBudget ? existingBudget.budget : '0',
          id: existingBudget ? existingBudget.id : `budget-${centerId}-${selectedYear}`
        };
      });
      
      console.log("Mapped budgets:", mappedBudgets);
      setBudgets(mappedBudgets);
      setUnsavedChanges(false);
    }
  }, [data.PaymentCenters, data.PaymentCenterBudgets, selectedYear]);
  
  // Update budgets when dialog opens or year changes
  useEffect(() => {
    if (open) {
      initializeBudgets();
    }
  }, [open, selectedYear, initializeBudgets]);
  
  // Handle budget input change
  const handleBudgetChange = (paymentCenterId, value) => {
    console.log(`Changing budget for center ${paymentCenterId} to ${value}`);
    setBudgets(prevBudgets => 
      prevBudgets.map(budget => 
        budget.paymentCenterId === paymentCenterId 
          ? { ...budget, budget: value } 
          : budget
      )
    );
    setUnsavedChanges(true);
  };
  
  // Handle year change
  const handleYearChange = (event) => {
    setSelectedYear(event.target.value);
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(amount);
  };
  
  // Handle save budgets
  const handleSaveBudgets = async () => {
    try {
      console.log("Saving budgets:", budgets);
      
      // Validate budget values
      const invalidBudgets = budgets.filter(
        budget => isNaN(parseFloat(budget.budget)) || parseFloat(budget.budget) < 0
      );
      
      if (invalidBudgets.length > 0) {
        setSnackbar({
          open: true,
          message: 'Invalid budget values. Please enter valid numbers.',
          severity: 'error'
        });
        return;
      }
      
      // Get existing budget entries
      const existingBudgets = data.PaymentCenterBudgets 
        ? data.PaymentCenterBudgets.filter(budget => budget.year === selectedYear)
        : [];
      
      console.log("Existing budgets:", existingBudgets);
      
      // Track if any were saved
      let savedCount = 0;
      
      // Save each budget
      for (const budget of budgets) {
        // Find existing budget by payment center ID and year
        const existingBudget = existingBudgets.find(
          b => b.paymentCenterId === budget.paymentCenterId && b.year === selectedYear
        );
        
        if (existingBudget) {
          // Update existing budget
          console.log(`Updating budget for ${budget.paymentCenterName}:`, {
            id: existingBudget.id,
            oldBudget: existingBudget.budget,
            newBudget: budget.budget
          });
          
          const success = await updateEntity('PaymentCenterBudgets', existingBudget.id, {
            budget: budget.budget,
            updatedAt: new Date().toISOString()
          });
          
          if (success) savedCount++;
        } else {
          // Add new budget
          console.log(`Adding new budget for ${budget.paymentCenterName}:`, {
            id: budget.id,
            budget: budget.budget
          });
          
          const newBudget = await addEntity('PaymentCenterBudgets', {
            id: budget.id,
            paymentCenterId: budget.paymentCenterId,
            year: selectedYear,
            budget: budget.budget,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          
          if (newBudget) savedCount++;
        }
      }
      
      setSnackbar({
        open: true,
        message: `${savedCount} budgets saved successfully!`,
        severity: 'success'
      });
      // Also save to Excel file locally
      const exportSuccess = excelService.saveToFile(
        excelService.saveToExcel(), 
        'KIOSC_Finance_Data.xlsx'
      );
      
      if (exportSuccess) {
        setSnackbar({
          open: true,
          message: 'Budgets saved successfully! Excel file has been downloaded.',
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: 'Budgets saved to system but Excel download failed. Try using the export button.',
          severity: 'warning'
        });
      }

      setUnsavedChanges(false);
      setEditMode(false);
    } catch (error) {
      console.error('Error saving budgets:', error);
      setSnackbar({
        open: true,
        message: 'Error saving budgets. Please try again.',
        severity: 'error'
      });
    }
  };

  // Add reminder at close
  const handleClose = () => {
    if (unsavedChanges) {
      const confirm = window.confirm('You have unsaved changes. Make sure you save the Excel file and upload it to GitHub to persist your changes. Continue?');
      if (!confirm) return;
    }
    onClose();
  };
  
  // Handle close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        Payment Center Budgets
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Year</InputLabel>
            <Select
              value={selectedYear}
              onChange={handleYearChange}
              label="Year"
              disabled={editMode}
            >
              {years.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Button
            variant={editMode ? "contained" : "outlined"}
            startIcon={editMode ? <SaveIcon /> : <EditIcon />}
            onClick={editMode ? handleSaveBudgets : () => setEditMode(true)}
            color={editMode ? "success" : "primary"}
          >
            {editMode ? "Save Budgets" : "Edit Budgets"}
          </Button>
        </Box>
        
        <Alert severity="info" sx={{ mb: 2 }}>
          Set budgets for each payment center for the selected year. These budgets will be used for reporting and visualizations.
        </Alert>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Important: After saving budgets, you must download the Excel file and then upload it to GitHub to persist your changes!
        </Alert>

        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            onClick={() => {
              excelService.saveToFile(
                excelService.saveToExcel(), 
                'KIOSC_Finance_Data.xlsx'
              );
              setUnsavedChanges(false);
            }}
          >
            Download Excel File
          </Button>
          
          <Button
            variant="outlined"
            color="success"
            onClick={() => {
              // This would open your GitHub save modal/component
              if (typeof onSaveToGitHub === 'function') {
                onSaveToGitHub();
                setUnsavedChanges(false);
              } else {
                alert('Please use the "Save to GitHub" button in the main application after closing this dialog.');
              }
            }}
          >
            Save to GitHub
          </Button>
        </Box>
        
        {budgets.length === 0 ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            No payment centers found. Please add payment centers first.
          </Alert>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width="60%">Payment Center</TableCell>
                <TableCell width="40%">Budget (AUD)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {budgets.map((budget) => (
                <TableRow key={budget.paymentCenterId}>
                  <TableCell>{budget.paymentCenterName}</TableCell>
                  <TableCell>
                    {editMode ? (
                      <TextField
                        type="number"
                        size="small"
                        value={budget.budget}
                        onChange={(e) => handleBudgetChange(budget.paymentCenterId, e.target.value)}
                        fullWidth
                        inputProps={{ min: 0, step: 100 }}
                      />
                    ) : (
                      formatCurrency(parseFloat(budget.budget) || 0)
                    )}
                  </TableCell>
                </TableRow>
              ))}
              
              {/* Total row */}
              <TableRow sx={{ bgcolor: 'background.default' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  {formatCurrency(
                    budgets.reduce((sum, budget) => sum + (parseFloat(budget.budget) || 0), 0)
                  )}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </DialogContent>
      
      <DialogActions>
        {editMode && (
          <Button onClick={() => setEditMode(false)} color="inherit">
            Cancel
          </Button>
        )}
        <Button onClick={handleClose} color="primary">
          Close
        </Button>
      </DialogActions>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default PaymentCenterBudgetForm;