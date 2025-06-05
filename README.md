# Paušal Invoice App

Full-stack invoice management application for Serbian paušal tax system.

## Features

- Customer management
- Invoice creation and management
- Multiple bank accounts support
- Company settings configuration
- Support for multiple currencies with exchange rates
- Serbian/English UI labels

## Tech Stack

- **Frontend**: React, Material-UI
- **Backend**: Node.js, Express
- **Database**: SQLite with better-sqlite3

## Project Structure

```
pausal-invoice-app/
├── backend/
│   ├── db/
│   │   └── database.js     # SQLite database setup
│   ├── routes/
│   │   ├── customers.js    # Customer API endpoints
│   │   ├── invoices.js     # Invoice API endpoints
│   │   └── settings.js     # Settings API endpoints
│   ├── server.js           # Express server
│   └── package.json
├── frontend/
│   ├── src/
│   │   └── App.js          # Main React component
│   └── package.json
└── README.md
```

## Database Schema

- **customers**: id, name, company, address, city, country, pib, mb, email
- **invoices**: id, invoice_number, invoice_date, trading_date, customer_id, currency, exchange_rate, payment_deadline, notes, total_rsd
- **invoice_items**: id, invoice_id, description, unit, quantity, price, discount
- **settings**: id, company_name, address, pib, mb, iban, swift, email
- **bank_accounts**: id, account_name, iban, swift, bank_name, is_default

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the backend server:
   ```bash
   npm run dev
   ```

   The backend will run on http://localhost:5000

### Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the React development server:
   ```bash
   npm start
   ```

   The frontend will run on http://localhost:3000

## API Endpoints

### Health Check
- `GET /api/health` - Check server status

### Customers
- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get customer by ID
- `POST /api/customers` - Create new customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Invoices
- `GET /api/invoices` - Get all invoices
- `GET /api/invoices/:id` - Get invoice by ID with items
- `POST /api/invoices` - Create new invoice
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice
- `GET /api/invoices/:id/items` - Get invoice items

### Settings
- `GET /api/settings` - Get company settings
- `POST /api/settings` - Create/update settings
- `GET /api/settings/bank-accounts` - Get all bank accounts
- `POST /api/settings/bank-accounts` - Create bank account
- `DELETE /api/settings/bank-accounts/:id` - Delete bank account

## Testing the Connection

Once both servers are running, navigate to http://localhost:3000 in your browser. You should see the Paušal Invoice App page with a connection test that shows "Status: OK - Server is running" if everything is set up correctly.

## Development

- Backend uses nodemon for hot reloading
- Frontend uses React's built-in hot reloading
- Database file is created at `backend/db/invoices.db`

## License

ISC