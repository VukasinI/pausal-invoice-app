import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Snackbar,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  GetApp as DownloadIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { invoiceService, customerService, settingsService } from '../services/api';
import InvoiceForm from '../components/InvoiceForm';
import pdfGenerator from '../services/pdfGenerator';
import { testPDF } from '../services/simplePdfTest';

function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [pdfLoading, setPdfLoading] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invoicesResponse, customersResponse] = await Promise.all([
        invoiceService.getAll(),
        customerService.getAll(),
      ]);
      setInvoices(invoicesResponse.data);
      setCustomers(customersResponse.data);
      setError(null);
    } catch (err) {
      setError('Failed to load data / Greška pri učitavanju podataka');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedInvoice(null);
    setOpenForm(true);
  };

  const handleEdit = async (invoice) => {
    try {
      const response = await invoiceService.getById(invoice.id);
      setSelectedInvoice(response.data);
      setOpenForm(true);
    } catch (err) {
      showSnackbar('Failed to load invoice / Greška pri učitavanju fakture', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this invoice? / Da li ste sigurni da želite da obrišete ovu fakturu?')) {
      try {
        await invoiceService.delete(id);
        fetchData();
        showSnackbar('Invoice deleted successfully / Faktura uspešno obrisana', 'success');
      } catch (err) {
        showSnackbar('Failed to delete invoice / Greška pri brisanju fakture', 'error');
      }
    }
  };

  const handleFormClose = () => {
    setOpenForm(false);
    setSelectedInvoice(null);
  };

  const handleFormSubmit = async (data) => {
    try {
      if (selectedInvoice) {
        await invoiceService.update(selectedInvoice.id, data);
        showSnackbar('Invoice updated successfully / Faktura uspešno ažurirana', 'success');
      } else {
        await invoiceService.create(data);
        showSnackbar('Invoice created successfully / Faktura uspešno kreirana', 'success');
      }
      fetchData();
      handleFormClose();
    } catch (err) {
      showSnackbar('Failed to save invoice / Greška pri čuvanju fakture', 'error');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const formatCurrency = (amount, currency = 'RSD') => {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'sent':
        return 'primary';
      case 'paid':
        return 'success';
      case 'overdue':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      draft: 'Draft / Nacrt',
      sent: 'Sent / Poslato',
      paid: 'Paid / Plaćeno',
      overdue: 'Overdue / Kasni',
    };
    return labels[status] || status;
  };

  const handleDownloadPDF = async (invoice) => {
    try {
      setPdfLoading(prev => ({ ...prev, [invoice.id]: true }));
      
      // Test simple PDF first
      console.log('Testing basic PDF functionality...');
      const testResult = testPDF();
      if (!testResult) {
        throw new Error('Basic PDF test failed');
      }
      
      // Get full invoice data with items
      const [invoiceResponse, settingsResponse] = await Promise.all([
        invoiceService.getById(invoice.id),
        settingsService.get()
      ]);
      
      const fullInvoiceData = invoiceResponse.data;
      const companyData = settingsResponse.data;
      
      // Find customer data
      const customer = customers.find(c => c.id === fullInvoiceData.customer_id);
      if (customer) {
        fullInvoiceData.customer_name = customer.name;
        fullInvoiceData.customer_company = customer.company;
        fullInvoiceData.customer_address = customer.address;
        fullInvoiceData.customer_city = customer.city;
        fullInvoiceData.customer_country = customer.country;
        fullInvoiceData.customer_pib = customer.pib;
        fullInvoiceData.customer_mb = customer.mb;
        fullInvoiceData.customer_email = customer.email;
      }
      
      console.log('Calling pdfGenerator.downloadInvoice...');
      await pdfGenerator.downloadInvoice(fullInvoiceData, companyData);
      showSnackbar('PDF downloaded successfully / PDF uspešno preuzet', 'success');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      showSnackbar(`Failed to download PDF: ${error.message}`, 'error');
    } finally {
      setPdfLoading(prev => ({ ...prev, [invoice.id]: false }));
    }
  };

  const handlePreviewPDF = async (invoice) => {
    try {
      setPdfLoading(prev => ({ ...prev, [`preview_${invoice.id}`]: true }));
      
      // Get full invoice data with items
      const [invoiceResponse, settingsResponse] = await Promise.all([
        invoiceService.getById(invoice.id),
        settingsService.get()
      ]);
      
      const fullInvoiceData = invoiceResponse.data;
      const companyData = settingsResponse.data;
      
      // Find customer data
      const customer = customers.find(c => c.id === fullInvoiceData.customer_id);
      if (customer) {
        fullInvoiceData.customer_name = customer.name;
        fullInvoiceData.customer_company = customer.company;
        fullInvoiceData.customer_address = customer.address;
        fullInvoiceData.customer_city = customer.city;
        fullInvoiceData.customer_country = customer.country;
        fullInvoiceData.customer_pib = customer.pib;
        fullInvoiceData.customer_mb = customer.mb;
        fullInvoiceData.customer_email = customer.email;
      }
      
      await pdfGenerator.previewInvoice(fullInvoiceData, companyData);
    } catch (error) {
      console.error('Error previewing PDF:', error);
      showSnackbar('Failed to preview PDF / Greška pri pregledu PDF-a', 'error');
    } finally {
      setPdfLoading(prev => ({ ...prev, [`preview_${invoice.id}`]: false }));
    }
  };

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Invoices / Fakture
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          New Invoice / Nova faktura
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Number / Broj</TableCell>
              <TableCell>Date / Datum</TableCell>
              <TableCell>Customer / Kupac</TableCell>
              <TableCell>Amount / Iznos</TableCell>
              <TableCell>Currency / Valuta</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions / Akcije</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No invoices found / Nema pronađenih faktura
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => (
                <TableRow key={invoice.id} hover>
                  <TableCell>{invoice.invoice_number}</TableCell>
                  <TableCell>{format(new Date(invoice.invoice_date), 'dd.MM.yyyy')}</TableCell>
                  <TableCell>
                    {invoice.customer_name}
                    {invoice.customer_company && (
                      <Typography variant="caption" display="block" color="text.secondary">
                        {invoice.customer_company}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{formatCurrency(invoice.total_rsd || 0)}</TableCell>
                  <TableCell>{invoice.currency}</TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(invoice.status)}
                      color={getStatusColor(invoice.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handlePreviewPDF(invoice)}
                      title="Preview PDF / Pregled PDF"
                      disabled={pdfLoading[`preview_${invoice.id}`]}
                    >
                      {pdfLoading[`preview_${invoice.id}`] ? (
                        <CircularProgress size={16} />
                      ) : (
                        <ViewIcon />
                      )}
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDownloadPDF(invoice)}
                      title="Download PDF / Preuzmi PDF"
                      disabled={pdfLoading[invoice.id]}
                    >
                      {pdfLoading[invoice.id] ? (
                        <CircularProgress size={16} />
                      ) : (
                        <DownloadIcon />
                      )}
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(invoice)}
                      title="Edit / Izmeni"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(invoice.id)}
                      title="Delete / Obriši"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {openForm && (
        <InvoiceForm
          open={openForm}
          onClose={handleFormClose}
          onSubmit={handleFormSubmit}
          invoice={selectedInvoice}
          customers={customers}
        />
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default Invoices;