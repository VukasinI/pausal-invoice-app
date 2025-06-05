import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  Box,
  Paper,
  Typography,
  Divider,
} from '@mui/material';
import {
  Person as PersonIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Email as EmailIcon,
} from '@mui/icons-material';

function CustomerForm({ open, onClose, onSubmit, customer }) {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    address: '',
    city: '',
    country: 'Serbia',
    pib: '',
    mb: '',
    email: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        company: customer.company || '',
        address: customer.address || '',
        city: customer.city || '',
        country: customer.country || 'Serbia',
        pib: customer.pib || '',
        mb: customer.mb || '',
        email: customer.email || '',
      });
    } else {
      setFormData({
        name: '',
        company: '',
        address: '',
        city: '',
        country: 'Serbia',
        pib: '',
        mb: '',
        email: '',
      });
    }
    setErrors({});
  }, [customer, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required / Ime je obavezno';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required / Adresa je obavezna';
    }
    
    if (!formData.city.trim()) {
      newErrors.city = 'City is required / Grad je obavezan';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format / Neispravan format emaila';
    }
    
    if (formData.pib && !/^\d{9}$/.test(formData.pib)) {
      newErrors.pib = 'PIB must be 9 digits / PIB mora imati 9 cifara';
    }
    
    if (formData.mb && !/^\d{8}$/.test(formData.mb)) {
      newErrors.mb = 'MB must be 8 digits / MB mora imati 8 cifara';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        }
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: '12px 12px 0 0',
          textAlign: 'center',
          py: 3
        }}>
          <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
            <PersonIcon />
            <Typography variant="h5" component="div">
              {customer ? 'Edit Customer / Izmeni kupca' : 'Add Customer / Dodaj kupca'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 4, bgcolor: 'grey.50' }}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, bgcolor: 'white' }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <BusinessIcon />
              Basic Information / Osnovni podaci
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Name / Ime *"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  error={!!errors.name}
                  helperText={errors.name}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                      },
                      '&.Mui-focused': {
                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.25)',
                      }
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Company / Firma"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                      }
                    }
                  }}
                />
              </Grid>
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
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                      }
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
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
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                      }
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Country / Država"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="Enter country name / Unesite naziv zemlje"
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                      }
                    }
                  }}
                />
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <LocationIcon />
              Tax Information / Poreske informacije
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="PIB"
                  name="pib"
                  value={formData.pib}
                  onChange={handleChange}
                  error={!!errors.pib}
                  helperText={errors.pib || 'Tax ID number (9 digits) / Poreski identifikacioni broj (9 cifara)'}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                      }
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="MB"
                  name="mb"
                  value={formData.mb}
                  onChange={handleChange}
                  error={!!errors.mb}
                  helperText={errors.mb || 'Registration number (8 digits) / Matični broj (8 cifara)'}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                      }
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1, mt: 2, mb: 3 }}>
                  <EmailIcon />
                  Contact Information / Kontakt informacije
                </Typography>
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
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                      }
                    }
                  }}
                />
              </Grid>
            </Grid>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: 'grey.50', borderTop: '1px solid', borderColor: 'divider' }}>
          <Button 
            onClick={onClose}
            variant="outlined"
            sx={{ 
              borderRadius: 2,
              px: 4,
              py: 1.5,
              borderColor: 'grey.300',
              color: 'grey.700',
              '&:hover': {
                borderColor: 'grey.400',
                bgcolor: 'grey.100'
              }
            }}
          >
            Cancel / Otkaži
          </Button>
          <Button 
            type="submit" 
            variant="contained"
            sx={{
              borderRadius: 2,
              px: 4,
              py: 1.5,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
                transform: 'translateY(-1px)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            {customer ? 'Update / Ažuriraj' : 'Create / Kreiraj'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default CustomerForm;