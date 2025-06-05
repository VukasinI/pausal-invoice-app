const express = require('express');
const router = express.Router();
const db = require('../db/database');

router.get('/', (req, res) => {
  try {
    const invoices = db.prepare(`
      SELECT i.*, c.name as customer_name, c.company as customer_company
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      ORDER BY i.invoice_date DESC
    `).all();
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const invoice = db.prepare(`
      SELECT i.*, c.name as customer_name, c.company as customer_company
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE i.id = ?
    `).get(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(req.params.id);
    invoice.items = items;
    
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  const transaction = db.transaction(() => {
    try {
      const { 
        invoice_number, invoice_date, trading_date, customer_id, bank_account_id,
        currency, exchange_rate, payment_deadline, notes, items 
      } = req.body;
      
      const stmt = db.prepare(`
        INSERT INTO invoices (
          invoice_number, invoice_date, trading_date, customer_id, bank_account_id,
          currency, exchange_rate, payment_deadline, notes, total_rsd, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      let total_rsd = 0;
      if (items && items.length > 0) {
        items.forEach(item => {
          const itemTotal = item.quantity * item.price * (1 - (item.discount || 0) / 100);
          total_rsd += itemTotal * (exchange_rate || 1);
        });
      }
      
      const result = stmt.run(
        invoice_number, invoice_date, trading_date, customer_id, bank_account_id,
        currency || 'RSD', exchange_rate || 1, payment_deadline || 30, notes, total_rsd, 'draft'
      );
      
      const invoiceId = result.lastInsertRowid;
      
      if (items && items.length > 0) {
        const itemStmt = db.prepare(`
          INSERT INTO invoice_items (invoice_id, description, unit, quantity, price, discount)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        items.forEach(item => {
          itemStmt.run(
            invoiceId, item.description, item.unit || 'kom',
            item.quantity, item.price, item.discount || 0
          );
        });
      }
      
      return { id: invoiceId, ...req.body, total_rsd };
    } catch (error) {
      throw error;
    }
  });
  
  try {
    const result = transaction();
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', (req, res) => {
  const transaction = db.transaction(() => {
    try {
      const { 
        invoice_number, invoice_date, trading_date, customer_id, bank_account_id,
        currency, exchange_rate, payment_deadline, notes, status, items 
      } = req.body;
      
      let total_rsd = 0;
      if (items && items.length > 0) {
        items.forEach(item => {
          const itemTotal = item.quantity * item.price * (1 - (item.discount || 0) / 100);
          total_rsd += itemTotal * (exchange_rate || 1);
        });
      }
      
      const stmt = db.prepare(`
        UPDATE invoices SET
          invoice_number = ?, invoice_date = ?, trading_date = ?, customer_id = ?, 
          bank_account_id = ?, currency = ?, exchange_rate = ?, payment_deadline = ?, 
          notes = ?, total_rsd = ?, status = ?
        WHERE id = ?
      `);
      
      const result = stmt.run(
        invoice_number, invoice_date, trading_date, customer_id, bank_account_id,
        currency, exchange_rate, payment_deadline, notes, total_rsd, status, req.params.id
      );
      
      if (result.changes === 0) {
        throw new Error('Invoice not found');
      }
      
      db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?').run(req.params.id);
      
      if (items && items.length > 0) {
        const itemStmt = db.prepare(`
          INSERT INTO invoice_items (invoice_id, description, unit, quantity, price, discount)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        
        items.forEach(item => {
          itemStmt.run(
            req.params.id, item.description, item.unit || 'kom',
            item.quantity, item.price, item.discount || 0
          );
        });
      }
      
      return { id: req.params.id, ...req.body, total_rsd };
    } catch (error) {
      throw error;
    }
  });
  
  try {
    const result = transaction();
    res.json(result);
  } catch (error) {
    if (error.message === 'Invoice not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM invoices WHERE id = ?').run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/items', (req, res) => {
  try {
    const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(req.params.id);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/generate/number', (req, res) => {
  try {
    const year = new Date().getFullYear();
    const lastInvoice = db.prepare(`
      SELECT invoice_number FROM invoices 
      WHERE invoice_number LIKE ?
      ORDER BY invoice_number DESC 
      LIMIT 1
    `).get(`%/${year}`);
    
    let nextNumber = 1;
    if (lastInvoice && lastInvoice.invoice_number) {
      const match = lastInvoice.invoice_number.match(/(\d+)\/\d+/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }
    
    const invoiceNumber = `${String(nextNumber).padStart(3, '0')}/${year}`;
    res.json({ invoice_number: invoiceNumber });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;