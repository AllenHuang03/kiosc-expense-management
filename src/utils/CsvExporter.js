// src/utils/CsvExporter.js

/**
 * Utility for CSV export functionality
 */
class CsvExporter {
    /**
     * Convert array of objects to CSV string
     * @param {Array} data - Array of objects to convert
     * @param {Array} headers - Optional array of header names in order
     * @param {Object} fieldMap - Optional object mapping field names to header names
     * @returns {string} CSV string
     */
    objectsToCsv(data, headers = null, fieldMap = {}) {
      if (!data || !data.length) {
        return '';
      }
      
      // Get all fields from the objects
      const fields = Object.keys(data[0]);
      
      // Use provided headers or generate from field map or fields
      const csvHeaders = headers || fields.map(field => fieldMap[field] || field);
      
      // Create header row
      let csvString = csvHeaders.join(',') + '\n';
      
      // Create data rows
      data.forEach(item => {
        const row = fields.map(field => {
          const value = item[field];
          
          // Handle different value types
          if (value === null || value === undefined) {
            return '';
          } else if (typeof value === 'string') {
            // Escape quotes and wrap in quotes
            return `"${value.replace(/"/g, '""')}"`;
          } else if (typeof value === 'object') {
            // Convert objects/arrays to JSON and wrap in quotes
            return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
          } else {
            return value;
          }
        });
        
        csvString += row.join(',') + '\n';
      });
      
      return csvString;
    }
    
    /**
     * Download CSV data as a file
     * @param {string} csvString - CSV content as string
     * @param {string} filename - File name for download
     */
    downloadCsv(csvString, filename) {
      // Create a Blob containing the CSV data
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      
      // Create a download link
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      // Set link attributes
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      
      // Add to document, click to download, then remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    /**
     * Export suppliers to CSV
     * @param {Array} suppliers - Array of supplier objects
     * @param {Array} categories - Array of categories for lookup
     * @param {string} filename - Optional filename
     */
    exportSuppliersToCsv(suppliers, categories, filename = 'KIOSC_Suppliers.csv') {
      // Get category name by ID
      const getCategoryName = (id) => {
        const category = categories.find(c => c.id === parseInt(id));
        return category ? category.name : 'Unknown';
      };
      
      // Map supplier fields to more readable names
      const fieldMap = {
        id: 'ID',
        code: 'Code',
        name: 'Name',
        category: 'Category',
        status: 'Status',
        contactName: 'Contact Name',
        email: 'Email',
        phone: 'Phone',
        address: 'Address',
        abn: 'ABN/Tax ID',
        paymentTerms: 'Payment Terms (Days)',
        notes: 'Notes',
        createdAt: 'Created At'
      };
      
      // Process data to replace category IDs with names
      const processedData = suppliers.map(supplier => ({
        ...supplier,
        category: getCategoryName(supplier.category)
      }));
      
      // Convert to CSV
      const csvString = this.objectsToCsv(processedData, null, fieldMap);
      
      // Download the CSV
      this.downloadCsv(csvString, filename);
    }
    
    /**
     * Export expenses to CSV
     * @param {Array} expenses - Array of expense objects
     * @param {Array} suppliers - Array of suppliers for lookup
     * @param {Array} programs - Array of programs for lookup
     * @param {Array} paymentCenters - Array of payment centers for lookup
     * @param {Array} paymentTypes - Array of payment types for lookup
     * @param {string} filename - Optional filename
     */
    exportExpensesToCsv(expenses, suppliers, programs, paymentCenters, paymentTypes, filename = 'KIOSC_Expenses.csv') {
      // Helper functions to get names from IDs
      const getSupplierName = (id) => {
        const supplier = suppliers.find(s => s.id === id);
        return supplier ? supplier.name : 'Unknown';
      };
      
      const getProgramName = (id) => {
        const program = programs.find(p => p.id === parseInt(id));
        return program ? program.name : 'Unknown';
      };
      
      const getPaymentCenterName = (id) => {
        const center = paymentCenters.find(c => c.id === parseInt(id));
        return center ? center.name : 'Unknown';
      };
      
      const getPaymentTypeName = (id) => {
        const type = paymentTypes.find(t => t.id === parseInt(id));
        return type ? type.name : 'Unknown';
      };
      
      // Map expense fields to more readable names
      const fieldMap = {
        id: 'ID',
        date: 'Date',
        description: 'Description',
        supplier: 'Supplier',
        amount: 'Amount',
        paymentType: 'Payment Type',
        paymentCenter: 'Payment Center',
        program: 'Program',
        status: 'Status',
        notes: 'Notes',
        invoiceDate: 'Invoice Date',
        paymentDate: 'Payment Date',
        createdBy: 'Created By',
        createdAt: 'Created At'
      };
      
      // Process data to replace IDs with names
      const processedData = expenses.map(expense => ({
        ...expense,
        supplier: getSupplierName(expense.supplier),
        program: getProgramName(expense.program),
        paymentCenter: getPaymentCenterName(expense.paymentCenter),
        paymentType: getPaymentTypeName(expense.paymentType)
      }));
      
      // Convert to CSV
      const csvString = this.objectsToCsv(processedData, null, fieldMap);
      
      // Download the CSV
      this.downloadCsv(csvString, filename);
    }
/**
   * Export journal entries to CSV
   * @param {Array} journals - Array of journal entry objects
   * @param {Array} programs - Array of programs for lookup
   * @param {Array} paymentCenters - Array of payment centers for lookup
   * @param {string} filename - Optional filename
   */
exportJournalsToCsv(journals, programs, paymentCenters, filename = 'KIOSC_JournalEntries.csv') {
    // Get program name by ID
    const getProgramName = (id) => {
      const program = programs.find(p => String(p.id) === String(id));
      return program ? program.name : 'Unknown';
    };
    
    // Get payment center name by ID
    const getPaymentCenterName = (id) => {
      const center = paymentCenters.find(c => String(c.id) === String(id));
      return center ? center.name : 'Unknown';
    };
    
    // Map journal fields to more readable names
    const fieldMap = {
      id: 'ID',
      reference: 'Reference',
      date: 'Date',
      description: 'Description',
      fromProgram: 'From Program',
      toProgram: 'To Program',
      fromPaymentCenter: 'From Payment Center',
      toPaymentCenter: 'To Payment Center',
      amount: 'Amount',
      status: 'Status',
      notes: 'Notes',
      createdBy: 'Created By',
      createdAt: 'Created At',
      approvedBy: 'Approved By',
      approvedAt: 'Approved At',
      rejectedBy: 'Rejected By',
      rejectedAt: 'Rejected At',
      reason: 'Rejection Reason'
    };
    
    // Process data to replace IDs with names
    const processedData = journals.map(journal => ({
      ...journal,
      fromProgram: getProgramName(journal.fromProgram),
      toProgram: getProgramName(journal.toProgram),
      fromPaymentCenter: getPaymentCenterName(journal.fromPaymentCenter),
      toPaymentCenter: getPaymentCenterName(journal.toPaymentCenter)
    }));
    
    // Convert to CSV
    const csvString = this.objectsToCsv(processedData, null, fieldMap);
    
    // Download the CSV
    this.downloadCsv(csvString, filename);
  }

}

  
  export default new CsvExporter();