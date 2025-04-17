// src/contexts/DataContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import excelService from '../services/ExcelService';
import githubService from '../services/GitHubService';

// Create context
const DataContext = createContext();

// Context provider component
export const DataProvider = ({ children }) => {
  // State for all data
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);
  
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
        newData = {
          Expenses: [],
          Suppliers: [],
          Programs: [],
          PaymentCenters: [
            { id: 1, name: 'GDC', description: 'GDC Payment Center' },
            { id: 2, name: 'VCES', description: 'VCES Payment Center' },
            { id: 3, name: 'Commercial', description: 'Commercial Payment Center' },
            { id: 4, name: 'Operation', description: 'Operation Payment Center' }
          ],
          PaymentTypes: [
            { id: 1, name: 'PO', description: 'Purchase Order' },
            { id: 2, name: 'Credit Card', description: 'Credit Card Payment' },
            { id: 3, name: 'Activiti', description: 'Activiti Invoice' }
          ],
          ExpenseStatus: [
            { id: 1, name: 'Committed', description: 'Expense is committed but not paid' },
            { id: 2, name: 'Invoiced', description: 'Invoice received but not paid' },
            { id: 3, name: 'Paid', description: 'Expense is paid' }
          ],
          Users: [
            { 
              id: 1, 
              username: 'admin', 
              name: 'Administrator', 
              email: 'admin@example.com',
              role: 'admin',
              permissions: ['read', 'write', 'delete', 'admin']
            }
          ]
        };
        
        // Store the default data in the service
        Object.entries(newData).forEach(([sheet, sheetData]) => {
          excelService.updateSheetData(sheet, sheetData);
        });
      }
      
      setData(newData);
      setInitialized(true);
    } catch (err) {
      console.error('Error initializing data:', err);
      setError('Failed to initialize data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Load data on component mount
  useEffect(() => {
    if (!initialized) {
      initializeData();
    }
  }, [initialized, initializeData]);
  
  // Save data to GitHub
  const saveData = useCallback(async () => {
    try {
      setLoading(true);
      await githubService.saveToGitHub();
      return true;
    } catch (err) {
      console.error('Error saving data:', err);
      setError('Failed to save data. Please check your connection and try again.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);
  
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
      
      // Add to Excel service
      excelService.addRow(collection, newEntity);
      
      // Update state
      setData(prevData => ({
        ...prevData,
        [collection]: [...prevData[collection], newEntity]
      }));
      
      return newEntity;
    } catch (err) {
      console.error('Error adding entity:', err);
      setError(`Failed to add entity to ${collection}.`);
      return null;
    }
  }, [data]);
  
  // Update an entity in a specific collection
  const updateEntity = useCallback((collection, id, updates) => {
    try {
      // Ensure the collection exists
      if (!data[collection]) {
        throw new Error(`Collection "${collection}" does not exist`);
      }
      
      // Update in Excel service
      const success = excelService.updateRow(collection, id, 'id', updates);
      
      if (!success) {
        throw new Error(`Entity with ID "${id}" not found in ${collection}`);
      }
      
      // Update state
      setData(prevData => ({
        ...prevData,
        [collection]: prevData[collection].map(item => 
          String(item.id) === String(id) ? { ...item, ...updates } : item
        )
      }));
      
      return true;
    } catch (err) {
      console.error('Error updating entity:', err);
      setError(`Failed to update entity in ${collection}.`);
      return false;
    }
  }, [data]);
  
  // Delete an entity from a specific collection
  const deleteEntity = useCallback((collection, id) => {
    try {
      // Ensure the collection exists
      if (!data[collection]) {
        throw new Error(`Collection "${collection}" does not exist`);
      }
      
      // Delete from Excel service
      const success = excelService.deleteRow(collection, id, 'id');
      
      if (!success) {
        throw new Error(`Entity with ID "${id}" not found in ${collection}`);
      }
      
      // Update state
      setData(prevData => ({
        ...prevData,
        [collection]: prevData[collection].filter(item => String(item.id) !== String(id))
      }));
      
      return true;
    } catch (err) {
      console.error('Error deleting entity:', err);
      setError(`Failed to delete entity from ${collection}.`);
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
  
  // Context value
  const contextValue = {
    data,
    loading,
    error,
    initialized,
    initializeData,
    saveData,
    exportToExcel,
    addEntity,
    updateEntity,
    deleteEntity,
    getEntities,
    getEntityById,
    filterEntities
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