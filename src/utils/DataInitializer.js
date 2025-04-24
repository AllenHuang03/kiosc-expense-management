// src/utils/DataInitializer.js
import { v4 as uuidv4 } from 'uuid';
import excelService from '../services/ExcelService';

class DataInitializer {
  /**
   * Initialize a new Excel data structure with default data
   * This now creates a more structured data that directly maps to Excel sheets
   * @returns {Object} The initialized data
   */
  initializeData() {
    const data = {
      Users: this.createUsers(),
      Suppliers: this.createSuppliers(),
      Programs: this.createPrograms(),
      PaymentCenters: this.createPaymentCenters(),
      PaymentTypes: this.createPaymentTypes(),
      ExpenseStatus: this.createExpenseStatuses(),
      Expenses: this.createExpenses(),
      JournalEntries: this.createJournalEntries()
    };
    
    // Update the Excel service with the data
    Object.entries(data).forEach(([sheet, sheetData]) => {
      excelService.updateSheetData(sheet, sheetData);
    });
    
    return data;
  }
  
  /**
   * Create sample users with proper Excel format
   * @returns {Array} Sample users
   */
  createUsers() {
    return [
      { 
        id: '1',
        username: 'admin',
        name: 'Administrator',
        email: 'admin@kiosc.com',
        role: 'admin',
        permissions: 'read,write,delete,admin,approve',
        status: 'active',
        lastLogin: '',
        createdAt: new Date().toISOString()
      },
      { 
        id: '2',
        username: 'manager',
        name: 'John Manager',
        email: 'john@kiosc.com',
        role: 'manager',
        permissions: 'read,write,approve',
        status: 'active',
        lastLogin: '',
        createdAt: new Date().toISOString()
      },
      { 
        id: '3',
        username: 'user',
        name: 'Jane User',
        email: 'jane@kiosc.com',
        role: 'user',
        permissions: 'read,write',
        status: 'active',
        lastLogin: '',
        createdAt: new Date().toISOString()
      },
      { 
        id: '4',
        username: 'viewer',
        name: 'View Only',
        email: 'viewer@kiosc.com',
        role: 'viewer',
        permissions: 'read',
        status: 'active',
        lastLogin: '',
        createdAt: new Date().toISOString()
      }
    ];
  }
  
  /**
   * Create sample suppliers with proper Excel format
   * @returns {Array} Sample suppliers
   */
  createSuppliers() {
    return [
      {
        id: 'SUP001',
        code: 'SUP001',
        name: 'Tech Solutions Inc',
        category: '1',
        status: 'Active',
        contactName: 'John Smith',
        email: 'john@techsolutions.com',
        phone: '(03) 9555-1234',
        address: '123 Tech Lane Melbourne VIC 3000',
        abn: '12 345 678 901',
        paymentTerms: '30',
        notes: 'Preferred IT hardware supplier',
        createdAt: '2023-01-15T00:00:00.000Z'
      },
      {
        id: 'SUP002',
        code: 'SUP002',
        name: 'Office Supplies Co',
        category: '2',
        status: 'Active',
        contactName: 'Sarah Johnson',
        email: 'sarah@officesupplies.com',
        phone: '(03) 9555-5678',
        address: '456 Supply Street Melbourne VIC 3000',
        abn: '23 456 789 012',
        paymentTerms: '14',
        notes: 'Regular office supply vendor',
        createdAt: '2023-02-10T00:00:00.000Z'
      },
      {
        id: 'SUP003',
        code: 'SUP003',
        name: 'Education Resources Ltd',
        category: '5',
        status: 'Active',
        contactName: 'Michael Chen',
        email: 'michael@eduresources.com',
        phone: '(03) 9555-9012',
        address: '789 Learning Road Melbourne VIC 3000',
        abn: '34 567 890 123',
        paymentTerms: '30',
        notes: 'Educational materials and resources',
        createdAt: '2023-03-05T00:00:00.000Z'
      }
    ];
  }
  
  /**
   * Create sample programs
   * @returns {Array} Sample programs
   */
  createPrograms() {
    return [
      { id: '1', name: 'General Operations', description: 'Day-to-day operational expenses', budget: '250000' },
      { id: '2', name: 'Outreach Program', description: 'Community outreach and education', budget: '75000' },
      { id: '3', name: 'Research Initiative', description: 'Research and development projects', budget: '120000' },
      { id: '4', name: 'Infrastructure', description: 'Infrastructure maintenance and upgrades', budget: '180000' },
      { id: '5', name: 'Staff Development', description: 'Training and professional development', budget: '50000' }
    ];
  }
  
  /**
   * Create sample payment centers
   * @returns {Array} Sample payment centers
   */
  createPaymentCenters() {
    return [
      { id: '1', name: 'GDC', description: 'GDC Payment Center' },
      { id: '2', name: 'VCES', description: 'VCES Payment Center' },
      { id: '3', name: 'Commercial', description: 'Commercial Payment Center' },
      { id: '4', name: 'Operation', description: 'Operation Payment Center' }
    ];
  }
  
  /**
   * Create sample payment types
   * @returns {Array} Sample payment types
   */
  createPaymentTypes() {
    return [
      { id: '1', name: 'PO', description: 'Purchase Order' },
      { id: '2', name: 'Credit Card', description: 'Credit Card Payment' },
      { id: '3', name: 'Activiti', description: 'Activiti Invoice' }
    ];
  }
  
  /**
   * Create sample expense statuses
   * @returns {Array} Sample expense statuses
   */
  createExpenseStatuses() {
    return [
      { id: '1', name: 'Committed', description: 'Expense is committed but not paid' },
      { id: '2', name: 'Invoiced', description: 'Invoice received but not paid' },
      { id: '3', name: 'Paid', description: 'Expense is paid' }
    ];
  }
  
  /**
   * Create sample expenses
   * @returns {Array} Sample expenses
   */
  createExpenses() {
    return [
      {
        id: 'EXP001',
        date: '2023-01-20',
        description: 'Computer Equipment Purchase',
        supplier: 'SUP001',
        amount: '5699.99',
        paymentType: '1',
        paymentCenter: '1',
        program: '1',
        status: 'Paid',
        notes: 'New laptops for staff',
        invoiceDate: '2023-01-25',
        paymentDate: '2023-02-10',
        createdBy: 'admin',
        createdAt: '2023-01-20T09:30:00.000Z'
      },
      {
        id: 'EXP002',
        date: '2023-02-05',
        description: 'Office Supplies',
        supplier: 'SUP002',
        amount: '824.50',
        paymentType: '2',
        paymentCenter: '1',
        program: '1',
        status: 'Paid',
        notes: 'Monthly office supplies',
        invoiceDate: '2023-02-05',
        paymentDate: '2023-02-05',
        createdBy: 'admin',
        createdAt: '2023-02-05T10:15:00.000Z'
      },
      {
        id: 'EXP003',
        date: '2023-02-15',
        description: 'Educational Materials',
        supplier: 'SUP003',
        amount: '3450.00',
        paymentType: '1',
        paymentCenter: '2',
        program: '2',
        status: 'Invoiced',
        notes: 'Materials for outreach program',
        invoiceDate: '2023-02-20',
        paymentDate: '',
        createdBy: 'user',
        createdAt: '2023-02-15T14:00:00.000Z'
      }
    ];
  }

  /**
   * Create sample journal entries
   * @returns {Array} Sample journal entries
   */
  createJournalEntries() {
    return [
      {
        id: 'JE001',
        date: '2023-03-15',
        description: 'Budget Reallocation - Q1 Adjustment',
        fromProgram: '1',
        toProgram: '2',
        fromPaymentCenter: '1',
        toPaymentCenter: '1',
        amount: '5000',
        reference: 'JE-20230315-001',
        status: 'Approved',
        notes: 'Quarterly budget reallocation to support outreach initiatives',
        createdBy: 'admin',
        createdAt: '2023-03-15T10:30:00.000Z',
        approvedBy: 'admin',
        approvedAt: '2023-03-16T09:15:00.000Z',
        rejectedBy: '',
        rejectedAt: '',
        reason: ''
      },
      {
        id: 'JE002',
        date: '2023-04-05',
        description: 'Fund Transfer - Equipment Purchase',
        fromProgram: '4',
        toProgram: '3',
        fromPaymentCenter: '3',
        toPaymentCenter: '2',
        amount: '7500',
        reference: 'JE-20230405-001',
        status: 'Approved',
        notes: 'Transfer of funds to research program for specialized equipment purchase',
        createdBy: 'user',
        createdAt: '2023-04-05T14:45:00.000Z',
        approvedBy: 'admin',
        approvedAt: '2023-04-06T11:20:00.000Z',
        rejectedBy: '',
        rejectedAt: '',
        reason: ''
      }
    ];
  }
}

export default new DataInitializer();