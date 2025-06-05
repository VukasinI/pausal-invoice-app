import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  CssBaseline,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import {
  People as PeopleIcon,
  Receipt as ReceiptIcon,
  Settings as SettingsIcon,
  Home as HomeIcon,
  Dashboard as DashboardIcon,
  MenuBook as BookIcon,
} from '@mui/icons-material';
import Customers from './pages/Customers';
import HomePage from './pages/HomePage';
import Invoices from './pages/Invoices';
import Dashboard from './pages/Dashboard';
import KPOKnjiga from './pages/KPOKnjiga';
import Settings from './pages/Settings';
import './App.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
      light: '#8da4ef',
      dark: '#4c63d2',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#764ba2',
      light: '#9575cd',
      dark: '#512da8',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8faff',
      paper: '#ffffff',
    },
    grey: {
      50: '#f8faff',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 1px 3px rgba(0, 0, 0, 0.05)',
    '0px 4px 6px rgba(0, 0, 0, 0.05)',
    '0px 5px 15px rgba(0, 0, 0, 0.08)',
    '0px 10px 24px rgba(0, 0, 0, 0.08)',
    '0px 15px 35px rgba(0, 0, 0, 0.08)',
    '0px 20px 40px rgba(0, 0, 0, 0.08)',
    '0px 25px 50px rgba(0, 0, 0, 0.1)',
    '0px 25px 50px rgba(0, 0, 0, 0.12)',
    '0px 25px 50px rgba(0, 0, 0, 0.14)',
    '0px 25px 50px rgba(0, 0, 0, 0.16)',
    ...Array(14).fill('0px 25px 50px rgba(0, 0, 0, 0.18)')
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 24px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            transform: 'translateY(-1px)',
          },
          transition: 'all 0.2s ease-in-out',
        },
        contained: {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          '&:hover': {
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
            transform: 'translateY(-2px)',
          },
          transition: 'all 0.3s ease-in-out',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
        },
      },
    },
  },
});

function Navigation() {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Paušal Invoice App
        </Typography>
        <Button
          color="inherit"
          component={Link}
          to="/"
          startIcon={<HomeIcon />}
          sx={{ backgroundColor: isActive('/') ? 'rgba(0,0,0,0.1)' : 'transparent' }}
        >
          Home / Početna
        </Button>
        <Button
          color="inherit"
          component={Link}
          to="/dashboard"
          startIcon={<DashboardIcon />}
          sx={{ backgroundColor: isActive('/dashboard') ? 'rgba(0,0,0,0.1)' : 'transparent' }}
        >
          Dashboard
        </Button>
        <Button
          color="inherit"
          component={Link}
          to="/customers"
          startIcon={<PeopleIcon />}
          sx={{ backgroundColor: isActive('/customers') ? 'rgba(0,0,0,0.1)' : 'transparent' }}
        >
          Customers / Kupci
        </Button>
        <Button
          color="inherit"
          component={Link}
          to="/invoices"
          startIcon={<ReceiptIcon />}
          sx={{ backgroundColor: isActive('/invoices') ? 'rgba(0,0,0,0.1)' : 'transparent' }}
        >
          Invoices / Fakture
        </Button>
        <Button
          color="inherit"
          component={Link}
          to="/kpo"
          startIcon={<BookIcon />}
          sx={{ backgroundColor: isActive('/kpo') ? 'rgba(0,0,0,0.1)' : 'transparent' }}
        >
          KPO Knjiga
        </Button>
        <Button
          color="inherit"
          component={Link}
          to="/settings"
          startIcon={<SettingsIcon />}
          sx={{ backgroundColor: isActive('/settings') ? 'rgba(0,0,0,0.1)' : 'transparent' }}
        >
          Settings / Podešavanja
        </Button>
      </Toolbar>
    </AppBar>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navigation />
          <Container component="main" sx={{ flexGrow: 1, py: 3 }}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/kpo" element={<KPOKnjiga />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Container>
          <Box component="footer" sx={{ bgcolor: 'background.paper', py: 2 }}>
            <Typography variant="body2" color="text.secondary" align="center">
              © 2024 Paušal Invoice App
            </Typography>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

function ComingSoon({ page }) {
  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          {page}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Coming soon / Uskoro
        </Typography>
      </Box>
    </Container>
  );
}

export default App;