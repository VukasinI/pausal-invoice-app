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
  Box,
  Typography,
  CircularProgress,
  Alert,
  Snackbar,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  GetApp as DownloadIcon,
  PictureAsPdf as PdfIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, startOfYear, endOfYear, getYear } from 'date-fns';
import { invoiceService, customerService, settingsService } from '../services/api';

function KPOKnjiga() {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [selectedYear, setSelectedYear] = useState(getYear(new Date()));

  // Filters
  const [filters, setFilters] = useState({
    fromDate: startOfYear(new Date()),
    toDate: endOfYear(new Date()),
    status: 'all',
    customer: 'all',
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [invoices, filters]);

  useEffect(() => {
    // Update date filters when year changes
    const yearDate = new Date(selectedYear, 0, 1);
    setFilters(prev => ({
      ...prev,
      fromDate: startOfYear(yearDate),
      toDate: endOfYear(yearDate),
    }));
  }, [selectedYear]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invoicesResponse, customersResponse] = await Promise.all([
        invoiceService.getAll(),
        customerService.getAll(),
      ]);
      
      // Sort by date and add running total (include all invoices for KPO)
      const validInvoices = invoicesResponse.data
        .sort((a, b) => new Date(a.invoice_date) - new Date(b.invoice_date));
      
      // Add running total
      let runningTotal = 0;
      const invoicesWithTotal = validInvoices.map(invoice => {
        runningTotal += invoice.total_rsd || 0;
        return { ...invoice, running_total: runningTotal };
      });
      
      setInvoices(invoicesWithTotal);
      setCustomers(customersResponse.data);
      setError(null);
    } catch (err) {
      setError('Failed to load data / Greška pri učitavanju podataka');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...invoices];

    // Date filter
    if (filters.fromDate) {
      filtered = filtered.filter(invoice => 
        new Date(invoice.invoice_date) >= filters.fromDate
      );
    }
    if (filters.toDate) {
      filtered = filtered.filter(invoice => 
        new Date(invoice.invoice_date) <= filters.toDate
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === filters.status);
    }

    // Customer filter
    if (filters.customer !== 'all') {
      filtered = filtered.filter(invoice => invoice.customer_id === parseInt(filters.customer));
    }

    // Sort chronologically (oldest first for KPO)
    filtered.sort((a, b) => new Date(a.invoice_date) - new Date(b.invoice_date));

    setFilteredInvoices(filtered);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: 'RSD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return format(new Date(dateString), 'dd.MM.yyyy');
  };

  const getStatusLabel = (status) => {
    const labels = {
      sent: 'Sent',
      paid: 'Paid',
      overdue: 'Overdue',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    switch (status) {
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

  const calculateTotals = () => {
    const total = filteredInvoices.reduce((sum, invoice) => sum + (invoice.total_rsd || 0), 0);
    const count = filteredInvoices.length;
    return { total, count };
  };

  const generateKPOPDF = async () => {
    setPdfLoading(true);
    try {
      const { jsPDF } = await import('jspdf');
      await import('jspdf-autotable');
      
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.width;
      const margin = 20;

      // Get company data
      let companyData = {};
      try {
        const settingsResponse = await settingsService.get();
        companyData = settingsResponse.data;
      } catch (error) {
        console.warn('Could not fetch company settings');
      }

      // Header
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('KNJIGA OSTVARENIH PRIHODA (KPO)', pageWidth / 2, 30, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('BOOK OF REALIZED INCOME', pageWidth / 2, 38, { align: 'center' });

      // Company info
      if (companyData.company_name) {
        doc.setFontSize(10);
        doc.text(`Obveznik: ${companyData.company_name}`, margin, 50);
        if (companyData.pib) {
          doc.text(`PIB: ${companyData.pib}`, margin, 55);
        }
        if (companyData.mb) {
          doc.text(`MB: ${companyData.mb}`, margin, 60);
        }
      }

      // Period
      const fromDateStr = format(filters.fromDate, 'dd.MM.yyyy');
      const toDateStr = format(filters.toDate, 'dd.MM.yyyy');
      doc.text(`Period: ${fromDateStr} - ${toDateStr}`, pageWidth - margin, 50, { align: 'right' });

      // Table headers
      const headers = [
        'R.br.',
        'Broj fakture',
        'Datum',
        'Kupac',
        'Iznos (EUR/USD)',
        'Iznos (RSD)',
        'Ukupno'
      ];

      // Table data
      let runningTotal = 0;
      const tableData = filteredInvoices.map((invoice, index) => {
        const customer = customers.find(c => c.id === invoice.customer_id);
        const customerName = customer ? 
          (customer.company || customer.name) : 
          invoice.customer_name || 'N/A';

        runningTotal += invoice.total_rsd || 0;

        return [
          (index + 1).toString(),
          invoice.invoice_number,
          formatDate(invoice.invoice_date),
          customerName.substring(0, 30) + (customerName.length > 30 ? '...' : ''),
          invoice.currency !== 'RSD' ? `${invoice.currency} ${invoice.total?.toFixed(2)}` : '-',
          formatCurrency(invoice.total_rsd || 0).replace(/\s/g, ' '),
          formatCurrency(runningTotal).replace(/\s/g, ' ')
        ];
      });

      // Add table
      let startY = 70;
      doc.autoTable({
        head: [headers],
        body: tableData,
        startY: startY,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [240, 240, 240],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 12 },
          1: { halign: 'center', cellWidth: 25 },
          2: { halign: 'center', cellWidth: 20 },
          3: { halign: 'left', cellWidth: 45 },
          4: { halign: 'right', cellWidth: 25 },
          5: { halign: 'right', cellWidth: 28 },
          6: { halign: 'right', cellWidth: 30 }
        }
      });

      // Summary
      const totals = calculateTotals();
      const finalY = doc.lastAutoTable.finalY + 15;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('REKAPITULACIJA / SUMMARY:', margin, finalY);
      
      doc.setFont('helvetica', 'normal');
      doc.text(`Ukupan broj faktura / Total invoices: ${totals.count}`, margin, finalY + 8);
      doc.text(`Ukupan prihod / Total income: ${formatCurrency(totals.total)}`, margin, finalY + 16);

      // Footer
      const footerY = doc.internal.pageSize.height - 20;
      doc.setFontSize(8);
      doc.text(
        `Generisano: ${new Date().toLocaleString('sr-RS')} - Pausal Invoice App`,
        pageWidth / 2,
        footerY,
        { align: 'center' }
      );

      // Download
      const filename = `KPO_Knjiga_${fromDateStr.replace(/\./g, '_')}_${toDateStr.replace(/\./g, '_')}.pdf`;
      doc.save(filename);

      showSnackbar('KPO book downloaded successfully', 'success');
    } catch (error) {
      console.error('Error generating KPO PDF:', error);
      showSnackbar('Failed to generate KPO PDF', 'error');
    } finally {
      setPdfLoading(false);
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
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

  const totals = calculateTotals();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h4" component="h1">
            KPO Book
          </Typography>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              displayEmpty
            >
              {[...Array(10)].map((_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Box>
        <Button
          variant="contained"
          startIcon={pdfLoading ? <CircularProgress size={16} /> : <PdfIcon />}
          onClick={generateKPOPDF}
          disabled={pdfLoading || filteredInvoices.length === 0}
        >
          {pdfLoading ? 'Generating...' : 'Export PDF'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          <FilterIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Filters
        </Typography>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <DatePicker
                label="From Date"
                value={filters.fromDate}
                onChange={(value) => handleFilterChange('fromDate', value)}
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <DatePicker
                label="To Date"
                value={filters.toDate}
                onChange={(value) => handleFilterChange('toDate', value)}
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="sent">Sent</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="overdue">Overdue</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Customer</InputLabel>
                <Select
                  value={filters.customer}
                  label="Customer"
                  onChange={(e) => handleFilterChange('customer', e.target.value)}
                >
                  <MenuItem value="all">All</MenuItem>
                  {customers.map((customer) => (
                    <MenuItem key={customer.id} value={customer.id}>
                      {customer.company || customer.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </LocalizationProvider>
      </Paper>

      {/* Summary */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6">
              Total Invoices: <strong>{totals.count}</strong>
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6">
              Total Income: <strong>{formatCurrency(totals.total)}</strong>
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6">
              Period: {format(filters.fromDate, 'dd.MM.yyyy')} - {format(filters.toDate, 'dd.MM.yyyy')}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* KPO Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width="60">No.</TableCell>
              <TableCell>Invoice No.</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell align="right">Amount (EUR/USD)</TableCell>
              <TableCell align="right">Amount (RSD)</TableCell>
              <TableCell align="right">Running Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No invoices for the selected period
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice, index) => {
                const customer = customers.find(c => c.id === invoice.customer_id);
                const customerName = customer ? 
                  (customer.company || customer.name) : 
                  invoice.customer_name || 'N/A';

                return (
                  <TableRow key={invoice.id} hover>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{invoice.invoice_number}</TableCell>
                    <TableCell>{formatDate(invoice.invoice_date)}</TableCell>
                    <TableCell>{customerName}</TableCell>
                    <TableCell align="right">
                      {invoice.currency !== 'RSD' ? 
                        `${invoice.currency} ${invoice.total?.toFixed(2)}` : 
                        '-'
                      }
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(invoice.total_rsd || 0)}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(invoice.running_total || 0)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

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

export default KPOKnjiga;