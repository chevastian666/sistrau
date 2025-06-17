import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
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
  Badge,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Avatar,
  AvatarGroup,
  Rating,
  FormControlLabel,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Timer as TimerIcon,
  DirectionsCar as DrivingIcon,
  Hotel as RestIcon,
  Work as WorkIcon,
  EventAvailable as AvailableIcon,
  Download as DownloadIcon,
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
  Assignment as ReportIcon,
  Schedule as ScheduleIcon,
  Groups as GroupsIcon,
  PersonOutline as PersonIcon,
  Assessment as AssessmentIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Pause as PauseIcon,
  Coffee as BreakIcon,
  Navigation as NavigationIcon,
  EmojiEvents as TrophyIcon,
  LocalShipping as TruckIcon,
  WarningAmber as AlertIcon,
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
import { workingHoursAPI } from '../services/api';
import { format, startOfWeek, endOfWeek, addDays, isToday, parseISO } from 'date-fns';
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
      id={`working-hours-tabpanel-${index}`}
      aria-labelledby={`working-hours-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const ACTIVITY_COLORS = {
  driving: '#2196F3',
  other_work: '#FF9800',
  break: '#4CAF50',
  daily_rest: '#9C27B0',
  rest: '#E0E0E0',
};

const ACTIVITY_LABELS = {
  driving: 'Conducción',
  other_work: 'Otro Trabajo',
  break: 'Descanso',
  daily_rest: 'Descanso Diario',
  rest: 'Día de Descanso',
};

const STATUS_COLORS = {
  compliant: '#4CAF50',
  violation: '#F44336',
  warning: '#FF9800',
  no_data: '#9E9E9E',
};

const WorkingHours: React.FC = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [selectedDriver, setSelectedDriver] = useState('current');
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [currentActivity, setCurrentActivity] = useState<any>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  // Fetch driver summary
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['working-hours-summary', selectedDriver],
    queryFn: () => workingHoursAPI.getSummary(selectedDriver),
  });

  // Fetch compliance check
  const { data: complianceCheck } = useQuery({
    queryKey: ['compliance-check'],
    queryFn: () => workingHoursAPI.checkCompliance(),
    enabled: selectedDriver === 'current',
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch fleet compliance
  const { data: fleetCompliance } = useQuery({
    queryKey: ['fleet-compliance'],
    queryFn: () => workingHoursAPI.getFleetCompliance(),
    enabled: tabValue === 2,
  });

  // Fetch schedule
  const { data: schedule } = useQuery({
    queryKey: ['driver-schedule', selectedDriver],
    queryFn: () => workingHoursAPI.getSchedule(selectedDriver),
  });

  // Fetch recommendations
  const { data: recommendations } = useQuery({
    queryKey: ['driver-recommendations', selectedDriver],
    queryFn: () => workingHoursAPI.getRecommendations(selectedDriver),
  });

  // Activity mutation
  const activityMutation = useMutation({
    mutationFn: workingHoursAPI.recordActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['working-hours-summary'] });
      queryClient.invalidateQueries({ queryKey: ['compliance-check'] });
      setActivityDialogOpen(false);
      setCurrentActivity(null);
    },
  });

  const handleStartActivity = (type: string) => {
    const activity = {
      type,
      startTime: new Date().toISOString(),
      vehicleId: 'ABC-1234', // This would come from vehicle selection
    };
    
    activityMutation.mutate(activity);
    setCurrentActivity(activity);
  };

  const handleStopActivity = () => {
    if (currentActivity) {
      activityMutation.mutate({
        ...currentActivity,
        endTime: new Date().toISOString(),
      });
    }
  };

  const renderOverview = () => (
    <Grid container spacing={3}>
      {/* Status Cards */}
      <Grid size={{ xs: 12, md: 8 }}>
        <Grid container spacing={2}>
          {/* Current Status */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  color: 'white',
                }}
              >
                <CardContent>
                  <Stack spacing={2}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Typography variant="h6">Estado Actual</Typography>
                      <Chip
                        label={complianceCheck?.status || 'No Data'}
                        size="small"
                        sx={{
                          backgroundColor: alpha(STATUS_COLORS[complianceCheck?.status || 'no_data'], 0.2),
                          color: STATUS_COLORS[complianceCheck?.status || 'no_data'],
                          fontWeight: 600,
                        }}
                      />
                    </Stack>
                    
                    {complianceCheck?.canDrive ? (
                      <Stack spacing={1}>
                        <Typography variant="h4" fontWeight={700}>
                          {complianceCheck.remainingDriving}h
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          Tiempo de conducción restante
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={(9 - parseFloat(complianceCheck.remainingDriving)) / 9 * 100}
                          sx={{
                            backgroundColor: alpha(theme.palette.common.white, 0.2),
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: theme.palette.common.white,
                            },
                          }}
                        />
                      </Stack>
                    ) : (
                      <Alert severity="error" sx={{ backgroundColor: 'transparent', color: 'white' }}>
                        <AlertTitle>No puede conducir</AlertTitle>
                        Debe tomar un descanso obligatorio
                      </Alert>
                    )}
                  </Stack>
                </CardContent>
                <CardActions>
                  <Button
                    fullWidth
                    variant="contained"
                    color="inherit"
                    startIcon={currentActivity ? <StopIcon /> : <PlayIcon />}
                    onClick={() => currentActivity ? handleStopActivity() : setActivityDialogOpen(true)}
                    sx={{
                      backgroundColor: alpha(theme.palette.common.white, 0.2),
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.common.white, 0.3),
                      },
                    }}
                  >
                    {currentActivity ? 'Finalizar Actividad' : 'Iniciar Actividad'}
                  </Button>
                </CardActions>
              </Card>
            </motion.div>
          </Grid>

          {/* Today's Summary */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card>
                <CardContent>
                  <Stack spacing={2}>
                    <Typography variant="h6">Resumen de Hoy</Typography>
                    
                    <Grid container spacing={2}>
                      <Grid size={6}>
                        <Stack spacing={0.5}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <DrivingIcon sx={{ color: ACTIVITY_COLORS.driving, fontSize: 20 }} />
                            <Typography variant="h5" fontWeight={700}>
                              {complianceCheck?.todayStats?.driving || '0.0'}h
                            </Typography>
                          </Stack>
                          <Typography variant="body2" color="text.secondary">
                            Conducción
                          </Typography>
                        </Stack>
                      </Grid>
                      
                      <Grid size={6}>
                        <Stack spacing={0.5}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <WorkIcon sx={{ color: ACTIVITY_COLORS.other_work, fontSize: 20 }} />
                            <Typography variant="h5" fontWeight={700}>
                              {complianceCheck?.todayStats?.work || '0.0'}h
                            </Typography>
                          </Stack>
                          <Typography variant="body2" color="text.secondary">
                            Trabajo Total
                          </Typography>
                        </Stack>
                      </Grid>
                    </Grid>
                    
                    {complianceCheck?.nextBreakIn && parseFloat(complianceCheck.nextBreakIn) < 2 && (
                      <Alert severity="warning" sx={{ py: 0.5 }}>
                        Próximo descanso en {(parseFloat(complianceCheck.nextBreakIn) * 60).toFixed(0)} min
                      </Alert>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Weekly Progress */}
          <Grid size={{ xs: 12 }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card>
                <CardContent>
                  <Stack spacing={2}>
                    <Typography variant="h6">Progreso Semanal</Typography>
                    
                    <Box sx={{ position: 'relative', height: 200 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={summary?.compliance?.dailyDetails?.slice(-7) || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(value) => format(parseISO(value), 'EEE', { locale: es })}
                            stroke={theme.palette.text.secondary}
                          />
                          <YAxis stroke={theme.palette.text.secondary} />
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: theme.palette.background.paper,
                              border: `1px solid ${theme.palette.divider}`,
                              borderRadius: theme.shape.borderRadius,
                            }}
                          />
                          <Bar dataKey="totalDriving" fill={ACTIVITY_COLORS.driving} name="Conducción" />
                          <Bar dataKey="totalWork" fill={ACTIVITY_COLORS.other_work} name="Trabajo" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                    
                    <Stack direction="row" spacing={2} justifyContent="center">
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Box sx={{ width: 12, height: 12, backgroundColor: ACTIVITY_COLORS.driving, borderRadius: 1 }} />
                        <Typography variant="caption">Conducción</Typography>
                      </Stack>
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Box sx={{ width: 12, height: 12, backgroundColor: ACTIVITY_COLORS.other_work, borderRadius: 1 }} />
                        <Typography variant="caption">Otro Trabajo</Typography>
                      </Stack>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      </Grid>

      {/* Right Column */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Stack spacing={3}>
          {/* Compliance Score */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardContent>
                <Stack spacing={2} alignItems="center">
                  <Typography variant="h6">Tasa de Cumplimiento</Typography>
                  
                  <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                    <CircularProgress
                      variant="determinate"
                      value={parseFloat(summary?.compliance?.complianceRate || '0')}
                      size={120}
                      thickness={8}
                      sx={{
                        color: parseFloat(summary?.compliance?.complianceRate || '0') > 90
                          ? theme.palette.success.main
                          : parseFloat(summary?.compliance?.complianceRate || '0') > 75
                          ? theme.palette.warning.main
                          : theme.palette.error.main,
                      }}
                    />
                    <Box
                      sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: 'absolute',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Stack alignItems="center">
                        <Typography variant="h4" fontWeight={700}>
                          {summary?.compliance?.complianceRate || '0'}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Último mes
                        </Typography>
                      </Stack>
                    </Box>
                  </Box>
                  
                  <Divider sx={{ width: '100%' }} />
                  
                  <Grid container spacing={2}>
                    <Grid size={6}>
                      <Stack alignItems="center">
                        <Typography variant="h6" fontWeight={700} color="success.main">
                          {summary?.compliance?.compliantDays || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Días Cumplidos
                        </Typography>
                      </Stack>
                    </Grid>
                    <Grid size={6}>
                      <Stack alignItems="center">
                        <Typography variant="h6" fontWeight={700} color="error.main">
                          {summary?.compliance?.violationDays || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Violaciones
                        </Typography>
                      </Stack>
                    </Grid>
                  </Grid>
                </Stack>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Violations */}
          {summary?.recentViolations && summary.recentViolations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card>
                <CardContent>
                  <Stack spacing={2}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <WarningIcon color="error" />
                      <Typography variant="h6">Violaciones Recientes</Typography>
                    </Stack>
                    
                    <List dense>
                      {summary.recentViolations.slice(0, 3).map((violation: any, index: number) => (
                        <ListItem key={index} disablePadding>
                          <ListItemText
                            primary={format(parseISO(violation.date), 'dd/MM', { locale: es })}
                            secondary={violation.violations[0]?.message}
                            primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                            secondaryTypographyProps={{ variant: 'caption' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Stack>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Recommendations */}
          {recommendations?.recommendations && recommendations.recommendations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Card>
                <CardContent>
                  <Stack spacing={2}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <TrendingUpIcon color="primary" />
                      <Typography variant="h6">Recomendaciones</Typography>
                    </Stack>
                    
                    <Stack spacing={1}>
                      {recommendations.recommendations.slice(0, 2).map((rec: any, index: number) => (
                        <Alert
                          key={index}
                          severity={rec.priority === 'high' ? 'warning' : 'info'}
                          sx={{ py: 0.5 }}
                        >
                          <AlertTitle sx={{ mb: 0 }}>{rec.title}</AlertTitle>
                          <Typography variant="caption">{rec.description}</Typography>
                        </Alert>
                      ))}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </Stack>
      </Grid>
    </Grid>
  );

  const renderSchedule = () => (
    <Grid container spacing={3}>
      <Grid size={12}>
        <Card>
          <CardContent>
            <Stack spacing={3}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="h6">Horario Semanal</Typography>
                <Stack direction="row" spacing={1}>
                  <Chip
                    label={`${schedule?.summary?.totalHours || 0}h totales`}
                    color="primary"
                    size="small"
                  />
                  <Chip
                    label={`${schedule?.summary?.workDays || 0} días trabajo`}
                    color="default"
                    size="small"
                  />
                </Stack>
              </Stack>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Día</TableCell>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Turno</TableCell>
                      <TableCell>Vehículo</TableCell>
                      <TableCell>Ruta</TableCell>
                      <TableCell align="right">Horas</TableCell>
                      <TableCell align="center">Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {schedule?.schedule?.map((day: any, index: number) => (
                      <TableRow key={index} sx={{ backgroundColor: day.type === 'rest' ? alpha(theme.palette.action.hover, 0.5) : 'transparent' }}>
                        <TableCell>
                          <Typography fontWeight={isToday(parseISO(day.date)) ? 700 : 400}>
                            {day.dayOfWeek}
                          </Typography>
                        </TableCell>
                        <TableCell>{format(parseISO(day.date), 'dd/MM', { locale: es })}</TableCell>
                        <TableCell>
                          {day.shifts[0] ? `${day.shifts[0].startTime} - ${day.shifts[0].endTime}` : '-'}
                        </TableCell>
                        <TableCell>{day.shifts[0]?.vehicleId || '-'}</TableCell>
                        <TableCell>{day.shifts[0]?.route || '-'}</TableCell>
                        <TableCell align="right">
                          {day.totalHours > 0 ? `${day.totalHours}h` : '-'}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={day.type === 'rest' ? 'Descanso' : 'Trabajo'}
                            size="small"
                            color={day.type === 'rest' ? 'default' : 'primary'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderFleetCompliance = () => (
    <Grid container spacing={3}>
      {/* Summary Cards */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Stack spacing={1}>
              <Typography variant="overline" color="text.secondary">
                Total Conductores
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {fleetCompliance?.summary?.totalDrivers || 0}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Stack spacing={1}>
              <Typography variant="overline" color="text.secondary">
                Cumplimiento Promedio
              </Typography>
              <Typography variant="h4" fontWeight={700} color="primary.main">
                {fleetCompliance?.summary?.avgComplianceRate || '0'}%
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Stack spacing={1}>
              <Typography variant="overline" color="text.secondary">
                Conductores Críticos
              </Typography>
              <Typography variant="h4" fontWeight={700} color="error.main">
                {fleetCompliance?.summary?.criticalDrivers || 0}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Stack spacing={1}>
              <Typography variant="overline" color="text.secondary">
                Requieren Atención
              </Typography>
              <Typography variant="h4" fontWeight={700} color="warning.main">
                {fleetCompliance?.summary?.needsAttention?.length || 0}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Drivers Table */}
      <Grid size={12}>
        <Card>
          <CardContent>
            <Stack spacing={3}>
              <Typography variant="h6">Estado de Conductores</Typography>
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Conductor</TableCell>
                      <TableCell align="center">Cumplimiento</TableCell>
                      <TableCell align="center">Violaciones</TableCell>
                      <TableCell align="center">Horas Conducidas</TableCell>
                      <TableCell align="center">Estado</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {fleetCompliance?.drivers?.map((driver: any) => (
                      <TableRow key={driver.driverId}>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                              {driver.name.charAt(0)}
                            </Avatar>
                            <Typography>{driver.name}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                            <LinearProgress
                              variant="determinate"
                              value={parseFloat(driver.complianceRate)}
                              sx={{
                                width: 80,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: alpha(theme.palette.divider, 0.2),
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: parseFloat(driver.complianceRate) > 90
                                    ? theme.palette.success.main
                                    : parseFloat(driver.complianceRate) > 75
                                    ? theme.palette.warning.main
                                    : theme.palette.error.main,
                                },
                              }}
                            />
                            <Typography variant="body2" fontWeight={600}>
                              {driver.complianceRate}%
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={driver.violations}
                            size="small"
                            color={driver.violations === 0 ? 'success' : driver.violations > 3 ? 'error' : 'warning'}
                          />
                        </TableCell>
                        <TableCell align="center">{driver.totalDriving}h</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={driver.status}
                            size="small"
                            color={
                              driver.status === 'excellent' ? 'success' :
                              driver.status === 'good' ? 'primary' :
                              driver.status === 'warning' ? 'warning' : 'error'
                            }
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <Tooltip title="Ver detalles">
                              <IconButton
                                size="small"
                                onClick={() => setSelectedDriver(driver.driverId)}
                              >
                                <AnalyticsIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Generar reporte">
                              <IconButton size="small">
                                <ReportIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Top Performers */}
      {fleetCompliance?.summary?.topPerformers && (
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <TrophyIcon sx={{ color: theme.palette.warning.main }} />
                  <Typography variant="h6">Mejores Conductores</Typography>
                </Stack>
                
                <Stack spacing={2}>
                  {fleetCompliance.summary.topPerformers.map((driver: any, index: number) => (
                    <Stack
                      key={driver.driverId}
                      direction="row"
                      alignItems="center"
                      spacing={2}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: alpha(theme.palette.primary.main, 0.05),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                      }}
                    >
                      <Avatar
                        sx={{
                          bgcolor: index === 0 ? theme.palette.warning.main :
                                  index === 1 ? theme.palette.grey[400] :
                                  theme.palette.warning.dark,
                          color: 'white',
                        }}
                      >
                        {index + 1}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography fontWeight={600}>{driver.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {driver.complianceRate}% cumplimiento
                        </Typography>
                      </Box>
                      <Rating value={5 - index} readOnly size="small" />
                    </Stack>
                  ))}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );

  const renderReports = () => (
    <Grid container spacing={3}>
      <Grid size={12}>
        <Card>
          <CardContent>
            <Stack spacing={3}>
              <Typography variant="h6">Informes de Cumplimiento</Typography>
              
              <Stack direction="row" spacing={2}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Conductor</InputLabel>
                  <Select
                    value={selectedDriver}
                    onChange={(e) => setSelectedDriver(e.target.value)}
                    label="Conductor"
                  >
                    <MenuItem value="current">Yo</MenuItem>
                    <MenuItem value="driver1">Conductor 1</MenuItem>
                    <MenuItem value="driver2">Conductor 2</MenuItem>
                    <MenuItem value="driver3">Conductor 3</MenuItem>
                    <MenuItem value="driver4">Conductor 4</MenuItem>
                  </Select>
                </FormControl>
                
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Período</InputLabel>
                  <Select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    label="Período"
                  >
                    <MenuItem value="week">Semana</MenuItem>
                    <MenuItem value="month">Mes</MenuItem>
                    <MenuItem value="quarter">Trimestre</MenuItem>
                    <MenuItem value="year">Año</MenuItem>
                  </Select>
                </FormControl>
                
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={() => setReportDialogOpen(true)}
                >
                  Generar Informe
                </Button>
              </Stack>

              {/* Monthly Summary Chart */}
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={summary?.compliance?.dailyDetails || []}>
                    <defs>
                      <linearGradient id="colorDriving" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={ACTIVITY_COLORS.driving} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={ACTIVITY_COLORS.driving} stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorWork" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={ACTIVITY_COLORS.other_work} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={ACTIVITY_COLORS.other_work} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => format(parseISO(value), 'dd/MM', { locale: es })}
                      stroke={theme.palette.text.secondary}
                    />
                    <YAxis stroke={theme.palette.text.secondary} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: theme.shape.borderRadius,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="totalDriving"
                      stroke={ACTIVITY_COLORS.driving}
                      fillOpacity={1}
                      fill="url(#colorDriving)"
                      name="Conducción"
                    />
                    <Area
                      type="monotone"
                      dataKey="totalWork"
                      stroke={ACTIVITY_COLORS.other_work}
                      fillOpacity={1}
                      fill="url(#colorWork)"
                      name="Trabajo Total"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>

              {/* Violations Summary */}
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Stack spacing={1}>
                      <WarningIcon sx={{ fontSize: 40, color: theme.palette.error.main, mx: 'auto' }} />
                      <Typography variant="h4" fontWeight={700}>
                        {summary?.compliance?.violations?.drivingTime || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Violaciones Tiempo Conducción
                      </Typography>
                    </Stack>
                  </Paper>
                </Grid>
                
                <Grid size={{ xs: 12, md: 4 }}>
                  <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Stack spacing={1}>
                      <RestIcon sx={{ fontSize: 40, color: theme.palette.warning.main, mx: 'auto' }} />
                      <Typography variant="h4" fontWeight={700}>
                        {summary?.compliance?.violations?.restTime || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Violaciones Tiempo Descanso
                      </Typography>
                    </Stack>
                  </Paper>
                </Grid>
                
                <Grid size={{ xs: 12, md: 4 }}>
                  <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Stack spacing={1}>
                      <BreakIcon sx={{ fontSize: 40, color: theme.palette.info.main, mx: 'auto' }} />
                      <Typography variant="h4" fontWeight={700}>
                        {summary?.compliance?.violations?.breakTime || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Violaciones Pausas
                      </Typography>
                    </Stack>
                  </Paper>
                </Grid>
              </Grid>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Control de Jornadas
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gestión de tiempos de conducción y descanso según normativa europea
        </Typography>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              minWidth: 120,
            },
          }}
        >
          <Tab
            label="Resumen"
            icon={<TimerIcon />}
            iconPosition="start"
          />
          <Tab
            label="Horario"
            icon={<CalendarIcon />}
            iconPosition="start"
          />
          <Tab
            label="Flota"
            icon={<GroupsIcon />}
            iconPosition="start"
          />
          <Tab
            label="Informes"
            icon={<AssessmentIcon />}
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        {renderOverview()}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {renderSchedule()}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {renderFleetCompliance()}
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        {renderReports()}
      </TabPanel>

      {/* Activity Dialog */}
      <Dialog
        open={activityDialogOpen}
        onClose={() => setActivityDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Iniciar Nueva Actividad</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={6}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[8],
                  },
                }}
                onClick={() => handleStartActivity('driving')}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <DrivingIcon sx={{ fontSize: 48, color: ACTIVITY_COLORS.driving, mb: 1 }} />
                  <Typography variant="h6">Conducción</Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid size={6}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[8],
                  },
                }}
                onClick={() => handleStartActivity('other_work')}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <WorkIcon sx={{ fontSize: 48, color: ACTIVITY_COLORS.other_work, mb: 1 }} />
                  <Typography variant="h6">Otro Trabajo</Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid size={6}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[8],
                  },
                }}
                onClick={() => handleStartActivity('break')}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <BreakIcon sx={{ fontSize: 48, color: ACTIVITY_COLORS.break, mb: 1 }} />
                  <Typography variant="h6">Descanso</Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid size={6}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[8],
                  },
                }}
                onClick={() => handleStartActivity('daily_rest')}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <RestIcon sx={{ fontSize: 48, color: ACTIVITY_COLORS.daily_rest, mb: 1 }} />
                  <Typography variant="h6">Descanso Diario</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActivityDialogOpen(false)}>Cancelar</Button>
        </DialogActions>
      </Dialog>

      {/* Report Dialog */}
      <Dialog
        open={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Generar Informe de Cumplimiento</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <Alert severity="info">
              Se generará un informe detallado para el conductor {selectedDriver} del período seleccionado ({selectedPeriod}).
            </Alert>
            
            <Typography variant="body2">
              El informe incluirá:
            </Typography>
            
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <CheckIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="Resumen de cumplimiento normativo" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="Detalle diario de actividades" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="Análisis de violaciones" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="Recomendaciones personalizadas" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="Tendencias y estadísticas" />
              </ListItem>
            </List>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => {
              // Here would go the actual download logic
              setReportDialogOpen(false);
            }}
          >
            Descargar PDF
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkingHours;