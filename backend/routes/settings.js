const express = require('express');
const router = express.Router();
const db = require('../db/database');

router.get('/', (req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM settings LIMIT 1').get();
    if (!settings) {
      return res.json({});
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const existingSettings = db.prepare('SELECT * FROM settings LIMIT 1').get();
    
    if (existingSettings) {
      const { 
        company_name, address, city, pib, mb, iban, swift, email, phone, website, logo_url 
      } = req.body;
      
      const stmt = db.prepare(`
        UPDATE settings SET
          company_name = ?, address = ?, city = ?, pib = ?, mb = ?, 
          iban = ?, swift = ?, email = ?, phone = ?, website = ?, logo_url = ?
        WHERE id = ?
      `);
      
      stmt.run(
        company_name, address, city, pib, mb, iban, swift, email, 
        phone, website, logo_url, existingSettings.id
      );
      
      res.json({ id: existingSettings.id, ...req.body });
    } else {
      const { 
        company_name, address, city, pib, mb, iban, swift, email, phone, website, logo_url 
      } = req.body;
      
      const stmt = db.prepare(`
        INSERT INTO settings (
          company_name, address, city, pib, mb, iban, swift, email, phone, website, logo_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        company_name, address, city, pib, mb, iban, swift, email, phone, website, logo_url
      );
      
      res.status(201).json({ id: result.lastInsertRowid, ...req.body });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/bank-accounts', (req, res) => {
  try {
    const accounts = db.prepare('SELECT * FROM bank_accounts ORDER BY is_default DESC, account_name').all();
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/bank-accounts', (req, res) => {
  try {
    const { account_name, iban, swift, bank_name, is_default } = req.body;
    
    if (is_default) {
      db.prepare('UPDATE bank_accounts SET is_default = 0').run();
    }
    
    const stmt = db.prepare(`
      INSERT INTO bank_accounts (account_name, iban, swift, bank_name, is_default)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(account_name, iban, swift, bank_name, is_default ? 1 : 0);
    res.status(201).json({ id: result.lastInsertRowid, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/bank-accounts/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM bank_accounts WHERE id = ?').run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Bank account not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;