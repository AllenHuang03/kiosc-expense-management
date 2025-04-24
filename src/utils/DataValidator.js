// src/utils/DataValidator.js

/**
 * Utility for data validation across the application
 */
class DataValidator {
  /**
   * Validate supplier data
   * @param {Object} supplier - The supplier object to validate
   * @returns {Object} Result with isValid flag and errors array
   */
  validateSupplier(supplier) {
    const errors = [];
    
    // Required fields
    if (!supplier.name || supplier.name.trim() === '') {
      errors.push('Supplier name is required');
    }
    
    if (!supplier.code || supplier.code.trim() === '') {
      errors.push('Supplier code is required');
    }
    
    if (!supplier.category) {
      errors.push('Category is required');
    }
    
    // Email validation
    if (supplier.email && !this.isValidEmail(supplier.email)) {
      errors.push('Invalid email format');
    }
    
    // Phone validation
    if (supplier.phone && !this.isValidPhone(supplier.phone)) {
      errors.push('Invalid phone number format');
    }
    
    // ABN validation (for Australian Business Number)
    if (supplier.abn && !this.isValidABN(supplier.abn)) {
      errors.push('Invalid ABN format');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Validate expense data
   * @param {Object} expense - The expense object to validate
   * @returns {Object} Result with isValid flag and errors array
   */
  validateExpense(expense) {
    const errors = [];
    
    // Required fields
    if (!expense.description || expense.description.trim() === '') {
      errors.push('Description is required');
    }
    
    if (!expense.date) {
      errors.push('Date is required');
    }
    
    if (!expense.supplier) {
      errors.push('Supplier is required');
    }
    
    if (!expense.amount) {
      errors.push('Amount is required');
    } else if (isNaN(parseFloat(expense.amount)) || parseFloat(expense.amount) <= 0) {
      errors.push('Amount must be a positive number');
    }
    
    if (!expense.paymentType) {
      errors.push('Payment type is required');
    }
    
    if (!expense.paymentCenter) {
      errors.push('Payment center is required');
    }
    
    if (!expense.program) {
      errors.push('Program is required');
    }
    
    // Date validation
    if (expense.status === 'Invoiced' && !expense.invoiceDate) {
      errors.push('Invoice date is required for invoiced expenses');
    }
    
    if (expense.status === 'Paid' && !expense.paymentDate) {
      errors.push('Payment date is required for paid expenses');
    }
    
    // Date sequence validation
    if (expense.invoiceDate && expense.date && new Date(expense.invoiceDate) < new Date(expense.date)) {
      errors.push('Invoice date cannot be earlier than expense date');
    }
    
    if (expense.paymentDate && expense.invoiceDate && new Date(expense.paymentDate) < new Date(expense.invoiceDate)) {
      errors.push('Payment date cannot be earlier than invoice date');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Validate journal entry data
   * @param {Object} journal - The journal entry object to validate
   * @returns {Object} Result with isValid flag and errors array
   */
  validateJournal(journal) {
    const errors = [];
    
    // Required fields
    if (!journal.description || journal.description.trim() === '') {
      errors.push('Description is required');
    }
    
    if (!journal.date) {
      errors.push('Date is required');
    }
    
    if (!journal.reference || journal.reference.trim() === '') {
      errors.push('Reference is required');
    }
    
    if (!journal.fromPaymentCenter) {
      errors.push('From payment center is required');
    }
    
    if (!journal.toPaymentCenter) {
      errors.push('To payment center is required');
    }
    
    // Cannot transfer to the same payment center
    if (journal.fromPaymentCenter && journal.toPaymentCenter && journal.fromPaymentCenter === journal.toPaymentCenter) {
      errors.push('From payment center and To payment center cannot be the same');
    }
    
    if (!journal.amount) {
      errors.push('Amount is required');
    } else if (isNaN(parseFloat(journal.amount)) || parseFloat(journal.amount) <= 0) {
      errors.push('Amount must be a positive number');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Validate user data
   * @param {Object} user - The user object to validate
   * @returns {Object} Result with isValid flag and errors array
   */
  validateUser(user) {
    const errors = [];
    
    // Required fields
    if (!user.username || user.username.trim() === '') {
      errors.push('Username is required');
    }
    
    if (!user.name || user.name.trim() === '') {
      errors.push('Name is required');
    }
    
    if (!user.role) {
      errors.push('Role is required');
    }
    
    // Email validation
    if (!user.email || !this.isValidEmail(user.email)) {
      errors.push('Valid email is required');
    }
    
    // Permissions validation
    if (!user.permissions || !Array.isArray(user.permissions) || user.permissions.length === 0) {
      errors.push('At least one permission is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Check if a value is a valid email
   * @param {string} email - Email to validate
   * @returns {boolean} Whether email is valid
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  /**
   * Check if a value is a valid phone number (basic format)
   * @param {string} phone - Phone number to validate
   * @returns {boolean} Whether phone is valid
   */
  isValidPhone(phone) {
    // Basic phone validation - accepts various formats
    const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
  }
  
  /**
   * Check if a value is a valid Australian Business Number (ABN)
   * @param {string} abn - ABN to validate
   * @returns {boolean} Whether ABN is valid
   */
  isValidABN(abn) {
    // Remove any spaces or special characters
    const cleanABN = abn.replace(/[^0-9]/g, '');
    
    // ABN should be 11 digits
    if (cleanABN.length !== 11) {
      return false;
    }
    
    // Simple validation (just checks if it's 11 digits)
    // For a real implementation, we would add the full ABN validation algorithm
    return true;
  }
  
  /**
   * Validate an Australian date format (DD/MM/YYYY)
   * @param {string} date - Date string to validate
   * @returns {boolean} Whether date is valid
   */
  isValidAustralianDate(date) {
    // Accept multiple formats
    const formats = [
      /^\d{2}\/\d{2}\/\d{4}$/,  // DD/MM/YYYY
      /^\d{4}-\d{2}-\d{2}$/     // YYYY-MM-DD
    ];
    
    return formats.some(format => format.test(date));
  }
}

export default new DataValidator();