// src/services/ExcelService.js
import * as XLSX from 'xlsx';

class ExcelService {
  constructor() {
    this.data = null;
    this.workbook = null;
    this.filename = null;
  }

  /**
   * Load Excel data from an array buffer or file
   * @param {ArrayBuffer|File} excelData - The Excel data to load
   * @param {string} filename - Optional filename
   * @returns {Object} - Object with sheets as keys and arrays of objects as values
   */
  loadExcel(excelData, filename = null) {
    try {
      let workbook;
      
      if (excelData instanceof File) {
        // Read the file using file reader
        const reader = new FileReader();
        
        return new Promise((resolve, reject) => {
          reader.onload = (e) => {
            try {
              const data = new Uint8Array(e.target.result);
              workbook = XLSX.read(data, { type: 'array', cellDates: true });
              this.workbook = workbook;
              this.filename = filename || excelData.name;
              
              const result = this.parseWorkbook(workbook);
              this.data = result;
              resolve(result);
            } catch (error) {
              reject(error);
            }
          };
          
          reader.onerror = (error) => reject(error);
          reader.readAsArrayBuffer(excelData);
        });
      } else {
        // Assume ArrayBuffer or similar
        workbook = XLSX.read(excelData, { type: 'array', cellDates: true });
        this.workbook = workbook;
        this.filename = filename;
        
        const result = this.parseWorkbook(workbook);
        this.data = result;
        return result;
      }
    } catch (error) {
      console.error('Error loading Excel data:', error);
      throw error;
    }
  }

  /**
   * Parse workbook into structured data
   * @param {Object} workbook - XLSX workbook
   * @returns {Object} - Object with sheets as keys and arrays of objects as values
   */
  parseWorkbook(workbook) {
    const result = {};
    
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        raw: false, // Convert to formatted string
        dateNF: 'yyyy-mm-dd', // Date format
        defval: '' // Default value for empty cells
      });
      
      result[sheetName] = jsonData;
    });
    
    return result;
  }

  /**
   * Get data for a specific sheet
   * @param {string} sheetName - The name of the sheet to get
   * @returns {Array} - Array of objects representing the sheet data
   */
  getSheetData(sheetName) {
    if (!this.data) {
      throw new Error('No Excel data loaded. Call loadExcel first.');
    }
    
    return this.data[sheetName] || [];
  }

  /**
   * Save current data to an Excel file
   * @param {string} filename - The filename to save as
   * @returns {ArrayBuffer} - Excel file as array buffer
   */
  saveToExcel(filename = null) {
    if (!this.data) {
      throw new Error('No data to save. Load or create data first.');
    }
    
    const workbook = XLSX.utils.book_new();
    
    // Add each data collection as a sheet
    Object.entries(this.data).forEach(([sheetName, collection]) => {
      if (Array.isArray(collection) && collection.length > 0) {
        const ws = XLSX.utils.json_to_sheet(collection);
        XLSX.utils.book_append_sheet(workbook, ws, sheetName);
      }
    });
    
    // Save to array buffer
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
    // Save to file if filename is provided
    if (filename) {
      this.saveToFile(buffer, filename);
    }
    
    return buffer;
  }

  /**
   * Save array buffer to file
   * @param {ArrayBuffer} buffer - Excel file as array buffer
   * @param {string} filename - The filename to save as
   */
  saveToFile(buffer, filename) {
    try {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || this.filename || 'export.xlsx';
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);
      
      return true;
    } catch (error) {
      console.error('Error saving Excel file:', error);
      return false;
    }
  }

  /**
   * Update sheet data
   * @param {string} sheetName - The name of the sheet to update
   * @param {Array} data - The new data for the sheet
   */
  updateSheetData(sheetName, data) {
    if (!this.data) {
      this.data = {};
    }
    
    this.data[sheetName] = data;
  }

  /**
   * Add a row to a sheet
   * @param {string} sheetName - The name of the sheet
   * @param {Object} row - The row data to add
   */
  addRow(sheetName, row) {
    if (!this.data) {
      this.data = {};
    }
    
    if (!this.data[sheetName]) {
      this.data[sheetName] = [];
    }
    
    this.data[sheetName].push(row);
  }

  /**
   * Update a row in a sheet
   * @param {string} sheetName - The name of the sheet
   * @param {string|number} id - The ID or key of the row to update
   * @param {string} idField - The field name that contains the ID
   * @param {Object} newData - The new data for the row
   * @returns {boolean} - Whether the update was successful
   */
  updateRow(sheetName, id, idField, newData) {
    if (!this.data || !this.data[sheetName]) {
      return false;
    }
    
    const index = this.data[sheetName].findIndex(row => String(row[idField]) === String(id));
    
    if (index === -1) {
      return false;
    }
    
    this.data[sheetName][index] = { ...this.data[sheetName][index], ...newData };
    return true;
  }

  /**
   * Delete a row from a sheet
   * @param {string} sheetName - The name of the sheet
   * @param {string|number} id - The ID or key of the row to delete
   * @param {string} idField - The field name that contains the ID
   * @returns {boolean} - Whether the deletion was successful
   */
  deleteRow(sheetName, id, idField) {
    if (!this.data || !this.data[sheetName]) {
      return false;
    }
    
    const index = this.data[sheetName].findIndex(row => String(row[idField]) === String(id));
    
    if (index === -1) {
      return false;
    }
    
    this.data[sheetName].splice(index, 1);
    return true;
  }

  /**
   * Create a new Excel sheet
   * @param {string} sheetName - The name of the new sheet
   * @param {Array} data - Initial data for the sheet
   */
  createSheet(sheetName, data = []) {
    if (!this.data) {
      this.data = {};
    }
    
    this.data[sheetName] = data;
  }
}

// Create and export a singleton instance
const excelService = new ExcelService();
export default excelService;