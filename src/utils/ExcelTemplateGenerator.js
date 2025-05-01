// src/utils/ExcelTemplateGenerator.js - With Payment Center Budgets instead of Programs
import * as XLSX from 'xlsx';

class ExcelTemplateGenerator {
  generateTemplate() {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Add Users sheet
    const usersData = [
      ['id', 'username', 'name', 'email', 'role', 'permissions', 'status', 'lastLogin', 'createdAt'],
      ['1', 'admin', 'Administrator', 'admin@kiosc.com', 'admin', 'read,write,delete,admin,approve', 'active', '', '2023-01-01T00:00:00.000Z'],
      ['2', 'manager', 'John Manager', 'john@kiosc.com', 'manager', 'read,write,approve', 'active', '', '2023-01-01T00:00:00.000Z'],
      ['3', 'user', 'Jane User', 'jane@kiosc.com', 'user', 'read,write', 'active', '', '2023-01-01T00:00:00.000Z'],
      ['4', 'viewer', 'View Only', 'viewer@kiosc.com', 'viewer', 'read', 'active', '', '2023-01-01T00:00:00.000Z']
    ];
    const usersWorksheet = XLSX.utils.aoa_to_sheet(usersData);
    XLSX.utils.book_append_sheet(workbook, usersWorksheet, 'Users');
    
    // Add Suppliers sheet
    const suppliersData = [
      ['id', 'code', 'name', 'category', 'status', 'contactName', 'email', 'phone', 'address', 'abn', 'paymentTerms', 'notes', 'createdAt'],
      ['SUP001', 'SUP001', 'Tech Solutions Inc', '1', 'Active', 'John Smith', 'john@techsolutions.com', '(03) 9555-1234', '123 Tech Lane Melbourne VIC 3000', '12 345 678 901', '30', 'Preferred IT hardware supplier', '2023-01-15T00:00:00.000Z'],
      ['SUP002', 'SUP002', 'Office Supplies Co', '2', 'Active', 'Sarah Johnson', 'sarah@officesupplies.com', '(03) 9555-5678', '456 Supply Street Melbourne VIC 3000', '23 456 789 012', '14', 'Regular office supply vendor', '2023-02-10T00:00:00.000Z'],
      ['SUP003', 'SUP003', 'Education Resources Ltd', '5', 'Active', 'Michael Chen', 'michael@eduresources.com', '(03) 9555-9012', '789 Learning Road Melbourne VIC 3000', '34 567 890 123', '30', 'Educational materials and resources', '2023-03-05T00:00:00.000Z']
    ];
    const suppliersWorksheet = XLSX.utils.aoa_to_sheet(suppliersData);
    XLSX.utils.book_append_sheet(workbook, suppliersWorksheet, 'Suppliers');
    
    // Add PaymentCenters sheet
    const paymentCentersData = [
      ['id', 'name', 'description'],
      ['1', 'GDC', 'GDC Payment Center'],
      ['2', 'VCES', 'VCES Payment Center'],
      ['3', 'Commercial', 'Commercial Payment Center'],
      ['4', 'Operation', 'Operation Payment Center']
    ];
    const paymentCentersWorksheet = XLSX.utils.aoa_to_sheet(paymentCentersData);
    XLSX.utils.book_append_sheet(workbook, paymentCentersWorksheet, 'PaymentCenters');
    
    // Add PaymentCenterBudgets sheet (replacing Programs sheet)
    const currentYear = new Date().getFullYear();
    const paymentCenterBudgetsData = [
      ['id', 'paymentCenterId', 'year', 'budget', 'description', 'notes', 'createdAt'],
      ['PCB001', '1', currentYear.toString(), '500000', 'GDC annual budget', 'Includes all operational expenses for GDC', '2023-01-01T00:00:00.000Z'],
      ['PCB002', '2', currentYear.toString(), '300000', 'VCES annual budget', 'Includes all operational expenses for VCES', '2023-01-01T00:00:00.000Z'],
      ['PCB003', '3', currentYear.toString(), '750000', 'Commercial activities budget', 'Includes all commercial operations', '2023-01-01T00:00:00.000Z'],
      ['PCB004', '4', currentYear.toString(), '450000', 'Operations budget', 'General operational expenses', '2023-01-01T00:00:00.000Z']
    ];
    const paymentCenterBudgetsWorksheet = XLSX.utils.aoa_to_sheet(paymentCenterBudgetsData);
    XLSX.utils.book_append_sheet(workbook, paymentCenterBudgetsWorksheet, 'PaymentCenterBudgets');
    
    // Add PaymentTypes sheet
    const paymentTypesData = [
      ['id', 'name', 'description'],
      ['1', 'PO', 'Purchase Order'],
      ['2', 'Credit Card', 'Credit Card Payment'],
      ['3', 'Activiti', 'Activiti Invoice']
    ];
    const paymentTypesWorksheet = XLSX.utils.aoa_to_sheet(paymentTypesData);
    XLSX.utils.book_append_sheet(workbook, paymentTypesWorksheet, 'PaymentTypes');
    
    // Add ExpenseStatus sheet
    const expenseStatusData = [
      ['id', 'name', 'description'],
      ['1', 'Committed', 'Expense is committed but not paid'],
      ['2', 'Invoiced', 'Invoice received but not paid'],
      ['3', 'Paid', 'Expense is paid']
    ];
    const expenseStatusWorksheet = XLSX.utils.aoa_to_sheet(expenseStatusData);
    XLSX.utils.book_append_sheet(workbook, expenseStatusWorksheet, 'ExpenseStatus');
    
    // Add Expenses sheet (without program field)
    const expensesData = [
      ['id', 'date', 'description', 'supplier', 'amount', 'paymentType', 'paymentCenter', 'status', 'notes', 'invoiceDate', 'paymentDate', 'createdBy', 'createdAt'],
      ['EXP001', '2023-01-20', 'Computer Equipment Purchase', 'SUP001', '5699.99', '1', '1', 'Paid', 'New laptops for staff', '2023-01-20', '2023-01-20', 'admin', '2023-01-20T09:30:00.000Z'],
      ['EXP002', '2023-02-05', 'Office Supplies', 'SUP002', '824.50', '2', '1', 'Paid', 'Monthly office supplies', '2023-02-05', '2023-02-05', 'admin', '2023-02-05T10:15:00.000Z'],
      ['EXP003', '2023-02-15', 'Educational Materials', 'SUP003', '3450.00', '1', '2', 'Invoiced', 'Materials for outreach program', '2023-02-15', '', 'user', '2023-02-15T14:00:00.000Z'],
      ['EXP004', '2023-03-01', 'Commercial Project Expenses', 'SUP001', '15000.00', '1', '3', 'Paid', 'Large commercial project equipment', '2023-03-05', '2023-03-15', 'admin', '2023-03-01T11:00:00.000Z']
    ];
    const expensesWorksheet = XLSX.utils.aoa_to_sheet(expensesData);
    XLSX.utils.book_append_sheet(workbook, expensesWorksheet, 'Expenses');
    
    // Add JournalEntries sheet (between payment centers only)
    const journalEntriesData = [
      ['id', 'date', 'description', 'reference', 'fromPaymentCenter', 'toPaymentCenter', 'amount', 'status', 'notes', 'createdBy', 'createdAt', 'approvedBy', 'approvedAt', 'rejectedBy', 'rejectedAt', 'reason'],
      ['JE001', '2023-03-15', 'Budget Reallocation - Q1 Adjustment', 'JE-20230315-001', '1', '2', '5000', 'Approved', 'Quarterly budget reallocation to support VCES initiatives', 'admin', '2023-03-15T10:30:00.000Z', 'admin', '2023-03-16T09:15:00.000Z', '', '', ''],
      ['JE002', '2023-04-05', 'Fund Transfer - Equipment Purchase', 'JE-20230405-001', '3', '4', '7500', 'Approved', 'Transfer from Commercial to Operations for equipment purchase', 'user', '2023-04-05T14:45:00.000Z', 'admin', '2023-04-06T11:20:00.000Z', '', '', '']
    ];
    const journalEntriesWorksheet = XLSX.utils.aoa_to_sheet(journalEntriesData);
    XLSX.utils.book_append_sheet(workbook, journalEntriesWorksheet, 'JournalEntries');
    
    // Add AuditLog sheet for full audit trail
    const auditLogData = [
      ['id', 'entityType', 'entityId', 'action', 'userId', 'username', 'timestamp', 'changes', 'description'],
      ['AUDIT001', 'Expenses', 'EXP001', 'CREATE', '1', 'admin', '2023-01-20T09:30:00.000Z', 'Created new expense', 'Created expense for computer equipment'],
      ['AUDIT002', 'JournalEntries', 'JE001', 'CREATE', '1', 'admin', '2023-03-15T10:30:00.000Z', 'Created new journal entry', 'Created journal entry JE-20230315-001'],
      ['AUDIT003', 'JournalEntries', 'JE001', 'APPROVE', '1', 'admin', '2023-03-16T09:15:00.000Z', 'Status changed from Pending to Approved', 'Approved journal entry JE-20230315-001'],
      ['AUDIT004', 'JournalEntries', 'JE002', 'CREATE', '3', 'user', '2023-04-05T14:45:00.000Z', 'Created new journal entry', 'Created journal entry JE-20230405-001'],
      ['AUDIT005', 'JournalEntries', 'JE002', 'APPROVE', '1', 'admin', '2023-04-06T11:20:00.000Z', 'Status changed from Pending to Approved', 'Approved journal entry JE-20230405-001']
    ];
    const auditLogWorksheet = XLSX.utils.aoa_to_sheet(auditLogData);
    XLSX.utils.book_append_sheet(workbook, auditLogWorksheet, 'AuditLog');
    
    // Generate and download the Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'KIOSC_Finance_Data_Template.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export default new ExcelTemplateGenerator();