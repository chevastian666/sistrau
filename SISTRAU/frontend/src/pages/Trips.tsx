import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const Trips: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Viajes
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography>
          Página de gestión de viajes en construcción...
        </Typography>
      </Paper>
    </Box>
  );
};

export default Trips;