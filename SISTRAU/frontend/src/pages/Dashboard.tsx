import React, { useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardHeader,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  LocalShipping,
  Route,
  Warning,
  Speed,
  Timeline,
  Assessment,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
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
}> = ({ title, value, icon, color, subtitle }) => (
  <Card>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography color="textSecondary" gutterBottom variant="subtitle2">
            {title}
          </Typography>
          <Typography variant="h4" component="div">
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="textSecondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            backgroundColor: `${color}.light`,
            borderRadius: 2,
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);

  // Fetch dashboard stats
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get(endpoints.stats.dashboard);
      return response.data;
    },
  });

  // Mock data for charts
  const weeklyTripsData = [
    { day: 'Lun', trips: 45 },
    { day: 'Mar', trips: 52 },
    { day: 'Mie', trips: 48 },
    { day: 'Jue', trips: 60 },
    { day: 'Vie', trips: 55 },
    { day: 'Sab', trips: 30 },
    { day: 'Dom', trips: 20 },
  ];

  const alertsPieData = [
    { name: 'Crítico', value: stats?.alerts.critical || 0, color: '#d32f2f' },
    { name: 'Alto', value: stats?.alerts.high || 0, color: '#f57c00' },
    { name: 'Medio', value: stats?.alerts.medium || 0, color: '#fbc02d' },
    { name: 'Bajo', value: stats?.alerts.low || 0, color: '#388e3c' },
  ];

  const performanceData = [
    { month: 'Ene', distance: 12000, fuel: 850 },
    { month: 'Feb', distance: 14000, fuel: 920 },
    { month: 'Mar', distance: 13500, fuel: 890 },
    { month: 'Abr', distance: 15000, fuel: 950 },
    { month: 'May', distance: 16000, fuel: 980 },
    { month: 'Jun', distance: 15500, fuel: 960 },
  ];

  if (isLoading) {
    return <LinearProgress />;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Bienvenido, {user?.firstName} {user?.lastName}
      </Typography>
      
      <Typography variant="subtitle1" color="textSecondary" paragraph>
        Panel de Control - {new Date().toLocaleDateString('es-UY', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Vehículos Activos"
            value={stats?.vehicles.active || 0}
            subtitle={`de ${stats?.vehicles.total || 0} totales`}
            icon={<LocalShipping sx={{ color: 'primary.main', fontSize: 30 }} />}
            color="primary"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Viajes en Curso"
            value={stats?.trips.inProgress || 0}
            subtitle={`${stats?.trips.completed || 0} completados hoy`}
            icon={<Route sx={{ color: 'success.main', fontSize: 30 }} />}
            color="success"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Alertas Activas"
            value={stats?.alerts.total || 0}
            subtitle={`${stats?.alerts.critical || 0} críticas`}
            icon={<Warning sx={{ color: 'warning.main', fontSize: 30 }} />}
            color="warning"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Velocidad Promedio"
            value={`${stats?.performance.avgSpeed || 0} km/h`}
            subtitle="Última hora"
            icon={<Speed sx={{ color: 'info.main', fontSize: 30 }} />}
            color="info"
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Weekly Trips Chart */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Viajes por Día
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyTripsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="trips" fill="#1976d2" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Alerts Pie Chart */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Distribución de Alertas
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={alertsPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {alertsPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Performance Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Rendimiento Mensual
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="distance"
                  stroke="#1976d2"
                  name="Distancia (km)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="fuel"
                  stroke="#ff9800"
                  name="Combustible (L)"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Actividad Reciente
            </Typography>
            <Box sx={{ mt: 2 }}>
              {[
                { time: 'Hace 5 min', event: 'Vehículo ABC-1234 inició viaje a Montevideo', type: 'info' },
                { time: 'Hace 15 min', event: 'Alerta de velocidad: DEF-5678 excedió límite', type: 'warning' },
                { time: 'Hace 30 min', event: 'Viaje completado: GHI-9012', type: 'success' },
                { time: 'Hace 1 hora', event: 'Mantenimiento programado: JKL-3456', type: 'default' },
              ].map((activity, index) => (
                <Box key={index} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" color="textSecondary" sx={{ minWidth: 80 }}>
                    {activity.time}
                  </Typography>
                  <Chip
                    label={activity.event}
                    size="small"
                    color={activity.type as any}
                    variant="outlined"
                  />
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Quick Stats */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Estadísticas Rápidas
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ mb: 2 }}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Tasa de Cumplimiento</Typography>
                  <Typography variant="body2" fontWeight="bold">92%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={92} color="success" />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Utilización de Flota</Typography>
                  <Typography variant="body2" fontWeight="bold">78%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={78} color="primary" />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Eficiencia de Combustible</Typography>
                  <Typography variant="body2" fontWeight="bold">85%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={85} color="info" />
              </Box>
              
              <Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Tiempo de Respuesta</Typography>
                  <Typography variant="body2" fontWeight="bold">95%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={95} color="secondary" />
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;