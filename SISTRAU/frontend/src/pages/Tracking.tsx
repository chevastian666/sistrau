import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const Tracking: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Tracking GPS
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography>
          Sistema de tracking en tiempo real en construcción...
        </Typography>
      </Paper>
    </Box>
  );
};

export default Tracking;