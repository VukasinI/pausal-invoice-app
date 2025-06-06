const express = require('express');
const router = express.Router();
const db = require('../db/database');

router.get('/', (req, res) => {
  try {
    const customers = db.prepare('SELECT * FROM customers ORDER BY name').all();
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    console.log('Creating customer with data:', req.body);
    const { name, company, address, city, country, pib, mb, email } = req.body;
    
    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!address || !address.trim()) {
      return res.status(400).json({ error: 'Address is required' });
    }
    if (!city || !city.trim()) {
      return res.status(400).json({ error: 'City is required' });
    }
    
    const normalizedCountry = country || 'Serbia';
    const stmt = db.prepare(`
      INSERT INTO customers (name, company, address, city, country, pib, mb, email)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(name, company, address, city, normalizedCountry, pib, mb, email);
    
    const responseData = {
      id: result.lastInsertRowid,
      name,
      company,
      address,
      city,
      country: normalizedCountry,
      pib,
      mb,
      email
    };
    
    console.log('Customer created successfully:', responseData);
    res.status(201).json(responseData);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    console.log('Updating customer', req.params.id, 'with data:', req.body);
    const { name, company, address, city, country, pib, mb, email } = req.body;
    
    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!address || !address.trim()) {
      return res.status(400).json({ error: 'Address is required' });
    }
    if (!city || !city.trim()) {
      return res.status(400).json({ error: 'City is required' });
    }
    
    const normalizedCountry = country || 'Serbia';
    const stmt = db.prepare(`
      UPDATE customers 
      SET name = ?, company = ?, address = ?, city = ?, country = ?, pib = ?, mb = ?, email = ?
      WHERE id = ?
    `);
    const result = stmt.run(name, company, address, city, normalizedCountry, pib, mb, email, req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    const responseData = {
      id: parseInt(req.params.id),
      name,
      company,
      address,
      city,
      country: normalizedCountry,
      pib,
      mb,
      email
    };
    
    console.log('Customer updated successfully:', responseData);
    res.json(responseData);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const customerId = req.params.id;
    
    // Check if customer exists
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Check if customer has any invoices
    const invoiceCount = db.prepare('SELECT COUNT(*) as count FROM invoices WHERE customer_id = ?').get(customerId);
    if (invoiceCount.count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete customer with existing invoices', 
        invoiceCount: invoiceCount.count 
      });
    }
    
    // Delete customer
    const result = db.prepare('DELETE FROM customers WHERE id = ?').run(customerId);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;