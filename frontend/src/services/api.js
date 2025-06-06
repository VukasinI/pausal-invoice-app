import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const customerService = {
  getAll: () => api.get('/customers'),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
};

export const invoiceService = {
  getAll: () => api.get('/invoices'),
  getById: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post('/invoices', data),
  update: (id, data) => api.put(`/invoices/${id}`, data),
  delete: (id) => api.delete(`/invoices/${id}`),
  getItems: (id) => api.get(`/invoices/${id}/items`),
};

export const settingsService = {
  get: () => api.get('/settings'),
  update: (data) => api.post('/settings', data),
  getBankAccounts: () => api.get('/settings/bank-accounts'),
  createBankAccount: (data) => api.post('/settings/bank-accounts', data),
  deleteBankAccount: (id) => api.delete(`/settings/bank-accounts/${id}`),
};

export const exchangeRateService = {
  getLatest: () => api.get('/exchange-rates/latest'),
  getCurrency: (currency, date = null) => {
    const params = date ? { date } : {};
    return api.get(`/exchange-rates/${currency}`, { params });
  },
  getHistorical: (currency, fromDate, toDate) => {
    return api.get(`/exchange-rates/${currency}/history`, {
      params: { fromDate, toDate }
    });
  },
  updateRates: () => api.post('/exchange-rates/update'),
  convert: (amount, fromCurrency, toCurrency, date = null) => {
    return api.post('/exchange-rates/convert', {
      amount,
      fromCurrency,
      toCurrency,
      date
    });
  },
};

// Enhanced exchange rate function using NBS data
export const getExchangeRate = async (fromCurrency, toCurrency = 'RSD', date = null) => {
  try {
    if (fromCurrency === toCurrency) return 1;
    
    if (toCurrency === 'RSD') {
      // Converting to RSD
      const response = await exchangeRateService.getCurrency(fromCurrency, date);
      const rate = response.data;
      return rate.rate / rate.unit; // NBS rate divided by unit
    } else if (fromCurrency === 'RSD') {
      // Converting from RSD
      const response = await exchangeRateService.getCurrency(toCurrency, date);
      const rate = response.data;
      return rate.unit / rate.rate; // Inverse of NBS rate
    } else {
      // Converting between two foreign currencies via RSD
      const [fromResponse, toResponse] = await Promise.all([
        exchangeRateService.getCurrency(fromCurrency, date),
        exchangeRateService.getCurrency(toCurrency, date)
      ]);
      
      const fromRate = fromResponse.data;
      const toRate = toResponse.data;
      
      // Convert via RSD: from -> RSD -> to
      const rsdRate = fromRate.rate / fromRate.unit;
      const targetRate = toRate.unit / toRate.rate;
      
      return rsdRate * targetRate;
    }
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    
    // Fallback to hardcoded rates
    const fallbackRates = {
      'EUR-RSD': 117.2,
      'USD-RSD': 108.5,
      'GBP-RSD': 137.2,
      'CHF-RSD': 120.8,
      'RSD-EUR': 0.00853,
      'RSD-USD': 0.00922,
      'RSD-GBP': 0.00729,
      'RSD-CHF': 0.00828,
    };
    
    const key = `${fromCurrency}-${toCurrency}`;
    return fallbackRates[key] || 1;
  }
};

// Get formatted exchange rate with currency info
export const getExchangeRateInfo = async (currency, date = null) => {
  try {
    if (currency === 'RSD') {
      return {
        currency_code: 'RSD',
        rate: 1,
        unit: 1,
        formatted: '1.0000 RSD',
        rate_date: new Date().toISOString().split('T')[0]
      };
    }
    
    const response = await exchangeRateService.getCurrency(currency, date);
    const data = response.data;
    
    return {
      ...data,
      formatted: `${data.rate.toFixed(4)} RSD per ${data.unit} ${data.currency_code}`,
      exchangeRate: data.rate / data.unit
    };
  } catch (error) {
    console.error('Error fetching exchange rate info:', error);
    return {
      currency_code: currency,
      rate: 1,
      unit: 1,
      formatted: 'Rate unavailable',
      exchangeRate: 1
    };
  }
};

export default api;