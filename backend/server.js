const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const cron = require('node-cron');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration for production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? true // Allow all origins in production for Railway
    : ['http://localhost:3000'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

const customerRoutes = require('./routes/customers');
const invoiceRoutes = require('./routes/invoices');
const settingsRoutes = require('./routes/settings');
const exchangeRatesRoutes = require('./routes/exchangeRates');
const nbsService = require('./services/nbsService');
const { verifyToken, login, verifySession } = require('./middleware/auth');

// Public routes
app.post('/api/auth/login', login);
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Protected routes
app.get('/api/auth/verify', verifyToken, verifySession);
app.use('/api/customers', verifyToken, customerRoutes);
app.use('/api/invoices', verifyToken, invoiceRoutes);
app.use('/api/settings', verifyToken, settingsRoutes);
app.use('/api/exchange-rates', verifyToken, exchangeRatesRoutes);

// Initialize exchange rates on startup
(async () => {
  try {
    console.log('Initializing exchange rates...');
    await nbsService.getLatestRates();
    console.log('Exchange rates initialized successfully');
  } catch (error) {
    console.error('Failed to initialize exchange rates:', error);
  }
})();

// Schedule daily exchange rate updates at 9:00 AM (NBS typically updates rates around 8:30 AM)
cron.schedule('0 9 * * 1-5', async () => {
  try {
    console.log('Running scheduled exchange rate update...');
    await nbsService.updateDailyRates();
    console.log('Scheduled exchange rate update completed');
  } catch (error) {
    console.error('Scheduled exchange rate update failed:', error);
  }
}, {
  timezone: "Europe/Belgrade"
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Exchange rate updates scheduled for 9:00 AM on weekdays');
});