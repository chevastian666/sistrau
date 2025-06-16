import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const Reports: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Reportes
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography>
          Sistema de reportes en construcción...
        </Typography>
      </Paper>
    </Box>
  );
};

export default Reports;