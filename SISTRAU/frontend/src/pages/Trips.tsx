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
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  AlertTitle,
  Avatar,
  AvatarGroup,
  Tooltip,
  Badge,
  LinearProgress,
  SpeedDial,
  SpeedDialIcon,
  SpeedDialAction,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Autocomplete,
  InputAdornment,
  FormControlLabel,
  Switch,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  alpha,
  useTheme,
  Zoom,
  Fade,
  Collapse,
  Rating,
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
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import {
  LocalShipping as TruckIcon,
  Route as RouteIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon,
  Person as DriverIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  AccessTime as TimeIcon,
  Speed as SpeedIcon,
  LocalGasStation as FuelIcon,
  AttachMoney as MoneyIcon,
  Map as MapIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Pause as PauseIcon,
  Assessment as ReportIcon,
  QrCode as QrCodeIcon,
  Navigation as NavigationIcon,
  SyncAlt as TransferIcon,
  Inventory as CargoIcon,
  Groups as TeamIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  MoreVert as MoreIcon,
  DirectionsCar as VehicleIcon,
  EventNote as EventIcon,
  AttachFile as AttachmentIcon,
  PhotoCamera as PhotoIcon,
  Mic as VoiceIcon,
  Description as DocumentIcon,
  Security as SecurityIcon,
  WifiTethering as LiveIcon,
  RadioButtonChecked as ActiveIcon,
  PauseCircle as PausedIcon,
  CheckCircleOutline as CompletedIcon,
  ErrorOutline as DelayedIcon,
  Block as CancelledIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, formatDistanceToNow, addHours } from 'date-fns';
import { es } from 'date-fns/locale';
import { tripAPI } from '../services/api/trips.api';

// Types
interface Trip {
  id: string;
  vehicleId: string;
  vehicle: {
    plateNumber: string;
    brand: string;
    model: string;
  };
  driverId: string;
  driver: {
    firstName: string;
    lastName: string;
    licenseNumber: string;
    phone: string;
  };
  route: {
    origin: string;
    destination: string;
    waypoints: string[];
    distance: number;
    estimatedDuration: number;
  };
  cargo: {
    description: string;
    weight: number;
    volume: number;
    value: number;
    dangerousGoods: boolean;
    specialRequirements: string[];
  };
  schedule: {
    departureTime: string;
    estimatedArrival: string;
    actualDeparture?: string;
    actualArrival?: string;
  };
  status: 'scheduled' | 'in_transit' | 'paused' | 'completed' | 'cancelled' | 'delayed';
  checkpoints: {
    id: string;
    location: string;
    arrivedAt: string;
    departedAt?: string;
    notes?: string;
    photos?: string[];
  }[];
  expenses: {
    fuel: number;
    tolls: number;
    maintenance: number;
    other: number;
  };
  documents: {
    id: string;
    type: string;
    name: string;
    url: string;
    uploadedAt: string;
  }[];
  alerts: {
    id: string;
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: string;
    resolved: boolean;
  }[];
  createdAt: string;
  updatedAt: string;
}

// Status configurations
const statusConfig = {
  scheduled: {
    label: 'Programado',
    color: 'info',
    icon: <ScheduleIcon />,
    gradient: 'linear-gradient(135deg, #2196F3 0%, #64B5F6 100%)',
  },
  in_transit: {
    label: 'En Tránsito',
    color: 'primary',
    icon: <TruckIcon />,
    gradient: 'linear-gradient(135deg, #1565C0 0%, #1976D2 100%)',
  },
  paused: {
    label: 'Pausado',
    color: 'warning',
    icon: <PausedIcon />,
    gradient: 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)',
  },
  completed: {
    label: 'Completado',
    color: 'success',
    icon: <CompletedIcon />,
    gradient: 'linear-gradient(135deg, #4CAF50 0%, #81C784 100%)',
  },
  cancelled: {
    label: 'Cancelado',
    color: 'error',
    icon: <CancelledIcon />,
    gradient: 'linear-gradient(135deg, #F44336 0%, #E57373 100%)',
  },
  delayed: {
    label: 'Retrasado',
    color: 'warning',
    icon: <DelayedIcon />,
    gradient: 'linear-gradient(135deg, #FF5722 0%, #FF7043 100%)',
  },
};

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
      id={`trips-tabpanel-${index}`}
      aria-labelledby={`trips-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const Trips: React.FC = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [filters, setFilters] = useState({
    status: '',
    dateRange: 'all',
    vehicleId: '',
    driverId: '',
  });

  // Form data for new trip
  const [formData, setFormData] = useState({
    vehicleId: '',
    driverId: '',
    origin: '',
    destination: '',
    waypoints: [] as string[],
    departureTime: new Date().toISOString(),
    cargoDescription: '',
    cargoWeight: 0,
    cargoVolume: 0,
    cargoValue: 0,
    dangerousGoods: false,
    specialRequirements: [] as string[],
  });

  // Mock data - replace with real API calls
  const mockTrips: Trip[] = [
    {
      id: 'TRIP-001',
      vehicleId: 'VEH-001',
      vehicle: {
        plateNumber: 'ABC-1234',
        brand: 'Mercedes-Benz',
        model: 'Actros',
      },
      driverId: 'DRV-001',
      driver: {
        firstName: 'Juan',
        lastName: 'Pérez',
        licenseNumber: 'LIC-12345',
        phone: '+598 99 123 456',
      },
      route: {
        origin: 'Montevideo',
        destination: 'Salto',
        waypoints: ['Durazno', 'Tacuarembó'],
        distance: 498,
        estimatedDuration: 6.5,
      },
      cargo: {
        description: 'Productos electrónicos',
        weight: 8500,
        volume: 45,
        value: 150000,
        dangerousGoods: false,
        specialRequirements: ['Frágil', 'Mantener seco'],
      },
      schedule: {
        departureTime: new Date().toISOString(),
        estimatedArrival: addHours(new Date(), 7).toISOString(),
        actualDeparture: new Date().toISOString(),
      },
      status: 'in_transit',
      checkpoints: [
        {
          id: 'CHK-001',
          location: 'Montevideo - Terminal',
          arrivedAt: new Date().toISOString(),
          departedAt: addHours(new Date(), 0.5).toISOString(),
          notes: 'Carga completa verificada',
          photos: [],
        },
        {
          id: 'CHK-002',
          location: 'Durazno - Parada técnica',
          arrivedAt: addHours(new Date(), 2).toISOString(),
          notes: 'Pausa de descanso reglamentaria',
        },
      ],
      expenses: {
        fuel: 2500,
        tolls: 450,
        maintenance: 0,
        other: 200,
      },
      documents: [
        {
          id: 'DOC-001',
          type: 'guia',
          name: 'Guía de Carga #12345',
          url: '/docs/guia-12345.pdf',
          uploadedAt: new Date().toISOString(),
        },
      ],
      alerts: [
        {
          id: 'ALERT-001',
          type: 'traffic',
          message: 'Congestión en Ruta 5 km 45',
          severity: 'medium',
          timestamp: addHours(new Date(), 1).toISOString(),
          resolved: false,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    // Add more mock trips...
  ];

  // Stats calculation
  const stats = {
    total: mockTrips.length,
    inTransit: mockTrips.filter(t => t.status === 'in_transit').length,
    completed: mockTrips.filter(t => t.status === 'completed').length,
    delayed: mockTrips.filter(t => t.status === 'delayed').length,
    totalDistance: mockTrips.reduce((acc, t) => acc + t.route.distance, 0),
    avgEfficiency: 85,
  };

  const renderStatCards = () => (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card
            sx={{
              background: statusConfig.in_transit.gradient,
              color: 'white',
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
                  <TruckIcon />
                </Avatar>
                <Box flex={1}>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.inTransit}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Viajes en Tránsito
                  </Typography>
                </Box>
              </Box>
              <LinearProgress
                variant="determinate"
                value={(stats.inTransit / stats.total) * 100}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.common.white, 0.2),
                  '& .MuiLinearProgress-bar': {
                    bgcolor: 'white',
                    borderRadius: 3,
                  },
                }}
              />
            </CardContent>
            <Box
              sx={{
                position: 'absolute',
                top: -20,
                right: -20,
                width: 100,
                height: 100,
                borderRadius: '50%',
                bgcolor: alpha(theme.palette.common.white, 0.1),
              }}
            />
          </Card>
        </motion.div>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card
            sx={{
              background: statusConfig.completed.gradient,
              color: 'white',
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
                  <CheckIcon />
                </Avatar>
                <Box flex={1}>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.completed}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Completados Hoy
                  </Typography>
                </Box>
              </Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <TrendingUpIcon sx={{ fontSize: 20 }} />
                <Typography variant="body2">
                  +15% vs ayer
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </motion.div>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.light} 100%)`,
              color: 'white',
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
                  <RouteIcon />
                </Avatar>
                <Box flex={1}>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.totalDistance.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Kilómetros Totales
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Promedio: {Math.round(stats.totalDistance / stats.total)} km/viaje
              </Typography>
            </CardContent>
          </Card>
        </motion.div>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.light} 100%)`,
              color: 'white',
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
                  <SpeedIcon />
                </Avatar>
                <Box flex={1}>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.avgEfficiency}%
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Eficiencia Promedio
                  </Typography>
                </Box>
              </Box>
              <Rating value={stats.avgEfficiency / 20} readOnly size="small" />
            </CardContent>
          </Card>
        </motion.div>
      </Grid>
    </Grid>
  );

  const renderTripCard = (trip: Trip) => (
    <motion.div
      key={trip.id}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        sx={{
          height: '100%',
          background: alpha(theme.palette.background.paper, 0.9),
          backdropFilter: 'blur(10px)',
          border: '1px solid',
          borderColor: alpha(statusConfig[trip.status].color === 'primary' ? theme.palette.primary.main : theme.palette[statusConfig[trip.status].color as 'info' | 'warning' | 'success' | 'error'].main, 0.2),
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: statusConfig[trip.status].color === 'primary' ? theme.palette.primary.main : theme.palette[statusConfig[trip.status].color as 'info' | 'warning' | 'success' | 'error'].main,
            boxShadow: `0 8px 24px ${alpha(statusConfig[trip.status].color === 'primary' ? theme.palette.primary.main : theme.palette[statusConfig[trip.status].color as 'info' | 'warning' | 'success' | 'error'].main, 0.15)}`,
          },
        }}
      >
        <CardContent>
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h6" fontWeight={700}>
                  {trip.id}
                </Typography>
                <Chip
                  label={statusConfig[trip.status].label}
                  size="small"
                  icon={statusConfig[trip.status].icon}
                  sx={{
                    bgcolor: alpha(statusConfig[trip.status].color === 'primary' ? theme.palette.primary.main : theme.palette[statusConfig[trip.status].color as 'info' | 'warning' | 'success' | 'error'].main, 0.1),
                    color: statusConfig[trip.status].color === 'primary' ? theme.palette.primary.main : theme.palette[statusConfig[trip.status].color as 'info' | 'warning' | 'success' | 'error'].main,
                    fontWeight: 600,
                  }}
                />
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Creado {formatDistanceToNow(new Date(trip.createdAt), { locale: es, addSuffix: true })}
              </Typography>
            </Box>
            {trip.status === 'in_transit' && (
              <Badge
                variant="dot"
                sx={{
                  '& .MuiBadge-badge': {
                    bgcolor: '#4CAF50',
                    animation: 'pulse 2s infinite',
                    '@keyframes pulse': {
                      '0%': { opacity: 1, transform: 'scale(1)' },
                      '50%': { opacity: 0.8, transform: 'scale(1.5)' },
                      '100%': { opacity: 1, transform: 'scale(1)' },
                    },
                  },
                }}
              >
                <LiveIcon color="primary" />
              </Badge>
            )}
          </Stack>

          {/* Route Info */}
          <Box sx={{ mb: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
              <LocationIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {trip.route.origin} → {trip.route.destination}
              </Typography>
            </Stack>
            {trip.route.waypoints.length > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ ml: 3.5 }}>
                Vía: {trip.route.waypoints.join(', ')}
              </Typography>
            )}
            <Stack direction="row" spacing={2} sx={{ mt: 1, ml: 3.5 }}>
              <Chip
                label={`${trip.route.distance} km`}
                size="small"
                icon={<RouteIcon />}
                variant="outlined"
              />
              <Chip
                label={`${trip.route.estimatedDuration}h`}
                size="small"
                icon={<TimeIcon />}
                variant="outlined"
              />
            </Stack>
          </Box>

          {/* Vehicle & Driver */}
          <Stack spacing={1.5} mb={2}>
            <Stack direction="row" spacing={1} alignItems="center">
              <VehicleIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
              <Typography variant="body2">
                {trip.vehicle.brand} {trip.vehicle.model} - {trip.vehicle.plateNumber}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <DriverIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
              <Typography variant="body2">
                {trip.driver.firstName} {trip.driver.lastName}
              </Typography>
              <Chip
                label={trip.driver.phone}
                size="small"
                variant="outlined"
                sx={{ ml: 'auto' }}
              />
            </Stack>
          </Stack>

          {/* Cargo Info */}
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.grey[100], 0.5),
              mb: 2,
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
              <CargoIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
              <Typography variant="body2" fontWeight={500}>
                {trip.cargo.description}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={2}>
              <Typography variant="caption" color="text.secondary">
                {trip.cargo.weight} kg
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {trip.cargo.volume} m³
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ${trip.cargo.value.toLocaleString()}
              </Typography>
            </Stack>
            {trip.cargo.dangerousGoods && (
              <Chip
                label="Mercancía Peligrosa"
                size="small"
                color="error"
                sx={{ mt: 1 }}
              />
            )}
          </Box>

          {/* Schedule Progress */}
          {trip.status === 'in_transit' && (
            <Box sx={{ mb: 2 }}>
              <Stack direction="row" justifyContent="space-between" mb={1}>
                <Typography variant="caption" color="text.secondary">
                  Progreso del viaje
                </Typography>
                <Typography variant="caption" fontWeight={600}>
                  65%
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={65}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 4,
                    background: statusConfig[trip.status].gradient,
                  },
                }}
              />
            </Box>
          )}

          {/* Alerts */}
          {trip.alerts.filter(a => !a.resolved).length > 0 && (
            <Alert
              severity="warning"
              sx={{ mb: 2, py: 0.5 }}
              icon={<WarningIcon fontSize="small" />}
            >
              <Typography variant="caption">
                {trip.alerts.filter(a => !a.resolved).length} alertas activas
              </Typography>
            </Alert>
          )}
        </CardContent>

        <CardActions sx={{ px: 2, pb: 2 }}>
          <Button
            size="small"
            startIcon={<ViewIcon />}
            onClick={() => {
              setSelectedTrip(trip);
              setViewDialogOpen(true);
            }}
          >
            Ver Detalles
          </Button>
          <Button
            size="small"
            startIcon={<MapIcon />}
            sx={{ ml: 'auto' }}
          >
            Rastrear
          </Button>
          <IconButton size="small">
            <MoreIcon />
          </IconButton>
        </CardActions>
      </Card>
    </motion.div>
  );

  const renderTripTimeline = (trip: Trip) => (
    <Timeline position="alternate">
      <TimelineItem>
        <TimelineOppositeContent color="text.secondary">
          {format(new Date(trip.schedule.departureTime), 'dd/MM HH:mm')}
        </TimelineOppositeContent>
        <TimelineSeparator>
          <TimelineDot color="primary">
            <StartIcon />
          </TimelineDot>
          <TimelineConnector />
        </TimelineSeparator>
        <TimelineContent>
          <Typography variant="subtitle2" fontWeight={600}>
            Inicio del Viaje
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {trip.route.origin}
          </Typography>
        </TimelineContent>
      </TimelineItem>

      {trip.checkpoints.map((checkpoint, index) => (
        <TimelineItem key={checkpoint.id}>
          <TimelineOppositeContent color="text.secondary">
            {format(new Date(checkpoint.arrivedAt), 'dd/MM HH:mm')}
          </TimelineOppositeContent>
          <TimelineSeparator>
            <TimelineDot color="info">
              <LocationIcon />
            </TimelineDot>
            {index < trip.checkpoints.length - 1 && <TimelineConnector />}
          </TimelineSeparator>
          <TimelineContent>
            <Typography variant="subtitle2" fontWeight={600}>
              {checkpoint.location}
            </Typography>
            {checkpoint.notes && (
              <Typography variant="body2" color="text.secondary">
                {checkpoint.notes}
              </Typography>
            )}
          </TimelineContent>
        </TimelineItem>
      ))}

      <TimelineItem>
        <TimelineOppositeContent color="text.secondary">
          {format(new Date(trip.schedule.estimatedArrival), 'dd/MM HH:mm')}
        </TimelineOppositeContent>
        <TimelineSeparator>
          <TimelineDot
            color={trip.status === 'completed' ? 'success' : 'grey'}
            variant={trip.status === 'completed' ? 'filled' : 'outlined'}
          >
            <CheckIcon />
          </TimelineDot>
        </TimelineSeparator>
        <TimelineContent>
          <Typography variant="subtitle2" fontWeight={600}>
            {trip.status === 'completed' ? 'Viaje Completado' : 'Destino (Estimado)'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {trip.route.destination}
          </Typography>
        </TimelineContent>
      </TimelineItem>
    </Timeline>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Gestión de Viajes
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Monitorea y gestiona todos los viajes en tiempo real
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
            >
              Filtros
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
              sx={{
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                '&:hover': {
                  background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                },
              }}
            >
              Nuevo Viaje
            </Button>
          </Stack>
        </Stack>
      </motion.div>

      {/* Stats Cards */}
      {renderStatCards()}

      {/* Tabs */}
      <Paper
        sx={{
          mb: 3,
          background: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(10px)',
        }}
      >
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
          <Tab
            label="Todos"
            icon={<RouteIcon />}
            iconPosition="start"
          />
          <Tab
            label="En Tránsito"
            icon={<TruckIcon />}
            iconPosition="start"
          />
          <Tab
            label="Programados"
            icon={<ScheduleIcon />}
            iconPosition="start"
          />
          <Tab
            label="Completados"
            icon={<CheckIcon />}
            iconPosition="start"
          />
          <Tab
            label="Alertas"
            icon={<WarningIcon />}
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Trip Cards Grid */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {mockTrips.map((trip) => (
            <Grid key={trip.id} size={{ xs: 12, md: 6, lg: 4 }}>
              {renderTripCard(trip)}
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* View Trip Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h6" fontWeight={600}>
                Detalles del Viaje {selectedTrip?.id}
              </Typography>
              <Chip
                label={selectedTrip ? statusConfig[selectedTrip.status].label : ''}
                size="small"
                sx={{ mt: 1 }}
              />
            </Box>
            <Stack direction="row" spacing={1}>
              <IconButton size="small">
                <PrintIcon />
              </IconButton>
              <IconButton size="small">
                <ShareIcon />
              </IconButton>
              <IconButton size="small" onClick={() => setViewDialogOpen(false)}>
                <CancelIcon />
              </IconButton>
            </Stack>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {selectedTrip && (
            <Box>
              {/* Trip Timeline */}
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Línea de Tiempo
              </Typography>
              {renderTripTimeline(selectedTrip)}

              {/* Expenses */}
              <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mt: 3 }}>
                Gastos del Viaje
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell>Combustible</TableCell>
                      <TableCell align="right">${selectedTrip.expenses.fuel}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Peajes</TableCell>
                      <TableCell align="right">${selectedTrip.expenses.tolls}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Mantenimiento</TableCell>
                      <TableCell align="right">${selectedTrip.expenses.maintenance}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Otros</TableCell>
                      <TableCell align="right">${selectedTrip.expenses.other}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><strong>Total</strong></TableCell>
                      <TableCell align="right">
                        <strong>
                          ${Object.values(selectedTrip.expenses).reduce((a, b) => a + b, 0)}
                        </strong>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>
            Cerrar
          </Button>
          <Button variant="contained" startIcon={<MapIcon />}>
            Ver en Mapa
          </Button>
        </DialogActions>
      </Dialog>

      {/* Speed Dial Actions */}
      <SpeedDial
        ariaLabel="Trip Actions"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        icon={<SpeedDialIcon />}
      >
        <SpeedDialAction
          icon={<MapIcon />}
          tooltipTitle="Mapa en Vivo"
          onClick={() => {}}
        />
        <SpeedDialAction
          icon={<ReportIcon />}
          tooltipTitle="Reportes"
          onClick={() => {}}
        />
        <SpeedDialAction
          icon={<DownloadIcon />}
          tooltipTitle="Exportar"
          onClick={() => {}}
        />
      </SpeedDial>
    </Box>
  );
};

export default Trips;