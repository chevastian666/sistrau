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
  Lock 
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { login } from '../store/slices/authSlice';
import { LoginRequest } from '../types';

const loginSchema = yup.object({
  username: yup.string().required('Usuario requerido'),
  password: yup.string().required('Contraseña requerida'),
});

const Login: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
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
        background: 'linear-gradient(135deg, #1565C0 0%, #0D47A1 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated Background Pattern */}
      <Box
        sx={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          opacity: 0.1,
          background: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FFFFFF' fill-opacity='0.5'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Floating Elements */}
      <motion.div
        animate={{ 
          y: [0, -20, 0],
          rotate: [0, 5, -5, 0]
        }}
        transition={{ 
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          position: 'absolute',
          top: '10%',
          left: '5%',
          opacity: 0.1,
        }}
      >
        <LocalShipping sx={{ fontSize: 200, color: 'white' }} />
      </motion.div>

      <motion.div
        animate={{ 
          y: [0, 20, 0],
          rotate: [0, -5, 5, 0]
        }}
        transition={{ 
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          position: 'absolute',
          bottom: '10%',
          right: '5%',
          opacity: 0.1,
        }}
      >
        <Security sx={{ fontSize: 150, color: 'white' }} />
      </motion.div>

      <motion.div
        animate={{ 
          x: [0, 20, 0],
          rotate: [0, 10, -10, 0]
        }}
        transition={{ 
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          position: 'absolute',
          top: '50%',
          right: '10%',
          opacity: 0.1,
        }}
      >
        <Speed sx={{ fontSize: 180, color: 'white' }} />
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
              backgroundColor: alpha('#FFFFFF', 0.95),
              borderRadius: 4,
              border: '1px solid',
              borderColor: alpha('#FFFFFF', 0.2),
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
            }}
          >
            {/* Logo and Title */}
            <motion.div
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Stack spacing={2} alignItems="center" sx={{ mb: 4 }}>
                <Box
                  sx={{
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1565C0 0%, #1976D2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 10px 30px rgba(21, 101, 192, 0.3)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <LocalShipping sx={{ fontSize: 50, color: 'white', zIndex: 1 }} />
                  <Box
                    sx={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 70%)',
                    }}
                  />
                </Box>
                
                <Box textAlign="center">
                  <Typography
                    component="h1"
                    variant="h3"
                    sx={{
                      fontWeight: 800,
                      background: 'linear-gradient(135deg, #1565C0 0%, #0D47A1 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 1,
                    }}
                  >
                    SISTRAU
                  </Typography>
                  <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
                    Sistema Inteligente de Tránsitos de Uruguay
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
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      background: 'linear-gradient(135deg, #1565C0 0%, #1976D2 100%)',
                      boxShadow: '0 8px 20px rgba(21, 101, 192, 0.25)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 12px 30px rgba(21, 101, 192, 0.35)',
                      },
                      '&:disabled': {
                        background: alpha('#1565C0', 0.5),
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

            <Divider sx={{ my: 4, width: '100%' }}>
              <Typography variant="body2" color="text.secondary">
                Acceso rápido
              </Typography>
            </Divider>

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