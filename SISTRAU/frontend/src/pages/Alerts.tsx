import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const Alerts: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Alertas
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography>
          Sistema de alertas en construcción...
        </Typography>
      </Paper>
    </Box>
  );
};

export default Alerts;