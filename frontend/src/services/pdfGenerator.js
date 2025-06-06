import jsPDF from 'jspdf';
import 'jspdf-autotable';

class PDFInvoiceGenerator {
  constructor() {
    this.doc = null;
    this.y = 40; // Starting Y position
    this.lineHeight = 6; // Height between lines
    this.margin = 20;
    this.pageWidth = 210; // A4 width
    this.pageHeight = 297; // A4 height
    this.leftCol = 20;
    this.rightCol = 110;
  }

  formatCurrency(amount, currency = 'RSD') {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  addLine(text, x = this.leftCol, fontSize = 10, style = 'normal') {
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', style);
    this.doc.text(text, x, this.y);
    this.y += this.lineHeight;
  }

  addBlankLine(height = 10) {
    this.y += height;
  }

  generate(invoiceData, companyData, customerData, bankAccounts, settings) {
    this.doc = new jsPDF();
    this.y = 40;

    // Header
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`Invoice / Faktura: ${invoiceData.invoice_number}`, this.pageWidth / 2, 25, { align: 'center' });
    
    // Invoice dates
    this.y = 40;
    this.addLine(`Invoice Date / Datum fakture: ${this.formatDate(invoiceData.invoice_date)}`, this.leftCol, 10);
    this.addLine(`Trading Date / Datum prometa: ${this.formatDate(invoiceData.trading_date)}`, this.leftCol, 10);
    this.addBlankLine();

    // Two columns: From and Bill To
    const startY = this.y;
    
    // Left column - From
    this.addLine('FROM / OD:', this.leftCol, 12, 'bold');
    this.addLine(companyData.company_name || '', this.leftCol, 11, 'bold');
    this.addLine(companyData.address || '', this.leftCol);
    this.addLine(`${companyData.postal_code || ''} ${companyData.city || ''}`, this.leftCol);
    if (companyData.pib) this.addLine(`PIB: ${companyData.pib}`, this.leftCol);
    if (companyData.mb) this.addLine(`MB: ${companyData.mb}`, this.leftCol);
    if (companyData.phone) this.addLine(`Tel: ${companyData.phone}`, this.leftCol);
    if (companyData.email) this.addLine(`Email: ${companyData.email}`, this.leftCol);
    
    // Right column - Bill To
    this.y = startY;
    this.addLine('BILL TO / KUPAC:', this.rightCol, 12, 'bold');
    this.addLine(customerData.name || '', this.rightCol, 11, 'bold');
    this.addLine(customerData.address || '', this.rightCol);
    this.addLine(`${customerData.postal_code || ''} ${customerData.city || ''}`, this.rightCol);
    this.addLine(`${customerData.country || 'Serbia'}`, this.rightCol);
    if (customerData.pib) this.addLine(`PIB: ${customerData.pib}`, this.rightCol);
    if (customerData.mb) this.addLine(`MB: ${customerData.mb}`, this.rightCol);
    if (customerData.contact_person) this.addLine(`Contact: ${customerData.contact_person}`, this.rightCol);
    if (customerData.email) this.addLine(`Email: ${customerData.email}`, this.rightCol);

    // Move to after both columns
    this.y = Math.max(this.y, startY + 60);
    this.addBlankLine();

    // Items table
    const items = invoiceData.items || [];
    const tableData = items.map((item, index) => {
      const total = item.quantity * item.price * (1 - (item.discount || 0) / 100);
      return [
        index + 1,
        item.description || '',
        item.unit || 'kom',
        item.quantity || 0,
        this.formatCurrency(item.price, invoiceData.currency),
        item.discount ? `${item.discount}%` : '0%',
        this.formatCurrency(total, invoiceData.currency)
      ];
    });

    // Add table with borders
    this.doc.autoTable({
      startY: this.y,
      head: [['#', 'Description / Opis', 'Unit', 'Qty', 'Price', 'Discount', 'Total']],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [107, 70, 193], // Purple color
        textColor: 255,
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { cellWidth: 70 },
        2: { halign: 'center', cellWidth: 20 },
        3: { halign: 'right', cellWidth: 15 },
        4: { halign: 'right', cellWidth: 25 },
        5: { halign: 'center', cellWidth: 20 },
        6: { halign: 'right', cellWidth: 30 },
      },
    });

    // Get Y position after table
    this.y = this.doc.lastAutoTable.finalY + 10;

    // Totals
    const totalsX = 130;
    this.addLine(`Subtotal: ${this.formatCurrency(invoiceData.subtotal || 0, invoiceData.currency)}`, totalsX, 10);
    if (invoiceData.discount_total > 0) {
      this.addLine(`Discount: -${this.formatCurrency(invoiceData.discount_total || 0, invoiceData.currency)}`, totalsX, 10);
    }
    this.addLine(`Total ${invoiceData.currency}: ${this.formatCurrency(invoiceData.total || 0, invoiceData.currency)}`, totalsX, 12, 'bold');
    
    if (invoiceData.currency !== 'RSD' && invoiceData.exchange_rate) {
      this.addLine(`Exchange Rate / Kurs: ${invoiceData.exchange_rate}`, totalsX, 10);
      this.addLine(`Total RSD: ${this.formatCurrency(invoiceData.total_rsd || 0, 'RSD')}`, totalsX, 12, 'bold');
    }

    this.addBlankLine(15);

    // Payment information
    this.addLine('PAYMENT INFORMATION / INFORMACIJE ZA PLAĆANJE:', this.leftCol, 12, 'bold');
    
    // Bank account
    const bankAccount = bankAccounts?.find(acc => acc.id === invoiceData.bank_account_id) || bankAccounts?.[0];
    if (bankAccount) {
      this.addLine(`Bank / Banka: ${bankAccount.bank_name}`, this.leftCol);
      this.addLine(`Account / Račun: ${bankAccount.account_number}`, this.leftCol);
      if (bankAccount.swift) this.addLine(`SWIFT: ${bankAccount.swift}`, this.leftCol);
      if (bankAccount.iban) this.addLine(`IBAN: ${bankAccount.iban}`, this.leftCol);
    }

    // Payment deadline
    const paymentDeadline = new Date(invoiceData.invoice_date);
    paymentDeadline.setDate(paymentDeadline.getDate() + (invoiceData.payment_deadline || 30));
    this.addLine(`Payment Due / Rok plaćanja: ${this.formatDate(paymentDeadline)}`, this.leftCol);

    // Reference number
    if (settings?.invoice_reference_model && settings?.invoice_reference_number) {
      this.addLine(`Reference / Poziv na broj: ${settings.invoice_reference_model}-${settings.invoice_reference_number}`, this.leftCol);
    }

    // Notes
    if (invoiceData.notes) {
      this.addBlankLine();
      this.addLine('NOTES / NAPOMENE:', this.leftCol, 12, 'bold');
      const lines = invoiceData.notes.split('\n');
      lines.forEach(line => {
        if (line.trim()) this.addLine(line, this.leftCol);
      });
    }

    // Footer
    this.y = this.pageHeight - 40;
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.y - 5, this.pageWidth - this.margin, this.y - 5);
    
    // Identification number
    const idNumber = this.generateIdNumber(invoiceData);
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`ID: ${idNumber}`, this.pageWidth / 2, this.y, { align: 'center' });

    return this.doc;
  }

  generateIdNumber(invoice) {
    // Simple ID based on invoice number and date
    const dateStr = new Date(invoice.invoice_date).toISOString().split('T')[0].replace(/-/g, '');
    return `${invoice.invoice_number.replace(/\//g, '-')}-${dateStr}`;
  }

  download(invoiceData, companyData, customerData, bankAccounts, settings) {
    const doc = this.generate(invoiceData, companyData, customerData, bankAccounts, settings);
    const filename = `Invoice_${invoiceData.invoice_number.replace(/\//g, '_')}_${customerData.name}.pdf`;
    doc.save(filename);
  }

  getBlob(invoiceData, companyData, customerData, bankAccounts, settings) {
    const doc = this.generate(invoiceData, companyData, customerData, bankAccounts, settings);
    return doc.output('blob');
  }

  // Compatibility method for existing code
  async downloadInvoice(invoiceData, companyData) {
    try {
      console.log('PDF Generator - Starting download with data:', {
        invoiceData: invoiceData,
        companyData: companyData
      });

      // Convert old format to new format
      const customerData = {
        name: invoiceData.customer_name || 'Unknown Customer',
        company: invoiceData.customer_company || '',
        address: invoiceData.customer_address || '',
        city: invoiceData.customer_city || '',
        country: invoiceData.customer_country || 'Serbia',
        pib: invoiceData.customer_pib || '',
        mb: invoiceData.customer_mb || '',
        email: invoiceData.customer_email || ''
      };

      console.log('PDF Generator - Customer data:', customerData);
      console.log('PDF Generator - Invoice items:', invoiceData.items);

      // Ensure items exist
      if (!invoiceData.items || !Array.isArray(invoiceData.items)) {
        invoiceData.items = [
          {
            description: 'Service',
            unit: 'kom',
            quantity: 1,
            price: invoiceData.total || 0,
            discount: 0
          }
        ];
      }

      // Generate and download
      this.download(invoiceData, companyData, customerData, [], {});
      console.log('PDF Generator - Download completed successfully');
      return true;
    } catch (error) {
      console.error('PDF generation error:', error);
      throw error;
    }
  }
}

export default new PDFInvoiceGenerator();