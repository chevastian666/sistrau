import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  IconButton,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Stack,
  Alert,
  AlertTitle,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  useTheme,
  alpha,
  Fade,
  Zoom,
  Skeleton,
} from '@mui/material';
import {
  Timer as TimerIcon,
  DirectionsCar as DrivingIcon,
  Hotel as RestIcon,
  Work as WorkIcon,
  EventAvailable as AvailableIcon,
  Download as DownloadIcon,
  CreditCard as CardIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  CalendarMonth as CalendarIcon,
  Speed as SpeedIcon,
  LocationOn as LocationIcon,
  TrendingUp as TrendingUpIcon,
  Shield as ShieldIcon,
  Fingerprint as FingerprintIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  RadialBarChart,
  RadialBar,
  AreaChart,
  Area,
} from 'recharts';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tachographAPI } from '../services/api';
import { format, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tachograph-tabpanel-${index}`}
      aria-labelledby={`tachograph-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const ACTIVITY_COLORS = {
  driving: '#2196F3',
  rest: '#4CAF50',
  work: '#FF9800',
  available: '#9C27B0',
};

const ACTIVITY_GRADIENTS = {
  driving: 'linear-gradient(135deg, #2196F3 0%, #21CBF3 100%)',
  rest: 'linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%)',
  work: 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)',
  available: 'linear-gradient(135deg, #9C27B0 0%, #BA68C8 100%)',
};

const ACTIVITY_ICONS = {
  driving: <DrivingIcon />,
  rest: <RestIcon />,
  work: <WorkIcon />,
  available: <AvailableIcon />,
};

const ACTIVITY_LABELS = {
  driving: 'Conduciendo',
  rest: 'Descansando',
  work: 'Trabajando',
  available: 'Disponible',
};

const Tachograph: React.FC = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [downloadForm, setDownloadForm] = useState({
    cardNumber: '',
    cardType: 'control',
    vehicleId: '',
  });

  // Obtener datos del conductor actual
  const { data: driverHours, isLoading: hoursLoading } = useQuery({
    queryKey: ['driver-hours', selectedDate],
    queryFn: () => tachographAPI.getDriverHours('current', selectedDate),
  });

  // Obtener resumen semanal
  const { data: weeklySummary, isLoading: weeklyLoading } = useQuery({
    queryKey: ['weekly-summary', startOfWeek(selectedDate)],
    queryFn: () => tachographAPI.getWeeklySummary('current', startOfWeek(selectedDate)),
  });

  // Obtener registros recientes
  const { data: recentRecords, isLoading: recordsLoading } = useQuery({
    queryKey: ['tachograph-records'],
    queryFn: () => tachographAPI.getDriverRecords('current', { limit: 50 }),
  });

  // Mutación para crear registro
  const createRecordMutation = useMutation({
    mutationFn: tachographAPI.createRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-hours'] });
      queryClient.invalidateQueries({ queryKey: ['tachograph-records'] });
    },
  });

  // Mutación para descargar datos
  const downloadDataMutation = useMutation({
    mutationFn: tachographAPI.downloadData,
    onSuccess: () => {
      setDownloadDialogOpen(false);
      setDownloadForm({ cardNumber: '', cardType: 'control', vehicleId: '' });
    },
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleActivityChange = (activity: string) => {
    createRecordMutation.mutate({
      vehicleId: 'VEHICLE-001', // En producción vendría del contexto
      activity,
      position: { lat: -34.9011, lng: -56.1645 }, // En producción vendría del GPS
      speed: 0,
      cardNumber: 'CARD-001', // En producción vendría del lector de tarjetas
    });
  };

  const handleDownloadSubmit = () => {
    downloadDataMutation.mutate(downloadForm);
  };

  // Preparar datos para gráfico de actividades
  const activityData = driverHours ? [
    { name: 'Conduciendo', value: driverHours.totalDriving, color: ACTIVITY_COLORS.driving },
    { name: 'Descansando', value: driverHours.totalRest, color: ACTIVITY_COLORS.rest },
    { name: 'Trabajando', value: driverHours.totalWork, color: ACTIVITY_COLORS.work },
    { name: 'Disponible', value: driverHours.totalAvailable, color: ACTIVITY_COLORS.available },
  ] : [];

  // Preparar datos para gráfico semanal
  const weeklyData = weeklySummary?.dailySummaries.map((day: any, index: number) => ({
    day: format(addDays(startOfWeek(selectedDate), index), 'EEE', { locale: es }),
    conducción: day.totalDriving,
    descanso: day.totalRest,
    trabajo: day.totalWork,
  })) || [];

  // Datos para el gráfico radial
  const radialData = [
    {
      name: 'Horas Conducidas',
      value: ((driverHours?.totalDriving || 0) / 9) * 100,
      fill: ACTIVITY_COLORS.driving,
    },
  ];

  return (
    <Box>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Tacógrafo Digital
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sistema inteligente de control de tiempos y cumplimiento normativo
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Tooltip title="Actualizar datos">
              <IconButton
                onClick={() => queryClient.invalidateQueries()}
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  backdropFilter: 'blur(10px)',
                  '&:hover': { 
                    bgcolor: alpha(theme.palette.primary.main, 0.2),
                    transform: 'rotate(180deg)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => setDownloadDialogOpen(true)}
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
                boxShadow: '0 8px 32px rgba(25, 118, 210, 0.3)',
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  boxShadow: '0 12px 48px rgba(25, 118, 210, 0.4)',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Descargar Datos
            </Button>
          </Stack>
        </Stack>

        {/* Cards de Estado */}
        <Grid container spacing={3} mb={3}>
          {/* Card de Estado Actual */}
          <Grid item size={{ xs: 12, md: 8 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card
                sx={{
                  height: '100%',
                  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
                  backdropFilter: 'blur(20px)',
                  border: '1px solid',
                  borderColor: alpha(theme.palette.primary.main, 0.1),
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '40%',
                    height: '100%',
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, transparent 100%)`,
                    transform: 'skewX(-15deg) translateX(20%)',
                  }}
                />
                <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                  <Stack direction="row" alignItems="center" spacing={2} mb={3}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 16px rgba(25, 118, 210, 0.3)',
                      }}
                    >
                      <FingerprintIcon sx={{ color: 'white', fontSize: 28 }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight={600}>
                        Control de Actividad
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Seleccione su estado actual
                      </Typography>
                    </Box>
                  </Stack>
                  
                  <Grid container spacing={2}>
                    {Object.entries(ACTIVITY_LABELS).map(([key, label]) => (
                      <Grid item size={{ xs: 6, sm: 3 }} key={key}>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            fullWidth
                            variant="outlined"
                            onClick={() => handleActivityChange(key)}
                            disabled={createRecordMutation.isPending}
                            sx={{
                              py: 2,
                              borderRadius: 2,
                              borderColor: alpha(ACTIVITY_COLORS[key as keyof typeof ACTIVITY_COLORS], 0.3),
                              background: alpha(ACTIVITY_COLORS[key as keyof typeof ACTIVITY_COLORS], 0.05),
                              '&:hover': {
                                borderColor: ACTIVITY_COLORS[key as keyof typeof ACTIVITY_COLORS],
                                background: alpha(ACTIVITY_COLORS[key as keyof typeof ACTIVITY_COLORS], 0.1),
                                transform: 'translateY(-2px)',
                                boxShadow: `0 8px 24px ${alpha(ACTIVITY_COLORS[key as keyof typeof ACTIVITY_COLORS], 0.25)}`,
                              },
                              transition: 'all 0.3s ease',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 1,
                            }}
                          >
                            <Box
                              sx={{
                                color: ACTIVITY_COLORS[key as keyof typeof ACTIVITY_COLORS],
                                fontSize: 32,
                              }}
                            >
                              {ACTIVITY_ICONS[key as keyof typeof ACTIVITY_ICONS]}
                            </Box>
                            <Typography
                              variant="caption"
                              sx={{
                                color: ACTIVITY_COLORS[key as keyof typeof ACTIVITY_COLORS],
                                fontWeight: 600,
                              }}
                            >
                              {label}
                            </Typography>
                          </Button>
                        </motion.div>
                      </Grid>
                    ))}
                  </Grid>
                  
                  <AnimatePresence>
                    {createRecordMutation.isSuccess && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <Alert 
                          severity="success" 
                          sx={{ 
                            mt: 2,
                            borderRadius: 2,
                            bgcolor: alpha(theme.palette.success.main, 0.1),
                          }}
                        >
                          Estado actualizado correctamente
                        </Alert>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          
          {/* Card de Tiempo de Conducción */}
          <Grid item size={{ xs: 12, md: 4 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card 
                sx={{ 
                  height: '100%',
                  background: ACTIVITY_GRADIENTS.driving,
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(33, 150, 243, 0.3)',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: -50,
                    right: -50,
                    width: 150,
                    height: 150,
                    borderRadius: '50%',
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                  }}
                />
                <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                  <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                    <TimerIcon sx={{ fontSize: 32 }} />
                    <Typography variant="h6" fontWeight={600}>
                      Tiempo de Conducción
                    </Typography>
                  </Stack>
                  
                  {hoursLoading ? (
                    <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
                  ) : (
                    <>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 1 }}>
                        <Typography variant="h2" fontWeight={700}>
                          {driverHours?.totalDriving.toFixed(1)}
                        </Typography>
                        <Typography variant="h6" sx={{ ml: 1, opacity: 0.8 }}>
                          horas
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="caption" sx={{ opacity: 0.8 }}>
                            Progreso diario
                          </Typography>
                          <Typography variant="caption" fontWeight={600}>
                            {((driverHours?.totalDriving || 0) / 9 * 100).toFixed(0)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(((driverHours?.totalDriving || 0) / 9) * 100, 100)}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: 'rgba(255, 255, 255, 0.2)',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: 'white',
                              borderRadius: 4,
                            },
                          }}
                        />
                        <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: 'block' }}>
                          Límite: 9 horas máximo
                        </Typography>
                      </Box>
                      
                      {driverHours?.totalDriving > 9 && (
                        <Fade in>
                          <Alert 
                            severity="error" 
                            sx={{ 
                              bgcolor: 'rgba(255, 255, 255, 0.2)',
                              color: 'white',
                              borderRadius: 2,
                              '& .MuiAlert-icon': {
                                color: 'white',
                              },
                            }}
                          >
                            ¡Límite excedido!
                          </Alert>
                        </Fade>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>

        {/* Estadísticas Rápidas */}
        <Grid container spacing={3} mb={3}>
          {[
            { 
              label: 'Descanso Acumulado', 
              value: driverHours?.totalRest.toFixed(1) || '0', 
              unit: 'horas',
              icon: <RestIcon />,
              color: ACTIVITY_COLORS.rest,
              gradient: ACTIVITY_GRADIENTS.rest,
            },
            { 
              label: 'Trabajo Realizado', 
              value: driverHours?.totalWork.toFixed(1) || '0', 
              unit: 'horas',
              icon: <WorkIcon />,
              color: ACTIVITY_COLORS.work,
              gradient: ACTIVITY_GRADIENTS.work,
            },
            { 
              label: 'Tiempo Disponible', 
              value: driverHours?.totalAvailable.toFixed(1) || '0', 
              unit: 'horas',
              icon: <AvailableIcon />,
              color: ACTIVITY_COLORS.available,
              gradient: ACTIVITY_GRADIENTS.available,
            },
            { 
              label: 'Cumplimiento', 
              value: driverHours?.violations?.length === 0 ? '100' : '85', 
              unit: '%',
              icon: <ShieldIcon />,
              color: '#4CAF50',
              gradient: 'linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%)',
            },
          ].map((stat, index) => (
            <Grid item size={{ xs: 6, sm: 3 }} key={stat.label}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              >
                <Card
                  sx={{
                    background: alpha(theme.palette.background.paper, 0.9),
                    backdropFilter: 'blur(20px)',
                    border: '1px solid',
                    borderColor: alpha(stat.color, 0.2),
                    boxShadow: `0 4px 24px ${alpha(stat.color, 0.15)}`,
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 8px 32px ${alpha(stat.color, 0.25)}`,
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={500}>
                          {stat.label}
                        </Typography>
                        <Typography variant="h5" fontWeight={700} sx={{ color: stat.color, mt: 0.5 }}>
                          {stat.value}
                          <Typography component="span" variant="body2" sx={{ ml: 0.5, color: 'text.secondary' }}>
                            {stat.unit}
                          </Typography>
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          background: stat.gradient,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                        }}
                      >
                        {stat.icon}
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Tabs de Información */}
        <Paper 
          sx={{ 
            background: alpha(theme.palette.background.paper, 0.9),
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            sx={{ 
              borderBottom: 1, 
              borderColor: 'divider',
              '& .MuiTab-root': {
                minHeight: 64,
                textTransform: 'none',
                fontWeight: 500,
              },
            }}
          >
            <Tab label="Resumen Diario" icon={<CalendarIcon />} iconPosition="start" />
            <Tab label="Análisis Semanal" icon={<AnalyticsIcon />} iconPosition="start" />
            <Tab label="Registros" icon={<TimerIcon />} iconPosition="start" />
            <Tab label="Cumplimiento" icon={<ShieldIcon />} iconPosition="start" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item size={{ xs: 12, md: 5 }}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    Distribución de Actividades
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Resumen visual de tu jornada laboral
                  </Typography>
                </Box>
                <Box sx={{ height: 350, position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={activityData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                        animationBegin={0}
                        animationDuration={800}
                      >
                        {activityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ 
                          borderRadius: 8, 
                          border: 'none',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center',
                    }}
                  >
                    <Typography variant="h3" fontWeight={700}>
                      24
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      horas totales
                    </Typography>
                  </Box>
                </Box>
                
                {/* Leyenda personalizada */}
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  {activityData.map((item, index) => (
                    <Grid item size={{ xs: 6 }} key={index}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: item.color,
                          }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {item.name}: {item.value.toFixed(1)}h
                        </Typography>
                      </Stack>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
              
              <Grid item size={{ xs: 12, md: 7 }}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    Análisis de Cumplimiento
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Estado actual de las normativas de conducción
                  </Typography>
                </Box>
                
                {/* Gráfico de cumplimiento radial */}
                <Box sx={{ height: 200, mb: 3 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={radialData}>
                      <RadialBar dataKey="value" fill={ACTIVITY_COLORS.driving} background={{ fill: alpha(ACTIVITY_COLORS.driving, 0.1) }} />
                      <RechartsTooltip />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </Box>
                
                {/* Métricas de cumplimiento */}
                <Grid container spacing={2}>
                  {[
                    { 
                      label: 'Conducción Continua', 
                      current: '3.5h', 
                      limit: '4.5h', 
                      status: 'ok' 
                    },
                    { 
                      label: 'Descanso Diario', 
                      current: driverHours?.totalRest.toFixed(1) + 'h', 
                      limit: '11h mín', 
                      status: driverHours?.totalRest >= 11 ? 'ok' : 'warning' 
                    },
                    { 
                      label: 'Conducción Diaria', 
                      current: driverHours?.totalDriving.toFixed(1) + 'h', 
                      limit: '9h máx', 
                      status: driverHours?.totalDriving <= 9 ? 'ok' : 'error' 
                    },
                  ].map((metric, index) => (
                    <Grid item size={{ xs: 12 }} key={index}>
                      <Paper
                        sx={{
                          p: 2,
                          background: alpha(
                            metric.status === 'ok' ? theme.palette.success.main : 
                            metric.status === 'warning' ? theme.palette.warning.main : 
                            theme.palette.error.main, 
                            0.05
                          ),
                          border: '1px solid',
                          borderColor: alpha(
                            metric.status === 'ok' ? theme.palette.success.main : 
                            metric.status === 'warning' ? theme.palette.warning.main : 
                            theme.palette.error.main, 
                            0.2
                          ),
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {metric.label}
                            </Typography>
                            <Typography variant="h6" fontWeight={700} sx={{ mt: 0.5 }}>
                              {metric.current}
                            </Typography>
                          </Box>
                          <Box textAlign="right">
                            <Typography variant="caption" color="text.secondary">
                              Límite: {metric.limit}
                            </Typography>
                            <Box sx={{ mt: 0.5 }}>
                              {metric.status === 'ok' && <CheckIcon color="success" />}
                              {metric.status === 'warning' && <WarningIcon color="warning" />}
                              {metric.status === 'error' && <ErrorIcon color="error" />}
                            </Box>
                          </Box>
                        </Stack>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
                
                {/* Alertas de violaciones */}
                {driverHours?.violations && driverHours.violations.length > 0 && (
                  <Box mt={3}>
                    <Typography variant="subtitle2" color="error" gutterBottom fontWeight={600}>
                      Violaciones Detectadas
                    </Typography>
                    <Stack spacing={1}>
                      {driverHours.violations.map((violation: any, index: number) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Alert 
                            severity={violation.severity === 'high' ? 'error' : 'warning'}
                            icon={violation.severity === 'high' ? <ErrorIcon /> : <WarningIcon />}
                            sx={{
                              borderRadius: 2,
                              '& .MuiAlert-icon': {
                                fontSize: 28,
                              },
                            }}
                          >
                            <AlertTitle>{violation.type.replace(/_/g, ' ')}</AlertTitle>
                            {violation.message}
                          </Alert>
                        </motion.div>
                      ))}
                    </Stack>
                  </Box>
                )}
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Resumen Semanal de Actividades
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Análisis detallado de los últimos 7 días
              </Typography>
            </Box>
            
            <Box sx={{ height: 400, mb: 4 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="colorDriving" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={ACTIVITY_COLORS.driving} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={ACTIVITY_COLORS.driving} stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorRest" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={ACTIVITY_COLORS.rest} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={ACTIVITY_COLORS.rest} stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorWork" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={ACTIVITY_COLORS.work} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={ACTIVITY_COLORS.work} stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                  <XAxis dataKey="day" stroke={theme.palette.text.secondary} />
                  <YAxis stroke={theme.palette.text.secondary} />
                  <RechartsTooltip 
                    contentStyle={{ 
                      borderRadius: 8, 
                      border: 'none',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                    }} 
                  />
                  <Legend />
                  <Area type="monotone" dataKey="conducción" stroke={ACTIVITY_COLORS.driving} fillOpacity={1} fill="url(#colorDriving)" />
                  <Area type="monotone" dataKey="descanso" stroke={ACTIVITY_COLORS.rest} fillOpacity={1} fill="url(#colorRest)" />
                  <Area type="monotone" dataKey="trabajo" stroke={ACTIVITY_COLORS.work} fillOpacity={1} fill="url(#colorWork)" />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
            
            {weeklySummary && (
              <Grid container spacing={3}>
                <Grid item size={{ xs: 12, md: 6 }}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Card
                      sx={{
                        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
                        border: '1px solid',
                        borderColor: alpha(theme.palette.primary.main, 0.1),
                      }}
                    >
                      <CardContent>
                        <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: 2,
                              background: theme.palette.primary.main,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                            }}
                          >
                            <TrendingUpIcon />
                          </Box>
                          <Typography variant="h6" fontWeight={600}>
                            Totales Semanales
                          </Typography>
                        </Stack>
                        
                        <Stack spacing={2}>
                          {[
                            { label: 'Conducción Total', value: weeklySummary.totalDriving.toFixed(1) + 'h', limit: '56h', percentage: (weeklySummary.totalDriving / 56) * 100 },
                            { label: 'Descanso Total', value: weeklySummary.totalRest.toFixed(1) + 'h', limit: 'Min 45h', percentage: (weeklySummary.totalRest / 168) * 100 },
                            { label: 'Trabajo Total', value: weeklySummary.totalWork.toFixed(1) + 'h', limit: null, percentage: (weeklySummary.totalWork / 168) * 100 },
                          ].map((item, index) => (
                            <Box key={index}>
                              <Stack direction="row" justifyContent="space-between" alignItems="baseline" mb={0.5}>
                                <Typography variant="body2" color="text.secondary">
                                  {item.label}
                                </Typography>
                                <Stack direction="row" spacing={1} alignItems="baseline">
                                  <Typography variant="h6" fontWeight={700}>
                                    {item.value}
                                  </Typography>
                                  {item.limit && (
                                    <Typography variant="caption" color="text.secondary">
                                      / {item.limit}
                                    </Typography>
                                  )}
                                </Stack>
                              </Stack>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min(item.percentage, 100)}
                                sx={{
                                  height: 6,
                                  borderRadius: 3,
                                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                                  '& .MuiLinearProgress-bar': {
                                    borderRadius: 3,
                                    background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
                                  },
                                }}
                              />
                            </Box>
                          ))}
                        </Stack>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
                
                <Grid item size={{ xs: 12, md: 6 }}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    <Card
                      sx={{
                        background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.05)} 0%, ${alpha(theme.palette.success.light, 0.05)} 100%)`,
                        border: '1px solid',
                        borderColor: alpha(theme.palette.success.main, 0.1),
                        height: '100%',
                      }}
                    >
                      <CardContent>
                        <Stack direction="row" alignItems="center" spacing={2} mb={2}>
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: 2,
                              background: theme.palette.success.main,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                            }}
                          >
                            <ShieldIcon />
                          </Box>
                          <Typography variant="h6" fontWeight={600}>
                            Cumplimiento Normativo
                          </Typography>
                        </Stack>
                        
                        {weeklySummary.weeklyViolations.length === 0 ? (
                          <Box
                            sx={{
                              textAlign: 'center',
                              py: 4,
                            }}
                          >
                            <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                            <Typography variant="h6" color="success.main" fontWeight={600}>
                              ¡Excelente!
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Cumpliendo con todas las normativas esta semana
                            </Typography>
                          </Box>
                        ) : (
                          <Stack spacing={2}>
                            {weeklySummary.weeklyViolations.map((violation: any, index: number) => (
                              <Alert 
                                key={index} 
                                severity="error"
                                sx={{
                                  borderRadius: 2,
                                }}
                              >
                                {violation.message}
                              </Alert>
                            ))}
                          </Stack>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              </Grid>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Registros Recientes
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Historial detallado de actividades con verificación digital
              </Typography>
            </Box>
            
            <TableContainer sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                    <TableCell>Fecha/Hora</TableCell>
                    <TableCell>Actividad</TableCell>
                    <TableCell>Vehículo</TableCell>
                    <TableCell>Ubicación</TableCell>
                    <TableCell>Velocidad</TableCell>
                    <TableCell align="center">Verificación</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recordsLoading ? (
                    [...Array(5)].map((_, index) => (
                      <TableRow key={index}>
                        <TableCell colSpan={6}>
                          <Skeleton variant="rectangular" height={40} />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    recentRecords?.records.map((record: any) => (
                      <TableRow 
                        key={record.id}
                        sx={{
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.02),
                          },
                        }}
                      >
                        <TableCell>
                          <Stack>
                            <Typography variant="body2" fontWeight={500}>
                              {format(new Date(record.timestamp), 'dd/MM/yyyy', { locale: es })}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {format(new Date(record.timestamp), 'HH:mm:ss', { locale: es })}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={ACTIVITY_ICONS[record.activity as keyof typeof ACTIVITY_ICONS]}
                            label={ACTIVITY_LABELS[record.activity as keyof typeof ACTIVITY_LABELS]}
                            size="small"
                            sx={{
                              background: alpha(ACTIVITY_COLORS[record.activity as keyof typeof ACTIVITY_COLORS], 0.1),
                              color: ACTIVITY_COLORS[record.activity as keyof typeof ACTIVITY_COLORS],
                              border: '1px solid',
                              borderColor: alpha(ACTIVITY_COLORS[record.activity as keyof typeof ACTIVITY_COLORS], 0.3),
                              '& .MuiChip-icon': {
                                color: ACTIVITY_COLORS[record.activity as keyof typeof ACTIVITY_COLORS],
                              },
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{record.vehicleId}</Typography>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <LocationIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              {record.position.lat.toFixed(4)}, {record.position.lng.toFixed(4)}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <SpeedIcon fontSize="small" color="action" />
                            <Typography variant="body2">{record.speed} km/h</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title={record.signature ? 'Firmado digitalmente' : 'Sin firma'}>
                            <IconButton size="small">
                              {record.signature ? (
                                <CheckIcon sx={{ color: 'success.main' }} />
                              ) : (
                                <ErrorIcon sx={{ color: 'error.main' }} />
                              )}
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <ShieldIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" fontWeight={600} gutterBottom>
                Sistema de Cumplimiento Avanzado
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
                El análisis detallado de cumplimiento normativo estará disponible próximamente. 
                Este módulo incluirá reportes personalizados, predicciones y recomendaciones basadas en IA.
              </Typography>
            </Box>
          </TabPanel>
        </Paper>
      </motion.div>

      {/* Dialog de Descarga de Datos */}
      <Dialog 
        open={downloadDialogOpen} 
        onClose={() => setDownloadDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            background: alpha(theme.palette.background.paper, 0.98),
            backdropFilter: 'blur(20px)',
          },
        }}
      >
        <DialogTitle>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                boxShadow: '0 4px 16px rgba(25, 118, 210, 0.3)',
              }}
            >
              <CardIcon />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                Descargar Datos con Tarjeta de Control
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Acceso autorizado para descarga de registros
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} mt={2}>
            <TextField
              fullWidth
              label="Número de Tarjeta"
              value={downloadForm.cardNumber}
              onChange={(e) => setDownloadForm({ ...downloadForm, cardNumber: e.target.value })}
              placeholder="Ingrese el número de tarjeta"
              InputProps={{
                startAdornment: <CardIcon sx={{ mr: 1, color: 'action.active' }} />,
              }}
            />
            <FormControl fullWidth>
              <InputLabel>Tipo de Tarjeta</InputLabel>
              <Select
                value={downloadForm.cardType}
                onChange={(e) => setDownloadForm({ ...downloadForm, cardType: e.target.value })}
                label="Tipo de Tarjeta"
              >
                <MenuItem value="control">Tarjeta de Control</MenuItem>
                <MenuItem value="company">Tarjeta de Empresa</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="ID del Vehículo"
              value={downloadForm.vehicleId}
              onChange={(e) => setDownloadForm({ ...downloadForm, vehicleId: e.target.value })}
              placeholder="Ingrese el ID del vehículo"
              InputProps={{
                startAdornment: <DrivingIcon sx={{ mr: 1, color: 'action.active' }} />,
              }}
            />
            
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              <AlertTitle>Información de Seguridad</AlertTitle>
              Los datos descargados están cifrados y firmados digitalmente. 
              El acceso quedará registrado en el sistema.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDownloadDialogOpen(false)} sx={{ mr: 1 }}>
            Cancelar
          </Button>
          <Button
            onClick={handleDownloadSubmit}
            variant="contained"
            disabled={!downloadForm.cardNumber || !downloadForm.vehicleId || downloadDataMutation.isPending}
            startIcon={downloadDataMutation.isPending ? <CircularProgress size={20} /> : <DownloadIcon />}
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
              boxShadow: '0 4px 16px rgba(25, 118, 210, 0.3)',
              '&:hover': {
                boxShadow: '0 8px 24px rgba(25, 118, 210, 0.4)',
              },
            }}
          >
            Descargar Datos
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Tachograph;