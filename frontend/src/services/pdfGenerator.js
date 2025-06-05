import jsPDF from 'jspdf';
import 'jspdf-autotable';
import CryptoJS from 'crypto-js';

class PDFInvoiceGenerator {
  constructor() {
    this.pageWidth = 210; // A4 width in mm
    this.pageHeight = 297; // A4 height in mm
    this.margin = 20;
    this.contentWidth = this.pageWidth - (this.margin * 2);
  }

  generateHash(invoiceData) {
    // Create a hash from invoice data for identification
    const hashData = {
      number: invoiceData.invoice_number,
      date: invoiceData.invoice_date,
      customer: invoiceData.customer_name,
      total: invoiceData.total_rsd,
      items: invoiceData.items?.map(item => ({
        desc: item.description,
        qty: item.quantity,
        price: item.price
      }))
    };
    
    const dataString = JSON.stringify(hashData);
    return CryptoJS.SHA256(dataString).toString(CryptoJS.enc.Hex).substring(0, 16).toUpperCase();
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

  addHeader(doc, companyData, invoiceData) {
    // Invoice title - large and bold at top
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Invoice / Faktura:', this.margin, 30);
    
    // Invoice number - same line as title
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text(invoiceData.invoice_number || 'N/A', this.margin + 70, 30);
    
    // Date information - top right
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const rightCol = this.pageWidth - this.margin - 80;
    
    doc.text('Invoice date / Datum', rightCol, 25);
    doc.text('fakture', rightCol, 30);
    doc.setFont('helvetica', 'bold');
    doc.text(this.formatDate(invoiceData.invoice_date), rightCol, 35);
    
    doc.setFont('helvetica', 'normal');
    doc.text('Trading date / Datum', rightCol + 45, 25);
    doc.text('prometa', rightCol + 45, 30);
    doc.setFont('helvetica', 'bold');
    doc.text(this.formatDate(invoiceData.trading_date), rightCol + 45, 35);
    
    // Trading place
    doc.setFont('helvetica', 'normal');
    doc.text('Trading place / Mesto', rightCol + 45, 45);
    doc.text('prometa', rightCol + 45, 50);
    doc.setFont('helvetica', 'bold');
    doc.text(companyData.city || 'Novi Sad', rightCol + 45, 55);
    
    // Horizontal line under header
    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 0, 0);
    doc.line(this.margin, 65, this.pageWidth - this.margin, 65);
    
    return 75; // Return Y position after header
  }

  addInvoiceInfo(doc, invoiceData, companyData, startY) {
    const leftCol = this.margin;
    const rightCol = this.pageWidth / 2 + 10;
    
    // From / Od section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('From / Od:', leftCol, startY);
    
    // Company name - larger and bold
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(companyData.company_name || 'Digital Media Lab', leftCol, startY + 10);
    
    // Company details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    let yPos = startY + 20;
    const companyInfo = [
      companyData.address || 'Branka Kozareva 11',
      `${companyData.city || 'Kac'} ${companyData.postal_code || '21241'}`,
      `VAT / EIB / PIB: ${companyData.pib || '112512167'}`,
      `ID no / MB / Matični broj: ${companyData.mb || '66147142'}`,
      `IBAN: ${companyData.iban || 'RS35265100000028025194'}`,
      `SWIFT: ${companyData.swift || 'RZBSRSBG'}`,
      `E-mail: ${companyData.email || 'vukasinilic01@gmail.com'}`,
    ];
    
    companyInfo.forEach((info) => {
      doc.text(info, leftCol, yPos);
      yPos += 5;
    });

    // Bill to / Komitent section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Bill to / Komitent:', rightCol, startY);
    
    // Customer name - larger and bold
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(invoiceData.customer_name || 'Customer Name', rightCol, startY + 10);
    
    // Customer details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    yPos = startY + 20;
    const customerInfo = [
      `Address / Adresa: ${invoiceData.customer_address || ''}`,
      `City / Grad: ${invoiceData.customer_city || ''}`,
      `Country / Država: ${invoiceData.customer_country || 'Serbia'}`,
      invoiceData.customer_pib ? `VAT / EIB / PIB: ${invoiceData.customer_pib}` : '',
    ].filter(Boolean);
    
    customerInfo.forEach((info) => {
      doc.text(info, rightCol, yPos);
      yPos += 5;
    });

    // Horizontal line after company info
    const maxY = Math.max(startY + 20 + companyInfo.length * 5, startY + 20 + customerInfo.length * 5);
    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 0, 0);
    doc.line(this.margin, maxY + 10, this.pageWidth - this.margin, maxY + 10);

    return maxY + 20; // Return Y position after info sections
  }

  addItemsTable(doc, invoiceData, startY) {
    const items = invoiceData.items || [];
    
    // Prepare table data exactly like the template
    const tableHeaders = [
      'TYPE OF SERVICE\n(VRSTA USLUGE)',
      'UNIT\n(JEDINICA)',
      'QUANTITY\n(KOLICINA)',
      'PRICE\n(CENA)',
      'DISCOUNT\n(RABAT)',
      'TOTAL\n(UKUPNO)'
    ];
    
    const tableData = items.map((item) => {
      const itemTotal = item.quantity * item.price * (1 - (item.discount || 0) / 100);
      return [
        item.description,
        `${item.unit || 'Piece'} /\n${item.unit || 'Komad'}`,
        item.quantity.toFixed(2),
        item.price.toFixed(2),
        (item.discount || 0).toFixed(2),
        itemTotal.toFixed(2)
      ];
    });

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const discountTotal = items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.price;
      return sum + (itemSubtotal * (item.discount || 0) / 100);
    }, 0);
    const total = subtotal - discountTotal;

    // Add table with clean styling like the template
    doc.autoTable({
      head: [tableHeaders],
      body: tableData,
      startY: startY,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 8,
        lineColor: [0, 0, 0],
        lineWidth: 0.5,
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center',
        valign: 'middle',
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 60 },     // Service description
        1: { halign: 'center', cellWidth: 25 },   // Unit
        2: { halign: 'center', cellWidth: 25 },   // Quantity  
        3: { halign: 'right', cellWidth: 25 },    // Price
        4: { halign: 'center', cellWidth: 25 },   // Discount
        5: { halign: 'right', cellWidth: 25 }     // Total
      },
      bodyStyles: {
        valign: 'middle',
      }
    });

    const finalY = doc.lastAutoTable.finalY + 15;

    // Add totals exactly like the template
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    
    // Total line
    doc.text(`TOTAL / UKUPNO (${invoiceData.currency})`, this.margin, finalY);
    doc.text(total.toFixed(2), this.pageWidth - this.margin, finalY, { align: 'right' });
    
    // Discount line
    doc.text(`DISCOUNT / RABAT (${invoiceData.currency})`, this.margin, finalY + 15);
    doc.text(discountTotal.toFixed(2), this.pageWidth - this.margin, finalY + 15, { align: 'right' });
    
    // Final total line with border
    doc.setLineWidth(1);
    doc.line(this.margin, finalY + 25, this.pageWidth - this.margin, finalY + 25);
    
    doc.setFontSize(14);
    doc.text(`TOTAL FOR PAYMENT / UKUPNO ZA UPLATU (${invoiceData.currency})`, this.margin, finalY + 35);
    doc.text(total.toFixed(2), this.pageWidth - this.margin, finalY + 35, { align: 'right' });
    
    doc.line(this.margin, finalY + 40, this.pageWidth - this.margin, finalY + 40);

    return finalY + 50;
  }

  addPaymentInfo(doc, invoiceData, startY) {
    if (!invoiceData.bank_account) return startY;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('PODACI ZA PLAĆANJE / PAYMENT DETAILS:', this.margin, startY);
    
    doc.setFont('helvetica', 'normal');
    const paymentInfo = [
      `Račun / Account: ${invoiceData.bank_account.iban || 'N/A'}`,
      `Banka / Bank: ${invoiceData.bank_account.bank_name || 'N/A'}`,
      invoiceData.bank_account.swift ? `SWIFT: ${invoiceData.bank_account.swift}` : '',
    ].filter(Boolean);
    
    paymentInfo.forEach((info, index) => {
      doc.text(info, this.margin, startY + 10 + (index * 5));
    });

    return startY + 30;
  }

  addNotes(doc, invoiceData, startY) {
    // Comment / Opis usluge section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('COMMENT / OPIS USLUGE', this.margin, startY);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    let yPos = startY + 8;
    
    // Payment deadline
    doc.text(`Payment deadline is ${invoiceData.payment_deadline || 15} days`, this.margin, yPos);
    yPos += 5;
    
    // Payment reference
    doc.text(`When making the payment, please provide the reference number / Pri plaćanju fakture`, this.margin, yPos);
    yPos += 5;
    doc.text(`navedite poziv na broj ${invoiceData.invoice_number}`, this.margin, yPos);
    yPos += 8;
    
    // Identification number
    doc.text('Identification number / Identifikacioni broj:', this.margin, yPos);
    yPos += 5;
    const hash = this.generateHash(invoiceData);
    doc.setFont('helvetica', 'bold');
    doc.text(hash, this.margin, yPos);
    doc.setFont('helvetica', 'normal');
    yPos += 8;
    
    // Document validity
    doc.text('Document is valid without stamp and signature / Faktura je važeća bez pečata i potpisa', this.margin, yPos);
    yPos += 5;
    doc.text(`Place of issue / Mesto izdavanja: ${invoiceData.city || 'Kac 21241'}`, this.margin, yPos);
    yPos += 10;
    
    // Tax exemption note
    doc.setFont('helvetica', 'bold');
    doc.text('NOTE ON TAX EXEMPTION / NAPOMENA O PORESKOM OSLOBOĐENJU:', this.margin, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    doc.text('Not in the VAT system. / Poreski obveznik nije u sistemu PDV-a.', this.margin, yPos);
    yPos += 5;
    doc.text('VAT not calculated on the invoice according to article 33 of Law on value added tax. / PDV', this.margin, yPos);
    yPos += 5;
    doc.text('nije obračunat na fakturi u skladu sa članom 33. Zakona o porezu na dodatu vrednost.', this.margin, yPos);
    
    return yPos + 15;
  }

  addFooter(doc, invoiceData) {
    const footerY = this.pageHeight - 25;
    
    // Page number and generation info
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Page 1 from 1', this.margin, footerY);
    
    // Generated by notice - center
    doc.text('Invoice made by pausal.rs', this.pageWidth / 2, footerY, { align: 'center' });
    
    // PAUSAL logo/text - right aligned
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('PAUSAL', this.pageWidth - this.margin, footerY, { align: 'right' });
  }

  async generatePDF(invoiceData, companyData = {}) {
    try {
      console.log('Creating jsPDF instance...');
      const doc = new jsPDF('p', 'mm', 'a4');
      console.log('jsPDF created successfully');
      
      // Set document metadata
      doc.setProperties({
        title: `Faktura ${invoiceData.invoice_number}`,
        subject: `Invoice ${invoiceData.invoice_number}`,
        author: companyData.company_name || 'Pausal Invoice App',
        creator: 'Pausal Invoice App'
      });

      let currentY = 20;

      // Add sections
      currentY = this.addHeader(doc, companyData, invoiceData);
      currentY = this.addInvoiceInfo(doc, invoiceData, companyData, currentY);
      currentY = this.addItemsTable(doc, invoiceData, currentY);
      currentY = this.addPaymentInfo(doc, invoiceData, currentY);
      currentY = this.addNotes(doc, invoiceData, currentY);
      
      // Add footer
      this.addFooter(doc, invoiceData);

      return doc;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF invoice');
    }
  }

  async downloadInvoice(invoiceData, companyData = {}) {
    try {
      console.log('Generating PDF with data:', { invoiceData, companyData });
      const doc = await this.generatePDF(invoiceData, companyData);
      const filename = `Faktura_${invoiceData.invoice_number.replace('/', '_')}.pdf`;
      console.log('Saving PDF with filename:', filename);
      doc.save(filename);
      console.log('PDF saved successfully');
      return filename;
    } catch (error) {
      console.error('Error downloading invoice:', error);
      throw error;
    }
  }

  async previewInvoice(invoiceData, companyData = {}) {
    try {
      const doc = await this.generatePDF(invoiceData, companyData);
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Open in new window for preview
      window.open(pdfUrl, '_blank');
      
      return pdfUrl;
    } catch (error) {
      console.error('Error previewing invoice:', error);
      throw error;
    }
  }
}

const pdfGenerator = new PDFInvoiceGenerator();
export default pdfGenerator;