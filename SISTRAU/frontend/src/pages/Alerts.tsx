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
  TextField,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  Divider,
  Avatar,
  Tooltip,
  Badge,
  LinearProgress,
  useTheme,
  alpha,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Drawer,
  Fab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  AppBar,
  Toolbar,
  Alert as MuiAlert,
  AlertTitle,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as CheckIcon,
  Speed as SpeedIcon,
  LocationOn as LocationIcon,
  DirectionsCar as VehicleIcon,
  Person as DriverIcon,
  Battery20 as BatteryIcon,
  SignalCellular4Bar as SignalIcon,
  Thermostat as TemperatureIcon,
  LocalGasStation as FuelIcon,
  Build as MaintenanceIcon,
  Security as SecurityIcon,
  Schedule as TimeIcon,
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  NotificationsOff as NotificationsOffIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Settings as SettingsIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Check as CheckMarkIcon,
  Clear as DismissIcon,
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Assessment as StatsIcon,
  Timeline as TrendIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { alertsAPI, Alert, AlertRule, AlertFilters, AlertStats } from '../services/api/alerts.api';

// Alert type configurations
const alertTypeConfig = {
  speed: { icon: SpeedIcon, color: '#f44336', label: 'Velocidad' },
  geofence: { icon: LocationIcon, color: '#ff9800', label: 'Geocerca' },
  route: { icon: LocationIcon, color: '#2196f3', label: 'Ruta' },
  stop: { icon: VehicleIcon, color: '#9c27b0', label: 'Parada' },
  engine: { icon: VehicleIcon, color: '#e91e63', label: 'Motor' },
  battery: { icon: BatteryIcon, color: '#ff5722', label: 'Batería' },
  signal: { icon: SignalIcon, color: '#607d8b', label: 'Señal' },
  maintenance: { icon: MaintenanceIcon, color: '#795548', label: 'Mantenimiento' },
  driver: { icon: DriverIcon, color: '#009688', label: 'Conductor' },
  security: { icon: SecurityIcon, color: '#f44336', label: 'Seguridad' },
  fuel: { icon: FuelIcon, color: '#4caf50', label: 'Combustible' },
  temperature: { icon: TemperatureIcon, color: '#ff9800', label: 'Temperatura' },
};

const severityConfig = {
  low: { color: '#4caf50', label: 'Baja', priority: 1 },
  medium: { color: '#ff9800', label: 'Media', priority: 2 },
  high: { color: '#f44336', label: 'Alta', priority: 3 },
  critical: { color: '#d32f2f', label: 'Crítica', priority: 4 },
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`alerts-tabpanel-${index}`}
      aria-labelledby={`alerts-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const Alerts: React.FC = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();

  // State
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);
  const [filters, setFilters] = useState<AlertFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<AlertRule | null>(null);

  // Mock data for development
  const mockAlerts: Alert[] = [
    {
      id: 'alert-001',
      type: 'speed',
      severity: 'high',
      status: 'active',
      title: 'Exceso de velocidad',
      message: 'Vehículo ABC-1234 excedió el límite de velocidad',
      description: 'El vehículo ha superado los 120 km/h en zona de 80 km/h',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      vehicleId: 'VEH-001',
      vehiclePlate: 'ABC-1234',
      driverId: 'DRV-001',
      driverName: 'Juan Pérez',
      location: {
        lat: -34.9011,
        lng: -56.1645,
        address: 'Av. 18 de Julio, Montevideo'
      },
      metadata: {
        speed: 125,
        speedLimit: 80
      },
      escalationLevel: 1
    },
    {
      id: 'alert-002',
      type: 'battery',
      severity: 'medium',
      status: 'acknowledged',
      title: 'Batería baja',
      message: 'Batería del dispositivo GPS al 15%',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      vehicleId: 'VEH-002',
      vehiclePlate: 'XYZ-5678',
      driverId: 'DRV-002',
      driverName: 'María González',
      metadata: {
        batteryLevel: 15
      },
      acknowledgedBy: 'user-001',
      acknowledgedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString()
    },
    {
      id: 'alert-003',
      type: 'geofence',
      severity: 'critical',
      status: 'active',
      title: 'Violación de geocerca',
      message: 'Vehículo DEF-9012 salió de zona autorizada',
      timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      vehicleId: 'VEH-003',
      vehiclePlate: 'DEF-9012',
      driverId: 'DRV-003',
      driverName: 'Carlos Rodriguez',
      location: {
        lat: -34.8854,
        lng: -56.1953,
        address: 'Zona Industrial, Montevideo'
      },
      metadata: {
        geofenceName: 'Zona Restringida Centro'
      },
      escalationLevel: 2
    },
    {
      id: 'alert-004',
      type: 'maintenance',
      severity: 'medium',
      status: 'active',
      title: 'Mantenimiento pendiente',
      message: 'Vehículo requiere mantenimiento preventivo',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      vehicleId: 'VEH-001',
      vehiclePlate: 'ABC-1234',
      metadata: {
        mileage: 15000,
        lastMaintenance: '2024-01-15'
      }
    },
    {
      id: 'alert-005',
      type: 'fuel',
      severity: 'low',
      status: 'resolved',
      title: 'Combustible bajo',
      message: 'Nivel de combustible inferior al 20%',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      vehicleId: 'VEH-002',
      vehiclePlate: 'XYZ-5678',
      driverId: 'DRV-002',
      driverName: 'María González',
      metadata: {
        fuelLevel: 18
      },
      resolvedBy: 'user-002',
      resolvedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
    }
  ];

  const mockStats: AlertStats = {
    total: 156,
    active: 23,
    critical: 5,
    high: 8,
    medium: 15,
    low: 128,
    acknowledged: 45,
    resolved: 88,
    byType: {
      speed: 45,
      geofence: 23,
      route: 12,
      stop: 8,
      engine: 15,
      battery: 25,
      signal: 10,
      maintenance: 8,
      driver: 5,
      security: 3,
      fuel: 1,
      temperature: 1
    },
    trends: [
      { period: '00:00', count: 12, change: 5 },
      { period: '06:00', count: 8, change: -2 },
      { period: '12:00', count: 15, change: 3 },
      { period: '18:00', count: 23, change: 8 }
    ]
  };

  // Queries
  const { data: alertsResponse = { data: mockAlerts }, isLoading } = useQuery({
    queryKey: ['alerts', filters],
    queryFn: async () => {
      try {
        const response = await alertsAPI.getAlerts(filters);
        // Handle paginated response or direct array
        return response.data ? response : { data: response };
      } catch (error) {
        return { data: mockAlerts };
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const alerts = alertsResponse.data || mockAlerts;

  const { data: alertStats = mockStats } = useQuery({
    queryKey: ['alertStats'],
    queryFn: async () => {
      try {
        return await alertsAPI.getAlertStats();
      } catch (error) {
        return mockStats;
      }
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Mutations
  const acknowledgeMutation = useMutation({
    mutationFn: alertsAPI.acknowledgeAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, resolution }: { id: string; resolution: string }) =>
      alertsAPI.resolveAlert(id, resolution),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  const dismissMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      alertsAPI.dismissAlert(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  // Filter alerts based on search term
  const filteredAlerts = (alerts || []).filter(alert =>
    alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alert.vehiclePlate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alert.driverName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group alerts by status
  const activeAlerts = filteredAlerts.filter(alert => alert.status === 'active');
  const acknowledgedAlerts = filteredAlerts.filter(alert => alert.status === 'acknowledged');
  const resolvedAlerts = filteredAlerts.filter(alert => alert.status === 'resolved');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleSelectAlert = (alertId: string) => {
    setSelectedAlerts(prev =>
      prev.includes(alertId)
        ? prev.filter(id => id !== alertId)
        : [...prev, alertId]
    );
  };

  const handleSelectAllAlerts = (alertList: Alert[]) => {
    const alertIds = alertList.map(alert => alert.id);
    const allSelected = alertIds.every(id => selectedAlerts.includes(id));
    
    if (allSelected) {
      setSelectedAlerts(prev => prev.filter(id => !alertIds.includes(id)));
    } else {
      setSelectedAlerts(prev => [...new Set([...prev, ...alertIds])]);
    }
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    acknowledgeMutation.mutate(alertId);
  };

  const handleResolveAlert = (alertId: string, resolution: string) => {
    resolveMutation.mutate({ id: alertId, resolution });
  };

  const handleDismissAlert = (alertId: string, reason: string) => {
    dismissMutation.mutate({ id: alertId, reason });
  };

  const handleExportAlerts = () => {
    const data = filteredAlerts.map(alert => ({
      fecha: format(new Date(alert.timestamp), 'dd/MM/yyyy HH:mm'),
      tipo: alertTypeConfig[alert.type]?.label || alert.type,
      severidad: severityConfig[alert.severity]?.label || alert.severity,
      estado: alert.status,
      titulo: alert.title,
      mensaje: alert.message,
      vehiculo: alert.vehiclePlate || '',
      conductor: alert.driverName || '',
    }));

    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).map(val => `"${val}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alertas_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
    a.click();
  };

  const renderAlertCard = (alert: Alert) => {
    const typeConfig = alertTypeConfig[alert.type];
    const severityConfig_ = severityConfig[alert.severity];
    const TypeIcon = typeConfig?.icon || WarningIcon;

    return (
      <motion.div
        key={alert.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          sx={{
            mb: 2,
            border: 1,
            borderColor: selectedAlerts.includes(alert.id) ? 'primary.main' : 'divider',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: 4,
            },
          }}
        >
          <CardContent sx={{ p: 2 }}>
            <Stack direction="row" alignItems="flex-start" spacing={2}>
              <Checkbox
                checked={selectedAlerts.includes(alert.id)}
                onChange={() => handleSelectAlert(alert.id)}
                size="small"
              />
              
              <Avatar
                sx={{
                  bgcolor: alpha(severityConfig_.color, 0.1),
                  color: severityConfig_.color,
                  width: 40,
                  height: 40,
                }}
              >
                <TypeIcon />
              </Avatar>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      {alert.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {alert.message}
                    </Typography>
                  </Box>
                  
                  <Stack spacing={1} alignItems="flex-end">
                    <Chip
                      label={severityConfig_.label}
                      size="small"
                      sx={{
                        bgcolor: alpha(severityConfig_.color, 0.1),
                        color: severityConfig_.color,
                        fontWeight: 600,
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {formatDistanceToNow(new Date(alert.timestamp), {
                        locale: es,
                        addSuffix: true,
                      })}
                    </Typography>
                  </Stack>
                </Stack>

                <Grid container spacing={2} mb={2}>
                  {alert.vehiclePlate && (
                    <Grid item size={{ xs: 6, sm: 3 }}>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <VehicleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2">{alert.vehiclePlate}</Typography>
                      </Stack>
                    </Grid>
                  )}
                  {alert.driverName && (
                    <Grid item size={{ xs: 6, sm: 3 }}>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <DriverIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2">{alert.driverName}</Typography>
                      </Stack>
                    </Grid>
                  )}
                  {alert.location?.address && (
                    <Grid item size={{ xs: 12, sm: 6 }}>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <LocationIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" noWrap>
                          {alert.location.address}
                        </Typography>
                      </Stack>
                    </Grid>
                  )}
                </Grid>

                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {alert.status === 'active' && (
                    <>
                      <Button
                        size="small"
                        startIcon={<CheckMarkIcon />}
                        onClick={() => handleAcknowledgeAlert(alert.id)}
                        disabled={acknowledgeMutation.isLoading}
                      >
                        Reconocer
                      </Button>
                      <Button
                        size="small"
                        startIcon={<CheckIcon />}
                        onClick={() => handleResolveAlert(alert.id, 'Resuelto manualmente')}
                        disabled={resolveMutation.isLoading}
                      >
                        Resolver
                      </Button>
                      <Button
                        size="small"
                        startIcon={<DismissIcon />}
                        onClick={() => handleDismissAlert(alert.id, 'Falsa alarma')}
                        disabled={dismissMutation.isLoading}
                      >
                        Descartar
                      </Button>
                    </>
                  )}
                  <Button
                    size="small"
                    startIcon={<InfoIcon />}
                    onClick={() => {
                      setSelectedAlert(alert);
                      setDetailsOpen(true);
                    }}
                  >
                    Detalles
                  </Button>
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const renderStatsCard = (title: string, value: number, color: string, icon: React.ReactNode) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: alpha(color, 0.1), color: color }}>
            {icon}
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight={600} color={color}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box mb={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" fontWeight={600}>
            Sistema de Alertas
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              startIcon={<AddIcon />}
              variant="contained"
              onClick={() => setRuleDialogOpen(true)}
            >
              Nueva Regla
            </Button>
            <IconButton onClick={() => setSettingsOpen(true)}>
              <SettingsIcon />
            </IconButton>
            <IconButton onClick={() => queryClient.invalidateQueries()}>
              <RefreshIcon />
            </IconButton>
          </Stack>
        </Stack>

        {/* Stats Cards */}
        <Grid container spacing={3} mb={3}>
          <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
            {renderStatsCard('Total Alertas', alertStats.total, '#2196f3', <StatsIcon />)}
          </Grid>
          <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
            {renderStatsCard('Activas', alertStats.active, '#f44336', <NotificationsActiveIcon />)}
          </Grid>
          <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
            {renderStatsCard('Críticas', alertStats.critical, '#d32f2f', <ErrorIcon />)}
          </Grid>
          <Grid item size={{ xs: 12, sm: 6, md: 3 }}>
            {renderStatsCard('Resueltas', alertStats.resolved, '#4caf50', <CheckIcon />)}
          </Grid>
        </Grid>

        {/* Search and Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              placeholder="Buscar alertas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ minWidth: 300 }}
            />
            <Button
              startIcon={<FilterIcon />}
              onClick={() => setDrawerOpen(true)}
              variant="outlined"
            >
              Filtros
            </Button>
            <Button
              startIcon={<DownloadIcon />}
              onClick={handleExportAlerts}
              variant="outlined"
            >
              Exportar
            </Button>
            {selectedAlerts.length > 0 && (
              <Chip
                label={`${selectedAlerts.length} seleccionadas`}
                color="primary"
                onDelete={() => setSelectedAlerts([])}
              />
            )}
          </Stack>
        </Paper>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab
            label={
              <Badge badgeContent={activeAlerts.length} color="error">
                Activas
              </Badge>
            }
          />
          <Tab
            label={
              <Badge badgeContent={acknowledgedAlerts.length} color="warning">
                Reconocidas
              </Badge>
            }
          />
          <Tab
            label={
              <Badge badgeContent={resolvedAlerts.length} color="success">
                Resueltas
              </Badge>
            }
          />
          <Tab label="Reglas" />
          <Tab label="Estadísticas" />
        </Tabs>

        {/* Loading indicator */}
        {isLoading && <LinearProgress />}

        {/* Tab Panels */}
        <TabPanel value={currentTab} index={0}>
          <Box sx={{ p: 2 }}>
            {activeAlerts.length > 0 && (
              <Stack direction="row" spacing={1} mb={2}>
                <Button
                  size="small"
                  onClick={() => handleSelectAllAlerts(activeAlerts)}
                >
                  {activeAlerts.every(alert => selectedAlerts.includes(alert.id))
                    ? 'Deseleccionar todo'
                    : 'Seleccionar todo'}
                </Button>
                {selectedAlerts.length > 0 && (
                  <>
                    <Button size="small" startIcon={<CheckMarkIcon />}>
                      Reconocer seleccionadas
                    </Button>
                    <Button size="small" startIcon={<CheckIcon />}>
                      Resolver seleccionadas
                    </Button>
                  </>
                )}
              </Stack>
            )}
            <AnimatePresence>
              {activeAlerts.map(alert => renderAlertCard(alert))}
            </AnimatePresence>
            {activeAlerts.length === 0 && (
              <Box textAlign="center" py={4}>
                <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No hay alertas activas
                </Typography>
              </Box>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          <Box sx={{ p: 2 }}>
            <AnimatePresence>
              {acknowledgedAlerts.map(alert => renderAlertCard(alert))}
            </AnimatePresence>
            {acknowledgedAlerts.length === 0 && (
              <Box textAlign="center" py={4}>
                <InfoIcon sx={{ fontSize: 64, color: 'info.main', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No hay alertas reconocidas
                </Typography>
              </Box>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={currentTab} index={2}>
          <Box sx={{ p: 2 }}>
            <AnimatePresence>
              {resolvedAlerts.map(alert => renderAlertCard(alert))}
            </AnimatePresence>
            {resolvedAlerts.length === 0 && (
              <Box textAlign="center" py={4}>
                <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No hay alertas resueltas
                </Typography>
              </Box>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={currentTab} index={3}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Reglas de Alertas
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Gestiona las reglas automáticas para la generación de alertas.
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />}>
              Crear Nueva Regla
            </Button>
          </Box>
        </TabPanel>

        <TabPanel value={currentTab} index={4}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Estadísticas de Alertas
            </Typography>
            <Grid container spacing={3}>
              {Object.entries(alertStats.byType).map(([type, count]) => {
                const typeConfig = alertTypeConfig[type as keyof typeof alertTypeConfig];
                if (!typeConfig || count === 0) return null;
                const TypeIcon = typeConfig.icon;
                return (
                  <Grid item size={{ xs: 12, sm: 6, md: 4 }} key={type}>
                    <Card>
                      <CardContent>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Avatar sx={{ bgcolor: alpha(typeConfig.color, 0.1), color: typeConfig.color }}>
                            <TypeIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="h6">{count}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {typeConfig.label}
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        </TabPanel>
      </Paper>

      {/* Filter Drawer */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 320, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Filtros de Alertas
          </Typography>
          <Stack spacing={3}>
            <FormControl fullWidth>
              <InputLabel>Tipo de Alerta</InputLabel>
              <Select
                multiple
                value={filters.types || []}
                onChange={(e) => setFilters({ ...filters, types: e.target.value as any[] })}
              >
                {Object.entries(alertTypeConfig).map(([type, config]) => (
                  <MenuItem key={type} value={type}>
                    {config.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Severidad</InputLabel>
              <Select
                multiple
                value={filters.severities || []}
                onChange={(e) => setFilters({ ...filters, severities: e.target.value as any[] })}
              >
                {Object.entries(severityConfig).map(([severity, config]) => (
                  <MenuItem key={severity} value={severity}>
                    {config.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Divider />

            <Button variant="contained" onClick={() => setDrawerOpen(false)} fullWidth>
              Aplicar Filtros
            </Button>
          </Stack>
        </Box>
      </Drawer>

      {/* Alert Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Detalles de la Alerta
          <IconButton
            onClick={() => setDetailsOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedAlert && (
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  {selectedAlert.title}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedAlert.message}
                </Typography>
                {selectedAlert.description && (
                  <Typography variant="body2" color="text.secondary">
                    {selectedAlert.description}
                  </Typography>
                )}
              </Box>

              <Grid container spacing={2}>
                <Grid item size={{ xs: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Tipo
                  </Typography>
                  <Chip
                    icon={React.createElement(alertTypeConfig[selectedAlert.type]?.icon || WarningIcon)}
                    label={alertTypeConfig[selectedAlert.type]?.label || selectedAlert.type}
                    size="small"
                  />
                </Grid>
                <Grid item size={{ xs: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Severidad
                  </Typography>
                  <Chip
                    label={severityConfig[selectedAlert.severity]?.label || selectedAlert.severity}
                    size="small"
                    sx={{
                      bgcolor: alpha(severityConfig[selectedAlert.severity]?.color || '#gray', 0.1),
                      color: severityConfig[selectedAlert.severity]?.color,
                    }}
                  />
                </Grid>
                <Grid item size={{ xs: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Estado
                  </Typography>
                  <Typography variant="body2">{selectedAlert.status}</Typography>
                </Grid>
                <Grid item size={{ xs: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Fecha/Hora
                  </Typography>
                  <Typography variant="body2">
                    {format(new Date(selectedAlert.timestamp), 'dd/MM/yyyy HH:mm:ss')}
                  </Typography>
                </Grid>
              </Grid>

              {selectedAlert.metadata && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Información Adicional
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                      {JSON.stringify(selectedAlert.metadata, null, 2)}
                    </pre>
                  </Paper>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Configuración de Alertas</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Notificaciones en tiempo real"
            />
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Sonido de alertas"
            />
            <FormControlLabel
              control={<Switch />}
              label="Notificaciones por email"
            />
            <FormControlLabel
              control={<Switch />}
              label="Notificaciones SMS"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={() => setSettingsOpen(false)}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Alerts;