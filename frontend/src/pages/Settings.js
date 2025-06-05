import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  Alert,
  Snackbar,
  Divider,
  Card,
  CardContent,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Save as SaveIcon,
  LocationOn as LocationIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Language as WebsiteIcon,
} from '@mui/icons-material';
import { settingsService } from '../services/api';

function Settings() {
  const [formData, setFormData] = useState({
    company_name: '',
    address: '',
    city: '',
    pib: '',
    mb: '',
    iban: '',
    swift: '',
    email: '',
    phone: '',
    website: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsService.get();
      if (response.data && Object.keys(response.data).length > 0) {
        setFormData(response.data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.company_name.trim()) {
      newErrors.company_name = 'Company name is required / Ime firme je obavezno';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required / Adresa je obavezna';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required / Grad je obavezan';
    }

    if (!formData.pib.trim()) {
      newErrors.pib = 'PIB is required / PIB je obavezan';
    } else if (!/^\d{9}$/.test(formData.pib)) {
      newErrors.pib = 'PIB must be 9 digits / PIB mora imati 9 cifara';
    }

    if (!formData.mb.trim()) {
      newErrors.mb = 'MB is required / MB je obavezan';
    } else if (!/^\d{8}$/.test(formData.mb)) {
      newErrors.mb = 'MB must be 8 digits / MB mora imati 8 cifara';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format / Neispravan format emaila';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      await settingsService.update(formData);
      showSnackbar('Settings saved successfully / Podešavanja uspešno sačuvana', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      showSnackbar('Failed to save settings / Greška pri čuvanju podešavanja', 'error');
    } finally {
      setSaving(false);
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
          <Typography>Loading settings...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Company Settings / Podešavanja firme
      </Typography>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={4}>
          {/* Company Information */}
          <Grid item xs={12} md={8}>
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ 
                  color: 'primary.main', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1, 
                  mb: 3 
                }}>
                  <BusinessIcon />
                  Company Information / Informacije o firmi
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Company Name / Ime firme *"
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleChange}
                      error={!!errors.company_name}
                      helperText={errors.company_name}
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        }
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="PIB *"
                      name="pib"
                      value={formData.pib}
                      onChange={handleChange}
                      error={!!errors.pib}
                      helperText={errors.pib || 'Tax ID number (9 digits) / Poreski identifikacioni broj (9 cifara)'}
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        }
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="MB *"
                      name="mb"
                      value={formData.mb}
                      onChange={handleChange}
                      error={!!errors.mb}
                      helperText={errors.mb || 'Registration number (8 digits) / Matični broj (8 cifara)'}
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        }
                      }}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom sx={{ 
                  color: 'primary.main', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1, 
                  mb: 3 
                }}>
                  <LocationIcon />
                  Address / Adresa
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Address / Adresa *"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      error={!!errors.address}
                      helperText={errors.address}
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        }
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="City / Grad *"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      error={!!errors.city}
                      helperText={errors.city}
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        }
                      }}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom sx={{ 
                  color: 'primary.main', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1, 
                  mb: 3 
                }}>
                  <EmailIcon />
                  Contact Information / Kontakt informacije
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      error={!!errors.email}
                      helperText={errors.email}
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        }
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Phone / Telefon"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        }
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Website / Veb sajt"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        }
                      }}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom sx={{ 
                  color: 'primary.main', 
                  mb: 3 
                }}>
                  Banking Information / Bankarske informacije
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="IBAN"
                      name="iban"
                      value={formData.iban}
                      onChange={handleChange}
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        }
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="SWIFT"
                      name="swift"
                      value={formData.swift}
                      onChange={handleChange}
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        }
                      }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={<SaveIcon />}
                disabled={saving}
                sx={{
                  px: 4,
                  py: 1.5,
                }}
              >
                {saving ? 'Saving...' : 'Save Settings / Sačuvaj podešavanja'}
              </Button>
            </Box>
          </Grid>

          {/* Information Panel */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Information / Informacije
                </Typography>
                <Typography variant="body2" paragraph>
                  These settings will be used on invoices and official documents.
                </Typography>
                <Typography variant="body2" paragraph>
                  Ova podešavanja će biti korišćena na fakturama i zvaničnim dokumentima.
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Required fields / Obavezna polja:</strong>
                </Typography>
                <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
                  <li>Company Name / Ime firme</li>
                  <li>PIB (9 digits / 9 cifara)</li>
                  <li>MB (8 digits / 8 cifara)</li>
                  <li>Address / Adresa</li>
                  <li>City / Grad</li>
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </form>

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

export default Settings;