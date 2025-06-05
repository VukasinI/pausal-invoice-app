const express = require('express');
const cors = require('cors');
const db = require('./db/database');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/customers', (req, res) => {
  console.log('Received request:', req.body);
  try {
    const { name, company, address, city, country, pib, mb, email } = req.body;
    
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
      name, company, address, city,
      country: normalizedCountry,
      pib, mb, email
    };
    
    console.log('Success:', responseData);
    res.status(201).json(responseData);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

const server = app.listen(3000, () => {
  console.log('Simple test server running on port 3000');
  
  // Auto-shutdown after 30 seconds
  setTimeout(() => {
    console.log('Auto-shutting down...');
    server.close();
    process.exit(0);
  }, 30000);
});