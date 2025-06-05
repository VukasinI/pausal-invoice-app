const express = require('express');
const router = express.Router();
const nbsService = require('../services/nbsService');

// Get latest exchange rates
router.get('/latest', async (req, res) => {
  try {
    const rates = await nbsService.getLatestRates();
    res.json(rates);
  } catch (error) {
    console.error('Error fetching latest rates:', error);
    res.status(500).json({ error: 'Failed to fetch exchange rates' });
  }
});

// Get exchange rate for specific currency
router.get('/:currency', async (req, res) => {
  try {
    const { currency } = req.params;
    const { date } = req.query;
    
    const rate = await nbsService.getRateForCurrency(currency.toUpperCase(), date);
    
    if (!rate) {
      return res.status(404).json({ error: 'Exchange rate not found' });
    }
    
    res.json({
      currency_code: currency.toUpperCase(),
      rate: rate.middle_rate,
      unit: rate.unit,
      rate_date: rate.rate_date,
      buy_rate: rate.buy_rate,
      sell_rate: rate.sell_rate
    });
  } catch (error) {
    console.error('Error fetching currency rate:', error);
    res.status(500).json({ error: 'Failed to fetch exchange rate' });
  }
});

// Get historical rates for a currency
router.get('/:currency/history', async (req, res) => {
  try {
    const { currency } = req.params;
    const { fromDate, toDate } = req.query;
    
    if (!fromDate || !toDate) {
      return res.status(400).json({ error: 'fromDate and toDate parameters are required' });
    }
    
    const rates = await nbsService.getHistoricalRates(currency.toUpperCase(), fromDate, toDate);
    res.json(rates);
  } catch (error) {
    console.error('Error fetching historical rates:', error);
    res.status(500).json({ error: 'Failed to fetch historical rates' });
  }
});

// Update rates manually (force refresh from NBS)
router.post('/update', async (req, res) => {
  try {
    const rates = await nbsService.updateDailyRates();
    res.json({ 
      message: 'Exchange rates updated successfully',
      count: rates.length,
      rates: rates 
    });
  } catch (error) {
    console.error('Error updating rates:', error);
    res.status(500).json({ error: 'Failed to update exchange rates' });
  }
});

// Convert amount between currencies
router.post('/convert', async (req, res) => {
  try {
    const { amount, fromCurrency, toCurrency, date } = req.body;
    
    if (!amount || !fromCurrency || !toCurrency) {
      return res.status(400).json({ error: 'amount, fromCurrency, and toCurrency are required' });
    }
    
    let convertedAmount = amount;
    
    if (fromCurrency === 'RSD' && toCurrency !== 'RSD') {
      // Converting from RSD to foreign currency
      const rate = await nbsService.getRateForCurrency(toCurrency, date);
      convertedAmount = amount / (rate.middle_rate / rate.unit);
    } else if (fromCurrency !== 'RSD' && toCurrency === 'RSD') {
      // Converting from foreign currency to RSD
      const rate = await nbsService.getRateForCurrency(fromCurrency, date);
      convertedAmount = amount * (rate.middle_rate / rate.unit);
    } else if (fromCurrency !== 'RSD' && toCurrency !== 'RSD') {
      // Converting between two foreign currencies via RSD
      const fromRate = await nbsService.getRateForCurrency(fromCurrency, date);
      const toRate = await nbsService.getRateForCurrency(toCurrency, date);
      
      const rsdAmount = amount * (fromRate.middle_rate / fromRate.unit);
      convertedAmount = rsdAmount / (toRate.middle_rate / toRate.unit);
    }
    // If both currencies are RSD, no conversion needed
    
    res.json({
      originalAmount: amount,
      fromCurrency,
      toCurrency,
      convertedAmount: Math.round(convertedAmount * 10000) / 10000, // Round to 4 decimal places
      date: date || new Date().toISOString().split('T')[0]
    });
  } catch (error) {
    console.error('Error converting currency:', error);
    res.status(500).json({ error: 'Failed to convert currency' });
  }
});

module.exports = router;