const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const customerRoutes = require('./routes/customers');
const invoiceRoutes = require('./routes/invoices');
const settingsRoutes = require('./routes/settings');
const exchangeRatesRoutes = require('./routes/exchangeRates');

app.use('/api/customers', customerRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/exchange-rates', exchangeRatesRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Skip exchange rate initialization for debugging
console.log('Starting server without exchange rate initialization...');

app.listen(PORT, () => {
  console.log(`Debug server is running on port ${PORT}`);
});