import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  InputAdornment,
  IconButton,
  Stack,
  Divider,
  alpha,
  Link,
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  LocalShipping, 
  Security, 
  Speed,
  AccountCircle,
  Lock,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { login } from '../store/slices/authSlice';
import { LoginRequest } from '../types';
import { useThemeMode } from '../contexts/ThemeContext';
import { useTheme } from '@mui/material/styles';

const loginSchema = yup.object({
  username: yup.string().required('Usuario requerido'),
  password: yup.string().required('Contraseña requerida'),
});

const Login: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { mode, toggleColorMode } = useThemeMode();
  const { loading, error } = useAppSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LoginRequest>({
    resolver: yupResolver(loginSchema),
  });

  const onSubmit = async (data: LoginRequest) => {
    try {
      await dispatch(login(data)).unwrap();
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleDemoLogin = (username: string, password: string) => {
    setValue('username', username);
    setValue('password', password);
    handleSubmit(onSubmit)();
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.palette.background.default,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated background effects */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: `radial-gradient(circle at 20% 80%, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 50%),
                        radial-gradient(circle at 80% 20%, ${alpha(theme.palette.secondary.main, 0.1)} 0%, transparent 50%),
                        radial-gradient(circle at 40% 40%, ${alpha(theme.palette.primary.main, 0.05)} 0%, transparent 50%)`,
            animation: 'rotate 30s linear infinite',
          },
          '@keyframes rotate': {
            '0%': { transform: 'rotate(0deg)' },
            '100%': { transform: 'rotate(360deg)' },
          },
        }}
      />

      {/* Grid pattern overlay */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `linear-gradient(${alpha(theme.palette.primary.main, 0.03)} 1px, transparent 1px),
                           linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.03)} 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
          opacity: 0.5,
        }}
      />

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            width: 4,
            height: 4,
            backgroundColor: theme.palette.primary.main,
            borderRadius: '50%',
            filter: `blur(${i % 2 === 0 ? 0 : 1}px)`,
            opacity: 0.6,
            animation: `float${i} ${15 + i * 3}s infinite ease-in-out`,
            [`@keyframes float${i}`]: {
              '0%, 100%': {
                transform: `translate(${i * 100}px, ${i * 50}px)`,
              },
              '33%': {
                transform: `translate(${i * 150}px, ${i * 100}px)`,
              },
              '66%': {
                transform: `translate(${i * 50}px, ${i * 150}px)`,
              },
            },
          }}
        />
      ))}
      {/* Floating tech elements */}
      <motion.div
        animate={{ 
          y: [0, -30, 0],
          x: [0, 10, 0],
        }}
        transition={{ 
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          position: 'absolute',
          top: '15%',
          left: '10%',
          opacity: 0.05,
        }}
      >
        <LocalShipping sx={{ fontSize: 200, color: theme.palette.primary.main }} />
      </motion.div>

      <motion.div
        animate={{ 
          y: [0, 20, 0],
          x: [0, -15, 0],
        }}
        transition={{ 
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          position: 'absolute',
          bottom: '15%',
          right: '10%',
          opacity: 0.05,
        }}
      >
        <Security sx={{ fontSize: 180, color: theme.palette.secondary.main }} />
      </motion.div>

      <Container component="main" maxWidth="sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Paper
            elevation={0}
            sx={{
              p: { xs: 4, md: 6 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              backdropFilter: 'blur(20px)',
              backgroundColor: alpha(theme.palette.background.paper, 0.8),
              borderRadius: 3,
              border: '1px solid',
              borderColor: alpha(theme.palette.primary.main, 0.1),
              boxShadow: `0 20px 40px ${alpha(theme.palette.common.black, 0.4)}`,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: `linear-gradient(90deg, 
                  ${theme.palette.primary.main} 0%, 
                  ${theme.palette.secondary.main} 50%, 
                  ${theme.palette.primary.main} 100%)`,
                backgroundSize: '200% 100%',
                animation: 'gradient 3s ease infinite',
              },
              '@keyframes gradient': {
                '0%': { backgroundPosition: '0% 50%' },
                '50%': { backgroundPosition: '100% 50%' },
                '100%': { backgroundPosition: '0% 50%' },
              },
            }}
          >
            {/* Logo and Title */}
            <motion.div
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Stack spacing={3} alignItems="center" sx={{ mb: 5 }}>
                <Box
                  sx={{
                    position: 'relative',
                    width: 100,
                    height: 100,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {/* Animated ring */}
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: -8,
                      borderRadius: '50%',
                      border: '2px solid',
                      borderColor: theme.palette.primary.main,
                      borderTopColor: 'transparent',
                      animation: 'spin 2s linear infinite',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' },
                      },
                    }}
                  />
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, 
                        ${alpha(theme.palette.primary.main, 0.1)} 0%, 
                        ${alpha(theme.palette.primary.dark, 0.2)} 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid',
                      borderColor: alpha(theme.palette.primary.main, 0.2),
                      boxShadow: `0 10px 30px ${alpha(theme.palette.primary.main, 0.2)}`,
                    }}
                  >
                    <Security 
                      sx={{ 
                        fontSize: 50, 
                        color: theme.palette.primary.main,
                        filter: `drop-shadow(0 0 10px ${alpha(theme.palette.primary.main, 0.5)})`,
                      }} 
                    />
                  </Box>
                </Box>
                
                <Box textAlign="center">
                  <Typography
                    component="h1"
                    variant="h3"
                    sx={{
                      fontWeight: 800,
                      letterSpacing: '-0.02em',
                      background: `linear-gradient(135deg, 
                        ${theme.palette.text.primary} 0%, 
                        ${alpha(theme.palette.text.primary, 0.7)} 100%)`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 1,
                    }}
                  >
                    SISTRAU
                  </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: 'text.secondary',
                      fontWeight: 400,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      fontSize: '0.875rem',
                    }}
                  >
                    Sistema de Tránsitos Uruguay
                  </Typography>
                </Box>
              </Stack>
            </motion.div>

            {/* Login Form */}
            <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%' }}>
              <Stack spacing={3}>
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <TextField
                    required
                    fullWidth
                    id="username"
                    label="Usuario"
                    autoComplete="username"
                    autoFocus
                    {...register('username')}
                    error={!!errors.username}
                    helperText={errors.username?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AccountCircle sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: 'primary.main',
                          borderWidth: 2,
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'primary.main',
                        },
                      },
                    }}
                  />
                </motion.div>

                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <TextField
                    required
                    fullWidth
                    label="Contraseña"
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    autoComplete="current-password"
                    {...register('password')}
                    error={!!errors.password}
                    helperText={errors.password?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            sx={{ color: 'text.secondary' }}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: 'primary.main',
                          borderWidth: 2,
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'primary.main',
                        },
                      },
                    }}
                  />
                </motion.div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Alert 
                      severity="error" 
                      sx={{ 
                        borderRadius: 2,
                        backgroundColor: alpha('#D32F2F', 0.1),
                      }}
                    >
                      {error}
                    </Alert>
                  </motion.div>
                )}

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                >
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{
                      py: 2,
                      fontSize: '1rem',
                      fontWeight: 700,
                      letterSpacing: '0.02em',
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                      boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.25)}`,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: '-100%',
                        width: '100%',
                        height: '100%',
                        background: `linear-gradient(90deg, transparent 0%, ${alpha(theme.palette.common.white, 0.2)} 50%, transparent 100%)`,
                        transition: 'left 0.5s ease',
                      },
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: `0 12px 30px ${alpha(theme.palette.primary.main, 0.35)}`,
                        '&::before': {
                          left: '100%',
                        },
                      },
                      '&:disabled': {
                        background: alpha(theme.palette.primary.main, 0.5),
                      },
                    }}
                  >
                    {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                  </Button>
                </motion.div>

                <Box sx={{ textAlign: 'center' }}>
                  <Link 
                    href="#" 
                    variant="body2" 
                    sx={{ 
                      color: 'primary.main',
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </Box>
              </Stack>
            </Box>

            <Box sx={{ position: 'relative', width: '100%', my: 4 }}>
              <Divider sx={{ width: '100%' }} />
              <Typography 
                variant="caption" 
                sx={{ 
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: theme.palette.background.paper,
                  px: 2,
                  color: 'text.secondary',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                Acceso rápido
              </Typography>
            </Box>

            {/* Demo Accounts */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              style={{ width: '100%' }}
            >
              <Stack spacing={2}>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Credenciales de prueba
                </Typography>
                
                <Stack direction="row" spacing={2}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => handleDemoLogin('admin', 'admin123')}
                    sx={{
                      py: 1.5,
                      borderWidth: 2,
                      '&:hover': {
                        borderWidth: 2,
                        backgroundColor: alpha('#1565C0', 0.05),
                      },
                    }}
                  >
                    <Stack>
                      <Typography variant="subtitle2" fontWeight={600}>
                        Admin
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        admin / admin123
                      </Typography>
                    </Stack>
                  </Button>

                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => handleDemoLogin('transportista', 'demo123')}
                    sx={{
                      py: 1.5,
                      borderWidth: 2,
                      '&:hover': {
                        borderWidth: 2,
                        backgroundColor: alpha('#1565C0', 0.05),
                      },
                    }}
                  >
                    <Stack>
                      <Typography variant="subtitle2" fontWeight={600}>
                        Transportista
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        transportista / demo123
                      </Typography>
                    </Stack>
                  </Button>
                </Stack>
              </Stack>
            </motion.div>
          </Paper>

          <Typography 
            variant="body2" 
            color="white" 
            align="center" 
            sx={{ 
              mt: 4,
              opacity: 0.8,
            }}
          >
            © 2025 SISTRAU - Ministerio de Transporte y Obras Públicas
          </Typography>
        </motion.div>
      </Container>
    </Box>
  );
};

export default Login;