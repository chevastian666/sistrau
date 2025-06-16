import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const Profile: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Mi Perfil
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography>
          Página de perfil en construcción...
        </Typography>
      </Paper>
    </Box>
  );
};

export default Profile;