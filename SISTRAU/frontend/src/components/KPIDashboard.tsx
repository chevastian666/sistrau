import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Stack,
  Chip,
  LinearProgress,
  useTheme,
  alpha,
  Skeleton,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Refresh,
  Download,
  Speed,
  LocalShipping,
  Route,
  Warning,
  CheckCircle,
  Timer,
  AttachMoney,
  LocalGasStation,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface KPIData {
  id: string;
  title: string;
  value: number | string;
  unit?: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
  color: string;
  sparklineData?: number[];
  target?: number;
}

const KPICard: React.FC<{
  kpi: KPIData;
  index: number;
  onRefresh: () => void;
}> = ({ kpi, index, onRefresh }) => {
  const theme = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Paper
        sx={{
          p: 3,
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid',
          borderColor: alpha(theme.palette[kpi.color].main, 0.2),
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: alpha(theme.palette[kpi.color].main, 0.4),
            transform: 'translateY(-2px)',
            boxShadow: `0 12px 24px ${alpha(theme.palette[kpi.color].main, 0.15)}`,
          },
        }}
      >
        {/* Background decoration */}
        <Box
          sx={{
            position: 'absolute',
            top: -20,
            right: -20,
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${alpha(
              theme.palette[kpi.color].main,
              0.1
            )} 0%, transparent 70%)`,
          }}
        />

        <Stack spacing={2}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
          >
            <Box>
              <Typography
                variant="overline"
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  letterSpacing: 1.2,
                }}
              >
                {kpi.title}
              </Typography>
              <Stack direction="row" alignItems="baseline" spacing={1}>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 800,
                    color: theme.palette[kpi.color].main,
                    textShadow: `0 0 20px ${alpha(
                      theme.palette[kpi.color].main,
                      0.4
                    )}`,
                  }}
                >
                  {kpi.value}
                </Typography>
                {kpi.unit && (
                  <Typography
                    variant="h6"
                    sx={{
                      color: theme.palette[kpi.color].main,
                      opacity: 0.8,
                    }}
                  >
                    {kpi.unit}
                  </Typography>
                )}
              </Stack>
            </Box>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette[kpi.color].main,
                  0.1
                )} 0%, ${alpha(theme.palette[kpi.color].main, 0.05)} 100%)`,
                border: '1px solid',
                borderColor: alpha(theme.palette[kpi.color].main, 0.2),
              }}
            >
              {React.cloneElement(kpi.icon as React.ReactElement, {
                sx: {
                  color: theme.palette[kpi.color].main,
                  fontSize: 24,
                },
              })}
            </Box>
          </Stack>

          {/* Trend indicator */}
          <Stack direction="row" alignItems="center" spacing={2}>
            <Chip
              size="small"
              icon={
                kpi.trend === 'up' ? (
                  <TrendingUp sx={{ fontSize: 16 }} />
                ) : kpi.trend === 'down' ? (
                  <TrendingDown sx={{ fontSize: 16 }} />
                ) : null
              }
              label={`${kpi.change > 0 ? '+' : ''}${kpi.change}%`}
              sx={{
                backgroundColor: alpha(
                  kpi.trend === 'up'
                    ? theme.palette.success.main
                    : kpi.trend === 'down'
                    ? theme.palette.error.main
                    : theme.palette.warning.main,
                  0.1
                ),
                color:
                  kpi.trend === 'up'
                    ? theme.palette.success.main
                    : kpi.trend === 'down'
                    ? theme.palette.error.main
                    : theme.palette.warning.main,
                fontWeight: 700,
                fontSize: '0.75rem',
              }}
            />
            {kpi.target && (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Target: {kpi.target}
                {kpi.unit}
              </Typography>
            )}
          </Stack>

          {/* Mini sparkline chart */}
          {kpi.sparklineData && (
            <Box sx={{ height: 50, mt: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={kpi.sparklineData.map((value, i) => ({ value, index: i }))}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={theme.palette[kpi.color].main}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          )}

          {/* Progress bar if target exists */}
          {kpi.target && typeof kpi.value === 'number' && (
            <Box>
              <LinearProgress
                variant="determinate"
                value={Math.min((kpi.value / kpi.target) * 100, 100)}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: alpha(theme.palette[kpi.color].main, 0.1),
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                    background: `linear-gradient(90deg, ${theme.palette[kpi.color].main} 0%, ${theme.palette[kpi.color].light} 100%)`,
                  },
                }}
              />
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}
              >
                {((kpi.value / kpi.target) * 100).toFixed(0)}% del objetivo
              </Typography>
            </Box>
          )}
        </Stack>
      </Paper>
    </motion.div>
  );
};

const KPIDashboard: React.FC = () => {
  const theme = useTheme();
  const [refreshKey, setRefreshKey] = useState(0);

  // Mock KPI data - in real app, this would come from API
  const { data: kpis, isLoading } = useQuery({
    queryKey: ['kpis', refreshKey],
    queryFn: async () => {
      // Simulate API call
      return [
        {
          id: 'active-vehicles',
          title: 'Vehículos Activos',
          value: 142,
          unit: '',
          change: 12.5,
          trend: 'up' as const,
          icon: <LocalShipping />,
          color: 'primary',
          sparklineData: [120, 125, 130, 128, 135, 140, 142],
          target: 150,
        },
        {
          id: 'trips-today',
          title: 'Viajes Hoy',
          value: 89,
          unit: '',
          change: -5.2,
          trend: 'down' as const,
          icon: <Route />,
          color: 'success',
          sparklineData: [95, 92, 90, 88, 91, 87, 89],
          target: 100,
        },
        {
          id: 'avg-speed',
          title: 'Velocidad Promedio',
          value: 68.5,
          unit: 'km/h',
          change: 3.8,
          trend: 'up' as const,
          icon: <Speed />,
          color: 'info',
          sparklineData: [65, 66, 67, 66.5, 68, 67.5, 68.5],
        },
        {
          id: 'fuel-efficiency',
          title: 'Eficiencia Combustible',
          value: 8.2,
          unit: 'km/l',
          change: 2.1,
          trend: 'up' as const,
          icon: <LocalGasStation />,
          color: 'warning',
          sparklineData: [7.8, 7.9, 8.0, 8.1, 8.0, 8.2, 8.2],
          target: 9.0,
        },
        {
          id: 'on-time-delivery',
          title: 'Entregas a Tiempo',
          value: 94.3,
          unit: '%',
          change: 1.2,
          trend: 'up' as const,
          icon: <CheckCircle />,
          color: 'success',
          sparklineData: [92, 93, 92.5, 94, 93.8, 94.1, 94.3],
          target: 95,
        },
        {
          id: 'active-alerts',
          title: 'Alertas Activas',
          value: 7,
          unit: '',
          change: -22.2,
          trend: 'down' as const,
          icon: <Warning />,
          color: 'error',
          sparklineData: [9, 8, 10, 8, 7, 8, 7],
        },
      ];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleExport = () => {
    // Export KPI data
    const csvData = kpis?.map(kpi => ({
      Indicador: kpi.title,
      Valor: `${kpi.value}${kpi.unit || ''}`,
      Cambio: `${kpi.change}%`,
      Tendencia: kpi.trend,
    }));
    
    console.log('Exporting KPI data:', csvData);
    // Implement actual CSV export logic
  };

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            KPIs en Tiempo Real
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Última actualización: {format(new Date(), "HH:mm:ss", { locale: es })}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Exportar datos">
            <IconButton onClick={handleExport}>
              <Download />
            </IconButton>
          </Tooltip>
          <Tooltip title="Actualizar">
            <IconButton onClick={handleRefresh}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <Grid container spacing={3}>
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Skeleton
                  variant="rectangular"
                  height={200}
                  sx={{ borderRadius: 2 }}
                />
              </Grid>
            ))
          : kpis?.map((kpi, index) => (
              <Grid item xs={12} sm={6} md={4} key={kpi.id}>
                <KPICard kpi={kpi} index={index} onRefresh={handleRefresh} />
              </Grid>
            ))}
      </Grid>
    </Box>
  );
};

export default KPIDashboard;