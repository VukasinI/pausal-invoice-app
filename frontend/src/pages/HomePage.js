import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  People as PeopleIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ExchangeRatesCard from '../components/ExchangeRatesCard';

function HomePage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    customers: 0,
    invoices: 0,
    totalRevenue: 0,
  });
  const [healthStatus, setHealthStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      
      // Check API health
      const healthResponse = await axios.get(`${API_BASE_URL}/health`);
      setHealthStatus(healthResponse.data);
      
      // Fetch statistics
      const customersResponse = await axios.get(`${API_BASE_URL}/customers`);
      const invoicesResponse = await axios.get(`${API_BASE_URL}/invoices`);
      
      setStats({
        customers: customersResponse.data.length,
        invoices: invoicesResponse.data.length,
        totalRevenue: invoicesResponse.data.reduce((sum, invoice) => sum + (invoice.total_rsd || 0), 0),
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('sr-RS', {
      style: 'currency',
      currency: 'RSD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Welcome / Dobrodošli
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Invoice Management System for Paušal Tax / Sistem za upravljanje fakturama za paušalni porez
        </Typography>
      </Box>

      {healthStatus && (
        <Alert severity="success" sx={{ mb: 3 }} icon={<CheckCircleIcon />}>
          API Status: {healthStatus.status} - {healthStatus.message}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <PeopleIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Customers / Ukupno kupaca
                  </Typography>
                  <Typography variant="h4">
                    {stats.customers}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
            <CardActions>
              <Button size="small" onClick={() => navigate('/customers')}>
                View all / Prikaži sve
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <ReceiptIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Invoices / Ukupno faktura
                  </Typography>
                  <Typography variant="h4">
                    {stats.invoices}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
            <CardActions>
              <Button size="small" onClick={() => navigate('/invoices')}>
                View all / Prikaži sve
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <TrendingUpIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Revenue / Ukupni prihod
                  </Typography>
                  <Typography variant="h5">
                    {formatCurrency(stats.totalRevenue)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
            <CardActions>
              <Button size="small" onClick={() => navigate('/invoices')}>
                View details / Detalji
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Quick Actions / Brze akcije
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                fullWidth
                sx={{ mb: 2 }}
                onClick={() => navigate('/dashboard')}
              >
                View Dashboard / Pogledaj Dashboard
              </Button>
              <Button
                variant="outlined"
                fullWidth
                sx={{ mb: 2 }}
                onClick={() => navigate('/kpo')}
              >
                KPO Knjiga / Income Record Book
              </Button>
              <Button
                variant="outlined"
                fullWidth
                sx={{ mb: 2 }}
                onClick={() => navigate('/customers')}
              >
                Add New Customer / Dodaj novog kupca
              </Button>
              <Button
                variant="outlined"
                fullWidth
                sx={{ mb: 2 }}
                onClick={() => navigate('/invoices')}
              >
                Create Invoice / Kreiraj fakturu
              </Button>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/settings')}
              >
                Company Settings / Podešavanja firme
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <ExchangeRatesCard />
            
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                About Paušal System / O paušalnom sistemu
              </Typography>
              <Typography variant="body2" paragraph>
                The paušal tax system in Serbia is a simplified taxation method for small businesses 
                and entrepreneurs with annual income below certain thresholds.
              </Typography>
              <Typography variant="body2" paragraph>
                Paušalni porez je pojednostavljen način oporezivanja za male biznise i preduzetnike 
                sa godišnjim prihodom ispod određenih granica.
              </Typography>
              <Typography variant="body2">
                This system allows for fixed monthly tax payments instead of complex calculations.
                / Ovaj sistem omogućava fiksne mesečne poreske uplate umesto složenih kalkulacija.
              </Typography>
            </Paper>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}

export default HomePage;