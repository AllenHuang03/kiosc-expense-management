// src/contexts/DataContext.js - Simplified error handling
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import excelService from '../services/ExcelService';
import githubService from '../services/GitHubService';
import dataInitializer from '../utils/DataInitializer';
import pdfExporter from '../utils/PdfExporter';
import csvExporter from '../utils/CsvExporter';
import { useAuth } from './AuthContext';

// Create context
const DataContext = createContext();

// Context provider component
export const DataProvider = ({ children }) => {
  // State for all data
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); 
  const [initialized, setInitialized] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  
  // Get currentUser and setAuthUserData from AuthContext
  const { currentUser, setAuthUserData } = useAuth();
  
  // Add this function to handle CSV-formatted permissions
  const parseCSVPermissions = (permissionsString) => {
    if (!permissionsString) return [];
    if (Array.isArray(permissionsString)) return permissionsString;
    
    return permissionsString.split(',').map(perm => perm.trim());
  };
  
  // Initialize data
  const initializeData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let newData;
      
      try {
        // Try to load data from GitHub
        newData = await githubService.loadDataFromExcel('KIOSC_Finance_Data.xlsx');
      } catch (err) {
        console.warn('Could not load data from GitHub, using default structure:', err);
        
        // Create default data structure if GitHub load fails
        newData = dataInitializer.initializeData();
      }
      
      // Process users to handle CSV permissions format
      if (newData.Users) {
        newData.Users = newData.Users.map(user => ({
          ...user,
          permissions: parseCSVPermissions(user.permissions)
        }));
      }
      
      // Ensure JournalEntries collection exists and remove duplicates
      if (!newData.JournalEntries) {
        newData.JournalEntries = [];
        excelService.updateSheetData('JournalEntries', []);
      } else {
        // Remove duplicates based on ID
        const uniqueEntries = Array.from(
          new Map(newData.JournalEntries.map(entry => [entry.id, entry])).values()
        );
        newData.JournalEntries = uniqueEntries;
      }
      
      // Ensure JournalLines collection exists
      if (!newData.JournalLines) {
        newData.JournalLines = [];
        excelService.updateSheetData('JournalLines', []);
      } else {
        // Remove duplicates based on journalId and lineNumber combination
        const uniqueLines = Array.from(
          new Map(newData.JournalLines.map(line => [`${line.journalId}-${line.lineNumber}`, line])).values()
        );
        newData.JournalLines = uniqueLines;
      }
      
      // Ensure AuditLog collection exists
      if (!newData.AuditLog) {
        newData.AuditLog = [];
        excelService.updateSheetData('AuditLog', []);
      }
      
      // Reconstruct journal entries with lines if needed
      if (newData.JournalEntries && newData.JournalLines) {
        newData.JournalEntries = newData.JournalEntries.map(journal => {
          const lines = newData.JournalLines
            .filter(line => line.journalId === journal.id)
            .sort((a, b) => a.lineNumber - b.lineNumber);
          
          return {
            ...journal,
            lines: lines.map(line => ({
              id: line.id,
              type: line.type,
              program: line.program,
              paymentCenter: line.paymentCenter,
              amount: line.amount
            }))
          };
        });
      }
      
      // Ensure PaymentCenterBudgets collection exists
      if (!newData.PaymentCenterBudgets) {
        newData.PaymentCenterBudgets = [];
        excelService.updateSheetData('PaymentCenterBudgets', []);
      }
      
      // Ensure all other collections exist and remove duplicates
      ['Expenses', 'Suppliers', 'Programs', 'PaymentCenters', 'PaymentTypes', 'PaymentCenterBudgets', 'ExpenseStatus'].forEach(collection => {
        if (newData[collection]) {
          const uniqueEntries = Array.from(
            new Map(newData[collection].map(item => [item.id, item])).values()
          );
          newData[collection] = uniqueEntries;
        } else {
          newData[collection] = [];
        }
      });
      
      setData(newData);
      setInitialized(true);
      
      // Set user data in AuthContext
      setAuthUserData(newData);
    } catch (err) {
      console.error('Error initializing data:', err);
      setError('Failed to initialize data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [setAuthUserData]);
  
  // Load data on component mount 
  useEffect(() => {
    if (!initialized) {
      initializeData();
    }
  }, [initialized, initializeData]);
  
  // Save data to GitHub with confirmation
  const saveData = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        const confirmed = window.confirm('Do you want to save changes to GitHub?');
        if (!confirmed) return false;
      }
      
      setLoading(true);
      await githubService.saveToGitHub();
      setUnsavedChanges(false);
      return true;
    } catch (err) {
      console.error('Error saving data:', err);
      setError('Failed to save data. Please check your connection and try again.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Auto-save to Excel (without GitHub push)
  const autoSaveToExcel = useCallback(() => {
    try {
      excelService.saveToExcel();
      return true;
    } catch (err) {
      console.error('Error auto-saving to Excel:', err);
      return false;
    }
  }, []);
  
  // Add audit entry helper function
  const createAuditEntry = useCallback((entityType, entityId, action, changes, description) => {
    return {
      id: `AUDIT${Date.now()}`,
      entityType,
      entityId,
      action,
      userId: currentUser?.id || 'system',
      username: currentUser?.username || 'system',
      timestamp: new Date().toISOString(),
      changes,
      description
    };
  }, [currentUser]);
  
  // Add a new entity to a specific collection
  const addEntity = useCallback((collection, entity) => {
    try {
      // Ensure the collection exists
      if (!data[collection]) {
        throw new Error(`Collection "${collection}" does not exist`);
      }
      
      // Generate ID if not provided
      const newEntity = {
        ...entity,
        id: entity.id || uuidv4()
      };
      
      // Check for duplicates
      const existingEntity = data[collection].find(item => item.id === newEntity.id);
      if (existingEntity) {
        console.warn(`Entity with ID ${newEntity.id} already exists in ${collection}`);
        return existingEntity;
      }
      
      // Special handling for journal entries with lines
      if (collection === 'JournalEntries' && entity.lines) {
        // Add to JournalEntries sheet
        const journalEntry = { ...newEntity };
        delete journalEntry.lines; // Remove lines for main entry
        journalEntry.totalAmount = entity.lines
          .filter(line => line.type === 'debit')
          .reduce((sum, line) => sum + parseFloat(line.amount || 0), 0);
        
        excelService.addRow('JournalEntries', journalEntry);
        
        // Add lines to JournalLines sheet
        if (!data.JournalLines) {
          data.JournalLines = [];
          excelService.createSheet('JournalLines', []);
        }
        
        entity.lines.forEach((line, index) => {
          const journalLine = {
            id: `${newEntity.id}-L${index + 1}`,
            journalId: newEntity.id,
            lineNumber: index + 1,
            type: line.type,
            program: line.program || '',
            paymentCenter: line.paymentCenter,
            amount: line.amount,
            createdAt: new Date().toISOString()
          };
          
          excelService.addRow('JournalLines', journalLine);
          data.JournalLines.push(journalLine);
        });
        
        // Create audit entry for journal creation
        const auditEntry = createAuditEntry(
          'JournalEntries',
          newEntity.id,
          'CREATE',
          JSON.stringify({ lines: entity.lines.length, totalAmount: journalEntry.totalAmount }),
          `Created journal entry ${newEntity.reference || newEntity.id}`
        );
        
        // Add audit entry
        if (!data.AuditLog) {
          data.AuditLog = [];
          excelService.createSheet('AuditLog', []);
        }
        excelService.addRow('AuditLog', auditEntry);
        data.AuditLog.push(auditEntry);
      } else {
        // Convert permissions array to CSV format for Users collection
        if (collection === 'Users' && Array.isArray(newEntity.permissions)) {
          newEntity.permissions = newEntity.permissions.join(',');
        }
        
        // Add to Excel service
        excelService.addRow(collection, newEntity);
        
        // Create audit entry for other entities
        const auditEntry = createAuditEntry(
          collection,
          newEntity.id,
          'CREATE',
          '',
          `Created new ${collection.slice(0, -1)}`
        );
        
        // Add audit entry
        if (!data.AuditLog) {
          data.AuditLog = [];
          excelService.createSheet('AuditLog', []);
        }
        excelService.addRow('AuditLog', auditEntry);
        data.AuditLog.push(auditEntry);
      }
      
      // Update state (convert back to array for in-memory usage)
      const stateEntity = { ...newEntity };
      if (collection === 'Users' && stateEntity.permissions) {
        stateEntity.permissions = parseCSVPermissions(stateEntity.permissions);
      }
      
      setData(prevData => ({
        ...prevData,
        [collection]: [...prevData[collection], stateEntity]
      }));
      
      // Auto-save to Excel
      autoSaveToExcel();
      setUnsavedChanges(true);
      
      return stateEntity;
    } catch (err) {
      console.error('Error adding entity:', err);
      setError(`Failed to add entity to ${collection}.`);
      return null;
    }
  }, [data, autoSaveToExcel, createAuditEntry]);
  
  // Update an entity in a specific collection
  const updateEntity = useCallback((collection, id, updates) => {
    try {
      // Ensure the collection exists
      if (!data[collection]) {
        throw new Error(`Collection "${collection}" does not exist`);
      }
      
      // Get existing entity for comparison
      const existingEntity = data[collection].find(item => String(item.id) === String(id));
      if (!existingEntity) {
        throw new Error(`Entity with ID "${id}" not found in ${collection}`);
      }
      
      // Special handling for journal entries with lines
      if (collection === 'JournalEntries' && updates.lines) {
        // Update main journal entry
        const journalUpdates = { ...updates };
        delete journalUpdates.lines;
        journalUpdates.totalAmount = updates.lines
          .filter(line => line.type === 'debit')
          .reduce((sum, line) => sum + parseFloat(line.amount || 0), 0);
        
        excelService.updateRow('JournalEntries', id, 'id', journalUpdates);
        
        // Remove existing lines
        if (data.JournalLines) {
          data.JournalLines = data.JournalLines.filter(line => line.journalId !== id);
          excelService.deleteRow('JournalLines', id, 'journalId');
        }
        
        // Add updated lines
        updates.lines.forEach((line, index) => {
          const journalLine = {
            id: `${id}-L${index + 1}`,
            journalId: id,
            lineNumber: index + 1,
            type: line.type,
            program: line.program || '',
            paymentCenter: line.paymentCenter,
            amount: line.amount,
            createdAt: new Date().toISOString()
          };
          
          excelService.addRow('JournalLines', journalLine);
          data.JournalLines.push(journalLine);
        });
        
        // Create audit entry for journal update
        const auditEntry = createAuditEntry(
          'JournalEntries',
          id,
          updates.status !== existingEntity.status ? 
            (updates.status === 'Approved' ? 'APPROVE' : 
             updates.status === 'Rejected' ? 'REJECT' : 'UPDATE') 
            : 'UPDATE',
          JSON.stringify({
            oldStatus: existingEntity.status,
            newStatus: updates.status,
            totalAmount: journalUpdates.totalAmount,
            lines: updates.lines.length
          }),
          updates.status !== existingEntity.status ?
            `Status changed from ${existingEntity.status} to ${updates.status}` :
            `Updated journal entry ${existingEntity.reference || id}`
        );
        
        // Add audit entry
        if (!data.AuditLog) {
          data.AuditLog = [];
          excelService.createSheet('AuditLog', []);
        }
        excelService.addRow('AuditLog', auditEntry);
        data.AuditLog.push(auditEntry);
      } else {
        // Convert permissions array to CSV format for Users collection
        const excelUpdates = { ...updates };
        if (collection === 'Users' && Array.isArray(excelUpdates.permissions)) {
          excelUpdates.permissions = excelUpdates.permissions.join(',');
        }
        
        // Update in Excel service
        const success = excelService.updateRow(collection, id, 'id', excelUpdates);
        
        if (!success) {
          throw new Error(`Entity with ID "${id}" not found in ${collection}`);
        }
        
        // Create audit entry for other entities
        const auditEntry = createAuditEntry(
          collection,
          id,
          'UPDATE',
          JSON.stringify({
            before: existingEntity,
            after: updates
          }),
          `Updated ${collection.slice(0, -1)} ${id}`
        );
        
        // Add audit entry
        if (!data.AuditLog) {
          data.AuditLog = [];
          excelService.createSheet('AuditLog', []);
        }
        excelService.addRow('AuditLog', auditEntry);
        data.AuditLog.push(auditEntry);
      }
      
      // Update state (convert back to array for in-memory usage)
      const stateUpdates = { ...updates };
      if (collection === 'Users' && updates.permissions) {
        stateUpdates.permissions = parseCSVPermissions(updates.permissions);
      }
      
      setData(prevData => ({
        ...prevData,
        [collection]: prevData[collection].map(item => 
          String(item.id) === String(id) ? { ...item, ...stateUpdates } : item
        )
      }));
      
      // Auto-save to Excel
      autoSaveToExcel();
      setUnsavedChanges(true);
      
      return true;
    } catch (err) {
      console.error('Error updating entity:', err);
      setError(`Failed to update entity in ${collection}.`);
      return false;
    }
  }, [data, autoSaveToExcel, createAuditEntry]);
  
  // Delete an entity from a specific collection
  const deleteEntity = useCallback((collection, id) => {
    try {
      // Ensure the collection exists
      if (!data[collection]) {
        throw new Error(`Collection "${collection}" does not exist`);
      }
      
      // Get existing entity for audit
      const existingEntity = data[collection].find(item => String(item.id) === String(id));
      if (!existingEntity) {
        throw new Error(`Entity with ID "${id}" not found in ${collection}`);
      }
      
      // Special handling for journal entries - also delete lines
      if (collection === 'JournalEntries') {
        // Delete journal lines
        if (data.JournalLines) {
          data.JournalLines = data.JournalLines.filter(line => line.journalId !== id);
          excelService.deleteRow('JournalLines', id, 'journalId');
        }
      }
      
      // Delete from Excel service
      const success = excelService.deleteRow(collection, id, 'id');
      
      if (!success) {
        throw new Error(`Entity with ID "${id}" not found in ${collection}`);
      }
      
      // Create audit entry for deletion
      const auditEntry = createAuditEntry(
        collection,
        id,
        'DELETE',
        JSON.stringify(existingEntity),
        `Deleted ${collection.slice(0, -1)} ${id}`
      );
      
      // Add audit entry
      if (!data.AuditLog) {
        data.AuditLog = [];
        excelService.createSheet('AuditLog', []);
      }
      excelService.addRow('AuditLog', auditEntry);
      data.AuditLog.push(auditEntry);
      
      // Update state
      setData(prevData => ({
        ...prevData,
        [collection]: prevData[collection].filter(item => String(item.id) !== String(id))
      }));
      
      // Auto-save to Excel
      autoSaveToExcel();
      setUnsavedChanges(true);
      
      return true;
    } catch (err) {
      console.error('Error deleting entity:', err);
      setError(`Failed to delete entity from ${collection}.`);
      return false;
    }
  }, [data, autoSaveToExcel, createAuditEntry]);
  
  // Export data to Excel file
  const exportToExcel = useCallback((filename = 'KIOSC_Finance_Export.xlsx') => {
    try {
      return excelService.saveToFile(excelService.saveToExcel(), filename);
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      setError('Failed to export data to Excel.');
      return false;
    }
  }, []);
  
  // Export data to PDF file
  const exportToPdf = useCallback((type, options = {}) => {
    try {
      let doc;
      
      switch (type) {
        case 'suppliers':
          doc = pdfExporter.exportSuppliersToPdf(
            data.Suppliers || [],
            options.categories || [],
            options.title || 'Supplier List'
          );
          break;
        case 'supplierDetails':
          doc = pdfExporter.exportSupplierDetailsToPdf(
            options.supplier,
            options.categories || [],
            options.transactions || []
          );
          break;
        case 'expenses':
          doc = pdfExporter.exportExpensesToPdf(
            data.Expenses || [],
            data.Suppliers || [],
            data.Programs || [],
            data.PaymentCenters || [],
            options.title || 'Expense Report'
          );
          break;
        case 'journalEntries':
          doc = pdfExporter.exportJournalsToPdf(
            data.JournalEntries || [],
            data.Programs || [],
            data.PaymentCenters || [],
            options.title || 'Journal Entries Report'
          );
          break;
        case 'journalDetails':
          doc = pdfExporter.exportJournalDetailsToPdf(
            options.journal,
            data.Programs || [],
            data.PaymentCenters || []
          );
          break;
        default:
          throw new Error(`Unknown PDF export type: ${type}`);
      }
      
      doc.save(options.filename || `KIOSC_${type}_Export.pdf`);
      return true;
    } catch (err) {
      console.error('Error exporting to PDF:', err);
      setError('Failed to export data to PDF.');
      return false;
    }
  }, [data]);
  
  // Export data to CSV file
  const exportToCsv = useCallback((type, options = {}) => {
    try {
      switch (type) {
        case 'suppliers':
          csvExporter.exportSuppliersToCsv(
            data.Suppliers || [],
            options.categories || [],
            options.filename || 'KIOSC_Suppliers.csv'
          );
          break;
        case 'expenses':
          csvExporter.exportExpensesToCsv(
            data.Expenses || [],
            data.Suppliers || [],
            data.Programs || [],
            data.PaymentCenters || [],
            data.PaymentTypes || [],
            options.filename || 'KIOSC_Expenses.csv'
          );
          break;
        case 'journalEntries':
          csvExporter.exportJournalsToCsv(
            data.JournalEntries || [],
            data.Programs || [],
            data.PaymentCenters || [],
            options.filename || 'KIOSC_JournalEntries.csv'
          );
          break;
        default:
          throw new Error(`Unknown CSV export type: ${type}`);
      }
      return true;
    } catch (err) {
      console.error('Error exporting to CSV:', err);
      setError('Failed to export data to CSV.');
      return false;
    }
  }, [data]);
  
  // Get entities from a specific collection
  const getEntities = useCallback((collection) => {
    return data[collection] || [];
  }, [data]);
  
  // Get a specific entity by ID
  const getEntityById = useCallback((collection, id) => {
    if (!data[collection]) {
      return null;
    }
    
    return data[collection].find(item => String(item.id) === String(id)) || null;
  }, [data]);
  
  // Filter entities by field value
  const filterEntities = useCallback((collection, field, value) => {
    if (!data[collection]) {
      return [];
    }
    
    return data[collection].filter(item => String(item[field]) === String(value));
  }, [data]);
  
  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  // Context value
  const contextValue = {
    data,
    loading,
    error,
    initialized,
    unsavedChanges,
    initializeData,
    saveData,
    exportToExcel,
    exportToPdf,
    exportToCsv,
    addEntity,
    updateEntity,
    deleteEntity,
    getEntities,
    getEntityById,
    filterEntities,
    clearError
  };
  
  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};

// Custom hook for using the data context
export const useData = () => {
  const context = useContext(DataContext);
  
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  
  return context;
};

export default DataContext;