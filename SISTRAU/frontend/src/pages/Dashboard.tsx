import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Stack,
  IconButton,
  useTheme,
  alpha,
  Skeleton,
} from '@mui/material';
import {
  LocalShipping,
  Route,
  Warning,
  Speed,
  TrendingUp,
  TrendingDown,
  MoreVert,
  NavigateNext,
  CheckCircle,
  Cancel,
  Schedule,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { 
  LineChart, 
  Line, 
  AreaChart,
  Area,
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  RadialBarChart,
  RadialBar,
  Legend
} from 'recharts';
import { api, endpoints } from '../config/api';
import { useAppSelector } from '../hooks/redux';

interface DashboardStats {
  vehicles: {
    total: number;
    active: number;
    maintenance: number;
  };
  trips: {
    total: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  };
  alerts: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  performance: {
    avgSpeed: number;
    totalDistance: number;
    fuelEfficiency: number;
  };
}

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
  trend?: { value: number; isPositive: boolean };
  delay?: number;
}> = ({ title, value, icon, color, subtitle, trend, delay = 0 }) => {
  const theme = useTheme();
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay, type: "spring", stiffness: 100 }}
    >
      <Card 
        sx={{ 
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          background: theme.palette.background.paper,
          border: '1px solid',
          borderColor: alpha(theme.palette.primary.main, 0.1),
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            borderColor: alpha(theme.palette[color as keyof typeof theme.palette].main, 0.3),
            boxShadow: `0 20px 40px ${alpha(theme.palette[color as keyof typeof theme.palette].main, 0.2)}`,
            '& .stat-glow': {
              opacity: 1,
            },
            '& .stat-icon': {
              transform: 'scale(1.1) rotate(5deg)',
            },
          },
        }}
      >
        {/* Glow effect */}
        <Box
          className="stat-glow"
          sx={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 150,
            height: 150,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(theme.palette[color as keyof typeof theme.palette].main, 0.2)} 0%, transparent 70%)`,
            opacity: 0.5,
            transition: 'opacity 0.3s ease',
            pointerEvents: 'none',
          }}
        />
        <CardContent sx={{ position: 'relative', zIndex: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box flex={1}>
              <Typography 
                color="text.secondary" 
                variant="overline" 
                sx={{ 
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  letterSpacing: 1.2,
                  opacity: 0.8,
                }}
              >
                {title}
              </Typography>
              <Typography 
                variant="h3" 
                sx={{ 
                  fontWeight: 800,
                  mt: 0.5,
                  mb: 0.5,
                  background: `linear-gradient(135deg, ${theme.palette[color as keyof typeof theme.palette]?.main || theme.palette.primary.main} 0%, ${theme.palette[color as keyof typeof theme.palette]?.light || theme.palette.primary.light} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: `0 0 20px ${alpha(theme.palette[color as keyof typeof theme.palette].main, 0.4)}`,
                }}
              >
                {value}
              </Typography>
              {subtitle && (
                <Typography variant="caption" sx={{ color: 'text.secondary', opacity: 0.7 }}>
                  {subtitle}
                </Typography>
              )}
              {trend && (
                <Box display="flex" alignItems="center" mt={1}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      backgroundColor: alpha(
                        trend.isPositive ? theme.palette.success.main : theme.palette.error.main,
                        0.1
                      ),
                    }}
                  >
                    {trend.isPositive ? (
                      <TrendingUp sx={{ fontSize: 14, color: 'success.main', mr: 0.5 }} />
                    ) : (
                      <TrendingDown sx={{ fontSize: 14, color: 'error.main', mr: 0.5 }} />
                    )}
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: trend.isPositive ? 'success.main' : 'error.main',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                      }}
                    >
                      {trend.value}%
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette[color as keyof typeof theme.palette]?.main || theme.palette.primary.main} 0%, ${theme.palette[color as keyof typeof theme.palette]?.light || theme.palette.primary.light} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 8px 16px ${alpha(theme.palette[color as keyof typeof theme.palette].main, 0.2)}`,
              }}
            >
              {React.cloneElement(icon as React.ReactElement, { 
                sx: { color: 'white', fontSize: 28 } 
              })}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const { user } = useAppSelector((state) => state.auth);

  // Fetch dashboard stats
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // Mock data for now
      return {
        vehicles: { total: 150, active: 120, maintenance: 30 },
        trips: { total: 450, inProgress: 85, completed: 350, cancelled: 15 },
        alerts: { total: 25, critical: 5, high: 8, medium: 7, low: 5 },
        performance: { avgSpeed: 65.5, totalDistance: 15420, fuelEfficiency: 85 },
      };
    },
  });

  // Mock data for charts
  const weeklyTripsData = [
    { day: 'Lun', trips: 45, completed: 42 },
    { day: 'Mar', trips: 52, completed: 48 },
    { day: 'Mie', trips: 48, completed: 46 },
    { day: 'Jue', trips: 60, completed: 55 },
    { day: 'Vie', trips: 55, completed: 52 },
    { day: 'Sab', trips: 30, completed: 28 },
    { day: 'Dom', trips: 20, completed: 19 },
  ];

  const alertsPieData = [
    { name: 'Crítico', value: stats?.alerts.critical || 0, color: '#D32F2F' },
    { name: 'Alto', value: stats?.alerts.high || 0, color: '#F57C00' },
    { name: 'Medio', value: stats?.alerts.medium || 0, color: '#FFA726' },
    { name: 'Bajo', value: stats?.alerts.low || 0, color: '#66BB6A' },
  ];

  const performanceData = [
    { hour: '00:00', vehicles: 20 },
    { hour: '04:00', vehicles: 15 },
    { hour: '08:00', vehicles: 85 },
    { hour: '12:00', vehicles: 95 },
    { hour: '16:00', vehicles: 90 },
    { hour: '20:00', vehicles: 60 },
    { hour: '23:59', vehicles: 30 },
  ];

  const efficiencyData = [
    { name: 'Eficiencia', value: 85, fill: '#4CAF50' },
  ];

  const recentActivity = [
    { 
      time: 'Hace 5 min', 
      event: 'Vehículo ABC-1234 inició viaje a Montevideo', 
      type: 'info',
      icon: <Route />,
    },
    { 
      time: 'Hace 15 min', 
      event: 'Alerta de velocidad: DEF-5678 excedió límite', 
      type: 'warning',
      icon: <Warning />,
    },
    { 
      time: 'Hace 30 min', 
      event: 'Viaje completado: GHI-9012', 
      type: 'success',
      icon: <CheckCircle />,
    },
    { 
      time: 'Hace 1 hora', 
      event: 'Mantenimiento programado: JKL-3456', 
      type: 'default',
      icon: <Schedule />,
    },
  ];

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh' }}>
      {/* Animated background gradient */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '100vh',
          background: `radial-gradient(ellipse at top left, ${alpha(theme.palette.primary.main, 0.03)} 0%, transparent 50%),
                      radial-gradient(ellipse at bottom right, ${alpha(theme.palette.secondary.main, 0.03)} 0%, transparent 50%)`,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={4}>
            <Box>
              <Stack direction="row" alignItems="center" spacing={2} mb={1}>
                <Box
                  sx={{
                    width: 6,
                    height: 40,
                    borderRadius: 1,
                    background: `linear-gradient(180deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    boxShadow: `0 0 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                  }}
                />
                <Typography 
                  variant="h3" 
                  sx={{ 
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    background: `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${alpha(theme.palette.text.primary, 0.8)} 100%)`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Panel de Control
                </Typography>
              </Stack>
              <Typography variant="body1" sx={{ color: 'text.secondary', opacity: 0.7, ml: 3 }}>
                Bienvenido de nuevo, {user?.firstName} • {new Date().toLocaleDateString('es-UY', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Chip
                icon={<CheckCircle sx={{ fontSize: 16 }} />}
                label="Sistema Operativo"
                size="small"
                sx={{
                  backgroundColor: alpha(theme.palette.success.main, 0.1),
                  color: 'success.main',
                  borderColor: alpha(theme.palette.success.main, 0.3),
                  border: '1px solid',
                  fontWeight: 600,
                }}
              />
              <IconButton
                sx={{
                  border: '1px solid',
                  borderColor: alpha(theme.palette.primary.main, 0.2),
                  '&:hover': {
                    borderColor: alpha(theme.palette.primary.main, 0.4),
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  },
                }}
              >
                <MoreVert />
              </IconButton>
            </Stack>
          </Stack>
        </motion.div>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          {isLoading ? (
            <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 2 }} />
          ) : (
            <StatCard
              title="Vehículos Activos"
              value={stats?.vehicles.active || 0}
              subtitle={`de ${stats?.vehicles.total || 0} totales`}
              icon={<LocalShipping />}
              color="primary"
              trend={{ value: 12, isPositive: true }}
              delay={0}
            />
          )}
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          {isLoading ? (
            <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 2 }} />
          ) : (
            <StatCard
              title="Viajes en Curso"
              value={stats?.trips.inProgress || 0}
              subtitle={`${stats?.trips.completed || 0} completados hoy`}
              icon={<Route />}
              color="success"
              trend={{ value: 8, isPositive: true }}
              delay={0.1}
            />
          )}
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          {isLoading ? (
            <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 2 }} />
          ) : (
            <StatCard
              title="Alertas Activas"
              value={stats?.alerts.total || 0}
              subtitle={`${stats?.alerts.critical || 0} críticas`}
              icon={<Warning />}
              color="warning"
              trend={{ value: 5, isPositive: false }}
              delay={0.2}
            />
          )}
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          {isLoading ? (
            <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 2 }} />
          ) : (
            <StatCard
              title="Velocidad Promedio"
              value={`${stats?.performance.avgSpeed || 0} km/h`}
              subtitle="Última hora"
              icon={<Speed />}
              color="info"
              trend={{ value: 3, isPositive: true }}
              delay={0.3}
            />
          )}
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Weekly Trips Chart */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Paper 
              sx={{ 
                p: 3,
                height: '100%',
                background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${theme.palette.background.paper} 100%)`,
                backdropFilter: 'blur(10px)',
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" fontWeight={600}>
                  Viajes Semanales
                </Typography>
                <Chip label="Esta semana" size="small" />
              </Stack>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={weeklyTripsData}>
                  <defs>
                    <linearGradient id="colorTrips" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1976D2" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#1976D2" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#4CAF50" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
                  <XAxis dataKey="day" stroke={theme.palette.text.secondary} />
                  <YAxis stroke={theme.palette.text.secondary} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: alpha(theme.palette.background.paper, 0.95),
                      border: 'none',
                      borderRadius: 8,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="trips" 
                    stroke="#1976D2" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorTrips)" 
                    name="Total"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="completed" 
                    stroke="#4CAF50" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorCompleted)" 
                    name="Completados"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Paper>
          </motion.div>
        </Grid>

        {/* Performance Gauge */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Paper 
              sx={{ 
                p: 3,
                height: '100%',
                background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.05)} 0%, ${theme.palette.background.paper} 100%)`,
              }}
            >
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Eficiencia General
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <RadialBarChart 
                  cx="50%" 
                  cy="50%" 
                  innerRadius="60%" 
                  outerRadius="90%" 
                  barSize={20} 
                  data={efficiencyData}
                >
                  <RadialBar
                    minAngle={15}
                    background
                    clockWise
                    dataKey="value"
                    cornerRadius={10}
                    fill="#4CAF50"
                  />
                  <text 
                    x="50%" 
                    y="50%" 
                    textAnchor="middle" 
                    dominantBaseline="middle"
                  >
                    <tspan 
                      style={{ 
                        fontSize: '2.5rem', 
                        fontWeight: 700,
                        fill: theme.palette.text.primary 
                      }}
                    >
                      {efficiencyData[0].value}%
                    </tspan>
                    <tspan 
                      x="50%" 
                      dy="2rem" 
                      style={{ 
                        fontSize: '1rem',
                        fill: theme.palette.text.secondary 
                      }}
                    >
                      Eficiencia
                    </tspan>
                  </text>
                </RadialBarChart>
              </ResponsiveContainer>
            </Paper>
          </motion.div>
        </Grid>

        {/* Real-time Vehicle Activity */}
        <Grid size={{ xs: 12, md: 6 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Paper sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" fontWeight={600}>
                  Actividad de Vehículos (24h)
                </Typography>
                <Chip 
                  label="En tiempo real" 
                  size="small" 
                  color="success" 
                  sx={{ 
                    animation: 'pulse 2s infinite',
                    '@keyframes pulse': {
                      '0%': { opacity: 1 },
                      '50%': { opacity: 0.5 },
                      '100%': { opacity: 1 },
                    },
                  }}
                />
              </Stack>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
                  <XAxis dataKey="hour" stroke={theme.palette.text.secondary} />
                  <YAxis stroke={theme.palette.text.secondary} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: alpha(theme.palette.background.paper, 0.95),
                      border: 'none',
                      borderRadius: 8,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="vehicles" 
                    stroke={theme.palette.primary.main} 
                    strokeWidth={3}
                    dot={{ fill: theme.palette.primary.main, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </motion.div>
        </Grid>

        {/* Alerts Distribution */}
        <Grid size={{ xs: 12, md: 6 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <Paper sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" fontWeight={600}>
                  Distribución de Alertas
                </Typography>
                <IconButton size="small" onClick={() => {}}>
                  <NavigateNext />
                </IconButton>
              </Stack>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={alertsPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {alertsPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: alpha(theme.palette.background.paper, 0.95),
                      border: 'none',
                      borderRadius: 8,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <Stack direction="row" justifyContent="center" flexWrap="wrap" gap={2} mt={2}>
                {alertsPieData.map((item) => (
                  <Stack key={item.name} direction="row" alignItems="center" spacing={1}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: item.color,
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {item.name} ({item.value})
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Paper>
          </motion.div>
        </Grid>

        {/* Recent Activity */}
        <Grid size={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Actividad Reciente
              </Typography>
              <Stack spacing={2} mt={3}>
                {recentActivity.map((activity, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.9 + index * 0.1 }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: alpha(theme.palette.background.default, 0.5),
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.05),
                          transform: 'translateX(8px)',
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: alpha(
                            activity.type === 'success' ? theme.palette.success.main :
                            activity.type === 'warning' ? theme.palette.warning.main :
                            activity.type === 'info' ? theme.palette.info.main :
                            theme.palette.grey[500],
                            0.1
                          ),
                          color: 
                            activity.type === 'success' ? theme.palette.success.main :
                            activity.type === 'warning' ? theme.palette.warning.main :
                            activity.type === 'info' ? theme.palette.info.main :
                            theme.palette.grey[500],
                        }}
                      >
                        {React.cloneElement(activity.icon, { fontSize: 'small' })}
                      </Box>
                      <Box flex={1}>
                        <Typography variant="body2">{activity.event}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {activity.time}
                        </Typography>
                      </Box>
                      <IconButton size="small">
                        <NavigateNext />
                      </IconButton>
                    </Box>
                  </motion.div>
                ))}
              </Stack>
            </Paper>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;