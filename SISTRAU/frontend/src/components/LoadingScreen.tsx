import React from 'react';
import { Box, Typography, useTheme, alpha } from '@mui/material';
import { motion } from 'framer-motion';
import { Security as SecurityIcon } from '@mui/icons-material';

const LoadingScreen: React.FC = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: 'background.default',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background animation */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 50% 50%, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 50%)`,
          animation: 'pulse 4s ease-in-out infinite',
          '@keyframes pulse': {
            '0%, 100%': { transform: 'scale(0.8)', opacity: 0.5 },
            '50%': { transform: 'scale(1.2)', opacity: 0.8 },
          },
        }}
      />

      {/* Logo container */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
      >
        <Box
          sx={{
            position: 'relative',
            width: 120,
            height: 120,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Rotating border */}
          <Box
            sx={{
              position: 'absolute',
              inset: -4,
              borderRadius: '50%',
              background: `conic-gradient(from 180deg at 50% 50%, 
                ${theme.palette.primary.main} 0deg, 
                transparent 60deg, 
                transparent 120deg, 
                ${theme.palette.secondary.main} 180deg, 
                transparent 240deg, 
                transparent 300deg, 
                ${theme.palette.primary.main} 360deg)`,
              animation: 'spin 3s linear infinite',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' },
              },
            }}
          />

          {/* Inner circle */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              backgroundColor: theme.palette.background.default,
              border: '2px solid',
              borderColor: alpha(theme.palette.primary.main, 0.2),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SecurityIcon 
              sx={{ 
                fontSize: 48, 
                color: theme.palette.primary.main,
                filter: `drop-shadow(0 0 20px ${alpha(theme.palette.primary.main, 0.6)})`,
              }} 
            />
          </Box>

          {/* Scanning line */}
          <Box
            sx={{
              position: 'absolute',
              width: '100%',
              height: 2,
              background: `linear-gradient(90deg, transparent 0%, ${theme.palette.primary.main} 50%, transparent 100%)`,
              animation: 'scan 2s ease-in-out infinite',
              '@keyframes scan': {
                '0%, 100%': { transform: 'translateY(-60px)', opacity: 0 },
                '50%': { transform: 'translateY(0)', opacity: 1 },
              },
            }}
          />
        </Box>
      </motion.div>

      {/* Loading text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <Typography 
          variant="h5" 
          sx={{ 
            mt: 4,
            fontWeight: 700,
            letterSpacing: '0.05em',
            background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          SISTRAU
        </Typography>
        <Typography 
          variant="caption" 
          sx={{ 
            display: 'block',
            textAlign: 'center',
            mt: 1,
            color: 'text.secondary',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          Iniciando sistema...
        </Typography>
      </motion.div>

      {/* Progress dots */}
      <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: theme.palette.primary.main,
              }}
            />
          </motion.div>
        ))}
      </Box>
    </Box>
  );
};

export default LoadingScreen;