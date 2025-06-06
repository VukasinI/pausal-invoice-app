import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  Box,
  MenuItem,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  InputAdornment,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import { getExchangeRate, getExchangeRateInfo, settingsService } from '../services/api';
import pdfGenerator from '../services/pdfGenerator';

const currencies = ['RSD', 'EUR', 'USD', 'GBP', 'CHF'];
const units = ['kom', 'sat', 'dan', 'mesec', 'paket', 'kg', 'l', 'm', 'm²'];

function InvoiceForm({ open, onClose, onSubmit, invoice, customers }) {
  const [formData, setFormData] = useState({
    invoice_number: '',
    invoice_date: new Date(),
    trading_date: new Date(),
    customer_id: '',
    bank_account_id: null,
    currency: 'RSD',
    exchange_rate: 1,
    payment_deadline: 30,
    notes: '',
    status: 'draft',
    items: [{ description: '', unit: 'kom', quantity: 1, price: 0, discount: 0 }],
  });

  const [errors, setErrors] = useState({});
  const [totals, setTotals] = useState({
    subtotal: 0,
    discountTotal: 0,
    total: 0,
    totalRsd: 0,
  });
  const [exchangeRateInfo, setExchangeRateInfo] = useState(null);
  const [rateLoading, setRateLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    if (invoice) {
      setFormData({
        ...invoice,
        invoice_date: new Date(invoice.invoice_date),
        trading_date: new Date(invoice.trading_date),
        items: invoice.items || [{ description: '', unit: 'kom', quantity: 1, price: 0, discount: 0 }],
      });
    } else {
      // Generate new invoice number
      generateInvoiceNumber();
    }
    setErrors({});
  }, [invoice, open]);

  useEffect(() => {
    if (open && formData.currency) {
      fetchExchangeRate(formData.currency);
    }
  }, [open, formData.currency, fetchExchangeRate]);

  useEffect(() => {
    calculateTotals();
  }, [formData.items, formData.currency, formData.exchange_rate]);

  const generateInvoiceNumber = () => {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 1000) + 1;
    const invoiceNumber = `${String(randomNum).padStart(3, '0')}/${year}`;
    setFormData(prev => ({ ...prev, invoice_number: invoiceNumber }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleDateChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // If trading date changes and currency is not RSD, update exchange rate
    if (name === 'trading_date' && formData.currency !== 'RSD') {
      console.log('Trading date changed to:', value, 'refreshing exchange rate for', formData.currency);
      setTimeout(() => {
        fetchExchangeRate(formData.currency);
      }, 100);
    }
  };

  const handleCurrencyChange = async (currency) => {
    setFormData(prev => ({ ...prev, currency }));
    await fetchExchangeRate(currency);
  };

  const fetchExchangeRate = useCallback(async (currency) => {
    if (currency === 'RSD') {
      setFormData(prev => ({ ...prev, exchange_rate: 1 }));
      setExchangeRateInfo({
        currency_code: 'RSD',
        rate: 1,
        unit: 1,
        formatted: '1.0000 RSD',
        rate_date: new Date().toISOString().split('T')[0]
      });
      return;
    }

    setRateLoading(true);
    try {
      const dateStr = format(formData.trading_date || new Date(), 'yyyy-MM-dd');
      console.log('Fetching exchange rate for', currency, 'on date', dateStr);
      
      const [rate, rateInfo] = await Promise.all([
        getExchangeRate(currency, 'RSD', dateStr),
        getExchangeRateInfo(currency, dateStr)
      ]);
      
      console.log('Exchange rate response:', { rate, rateInfo });
      
      setFormData(prev => ({ ...prev, exchange_rate: rate }));
      setExchangeRateInfo(rateInfo);
    } catch (error) {
      console.error('Failed to fetch exchange rate:', error);
      // Fallback rate
      setFormData(prev => ({ ...prev, exchange_rate: 1 }));
      setExchangeRateInfo({
        currency_code: currency,
        rate: 1,
        unit: 1,
        formatted: 'Rate unavailable',
        rate_date: new Date().toISOString().split('T')[0]
      });
    } finally {
      setRateLoading(false);
    }
  }, [formData.trading_date]);

  const refreshExchangeRate = async () => {
    await fetchExchangeRate(formData.currency);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    };
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', unit: 'kom', quantity: 1, price: 0, discount: 0 }],
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, items: newItems }));
    }
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let discountTotal = 0;

    formData.items.forEach(item => {
      const itemSubtotal = item.quantity * item.price;
      const itemDiscount = itemSubtotal * (item.discount / 100);
      subtotal += itemSubtotal;
      discountTotal += itemDiscount;
    });

    const total = subtotal - discountTotal;
    const totalRsd = total * formData.exchange_rate;

    setTotals({
      subtotal,
      discountTotal,
      total,
      totalRsd,
    });
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.invoice_number.trim()) {
      newErrors.invoice_number = 'Invoice number is required / Broj fakture je obavezan';
    }

    if (!formData.customer_id) {
      newErrors.customer_id = 'Customer is required / Kupac je obavezan';
    }

    if (!formData.invoice_date) {
      newErrors.invoice_date = 'Invoice date is required / Datum fakture je obavezan';
    }

    if (!formData.trading_date) {
      newErrors.trading_date = 'Trading date is required / Datum prometa je obavezan';
    }

    let hasValidItem = false;
    formData.items.forEach((item, index) => {
      if (item.description.trim() || item.quantity > 0 || item.price > 0) {
        hasValidItem = true;
        if (!item.description.trim()) {
          newErrors[`item_${index}_description`] = 'Description required / Opis je obavezan';
        }
      }
    });

    if (!hasValidItem) {
      newErrors.items = 'At least one item is required / Potrebna je bar jedna stavka';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      const submitData = {
        ...formData,
        invoice_date: format(formData.invoice_date, 'yyyy-MM-dd'),
        trading_date: format(formData.trading_date, 'yyyy-MM-dd'),
        total_rsd: totals.totalRsd,
        items: formData.items.filter(item => item.description.trim()),
      };
      onSubmit(submitData);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('sr-RS', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handlePreviewPDF = async () => {
    if (!validate()) return;
    
    setPdfLoading(true);
    try {
      // Get company data
      const settingsResponse = await settingsService.get();
      const companyData = settingsResponse.data;
      
      // Prepare invoice data
      const previewData = {
        ...formData,
        invoice_date: format(formData.invoice_date, 'yyyy-MM-dd'),
        trading_date: format(formData.trading_date, 'yyyy-MM-dd'),
        total_rsd: totals.totalRsd,
        items: formData.items.filter(item => item.description.trim()),
      };
      
      // Find customer data
      const customer = customers.find(c => c.id === formData.customer_id);
      if (customer) {
        previewData.customer_name = customer.name;
        previewData.customer_company = customer.company;
        previewData.customer_address = customer.address;
        previewData.customer_city = customer.city;
        previewData.customer_country = customer.country;
        previewData.customer_pib = customer.pib;
        previewData.customer_mb = customer.mb;
        previewData.customer_email = customer.email;
      }
      
      await pdfGenerator.previewInvoice(previewData, companyData);
    } catch (error) {
      console.error('Error previewing PDF:', error);
      alert('Failed to preview PDF / Greška pri pregledu PDF-a');
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {invoice ? 'Edit Invoice / Izmeni fakturu' : 'New Invoice / Nova faktura'}
        </DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Invoice Number / Broj fakture *"
                    name="invoice_number"
                    value={formData.invoice_number}
                    onChange={handleChange}
                    error={!!errors.invoice_number}
                    helperText={errors.invoice_number}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={generateInvoiceNumber} edge="end" title="Generate new number">
                            <RefreshIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <DatePicker
                    label="Invoice Date / Datum fakture *"
                    value={formData.invoice_date}
                    onChange={(value) => handleDateChange('invoice_date', value)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        error={!!errors.invoice_date}
                        helperText={errors.invoice_date}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <DatePicker
                    label="Trading Date / Datum prometa *"
                    value={formData.trading_date}
                    onChange={(value) => handleDateChange('trading_date', value)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        error={!!errors.trading_date}
                        helperText={errors.trading_date}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Customer / Kupac *"
                    name="customer_id"
                    value={formData.customer_id}
                    onChange={handleChange}
                    error={!!errors.customer_id}
                    helperText={errors.customer_id}
                  >
                    <MenuItem value="">
                      <em>Select customer / Izaberite kupca</em>
                    </MenuItem>
                    {customers.map((customer) => (
                      <MenuItem key={customer.id} value={customer.id}>
                        {customer.name} {customer.company && `(${customer.company})`}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField
                    fullWidth
                    select
                    label="Currency / Valuta"
                    name="currency"
                    value={formData.currency}
                    onChange={(e) => handleCurrencyChange(e.target.value)}
                  >
                    {currencies.map((currency) => (
                      <MenuItem key={currency} value={currency}>
                        {currency}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField
                    fullWidth
                    label="Exchange Rate / Kurs"
                    name="exchange_rate"
                    type="number"
                    value={formData.exchange_rate}
                    onChange={handleChange}
                    disabled={formData.currency === 'RSD' || rateLoading}
                    helperText={
                      formData.currency === 'RSD' 
                        ? 'Fixed at 1.0 for RSD'
                        : exchangeRateInfo?.rate_date 
                          ? `NBS rate from ${new Date(exchangeRateInfo.rate_date).toLocaleDateString('en-GB')}`
                          : 'Enter manual rate'
                    }
                    InputProps={{
                      endAdornment: formData.currency !== 'RSD' && (
                        <InputAdornment position="end">
                          <IconButton 
                            onClick={refreshExchangeRate} 
                            edge="end" 
                            title="Refresh rate from NBS"
                            disabled={rateLoading}
                          >
                            <RefreshIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField
                    fullWidth
                    label="Payment Days / Rok plaćanja"
                    name="payment_deadline"
                    type="number"
                    value={formData.payment_deadline}
                    onChange={handleChange}
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Items / Stavke
                </Typography>
                {errors.items && (
                  <Typography color="error" variant="caption">
                    {errors.items}
                  </Typography>
                )}
              </Box>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Description / Opis</TableCell>
                      <TableCell width="120">Unit / Jedinica</TableCell>
                      <TableCell width="100">Quantity / Količina</TableCell>
                      <TableCell width="120">Price / Cena</TableCell>
                      <TableCell width="100">Discount % / Popust %</TableCell>
                      <TableCell width="120">Total / Ukupno</TableCell>
                      <TableCell width="50"></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formData.items.map((item, index) => {
                      const itemTotal = item.quantity * item.price * (1 - item.discount / 100);
                      return (
                        <TableRow key={index}>
                          <TableCell>
                            <TextField
                              fullWidth
                              size="small"
                              value={item.description}
                              onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                              error={!!errors[`item_${index}_description`]}
                              placeholder="Enter description / Unesite opis"
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              fullWidth
                              select
                              size="small"
                              value={item.unit}
                              onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                            >
                              {units.map((unit) => (
                                <MenuItem key={unit} value={unit}>
                                  {unit}
                                </MenuItem>
                              ))}
                            </TextField>
                          </TableCell>
                          <TableCell>
                            <TextField
                              fullWidth
                              size="small"
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                              inputProps={{ min: 0, step: 0.01 }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              fullWidth
                              size="small"
                              type="number"
                              value={item.price}
                              onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                              inputProps={{ min: 0, step: 0.01 }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              fullWidth
                              size="small"
                              type="number"
                              value={item.discount}
                              onChange={(e) => handleItemChange(index, 'discount', parseFloat(e.target.value) || 0)}
                              inputProps={{ min: 0, max: 100, step: 0.01 }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatCurrency(itemTotal)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => removeItem(index)}
                              disabled={formData.items.length === 1}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ mt: 2, mb: 3 }}>
                <Button
                  startIcon={<AddIcon />}
                  onClick={addItem}
                  variant="outlined"
                  size="small"
                >
                  Add Item / Dodaj stavku
                </Button>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={8}>
                  <TextField
                    fullWidth
                    label="Notes / Napomene"
                    name="notes"
                    multiline
                    rows={3}
                    value={formData.notes}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Summary / Rezime
                    </Typography>
                    
                    {/* Exchange Rate Info */}
                    {formData.currency !== 'RSD' && exchangeRateInfo && (
                      <Box sx={{ mb: 2, p: 1, backgroundColor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Exchange Rate / Kurs ({exchangeRateInfo.rate_date}):
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {exchangeRateInfo.formatted}
                        </Typography>
                        {rateLoading && (
                          <Typography variant="caption" color="primary">
                            Updating rate...
                          </Typography>
                        )}
                      </Box>
                    )}
                    
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Subtotal / Međuzbir:</Typography>
                      <Typography variant="body2">
                        {formatCurrency(totals.subtotal)} {formData.currency}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Discount / Popust:</Typography>
                      <Typography variant="body2">
                        -{formatCurrency(totals.discountTotal)} {formData.currency}
                      </Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body1" fontWeight="bold">
                        Total / Ukupno:
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {formatCurrency(totals.total)} {formData.currency}
                      </Typography>
                    </Box>
                    {formData.currency !== 'RSD' && (
                      <>
                        <Box display="flex" justifyContent="space-between" sx={{ mt: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Total RSD / Ukupno RSD:
                          </Typography>
                          <Typography variant="body2" color="text.secondary" fontWeight="medium">
                            {formatCurrency(totals.totalRsd)} RSD
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          * Rate: 1 {formData.currency} = {formatCurrency(formData.exchange_rate)} RSD
                        </Typography>
                      </>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>
            Cancel / Otkaži
          </Button>
          <Button 
            onClick={handlePreviewPDF}
            disabled={pdfLoading}
            startIcon={pdfLoading ? <CircularProgress size={16} /> : null}
          >
            {pdfLoading ? 'Generating...' : 'Preview PDF / Pregled PDF'}
          </Button>
          <Button type="submit" variant="contained">
            {invoice ? 'Update / Ažuriraj' : 'Create / Kreiraj'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default InvoiceForm;