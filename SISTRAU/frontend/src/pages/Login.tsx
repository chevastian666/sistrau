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
  Link,
  InputAdornment,
  IconButton,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  LocalShipping,
} from '@mui/icons-material';
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

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const demoAccounts = [
    { role: 'Transportista', username: 'transportista', password: 'demo123' },
    { role: 'Conductor', username: 'conductor', password: 'demo123' },
    { role: 'Autoridad', username: 'autoridad', password: 'demo123' },
    { role: 'Sindicato', username: 'sindicato', password: 'demo123' },
  ];

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <LocalShipping sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
            <Typography component="h1" variant="h4">
              SISTRAU
            </Typography>
          </Box>
          
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            Sistema Integral de Tránsitos de Uruguay
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
            <Tab label="Iniciar Sesión" />
            <Tab label="Cuentas Demo" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Usuario"
                autoComplete="username"
                autoFocus
                {...register('username')}
                error={!!errors.username}
                helperText={errors.username?.message}
              />
              
              <TextField
                margin="normal"
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
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? 'Ingresando...' : 'Ingresar'}
              </Button>

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Link href="#" variant="body2">
                  ¿Olvidaste tu contraseña?
                </Link>
                <Link href="#" variant="body2">
                  Registrarse
                </Link>
              </Box>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Typography variant="body2" color="text.secondary" paragraph>
              Puedes usar estas cuentas demo para explorar el sistema:
            </Typography>
            
            {demoAccounts.map((account) => (
              <Paper
                key={account.username}
                variant="outlined"
                sx={{ p: 2, mb: 2, cursor: 'pointer' }}
                onClick={() => {
                  onSubmit({
                    username: account.username,
                    password: account.password,
                  });
                }}
              >
                <Typography variant="subtitle2" fontWeight="bold">
                  {account.role}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Usuario: {account.username} | Contraseña: {account.password}
                </Typography>
              </Paper>
            ))}
          </TabPanel>
        </Paper>

        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
          © 2025 SISTRAU - Ministerio de Transporte y Obras Públicas
        </Typography>
      </Box>
    </Container>
  );
};

export default Login;