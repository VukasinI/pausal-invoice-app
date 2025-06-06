const axios = require('axios');
const db = require('../db/database');

class NBSService {
  constructor() {
    this.apiURL = 'https://api.nbs.rs/exchange-rate/v1/rate/daily/';
  }

  async fetchExchangeRates(date = null) {
    try {
      // Use current date if no date provided
      const targetDate = date || new Date().toISOString().split('T')[0];
      
      console.log(`Fetching NBS exchange rates for date: ${targetDate}`);
      
      // First, check if we have cached rates for this date
      const cachedRates = await this.getCachedRatesForDate(targetDate);
      if (cachedRates.length > 0) {
        console.log(`Using cached rates for ${targetDate}`);
        return cachedRates;
      }
      
      // NBS API endpoint with date parameter
      const url = `${this.apiURL}?date=${targetDate}`;
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.data && response.data.exchangeRateListModels && response.data.exchangeRateListModels.length > 0) {
        const rates = this.parseNBSResponse(response.data, targetDate);
        // Cache the rates
        await this.saveRatesToDB(rates);
        return rates;
      } else if (response.data && response.data.message) {
        // No rates for this date (weekend/holiday), try previous business day
        const previousDay = new Date(targetDate);
        previousDay.setDate(previousDay.getDate() - 1);
        const prevDateStr = previousDay.toISOString().split('T')[0];
        
        console.log(`No rates for ${targetDate}, trying ${prevDateStr}`);
        return this.fetchExchangeRates(prevDateStr);
      }
    } catch (error) {
      console.error('Error fetching NBS rates:', error.message);
      
      // Return fallback rates if API fails
      return this.getFallbackRates();
    }
  }

  async getCachedRatesForDate(date) {
    try {
      const rates = db.prepare(`
        SELECT * FROM exchange_rates 
        WHERE rate_date = ?
        ORDER BY currency_code
      `).all(date);
      
      return rates;
    } catch (error) {
      console.error('Error getting cached rates:', error);
      return [];
    }
  }

  parseNBSResponse(response, date) {
    const rates = [];
    
    if (response.exchangeRateListModels && response.exchangeRateListModels.length > 0) {
      response.exchangeRateListModels.forEach(rate => {
        // Common currencies we're interested in
        const supportedCurrencies = ['EUR', 'USD', 'GBP', 'CHF', 'JPY', 'AUD', 'CAD', 'SEK', 'NOK', 'DKK'];
        
        if (supportedCurrencies.includes(rate.currencyCode)) {
          rates.push({
            currency_code: rate.currencyCode,
            currency_name: rate.currencyNameSerCyrillic || rate.currencyNameSerLatin || rate.currencyNameEng || rate.currencyCode,
            buy_rate: this.parseRate(rate.buyingRate),
            middle_rate: this.parseRate(rate.middleRate),
            sell_rate: this.parseRate(rate.sellingRate),
            rate_date: date,
            unit: parseInt(rate.unit) || 1
          });
        }
      });
    }

    return rates;
  }

  parseRate(rateString) {
    if (!rateString) return null;
    // Handle comma as decimal separator
    const normalizedRate = rateString.toString().replace(',', '.');
    const parsed = parseFloat(normalizedRate);
    return isNaN(parsed) ? null : parsed;
  }

  getFallbackRates() {
    // Fallback rates in case NBS API is unavailable
    const today = new Date().toISOString().split('T')[0];
    return [
      {
        currency_code: 'EUR',
        currency_name: 'Euro',
        buy_rate: 116.8,
        middle_rate: 117.2,
        sell_rate: 117.6,
        rate_date: today,
        unit: 1
      },
      {
        currency_code: 'USD',
        currency_name: 'US Dollar',
        buy_rate: 108.1,
        middle_rate: 108.5,
        sell_rate: 108.9,
        rate_date: today,
        unit: 1
      },
      {
        currency_code: 'GBP',
        currency_name: 'British Pound',
        buy_rate: 136.5,
        middle_rate: 137.2,
        sell_rate: 137.9,
        rate_date: today,
        unit: 1
      },
      {
        currency_code: 'CHF',
        currency_name: 'Swiss Franc',
        buy_rate: 120.1,
        middle_rate: 120.8,
        sell_rate: 121.5,
        rate_date: today,
        unit: 1
      }
    ];
  }

  async saveRatesToDB(rates) {
    if (!rates || rates.length === 0) return;

    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO exchange_rates (
        currency_code, currency_name, buy_rate, middle_rate, sell_rate, rate_date, unit
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction(() => {
      rates.forEach(rate => {
        insertStmt.run(
          rate.currency_code,
          rate.currency_name,
          rate.buy_rate,
          rate.middle_rate,
          rate.sell_rate,
          rate.rate_date,
          rate.unit
        );
      });
    });

    transaction();
    console.log(`Saved ${rates.length} exchange rates to database`);
  }

  async getLatestRates() {
    try {
      const rates = db.prepare(`
        SELECT * FROM exchange_rates 
        WHERE rate_date = (SELECT MAX(rate_date) FROM exchange_rates)
        ORDER BY currency_code
      `).all();

      if (rates.length === 0) {
        // No rates in DB, fetch from NBS
        console.log('No rates in database, fetching from NBS...');
        const fetchedRates = await this.fetchExchangeRates();
        await this.saveRatesToDB(fetchedRates);
        return fetchedRates;
      }

      return rates;
    } catch (error) {
      console.error('Error getting latest rates:', error);
      return this.getFallbackRates();
    }
  }

  async getRateForCurrency(currencyCode, date = null) {
    try {
      if (currencyCode === 'RSD') {
        return { 
          middle_rate: 1, 
          unit: 1,
          rate_date: date || new Date().toISOString().split('T')[0],
          currency_code: 'RSD'
        };
      }

      const targetDate = date || new Date().toISOString().split('T')[0];

      // First check cache
      let query = `
        SELECT * FROM exchange_rates 
        WHERE currency_code = ? AND rate_date = ?
      `;
      
      let rate = db.prepare(query).get(currencyCode, targetDate);

      if (!rate && date) {
        // If specific date requested but not found, fetch from API
        console.log(`Rate not cached for ${currencyCode} on ${targetDate}, fetching from API...`);
        const fetchedRates = await this.fetchExchangeRates(targetDate);
        rate = fetchedRates.find(r => r.currency_code === currencyCode);
      }

      if (!rate) {
        // Try to get the most recent rate
        query = `
          SELECT * FROM exchange_rates 
          WHERE currency_code = ?
          ORDER BY rate_date DESC LIMIT 1
        `;
        rate = db.prepare(query).get(currencyCode);
      }

      if (!rate) {
        // No rate found anywhere, use fallback
        const fallbackRates = this.getFallbackRates();
        return fallbackRates.find(r => r.currency_code === currencyCode) || { 
          middle_rate: 1, 
          unit: 1,
          rate_date: targetDate,
          currency_code: currencyCode
        };
      }

      return rate;
    } catch (error) {
      console.error('Error getting rate for currency:', error);
      return { middle_rate: 1, unit: 1 };
    }
  }

  async updateDailyRates() {
    try {
      console.log('Updating daily exchange rates from NBS...');
      const rates = await this.fetchExchangeRates();
      await this.saveRatesToDB(rates);
      return rates;
    } catch (error) {
      console.error('Error updating daily rates:', error);
      throw error;
    }
  }

  // Get historical rates for a specific period
  async getHistoricalRates(currencyCode, fromDate, toDate) {
    try {
      const rates = db.prepare(`
        SELECT * FROM exchange_rates 
        WHERE currency_code = ? AND rate_date BETWEEN ? AND ?
        ORDER BY rate_date DESC
      `).all(currencyCode, fromDate, toDate);

      return rates;
    } catch (error) {
      console.error('Error getting historical rates:', error);
      return [];
    }
  }
}

module.exports = new NBSService();