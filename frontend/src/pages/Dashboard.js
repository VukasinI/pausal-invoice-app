import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Alert,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Receipt as ReceiptIcon,
  People as PeopleIcon,
  MonetizationOn as MoneyIcon,
} from '@mui/icons-material';
import { invoiceService, customerService } from '../services/api';
import { format, startOfYear, endOfYear, startOfMonth, endOfMonth } from 'date-fns';

function Dashboard() {
  const [dashboardData, setDashboardData] = useState({
    yearlyIncome: 0,
    monthlyIncome: 0,
    totalInvoices: 0,
    totalCustomers: 0,
    recentInvoices: [],
    monthlyBreakdown: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Paušal limits for 2024 (in RSD)
  const ANNUAL_LIMIT = 6000000; // 6M RSD
  const MONTHLY_LIMIT = 500000; // 500k RSD typical monthly target
  const WARNING_THRESHOLD = 0.8; // 80% of limit
  const DANGER_THRESHOLD = 0.95; // 95% of limit

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [invoicesResponse, customersResponse] = await Promise.all([
        invoiceService.getAll(),
        customerService.getAll(),
      ]);

      const invoices = invoicesResponse.data;
      const customers = customersResponse.data;

      // Calculate current year income
      const currentYear = new Date().getFullYear();
      const yearStart = startOfYear(new Date());
      const yearEnd = endOfYear(new Date());
      
      const yearlyInvoices = invoices.filter(invoice => {
        const invoiceDate = new Date(invoice.invoice_date);
        return invoiceDate >= yearStart && invoiceDate <= yearEnd && invoice.status !== 'draft';
      });

      const yearlyIncome = yearlyInvoices.reduce((total, invoice) => {
        return total + (invoice.total_rsd || 0);
      }, 0);

      // Calculate current month income
      const monthStart = startOfMonth(new Date());
      const monthEnd = endOfMonth(new Date());
      
      const monthlyInvoices = invoices.filter(invoice => {
        const invoiceDate = new Date(invoice.invoice_date);
        return invoiceDate >= monthStart && invoiceDate <= monthEnd && invoice.status !== 'draft';
      });

      const monthlyIncome = monthlyInvoices.reduce((total, invoice) => {
        return total + (invoice.total_rsd || 0);
      }, 0);

      // Calculate monthly breakdown for current year
      const monthlyBreakdown = [];
      for (let month = 0; month < 12; month++) {
        const monthStart = new Date(currentYear, month, 1);
        const monthEnd = new Date(currentYear, month + 1, 0);
        
        const monthInvoices = invoices.filter(invoice => {
          const invoiceDate = new Date(invoice.invoice_date);
          return invoiceDate >= monthStart && invoiceDate <= monthEnd && invoice.status !== 'draft';
        });

        const monthIncome = monthInvoices.reduce((total, invoice) => {
          return total + (invoice.total_rsd || 0);
        }, 0);

        monthlyBreakdown.push({
          month: monthStart.toLocaleDateString('sr-RS', { month: 'long' }),
          income: monthIncome,
          invoiceCount: monthInvoices.length,
        });
      }

      // Get recent invoices (last 5)
      const recentInvoices = invoices
        .filter(invoice => invoice.status !== 'draft')
        .sort((a, b) => new Date(b.invoice_date) - new Date(a.invoice_date))
        .slice(0, 5);

      setDashboardData({
        yearlyIncome,
        monthlyIncome,
        totalInvoices: invoices.filter(inv => inv.status !== 'draft').length,
        totalCustomers: customers.length,
        recentInvoices,
        monthlyBreakdown,
      });

      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data / Greška pri učitavanju podataka');
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

  const getIncomeStatus = (current, limit) => {
    const percentage = (current / limit) * 100;
    if (percentage >= DANGER_THRESHOLD * 100) {
      return { level: 'danger', color: 'error', icon: WarningIcon };
    } else if (percentage >= WARNING_THRESHOLD * 100) {
      return { level: 'warning', color: 'warning', icon: WarningIcon };
    } else {
      return { level: 'safe', color: 'success', icon: CheckCircleIcon };
    }
  };

  const yearlyStatus = getIncomeStatus(dashboardData.yearlyIncome, ANNUAL_LIMIT);
  const monthlyStatus = getIncomeStatus(dashboardData.monthlyIncome, MONTHLY_LIMIT);

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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard / Kontrolna tabla
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Income Limit Alerts */}
      {yearlyStatus.level === 'danger' && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <strong>UPOZORENJE!</strong> Blizu ste godišnjeg limita od 6M RSD za paušalni porez! 
          / <strong>WARNING!</strong> You are approaching the annual 6M RSD limit for lump-sum tax!
        </Alert>
      )}

      {yearlyStatus.level === 'warning' && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Upozorenje: Dostigli ste 80% godišnjeg limita za paušalni porez. 
          / Warning: You have reached 80% of the annual lump-sum tax limit.
        </Alert>
      )}

      {/* Key Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <MoneyIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Godišnji prihod / Annual Income
                  </Typography>
                  <Typography variant="h5">
                    {formatCurrency(dashboardData.yearlyIncome)}
                  </Typography>
                </Box>
              </Box>
              <Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">
                    Limit: {formatCurrency(ANNUAL_LIMIT)}
                  </Typography>
                  <Typography variant="body2">
                    {((dashboardData.yearlyIncome / ANNUAL_LIMIT) * 100).toFixed(1)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min((dashboardData.yearlyIncome / ANNUAL_LIMIT) * 100, 100)}
                  color={yearlyStatus.color}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <TrendingUpIcon color="secondary" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Mesečni prihod / Monthly Income
                  </Typography>
                  <Typography variant="h5">
                    {formatCurrency(dashboardData.monthlyIncome)}
                  </Typography>
                </Box>
              </Box>
              <Chip
                icon={React.createElement(monthlyStatus.icon, { fontSize: 'small' })}
                label={`${((dashboardData.monthlyIncome / MONTHLY_LIMIT) * 100).toFixed(1)}% cilja`}
                color={monthlyStatus.color}
                size="small"
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <ReceiptIcon color="info" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Ukupno faktura / Total Invoices
                  </Typography>
                  <Typography variant="h4">
                    {dashboardData.totalInvoices}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PeopleIcon color="success" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Ukupno kupaca / Total Customers
                  </Typography>
                  <Typography variant="h4">
                    {dashboardData.totalCustomers}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Monthly Breakdown */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Mesečni pregled / Monthly Overview ({new Date().getFullYear()})
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Mesec / Month</TableCell>
                    <TableCell align="right">Prihod / Income</TableCell>
                    <TableCell align="right">Br. faktura / Invoices</TableCell>
                    <TableCell align="right">% od limita / % of Limit</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardData.monthlyBreakdown.map((month, index) => (
                    <TableRow key={index}>
                      <TableCell>{month.month}</TableCell>
                      <TableCell align="right">
                        {formatCurrency(month.income)}
                      </TableCell>
                      <TableCell align="right">{month.invoiceCount}</TableCell>
                      <TableCell align="right">
                        {((month.income / (ANNUAL_LIMIT / 12)) * 100).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Recent Invoices */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Poslednje fakture / Recent Invoices
            </Typography>
            {dashboardData.recentInvoices.length === 0 ? (
              <Typography color="textSecondary">
                Nema faktura / No invoices
              </Typography>
            ) : (
              <Box>
                {dashboardData.recentInvoices.map((invoice) => (
                  <Box key={invoice.id} sx={{ mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="body2" fontWeight="medium">
                      {invoice.invoice_number}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {invoice.customer_name}
                    </Typography>
                    <Box display="flex" justifyContent="space-between" mt={1}>
                      <Typography variant="caption">
                        {format(new Date(invoice.invoice_date), 'dd.MM.yyyy')}
                      </Typography>
                      <Typography variant="caption" fontWeight="medium">
                        {formatCurrency(invoice.total_rsd)}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Tax Information */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Informacije o paušalnom porezu / Lump-sum Tax Information
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" paragraph>
              <strong>Godišnji limit / Annual Limit:</strong> 6.000.000 RSD
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>Mesečni paušalni porez / Monthly Lump-sum Tax:</strong> Zavisi od delatnosti / Depends on activity
            </Typography>
            <Typography variant="body2">
              <strong>Prekoračenje limita / Exceeding the Limit:</strong> Prelazak na redovno oporezivanje / 
              Switch to regular taxation
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" paragraph>
              <strong>Ostalo do limita / Remaining to Limit:</strong>{' '}
              {formatCurrency(Math.max(0, ANNUAL_LIMIT - dashboardData.yearlyIncome))}
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>Prosečni mesečni prihod / Average Monthly Income:</strong>{' '}
              {formatCurrency(dashboardData.yearlyIncome / 12)}
            </Typography>
            <Typography variant="body2">
              <strong>Projekcija za godinu / Year Projection:</strong>{' '}
              {formatCurrency((dashboardData.monthlyIncome * 12))}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}

export default Dashboard;