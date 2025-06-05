import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Snackbar,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { customerService } from '../services/api';
import CustomerForm from '../components/CustomerForm';

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [searchTerm, customers]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await customerService.getAll();
      setCustomers(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load customers / Greška pri učitavanju kupaca');
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    const filtered = customers.filter(customer => {
      const searchLower = searchTerm.toLowerCase();
      return (
        customer.name?.toLowerCase().includes(searchLower) ||
        customer.company?.toLowerCase().includes(searchLower) ||
        customer.email?.toLowerCase().includes(searchLower) ||
        customer.pib?.toLowerCase().includes(searchLower) ||
        customer.mb?.toLowerCase().includes(searchLower) ||
        customer.city?.toLowerCase().includes(searchLower)
      );
    });
    setFilteredCustomers(filtered);
  };

  const handleAdd = () => {
    setSelectedCustomer(null);
    setOpenForm(true);
  };

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setOpenForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer? / Da li ste sigurni da želite da obrišete ovog kupca?')) {
      try {
        await customerService.delete(id);
        fetchCustomers();
        showSnackbar('Customer deleted successfully / Kupac uspešno obrisan', 'success');
      } catch (err) {
        showSnackbar('Failed to delete customer / Greška pri brisanju kupca', 'error');
      }
    }
  };

  const handleFormClose = () => {
    setOpenForm(false);
    setSelectedCustomer(null);
  };

  const handleFormSubmit = async (data) => {
    try {
      if (selectedCustomer) {
        await customerService.update(selectedCustomer.id, data);
        showSnackbar('Customer updated successfully / Kupac uspešno ažuriran', 'success');
      } else {
        await customerService.create(data);
        showSnackbar('Customer created successfully / Kupac uspešno kreiran', 'success');
      }
      fetchCustomers();
      handleFormClose();
    } catch (err) {
      showSnackbar('Failed to save customer / Greška pri čuvanju kupca', 'error');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Customers / Kupci
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          Add Customer / Dodaj kupca
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 2, p: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search customers... / Pretraži kupce..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name / Ime</TableCell>
              <TableCell>Company / Firma</TableCell>
              <TableCell>PIB</TableCell>
              <TableCell>MB</TableCell>
              <TableCell>City / Grad</TableCell>
              <TableCell>Email</TableCell>
              <TableCell align="right">Actions / Akcije</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No customers found / Nema pronađenih kupaca
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => (
                <TableRow key={customer.id} hover>
                  <TableCell>{customer.name}</TableCell>
                  <TableCell>{customer.company || '-'}</TableCell>
                  <TableCell>{customer.pib || '-'}</TableCell>
                  <TableCell>{customer.mb || '-'}</TableCell>
                  <TableCell>{customer.city}</TableCell>
                  <TableCell>{customer.email || '-'}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(customer)}
                      title="Edit / Izmeni"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(customer.id)}
                      title="Delete / Obriši"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <CustomerForm
        open={openForm}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        customer={selectedCustomer}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default Customers;