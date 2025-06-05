const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'invoices.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    company TEXT,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    country TEXT DEFAULT 'Serbia',
    pib TEXT,
    mb TEXT,
    email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS bank_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_name TEXT NOT NULL,
    iban TEXT NOT NULL,
    swift TEXT,
    bank_name TEXT,
    is_default BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT NOT NULL UNIQUE,
    invoice_date DATE NOT NULL,
    trading_date DATE NOT NULL,
    customer_id INTEGER NOT NULL,
    bank_account_id INTEGER,
    currency TEXT DEFAULT 'RSD',
    exchange_rate DECIMAL(10,4) DEFAULT 1,
    payment_deadline INTEGER DEFAULT 30,
    notes TEXT,
    total_rsd DECIMAL(15,2),
    status TEXT DEFAULT 'draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers (id),
    FOREIGN KEY (bank_account_id) REFERENCES bank_accounts (id)
  );

  CREATE TABLE IF NOT EXISTS invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL,
    description TEXT NOT NULL,
    unit TEXT DEFAULT 'kom',
    quantity DECIMAL(10,2) NOT NULL,
    price DECIMAL(15,2) NOT NULL,
    discount DECIMAL(5,2) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    pib TEXT NOT NULL,
    mb TEXT NOT NULL,
    iban TEXT,
    swift TEXT,
    email TEXT,
    phone TEXT,
    website TEXT,
    logo_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS exchange_rates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    currency_code TEXT NOT NULL,
    currency_name TEXT NOT NULL,
    buy_rate DECIMAL(10,4),
    middle_rate DECIMAL(10,4),
    sell_rate DECIMAL(10,4),
    rate_date DATE NOT NULL,
    unit INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(currency_code, rate_date)
  );

  CREATE TRIGGER IF NOT EXISTS update_customer_timestamp
  AFTER UPDATE ON customers
  BEGIN
    UPDATE customers SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

  CREATE TRIGGER IF NOT EXISTS update_invoice_timestamp
  AFTER UPDATE ON invoices
  BEGIN
    UPDATE invoices SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

  CREATE TRIGGER IF NOT EXISTS update_settings_timestamp
  AFTER UPDATE ON settings
  BEGIN
    UPDATE settings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;
`);

module.exports = db;