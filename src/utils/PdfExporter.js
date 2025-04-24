// src/utils/PdfExporter.js
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

/**
 * Utility for PDF export functionality
 */
class PdfExporter {
  /**
   * Format currency
   * @param {number} amount - The amount to format
   * @returns {string} Formatted currency string
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(amount);
  }

  /**
   * Export supplier list to PDF
   * @param {Array} suppliers - Array of supplier objects
   * @param {Array} categories - Array of category objects for lookup
   * @param {string} title - Optional PDF title
   * @returns {jsPDF} PDF document
   */
  exportSuppliersToPdf(suppliers, categories, title = 'Supplier List') {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text(title, 14, 22);
    
    // Add timestamp
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on ${new Date().toLocaleString()}`, 14, 30);
    
    // Get category name by ID
    const getCategoryName = (id) => {
      const category = categories.find(c => c.id === parseInt(id));
      return category ? category.name : 'Unknown';
    };
    
    // Create table data
    const tableColumn = ["Code", "Name", "Category", "Contact", "Email", "Phone", "Status"];
    const tableRows = suppliers.map(supplier => [
      supplier.code,
      supplier.name,
      getCategoryName(supplier.category),
      supplier.contactName || '-',
      supplier.email || '-',
      supplier.phone || '-',
      supplier.status
    ]);
    
    // Generate the PDF table
    doc.autoTable({
      startY: 40,
      head: [tableColumn],
      body: tableRows,
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      rowPageBreak: 'auto',
      bodyStyles: { valign: 'middle' },
      theme: 'striped',
      margin: { top: 40, right: 14, bottom: 20, left: 14 },
      didDrawPage: (data) => {
        // Add page number at the bottom
        doc.setFontSize(10);
        doc.text(
          `Page ${doc.internal.getNumberOfPages()}`,
          data.settings.margin.left,
          doc.internal.pageSize.height - 10
        );
      }
    });
    
    return doc;
  }
  
  /**
   * Export supplier details to PDF
   * @param {Object} supplier - The supplier object
   * @param {Array} categories - Array of category objects for lookup
   * @param {Array} transactions - Array of transaction objects for the supplier
   * @returns {jsPDF} PDF document
   */
  exportSupplierDetailsToPdf(supplier, categories, transactions) {
    const doc = new jsPDF();
    
    // Get category name by ID
    const getCategoryName = (id) => {
      const category = categories.find(c => c.id === parseInt(id));
      return category ? category.name : 'Unknown';
    };
    
    // Add title
    doc.setFontSize(20);
    doc.text(`Supplier Profile: ${supplier.name}`, 14, 22);
    
    // Add code and category
    doc.setFontSize(12);
    doc.text(`Code: ${supplier.code}`, 14, 32);
    doc.text(`Category: ${getCategoryName(supplier.category)}`, 14, 40);
    doc.text(`Status: ${supplier.status}`, 14, 48);
    
    // Add line
    doc.setDrawColor(200);
    doc.line(14, 55, 196, 55);
    
    // Contact information
    doc.setFontSize(16);
    doc.text('Contact Information', 14, 65);
    
    doc.setFontSize(12);
    doc.text(`Contact Name: ${supplier.contactName || 'N/A'}`, 14, 75);
    doc.text(`Email: ${supplier.email || 'N/A'}`, 14, 83);
    doc.text(`Phone: ${supplier.phone || 'N/A'}`, 14, 91);
    doc.text(`Address:`, 14, 99);
    
    // Handle multiline address
    if (supplier.address) {
      const addressLines = doc.splitTextToSize(supplier.address, 170);
      let y = 107;
      addressLines.forEach(line => {
        doc.text(line, 14, y);
        y += 8;
      });
    } else {
      doc.text('N/A', 14, 107);
    }
    
    // Add line
    let yPos = 115;
    if (supplier.address && supplier.address.split('\n').length > 1) {
      yPos += (supplier.address.split('\n').length - 1) * 8;
    }
    
    doc.line(14, yPos, 196, yPos);
    
    // Payment details
    doc.setFontSize(16);
    doc.text('Payment Details', 14, yPos + 10);
    
    doc.setFontSize(12);
    doc.text(`ABN/Tax ID: ${supplier.abn || 'N/A'}`, 14, yPos + 20);
    doc.text(`Payment Terms: ${supplier.paymentTerms || '30'} days`, 14, yPos + 28);
    
    // Notes
    if (supplier.notes) {
      doc.setFontSize(16);
      doc.text('Notes', 14, yPos + 38);
      
      doc.setFontSize(12);
      const noteLines = doc.splitTextToSize(supplier.notes, 170);
      let y = yPos + 48;
      noteLines.forEach(line => {
        doc.text(line, 14, y);
        y += 8;
      });
      
      yPos = y + 4;
    } else {
      yPos += 38;
    }
    
          // Transaction history
    if (transactions && transactions.length > 0) {
      // Add new page if there's not enough space
      if (yPos > 180) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(16);
      doc.text('Transaction History', 14, yPos);
      
      // Create table data for transactions
      const tableColumn = ["Date", "Description", "Status", "Amount"];
      const tableRows = transactions
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map(transaction => [
          transaction.date,
          transaction.description,
          transaction.status,
          this.formatCurrency(transaction.amount)
        ]);
      
      // Generate the transaction table
      doc.autoTable({
        startY: yPos + 10,
        head: [tableColumn],
        body: tableRows,
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [240, 240, 240] },
        theme: 'striped',
        margin: { right: 14, left: 14 }
      });
      
      // Calculate total amount
      const totalAmount = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
      
      // Add total amount
      const finalY = doc.lastAutoTable.finalY || 100;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total Transactions: ${this.formatCurrency(totalAmount)}`, 140, finalY + 10, { align: 'right' });
    }
    
    // Add page number at the bottom of each page
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }
    
    return doc;
  }
  
  /**
   * Export expense list to PDF
   * @param {Array} expenses - Array of expense objects
   * @param {Array} suppliers - Array of supplier objects for lookup
   * @param {Array} programs - Array of program objects for lookup
   * @param {Array} paymentCenters - Array of payment center objects for lookup
   * @param {string} title - Optional PDF title
   * @returns {jsPDF} PDF document
   */
  exportExpensesToPdf(expenses, suppliers, programs, paymentCenters, title = 'Expense Report') {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text(title, 14, 22);
    
    // Add timestamp
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on ${new Date().toLocaleString()}`, 14, 30);
    
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
    
    // Create table data
    const tableColumn = ["Date", "Description", "Supplier", "Program", "Payment Center", "Status", "Amount"];
    const tableRows = expenses.map(expense => [
      expense.date,
      expense.description,
      getSupplierName(expense.supplier),
      getProgramName(expense.program),
      getPaymentCenterName(expense.paymentCenter),
      expense.status,
      this.formatCurrency(expense.amount)
    ]);
    
    // Calculate summary data
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const committedAmount = expenses
      .filter(expense => expense.status === 'Committed')
      .reduce((sum, expense) => sum + expense.amount, 0);
    const invoicedAmount = expenses
      .filter(expense => expense.status === 'Invoiced')
      .reduce((sum, expense) => sum + expense.amount, 0);
    const paidAmount = expenses
      .filter(expense => expense.status === 'Paid')
      .reduce((sum, expense) => sum + expense.amount, 0);
    
    // Add summary before table
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Total Amount: ${this.formatCurrency(totalAmount)}`, 14, 40);
    doc.text(`Committed: ${this.formatCurrency(committedAmount)}`, 14, 48);
    doc.text(`Invoiced: ${this.formatCurrency(invoicedAmount)}`, 90, 48);
    doc.text(`Paid: ${this.formatCurrency(paidAmount)}`, 166, 48);
    
    // Generate the PDF table
    doc.autoTable({
      startY: 60,
      head: [tableColumn],
      body: tableRows,
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      rowPageBreak: 'auto',
      bodyStyles: { valign: 'middle' },
      theme: 'striped',
      margin: { top: 60, right: 14, bottom: 20, left: 14 },
      didDrawPage: (data) => {
        // Add page number at the bottom
        doc.setFontSize(10);
        doc.text(
          `Page ${doc.internal.getNumberOfPages()}`,
          data.settings.margin.left,
          doc.internal.pageSize.height - 10
        );
      }
    });
    
    return doc;
  }
  /**
   * Export journal entries to PDF
   * @param {Array} journals - Array of journal entry objects
   * @param {Array} programs - Array of program objects for lookup
   * @param {Array} paymentCenters - Array of payment center objects for lookup
   * @param {string} title - Optional PDF title
   * @returns {jsPDF} PDF document
   */
  exportJournalsToPdf(journals, programs, paymentCenters, title = 'Journal Entries Report') {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text(title, 14, 22);
    
    // Add timestamp
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on ${new Date().toLocaleString()}`, 14, 30);
    
    // Helper functions to get names from IDs
    const getProgramName = (id) => {
      const program = programs.find(p => String(p.id) === String(id));
      return program ? program.name : 'Unknown';
    };
    
    const getPaymentCenterName = (id) => {
      const center = paymentCenters.find(c => String(c.id) === String(id));
      return center ? center.name : 'Unknown';
    };
    
    // Calculate summary data
    const totalAmount = journals.reduce((sum, journal) => sum + (parseFloat(journal.amount) || 0), 0);
    const pendingCount = journals.filter(journal => journal.status === 'Pending').length;
    const approvedCount = journals.filter(journal => journal.status === 'Approved').length;
    const rejectedCount = journals.filter(journal => journal.status === 'Rejected').length;
    
    // Add summary before table
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Total Amount: ${this.formatCurrency(totalAmount)}`, 14, 40);
    doc.text(`Total Entries: ${journals.length}`, 14, 48);
    doc.text(`Pending: ${pendingCount}`, 14, 56);
    doc.text(`Approved: ${approvedCount}`, 80, 56);
    doc.text(`Rejected: ${rejectedCount}`, 146, 56);
    
    // Create table data
    const tableColumn = [
      "Reference", 
      "Date", 
      "Description", 
      "From Program", 
      "To Program", 
      "Amount", 
      "Status"
    ];
    
    const tableRows = journals.map(journal => [
      journal.reference,
      journal.date,
      journal.description,
      getProgramName(journal.fromProgram),
      getProgramName(journal.toProgram),
      this.formatCurrency(journal.amount || 0),
      journal.status
    ]);
    
    // Generate the PDF table
    doc.autoTable({
      startY: 65,
      head: [tableColumn],
      body: tableRows,
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      rowPageBreak: 'auto',
      bodyStyles: { valign: 'middle' },
      theme: 'striped',
      margin: { top: 65, right: 14, bottom: 20, left: 14 },
      didDrawPage: (data) => {
        // Add page number at the bottom
        doc.setFontSize(10);
        doc.text(
          `Page ${doc.internal.getNumberOfPages()}`,
          data.settings.margin.left,
          doc.internal.pageSize.height - 10
        );
      }
    });
    
    return doc;
  }
  
  /**
   * Export journal entry details to PDF
   * @param {Object} journal - The journal entry object
   * @param {Array} programs - Array of program objects for lookup
   * @param {Array} paymentCenters - Array of payment center objects for lookup
   * @returns {jsPDF} PDF document
   */
  exportJournalDetailsToPdf(journal, programs, paymentCenters) {
    const doc = new jsPDF();
    
    // Helper functions to get names from IDs
    const getProgramName = (id) => {
      const program = programs.find(p => String(p.id) === String(id));
      return program ? program.name : 'Unknown';
    };
    
    const getPaymentCenterName = (id) => {
      const center = paymentCenters.find(c => String(c.id) === String(id));
      return center ? center.name : 'Unknown';
    };
    
    // Format date
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      
      const date = new Date(dateString);
      return date.toLocaleDateString('en-AU', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      });
    };
    
    // Add title
    doc.setFontSize(20);
    doc.text(`Journal Entry: ${journal.reference}`, 14, 22);
    
    // Add status
    doc.setFontSize(12);
    doc.setTextColor(
      journal.status === 'Approved' ? 0 : 
      journal.status === 'Rejected' ? 255 : 
      0
    );
    doc.setFillColor(
      journal.status === 'Approved' ? 0 : 
      journal.status === 'Rejected' ? 255 : 
      0
    );
    doc.text(`Status: ${journal.status}`, 170, 22, { align: 'right' });
    
    // Reset text color
    doc.setTextColor(0);
    
    // Add details
    doc.setFontSize(12);
    doc.text(`Date: ${formatDate(journal.date)}`, 14, 36);
    doc.text(`Created By: ${journal.createdBy || 'Unknown'}`, 14, 44);
    doc.text(`Created At: ${formatDate(journal.createdAt)}`, 14, 52);
    
    // Add description
    doc.setFontSize(14);
    doc.text('Description', 14, 64);
    doc.setFontSize(12);
    
    // Handle multiline description
    const descriptionLines = doc.splitTextToSize(journal.description || 'N/A', 180);
    let y = 72;
    descriptionLines.forEach((line) => {
      doc.text(line, 14, y);
      y += 8;
    });
    
    // Add line
    doc.line(14, y + 4, 196, y + 4);
    
    // Add transfer details
    doc.setFontSize(14);
    doc.text('Transfer Details', 14, y + 16);
    
    // Create a table for transfer details
    doc.autoTable({
      startY: y + 24,
      head: [['', 'From', 'To']],
      body: [
        ['Program', getProgramName(journal.fromProgram), getProgramName(journal.toProgram)],
        ['Payment Center', getPaymentCenterName(journal.fromPaymentCenter), getPaymentCenterName(journal.toPaymentCenter)]
      ],
      theme: 'grid',
      styles: { halign: 'center' },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      columnStyles: { 0: { fontStyle: 'bold', fillColor: [230, 230, 230] } }
    });
    
    // Add amount
    y = doc.lastAutoTable.finalY + 20;
    doc.setFontSize(14);
    doc.text('Amount', 14, y);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(this.formatCurrency(journal.amount || 0), 14, y + 10);
    doc.setFont('helvetica', 'normal');
    
    // Add approval/rejection details if applicable
    if (journal.status === 'Approved') {
      y += 24;
      doc.setFontSize(14);
      doc.text('Approval Details', 14, y);
      doc.setFontSize(12);
      doc.text(`Approved By: ${journal.approvedBy || 'Unknown'}`, 14, y + 10);
      doc.text(`Approved At: ${formatDate(journal.approvedAt)}`, 14, y + 18);
    } else if (journal.status === 'Rejected') {
      y += 24;
      doc.setFontSize(14);
      doc.text('Rejection Details', 14, y);
      doc.setFontSize(12);
      doc.text(`Rejected By: ${journal.rejectedBy || 'Unknown'}`, 14, y + 10);
      doc.text(`Rejected At: ${formatDate(journal.rejectedAt)}`, 14, y + 18);
      
      // Add reason
      doc.text('Reason:', 14, y + 30);
      
      // Handle multiline reason
      const reasonLines = doc.splitTextToSize(journal.reason || 'No reason provided', 180);
      let reasonY = y + 38;
      reasonLines.forEach((line) => {
        doc.text(line, 14, reasonY);
        reasonY += 8;
      });
    }
    
    // Add notes if available
    if (journal.notes) {
      y = (journal.status === 'Pending') ? y + 24 : doc.lastAutoTable.finalY + 40;
      doc.setFontSize(14);
      doc.text('Notes', 14, y);
      
      // Handle multiline notes
      const noteLines = doc.splitTextToSize(journal.notes, 180);
      let noteY = y + 10;
      noteLines.forEach((line) => {
        doc.text(line, 14, noteY);
        noteY += 8;
      });
    }
    
    // Add page number
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(
      `Page 1 of 1`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
    
    return doc;
  }



}

export default new PdfExporter();