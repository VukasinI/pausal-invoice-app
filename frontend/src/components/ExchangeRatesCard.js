import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  CircularProgress,
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { exchangeRateService } from '../services/api';
import { format } from 'date-fns';

function ExchangeRatesCard() {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      setLoading(true);
      const response = await exchangeRateService.getLatest();
      setRates(response.data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatRate = (rate, unit = 1) => {
    if (unit === 1) {
      return rate.toFixed(4);
    }
    return `${rate.toFixed(4)} (per ${unit})`;
  };

  const getCurrencyFlag = (currency) => {
    const flags = {
      EUR: '🇪🇺',
      USD: '🇺🇸',
      GBP: '🇬🇧',
      CHF: '🇨🇭',
      JPY: '🇯🇵',
    };
    return flags[currency] || '💱';
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Exchange Rates / Kursovi
          </Typography>
          <IconButton onClick={fetchRates} disabled={loading} title="Refresh rates">
            <RefreshIcon />
          </IconButton>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" p={2}>
            <CircularProgress size={24} />
          </Box>
        ) : rates.length === 0 ? (
          <Typography color="text.secondary">
            No exchange rates available / Nema dostupnih kursova
          </Typography>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Currency / Valuta</TableCell>
                    <TableCell align="right">Rate (RSD) / Kurs</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rates.map((rate) => (
                    <TableRow key={rate.currency_code}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <span>{getCurrencyFlag(rate.currency_code)}</span>
                          <Typography variant="body2" fontWeight="medium">
                            {rate.currency_code}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {formatRate(rate.middle_rate, rate.unit)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {lastUpdate && (
              <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
                <Chip
                  label={`NBS Rate / NBS Kurs`}
                  size="small"
                  variant="outlined"
                  color="primary"
                />
                <Typography variant="caption" color="text.secondary">
                  Updated: {format(lastUpdate, 'HH:mm')}
                </Typography>
              </Box>
            )}

            {rates.length > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Source: National Bank of Serbia / Izvor: Narodna banka Srbije
              </Typography>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default ExchangeRatesCard;