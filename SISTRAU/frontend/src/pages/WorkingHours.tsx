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
  SpeedDial,
  SpeedDialIcon,
  SpeedDialAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import {
  AccessTime as ClockIcon,
  DirectionsCar as DrivingIcon,
  Hotel as RestIcon,
  Work as WorkIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CalendarMonth as CalendarIcon,
  Assessment as ReportIcon,
  Notifications as AlertIcon,
  Groups as FleetIcon,
  Schedule as ScheduleIcon,
  AutoAwesome as AIIcon,
  ExpandMore as ExpandMoreIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  Settings as SettingsIcon,
  Psychology as PredictIcon,
  LocalFireDepartment as UrgentIcon,
  Shield as ComplianceIcon,
  School as TrainingIcon,
  Route as RouteIcon,
  Weekend as WeekendIcon,
  NightsStay as NightIcon,
  WbSunny as DayIcon,
  Coffee as BreakIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workingHoursAPI } from '../services/api';
import { format, startOfWeek, endOfWeek, addDays, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAppSelector } from '../hooks/redux';

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
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const WorkingHours: React.FC = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { user } = useAppSelector((state) => state.auth);
  const [tabValue, setTabValue] = useState(0);
  const [selectedDriver, setSelectedDriver] = useState(user?.role === 'driver' ? 'current' : '');
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  });
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showSimulationDialog, setShowSimulationDialog] = useState(false);

  // Queries
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['workingHoursSummary', selectedDriver, dateRange],
    queryFn: () => workingHoursAPI.getSummary(selectedDriver || 'current', dateRange.start, dateRange.end),
    enabled: !!selectedDriver,
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['workingHoursAlerts', selectedDriver],
    queryFn: () => workingHoursAPI.getAlerts(selectedDriver || 'current'),
    enabled: !!selectedDriver,
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: fleetCompliance, isLoading: fleetLoading } = useQuery({
    queryKey: ['fleetCompliance', dateRange],
    queryFn: () => workingHoursAPI.getFleetCompliance({ startDate: dateRange.start, endDate: dateRange.end }),
    enabled: user?.role !== 'driver',
  });

  const { data: recommendations } = useQuery({
    queryKey: ['workingHoursRecommendations', selectedDriver],
    queryFn: () => workingHoursAPI.getRecommendations(selectedDriver || 'current'),
    enabled: !!selectedDriver,
  });

  // Mock data for charts
  const weeklyData = [
    { day: 'Lun', driving: 8.5, work: 1.5, rest: 11, available: 3 },
    { day: 'Mar', driving: 9, work: 1, rest: 10.5, available: 3.5 },
    { day: 'Mié', driving: 7.5, work: 2, rest: 12, available: 2.5 },
    { day: 'Jue', driving: 8, work: 1.5, rest: 11.5, available: 3 },
    { day: 'Vie', driving: 9.5, work: 0.5, rest: 10, available: 4 },
    { day: 'Sáb', driving: 0, work: 0, rest: 24, available: 0 },
    { day: 'Dom', driving: 0, work: 0, rest: 24, available: 0 },
  ];

  const complianceData = [
    { subject: 'Conducción', A: 85, fullMark: 100 },
    { subject: 'Descanso', A: 92, fullMark: 100 },
    { subject: 'Pausas', A: 88, fullMark: 100 },
    { subject: 'Semanal', A: 90, fullMark: 100 },
    { subject: 'Bimensual', A: 95, fullMark: 100 },
  ];

  const activityColors = {
    driving: theme.palette.primary.main,
    work: theme.palette.warning.main,
    rest: theme.palette.success.main,
    available: theme.palette.info.main,
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return theme.palette.success.main;
    if (score >= 70) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <ErrorIcon color="error" />;
      case 'high':
        return <WarningIcon color="warning" />;
      case 'medium':
        return <InfoIcon color="info" />;
      default:
        return <CheckIcon color="success" />;
    }
  };

  const renderSummaryCards = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={3}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              color: 'white',
              height: '100%',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.common.white, 0.2),
                    backdropFilter: 'blur(10px)',
                    mr: 2,
                  }}
                >
                  <DrivingIcon />
                </Avatar>
                <Typography variant="h6">Conducción</Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold">
                {summary?.totals.driving.toFixed(1) || '0'}h
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 1 }}>
                de {56}h semanales permitidas
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(summary?.totals.driving / 56) * 100 || 0}
                sx={{
                  mt: 2,
                  height: 8,
                  borderRadius: 4,
                  bgcolor: alpha(theme.palette.common.white, 0.2),
                  '& .MuiLinearProgress-bar': {
                    bgcolor: 'white',
                    borderRadius: 4,
                  },
                }}
              />
            </CardContent>
          </Card>
        </motion.div>
      </Grid>

      <Grid item xs={12} md={3}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
              color: 'white',
              height: '100%',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.common.white, 0.2),
                    backdropFilter: 'blur(10px)',
                    mr: 2,
                  }}
                >
                  <RestIcon />
                </Avatar>
                <Typography variant="h6">Descanso</Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold">
                {summary?.totals.rest.toFixed(1) || '0'}h
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 1 }}>
                Promedio diario: {((summary?.totals.rest || 0) / 7).toFixed(1)}h
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                <CheckIcon sx={{ mr: 1 }} />
                <Typography variant="body2">Cumplimiento óptimo</Typography>
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      </Grid>

      <Grid item xs={12} md={3}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
              color: 'white',
              height: '100%',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.common.white, 0.2),
                    backdropFilter: 'blur(10px)',
                    mr: 2,
                  }}
                >
                  <AlertIcon />
                </Avatar>
                <Typography variant="h6">Alertas</Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold">
                {alerts?.activeAlerts || 0}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 1 }}>
                {alerts?.alerts?.filter(a => a.severity === 'critical').length || 0} críticas
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                {alerts?.alerts?.slice(0, 3).map((alert, index) => (
                  <Box key={index}>{getSeverityIcon(alert.severity)}</Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </motion.div>
      </Grid>

      <Grid item xs={12} md={3}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
              color: 'white',
              height: '100%',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.common.white, 0.2),
                    backdropFilter: 'blur(10px)',
                    mr: 2,
                  }}
                >
                  <ComplianceIcon />
                </Avatar>
                <Typography variant="h6">Cumplimiento</Typography>
              </Box>
              <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress
                  variant="determinate"
                  value={summary?.complianceScore || 0}
                  size={80}
                  thickness={8}
                  sx={{
                    color: 'white',
                    '& .MuiCircularProgress-circle': {
                      strokeLinecap: 'round',
                    },
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
                  <Typography variant="h5" component="div" fontWeight="bold">
                    {summary?.complianceScore || 0}%
                  </Typography>
                </Box>
              </Box>
              <Rating
                value={(summary?.complianceScore || 0) / 20}
                readOnly
                sx={{ mt: 2 }}
              />
            </CardContent>
          </Card>
        </motion.div>
      </Grid>
    </Grid>
  );

  const renderAlerts = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Paper
        sx={{
          p: 3,
          background: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <AlertIcon sx={{ mr: 1 }} />
          Alertas Activas
        </Typography>

        {alertsLoading ? (
          <Stack spacing={2}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
            ))}
          </Stack>
        ) : (
          <Stack spacing={2}>
            <AnimatePresence>
              {alerts?.alerts?.map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Alert
                    severity={
                      alert.severity === 'critical' ? 'error' :
                      alert.severity === 'high' ? 'warning' : 'info'
                    }
                    icon={getSeverityIcon(alert.severity)}
                    action={
                      <Button size="small" variant="outlined">
                        Resolver
                      </Button>
                    }
                    sx={{
                      '& .MuiAlert-icon': {
                        fontSize: 28,
                      },
                    }}
                  >
                    <AlertTitle>{alert.message}</AlertTitle>
                    <Typography variant="body2" color="text.secondary">
                      {alert.action}
                    </Typography>
                    {alert.remainingTime !== undefined && (
                      <Chip
                        label={`${alert.remainingTime.toFixed(1)}h restantes`}
                        size="small"
                        color="warning"
                        sx={{ mt: 1 }}
                      />
                    )}
                  </Alert>
                </motion.div>
              ))}
            </AnimatePresence>

            {(!alerts?.alerts || alerts.alerts.length === 0) && (
              <Alert severity="success" icon={<CheckIcon />}>
                No hay alertas activas. ¡Excelente cumplimiento!
              </Alert>
            )}
          </Stack>
        )}
      </Paper>
    </motion.div>
  );

  const renderActivityChart = () => (
    <Paper
      sx={{
        p: 3,
        background: alpha(theme.palette.background.paper, 0.8),
        backdropFilter: 'blur(10px)',
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
      }}
    >
      <Typography variant="h6" gutterBottom>
        Actividad Semanal
      </Typography>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={weeklyData}>
          <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
          <XAxis dataKey="day" />
          <YAxis />
          <RechartsTooltip
            contentStyle={{
              backgroundColor: alpha(theme.palette.background.paper, 0.95),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              borderRadius: 8,
            }}
          />
          <Legend />
          <Bar dataKey="driving" stackId="a" fill={activityColors.driving} name="Conducción" />
          <Bar dataKey="work" stackId="a" fill={activityColors.work} name="Trabajo" />
          <Bar dataKey="rest" stackId="a" fill={activityColors.rest} name="Descanso" />
          <Bar dataKey="available" stackId="a" fill={activityColors.available} name="Disponible" />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );

  const renderComplianceRadar = () => (
    <Paper
      sx={{
        p: 3,
        background: alpha(theme.palette.background.paper, 0.8),
        backdropFilter: 'blur(10px)',
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
      }}
    >
      <Typography variant="h6" gutterBottom>
        Análisis de Cumplimiento
      </Typography>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={complianceData}>
          <PolarGrid stroke={alpha(theme.palette.divider, 0.3)} />
          <PolarAngleAxis dataKey="subject" />
          <PolarRadiusAxis angle={90} domain={[0, 100]} />
          <Radar
            name="Cumplimiento"
            dataKey="A"
            stroke={theme.palette.primary.main}
            fill={theme.palette.primary.main}
            fillOpacity={0.6}
          />
        </RadarChart>
      </ResponsiveContainer>
    </Paper>
  );

  const renderRecommendations = () => (
    <Paper
      sx={{
        p: 3,
        background: alpha(theme.palette.background.paper, 0.8),
        backdropFilter: 'blur(10px)',
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <AIIcon sx={{ mr: 1 }} />
        Recomendaciones Inteligentes
      </Typography>

      <Stack spacing={2}>
        {recommendations?.recommendations?.ai && (
          <>
            {/* Recomendaciones inmediatas */}
            {recommendations.recommendations.ai.immediate?.length > 0 && (
              <Accordion
                defaultExpanded
                sx={{
                  bgcolor: alpha(theme.palette.error.main, 0.05),
                  border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <UrgentIcon color="error" sx={{ mr: 1 }} />
                    <Typography>Acción Inmediata</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <List>
                    {recommendations.recommendations.ai.immediate.map((rec, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <Avatar sx={{ bgcolor: theme.palette.error.main, width: 32, height: 32 }}>
                            {index + 1}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={rec.message}
                          secondary={rec.benefit}
                        />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Recomendaciones a corto plazo */}
            {recommendations.recommendations.ai.shortTerm?.length > 0 && (
              <Accordion
                sx={{
                  bgcolor: alpha(theme.palette.warning.main, 0.05),
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ScheduleIcon color="warning" sx={{ mr: 1 }} />
                    <Typography>Corto Plazo</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <List>
                    {recommendations.recommendations.ai.shortTerm.map((rec, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <Avatar sx={{ bgcolor: theme.palette.warning.main, width: 32, height: 32 }}>
                            {index + 1}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={rec.message}
                          secondary={rec.benefit}
                        />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Recomendaciones a largo plazo */}
            {recommendations.recommendations.ai.longTerm?.length > 0 && (
              <Accordion
                sx={{
                  bgcolor: alpha(theme.palette.info.main, 0.05),
                  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TrendingUpIcon color="info" sx={{ mr: 1 }} />
                    <Typography>Largo Plazo</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <List>
                    {recommendations.recommendations.ai.longTerm.map((rec, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <Avatar sx={{ bgcolor: theme.palette.info.main, width: 32, height: 32 }}>
                            {index + 1}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={rec.message}
                          secondary={rec.benefit}
                        />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            )}
          </>
        )}
      </Stack>
    </Paper>
  );

  const renderFleetCompliance = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Grid container spacing={3}>
        {/* Fleet Summary Cards */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <Card sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Total Conductores
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {fleetCompliance?.summary.totalDrivers || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card sx={{ bgcolor: alpha(theme.palette.success.main, 0.1) }}>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Conductores Conformes
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {fleetCompliance?.summary.compliantDrivers || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1) }}>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    En Advertencia
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {fleetCompliance?.summary.warningDrivers || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card sx={{ bgcolor: alpha(theme.palette.error.main, 0.1) }}>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>
                    Con Violaciones
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="error.main">
                    {fleetCompliance?.summary.violationDrivers || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Driver Breakdown Table */}
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 3,
              background: alpha(theme.palette.background.paper, 0.8),
              backdropFilter: 'blur(10px)',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Detalle por Conductor
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Conductor</TableCell>
                    <TableCell align="center">Puntuación</TableCell>
                    <TableCell align="center">Violaciones</TableCell>
                    <TableCell align="center">Estado</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fleetCompliance?.driverBreakdown?.map((driver) => (
                    <TableRow key={driver.driverId}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 2 }}>{driver.name.charAt(0)}</Avatar>
                          {driver.name}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={`${driver.complianceScore}%`}
                          color={
                            driver.complianceScore >= 90 ? 'success' :
                            driver.complianceScore >= 70 ? 'warning' : 'error'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Badge badgeContent={driver.violations} color="error">
                          <WarningIcon color={driver.violations > 0 ? 'error' : 'disabled'} />
                        </Badge>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={driver.status}
                          color={
                            driver.status === 'compliant' ? 'success' :
                            driver.status === 'warning' ? 'warning' : 'error'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <IconButton size="small" color="primary">
                            <ReportIcon />
                          </IconButton>
                          <IconButton size="small" color="primary">
                            <ScheduleIcon />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Fleet Trends */}
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 3,
              background: alpha(theme.palette.background.paper, 0.8),
              backdropFilter: 'blur(10px)',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Tendencias de la Flota
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <TrendingUpIcon color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="Mejora en Cumplimiento"
                  secondary={fleetCompliance?.trends?.complianceImprovement || '+0%'}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <TrendingDownIcon color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="Reducción de Violaciones"
                  secondary={fleetCompliance?.trends?.violationReduction || '-0%'}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <ClockIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Promedio Horas Conducción"
                  secondary={`${fleetCompliance?.trends?.averageDrivingHours || 0} horas/día`}
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Fleet Recommendations */}
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 3,
              background: alpha(theme.palette.background.paper, 0.8),
              backdropFilter: 'blur(10px)',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Recomendaciones para la Flota
            </Typography>
            <Stack spacing={2}>
              {fleetCompliance?.recommendations?.map((rec, index) => (
                <Alert
                  key={index}
                  severity={rec.priority === 'high' ? 'error' : 'warning'}
                  icon={
                    rec.category === 'training' ? <TrainingIcon /> :
                    rec.category === 'scheduling' ? <ScheduleIcon /> :
                    <InfoIcon />
                  }
                >
                  <AlertTitle>{rec.message}</AlertTitle>
                  Afecta a {rec.affectedDrivers} conductores
                </Alert>
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </motion.div>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 'bold',
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Control de Jornadas Laborales
        </Typography>

        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            sx={{
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              '&:hover': {
                background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
              },
            }}
          >
            Exportar Informe
          </Button>
          <Button
            variant="outlined"
            startIcon={<ScheduleIcon />}
            onClick={() => setShowScheduleDialog(true)}
          >
            Programar Turnos
          </Button>
        </Stack>
      </Box>

      {/* Summary Cards */}
      {renderSummaryCards()}

      {/* Tabs */}
      <Box sx={{ mt: 4 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              minWidth: 120,
            },
          }}
        >
          <Tab label="Resumen" icon={<DrivingIcon />} iconPosition="start" />
          <Tab label="Alertas" icon={<AlertIcon />} iconPosition="start" />
          <Tab label="Análisis" icon={<ChartIcon />} iconPosition="start" />
          <Tab label="Flota" icon={<FleetIcon />} iconPosition="start" disabled={user?.role === 'driver'} />
          <Tab label="Recomendaciones" icon={<AIIcon />} iconPosition="start" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              {renderActivityChart()}
            </Grid>
            <Grid item xs={12} md={4}>
              {renderComplianceRadar()}
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {renderAlerts()}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper
                sx={{
                  p: 3,
                  background: alpha(theme.palette.background.paper, 0.8),
                  backdropFilter: 'blur(10px)',
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Análisis Detallado de Cumplimiento
                </Typography>
                <Timeline position="alternate">
                  {summary?.dailyBreakdown?.slice(0, 7).map((day, index) => (
                    <TimelineItem key={index}>
                      <TimelineOppositeContent color="text.secondary">
                        {format(new Date(day.date), 'dd MMM', { locale: es })}
                      </TimelineOppositeContent>
                      <TimelineSeparator>
                        <TimelineDot
                          color={
                            day.compliance === 'compliant' ? 'success' :
                            day.compliance === 'warning' ? 'warning' : 'error'
                          }
                        >
                          {day.compliance === 'compliant' ? <CheckIcon /> :
                           day.compliance === 'warning' ? <WarningIcon /> : <ErrorIcon />}
                        </TimelineDot>
                        {index < 6 && <TimelineConnector />}
                      </TimelineSeparator>
                      <TimelineContent>
                        <Card sx={{ p: 2 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {day.totals.driving.toFixed(1)}h conducción
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {day.totals.rest.toFixed(1)}h descanso
                          </Typography>
                          {day.violations.length > 0 && (
                            <Chip
                              label={`${day.violations.length} violaciones`}
                              size="small"
                              color="error"
                              sx={{ mt: 1 }}
                            />
                          )}
                        </Card>
                      </TimelineContent>
                    </TimelineItem>
                  ))}
                </Timeline>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          {renderFleetCompliance()}
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          {renderRecommendations()}
        </TabPanel>
      </Box>

      {/* Speed Dial Actions */}
      <SpeedDial
        ariaLabel="Working Hours Actions"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        icon={<SpeedDialIcon />}
      >
        <SpeedDialAction
          icon={<PredictIcon />}
          tooltipTitle="Simular Horarios"
          onClick={() => setShowSimulationDialog(true)}
        />
        <SpeedDialAction
          icon={<ReportIcon />}
          tooltipTitle="Generar Informe"
        />
        <SpeedDialAction
          icon={<ShareIcon />}
          tooltipTitle="Compartir"
        />
      </SpeedDial>
    </Box>
  );
};

export default WorkingHours;