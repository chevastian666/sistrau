import React, { useState, useEffect, useRef } from 'react';
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
  Switch,
  FormControlLabel,
  Divider,
  Avatar,
  Tooltip,
  Badge,
  ToggleButton,
  ToggleButtonGroup,
  LinearProgress,
  useTheme,
  alpha,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Drawer,
  Fab,
} from '@mui/material';
import {
  Map as MapIcon,
  Navigation as NavigationIcon,
  LocalShipping as TruckIcon,
  Speed as SpeedIcon,
  Schedule as TimeIcon,
  Battery80 as BatteryIcon,
  SignalCellular4Bar as SignalIcon,
  Satellite as SatelliteIcon,
  Warning as WarningIcon,
  FilterList as FilterIcon,
  Layers as LayersIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Settings as SettingsIcon,
  CenterFocusStrong as CenterIcon,
  WifiTethering as LiveIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './tracking.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { trackingAPI } from '../services/api/tracking.api';
import io, { Socket } from 'socket.io-client';

// Initialize Mapbox
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';

// Types
interface VehiclePosition {
  vehicleId: string;
  plateNumber: string;
  driverId: string;
  driverName: string;
  position: {
    lat: number;
    lng: number;
    altitude?: number;
    accuracy?: number;
  };
  speed: number;
  heading: number;
  timestamp: string;
  status: 'active' | 'idle' | 'stopped' | 'offline';
  battery?: number;
  signal?: number;
  engineStatus?: boolean;
  fuel?: number;
  temperature?: number;
  tripId?: string;
  alerts?: Alert[];
}

interface Alert {
  id: string;
  type: 'speed' | 'geofence' | 'route' | 'stop' | 'engine' | 'battery' | 'signal';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
}

interface TrackingFilters {
  vehicles?: string[];
  status?: string[];
  routes?: string[];
  alerts?: boolean;
}

// Map styles
const mapStyles = {
  streets: 'mapbox://styles/mapbox/streets-v12',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  dark: 'mapbox://styles/mapbox/dark-v11',
};

const Tracking: React.FC = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const socketRef = useRef<Socket | null>(null);

  // State
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [mapStyle, setMapStyle] = useState('streets');
  const [showTraffic, setShowTraffic] = useState(true);
  const [autoFollow, setAutoFollow] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [filters, setFilters] = useState<TrackingFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Mock data for development
  const mockVehicles: VehiclePosition[] = [
    {
      vehicleId: 'VEH-001',
      plateNumber: 'ABC-1234',
      driverId: 'DRV-001',
      driverName: 'Juan Pérez',
      position: { lat: -34.9011, lng: -56.1645 },
      speed: 45,
      heading: 135,
      timestamp: new Date().toISOString(),
      status: 'active',
      battery: 85,
      signal: 90,
      engineStatus: true,
      fuel: 65,
      temperature: 22,
      tripId: 'TRIP-001',
    },
    {
      vehicleId: 'VEH-002',
      plateNumber: 'XYZ-5678',
      driverId: 'DRV-002',
      driverName: 'María González',
      position: { lat: -34.8721, lng: -56.1819 },
      speed: 0,
      heading: 45,
      timestamp: new Date().toISOString(),
      status: 'idle',
      battery: 92,
      signal: 85,
      engineStatus: false,
      fuel: 80,
      temperature: 21,
    },
    {
      vehicleId: 'VEH-003',
      plateNumber: 'DEF-9012',
      driverId: 'DRV-003',
      driverName: 'Carlos Rodriguez',
      position: { lat: -34.8854, lng: -56.1953 },
      speed: 62,
      heading: 270,
      timestamp: new Date().toISOString(),
      status: 'active',
      battery: 70,
      signal: 75,
      engineStatus: true,
      fuel: 45,
      temperature: 23,
      tripId: 'TRIP-002',
      alerts: [
        {
          id: 'ALERT-001',
          type: 'speed',
          severity: 'medium',
          message: 'Velocidad sobre el límite permitido',
          timestamp: new Date().toISOString(),
        },
      ],
    },
  ];

  // Query for real-time positions
  const { data: vehiclePositions = mockVehicles, isLoading } = useQuery({
    queryKey: ['vehiclePositions', filters],
    queryFn: async () => {
      try {
        const response = await trackingAPI.getVehiclePositions(filters);
        return response;
      } catch (error) {
        return mockVehicles;
      }
    },
    refetchInterval: 5000,
  });

  // Filter vehicles based on search
  const filteredVehicles = vehiclePositions.filter(vehicle =>
    vehicle.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.driverName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Initialize map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyles[mapStyle as keyof typeof mapStyles],
      center: [-56.1645, -34.9011], // Montevideo
      zoom: 12,
      attributionControl: false,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true,
      showUserHeading: true
    }), 'top-right');

    // Add scale control
    map.current.addControl(new mapboxgl.ScaleControl({
      maxWidth: 200,
      unit: 'metric'
    }), 'bottom-left');

    return () => {
      map.current?.remove();
    };
  }, []);

  // Update map style
  useEffect(() => {
    if (map.current) {
      map.current.setStyle(mapStyles[mapStyle as keyof typeof mapStyles]);
    }
  }, [mapStyle]);

  // Update vehicle markers
  useEffect(() => {
    if (!map.current) return;

    filteredVehicles.forEach((vehicle) => {
      const markerId = vehicle.vehicleId;
      const marker = markersRef.current[markerId];

      if (marker) {
        // Update existing marker
        marker.setLngLat([vehicle.position.lng, vehicle.position.lat]);
      } else {
        // Create custom marker element
        const el = document.createElement('div');
        el.className = `vehicle-marker ${vehicle.status} ${vehicle.alerts && vehicle.alerts.length > 0 ? 'alert' : ''}`;
        el.style.width = '36px';
        el.style.height = '36px';
        el.style.cursor = 'pointer';
        el.style.borderRadius = '50%';
        el.style.border = '3px solid white';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
        el.style.transition = 'all 0.3s ease';
        el.style.transform = `rotate(${vehicle.heading}deg)`;
        
        // Set color based on status
        const statusColors = {
          active: '#4CAF50',
          idle: '#FF9800',
          stopped: '#9E9E9E',
          offline: '#F44336',
        };
        
        el.style.backgroundColor = statusColors[vehicle.status];
        
        // Add border for alerts
        if (vehicle.alerts && vehicle.alerts.length > 0) {
          el.style.border = '3px solid #ff5722';
          el.style.boxShadow = '0 4px 12px rgba(255, 87, 34, 0.4)';
        }
        
        // Add truck icon with direction indicator
        el.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: center; position: relative;">
            <svg viewBox="0 0 24 24" style="width: 20px; height: 20px; fill: white;">
              <path d="M18.92 5.01C18.72 4.42 18.16 4 17.5 4h-11c-.66 0-1.21.42-1.42 1.01L3 11v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 15c-.83 0-1.5-.67-1.5-1.5S5.67 12 6.5 12s1.5.67 1.5 1.5S7.33 15 6.5 15zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 10l1.5-4.5h11L19 10H5z"/>
            </svg>
            ${vehicle.speed > 0 ? `
              <div style="position: absolute; top: -2px; right: -2px; width: 8px; height: 8px; background: white; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>
            ` : ''}
          </div>
        `;

        // Create popup
        const popup = new mapboxgl.Popup({
          offset: 30,
          closeButton: true,
          className: 'vehicle-popup'
        }).setHTML(`
          <div style="padding: 16px; min-width: 240px; font-family: 'Roboto', sans-serif;">
            <div style="display: flex; align-items: center; margin-bottom: 12px;">
              <div style="width: 12px; height: 12px; border-radius: 50%; background: ${statusColors[vehicle.status]}; margin-right: 8px;"></div>
              <h4 style="margin: 0; color: #1976d2; font-size: 16px; font-weight: 600;">${vehicle.plateNumber}</h4>
              ${vehicle.alerts && vehicle.alerts.length > 0 ? `<span style="margin-left: auto; background: #ff5722; color: white; padding: 2px 6px; border-radius: 12px; font-size: 11px; font-weight: 500;">⚠ ${vehicle.alerts.length}</span>` : ''}
            </div>
            <div style="font-size: 13px; line-height: 1.6; color: #424242;">
              <div style="margin-bottom: 4px;"><strong>Conductor:</strong> ${vehicle.driverName}</div>
              <div style="margin-bottom: 4px;"><strong>Velocidad:</strong> <span style="color: ${vehicle.speed > 80 ? '#f44336' : '#2e7d32'}; font-weight: 500;">${vehicle.speed} km/h</span></div>
              <div style="margin-bottom: 4px;"><strong>Estado:</strong> <span style="color: ${statusColors[vehicle.status]}; font-weight: 500; text-transform: capitalize;">${vehicle.status}</span></div>
              ${vehicle.battery ? `<div style="margin-bottom: 4px;"><strong>Batería:</strong> <span style="color: ${vehicle.battery < 20 ? '#f44336' : '#2e7d32'};">${vehicle.battery}%</span></div>` : ''}
              ${vehicle.signal ? `<div style="margin-bottom: 4px;"><strong>Señal:</strong> ${vehicle.signal}%</div>` : ''}
              ${vehicle.tripId ? `<div style="margin-top: 8px; padding: 4px 8px; background: #e3f2fd; border-radius: 4px; font-size: 12px;"><strong>Viaje:</strong> ${vehicle.tripId}</div>` : ''}
            </div>
            <div style="margin-top: 12px; font-size: 11px; color: #757575;">
              Última actualización: ${formatDistanceToNow(new Date(vehicle.timestamp), { locale: es, addSuffix: true })}
            </div>
          </div>
        `);

        // Create new marker
        const newMarker = new mapboxgl.Marker({
          element: el,
          anchor: 'center',
        })
          .setLngLat([vehicle.position.lng, vehicle.position.lat])
          .setPopup(popup)
          .addTo(map.current);

        // Marker events
        el.addEventListener('click', () => {
          setSelectedVehicle(vehicle.vehicleId);
          if (autoFollow) {
            map.current?.flyTo({
              center: [vehicle.position.lng, vehicle.position.lat],
              zoom: 16,
            });
          }
        });

        markersRef.current[markerId] = newMarker;
      }
    });

    // Remove markers for vehicles no longer in the list
    Object.keys(markersRef.current).forEach((markerId) => {
      if (!filteredVehicles.find(v => v.vehicleId === markerId)) {
        markersRef.current[markerId].remove();
        delete markersRef.current[markerId];
      }
    });
  }, [filteredVehicles, autoFollow]);

  // Stats calculation
  const stats = {
    totalVehicles: vehiclePositions.length,
    activeVehicles: vehiclePositions.filter(v => v.status === 'active').length,
    idleVehicles: vehiclePositions.filter(v => v.status === 'idle').length,
    offlineVehicles: vehiclePositions.filter(v => v.status === 'offline').length,
    alerts: vehiclePositions.reduce((acc, v) => acc + (v.alerts?.length || 0), 0),
  };

  const handleCenterMap = () => {
    if (map.current) {
      if (selectedVehicle) {
        const vehicle = vehiclePositions.find(v => v.vehicleId === selectedVehicle);
        if (vehicle) {
          map.current.flyTo({
            center: [vehicle.position.lng, vehicle.position.lat],
            zoom: 16,
          });
        }
      } else {
        // Center on all vehicles
        const bounds = new mapboxgl.LngLatBounds();
        vehiclePositions.forEach(vehicle => {
          bounds.extend([vehicle.position.lng, vehicle.position.lat]);
        });
        map.current.fitBounds(bounds, { padding: 50 });
      }
    }
  };

  const handleExportData = () => {
    const data = vehiclePositions.map(v => ({
      vehiculo: v.plateNumber,
      conductor: v.driverName,
      latitud: v.position.lat,
      longitud: v.position.lng,
      velocidad: v.speed,
      estado: v.status,
      timestamp: v.timestamp,
    }));

    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tracking_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
    a.click();
  };

  const renderVehicleCard = (vehicle: VehiclePosition) => (
    <motion.div
      key={vehicle.vehicleId}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        sx={{
          mb: 2,
          cursor: 'pointer',
          border: selectedVehicle === vehicle.vehicleId ? 2 : 1,
          borderColor: selectedVehicle === vehicle.vehicleId ? 'primary.main' : 'divider',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: 4,
            borderColor: 'primary.main',
          },
        }}
        onClick={() => setSelectedVehicle(vehicle.vehicleId)}
      >
        <CardContent sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Badge
                variant="dot"
                sx={{
                  '& .MuiBadge-badge': {
                    bgcolor: vehicle.status === 'active' ? '#4CAF50' : 
                            vehicle.status === 'idle' ? '#FF9800' :
                            vehicle.status === 'offline' ? '#F44336' : '#9E9E9E',
                  },
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: 'primary.main',
                    width: 40,
                    height: 40,
                  }}
                >
                  <TruckIcon />
                </Avatar>
              </Badge>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  {vehicle.plateNumber}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {vehicle.driverName}
                </Typography>
              </Box>
            </Stack>
            {vehicle.alerts && vehicle.alerts.length > 0 && (
              <Chip
                icon={<WarningIcon />}
                label={vehicle.alerts.length}
                size="small"
                color="warning"
                variant="outlined"
              />
            )}
          </Stack>

          <Grid container spacing={2}>
            <Grid item size={{ xs: 6 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <SpeedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2">
                  {vehicle.speed} km/h
                </Typography>
              </Stack>
            </Grid>
            <Grid item size={{ xs: 6 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <BatteryIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2">
                  {vehicle.battery || 0}%
                </Typography>
              </Stack>
            </Grid>
            <Grid item size={{ xs: 6 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <SignalIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2">
                  {vehicle.signal || 0}%
                </Typography>
              </Stack>
            </Grid>
            <Grid item size={{ xs: 6 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <TimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2">
                  {formatDistanceToNow(new Date(vehicle.timestamp), { 
                    locale: es, 
                    addSuffix: true 
                  })}
                </Typography>
              </Stack>
            </Grid>
          </Grid>

          {vehicle.tripId && (
            <Chip
              label={`Viaje: ${vehicle.tripId}`}
              size="small"
              variant="outlined"
              sx={{ mt: 1.5 }}
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      {/* Sidebar */}
      <Paper
        className="tracking-sidebar"
        sx={{
          width: sidebarOpen ? 380 : 0,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 0,
          borderRight: 1,
          borderColor: 'divider',
          transition: 'width 0.3s ease',
          overflow: 'hidden',
        }}
      >
        {/* Sidebar Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight={600}>
              Vehículos GPS
            </Typography>
            <Stack direction="row" spacing={1}>
              <IconButton 
                size="small" 
                onClick={() => setAutoFollow(!autoFollow)}
                color={autoFollow ? 'primary' : 'default'}
              >
                <Tooltip title={autoFollow ? 'Desactivar seguimiento' : 'Activar seguimiento'}>
                  <NavigationIcon />
                </Tooltip>
              </IconButton>
              <IconButton size="small" onClick={() => queryClient.invalidateQueries()}>
                <RefreshIcon />
              </IconButton>
              <IconButton size="small" onClick={() => setSidebarOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Stack>
          </Stack>

          {/* Search */}
          <TextField
            fullWidth
            size="small"
            placeholder="Buscar vehículo o conductor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
            sx={{ mb: 2 }}
          />

          {/* Stats */}
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip
              icon={<TruckIcon />}
              label={`${stats.totalVehicles} total`}
              size="small"
              color="primary"
              variant="outlined"
            />
            <Chip
              icon={<LiveIcon />}
              label={`${stats.activeVehicles} activos`}
              size="small"
              color="success"
              variant="outlined"
            />
            {stats.alerts > 0 && (
              <Chip
                icon={<WarningIcon />}
                label={`${stats.alerts} alertas`}
                size="small"
                color="warning"
                variant="outlined"
              />
            )}
          </Stack>
        </Box>

        {/* Vehicle List */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          <AnimatePresence>
            {filteredVehicles.map((vehicle) => renderVehicleCard(vehicle))}
          </AnimatePresence>
          {filteredVehicles.length === 0 && (
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 4 }}>
              No se encontraron vehículos
            </Typography>
          )}
        </Box>

        {/* Footer */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">
            Última actualización: {format(new Date(), 'HH:mm:ss')}
          </Typography>
        </Box>
      </Paper>

      {/* Map Container */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        <div
          ref={mapContainer}
          style={{
            width: '100%',
            height: '100%',
          }}
        />

        {/* Top Controls */}
        <Paper
          className="tracking-controls"
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            p: 2,
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" gutterBottom className="live-indicator">
            Tracking GPS en Tiempo Real
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              icon={<TruckIcon />}
              label={`${stats.totalVehicles} vehículos`}
              color="primary"
              size="small"
            />
            <Chip
              icon={<LiveIcon />}
              label={`${stats.activeVehicles} activos`}
              color="success"
              size="small"
            />
            {stats.alerts > 0 && (
              <Chip
                icon={<WarningIcon />}
                label={`${stats.alerts} alertas`}
                color="warning"
                size="small"
              />
            )}
          </Stack>
        </Paper>

        {/* Map Style Selector */}
        <ToggleButtonGroup
          value={mapStyle}
          exclusive
          onChange={(_, value) => value && setMapStyle(value)}
          sx={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            bgcolor: 'background.paper',
            borderRadius: 2,
          }}
        >
          <ToggleButton value="streets" size="small">
            <Tooltip title="Calles">
              <MapIcon />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="satellite" size="small">
            <Tooltip title="Satélite">
              <SatelliteIcon />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="dark" size="small">
            <Tooltip title="Oscuro">
              <LayersIcon />
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>

        {/* Floating Action Buttons */}
        <Stack
          spacing={1}
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 16,
          }}
        >
          {!sidebarOpen && (
            <Fab
              size="small"
              onClick={() => setSidebarOpen(true)}
              sx={{
                bgcolor: 'primary.main',
                '&:hover': { bgcolor: 'primary.dark' },
              }}
            >
              <MenuIcon />
            </Fab>
          )}
          <Fab
            size="small"
            onClick={handleCenterMap}
            sx={{
              bgcolor: 'background.paper',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <CenterIcon />
          </Fab>
          <Fab
            size="small"
            onClick={() => setDrawerOpen(true)}
            sx={{
              bgcolor: 'background.paper',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <FilterIcon />
          </Fab>
          <Fab
            size="small"
            onClick={handleExportData}
            sx={{
              bgcolor: 'background.paper',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <DownloadIcon />
          </Fab>
          <Fab
            size="small"
            onClick={() => setSettingsOpen(true)}
            sx={{
              bgcolor: 'background.paper',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <SettingsIcon />
          </Fab>
        </Stack>

        {/* Auto-follow indicator */}
        {autoFollow && selectedVehicle && (
          <Chip
            icon={<NavigationIcon />}
            label="Siguiendo vehículo"
            color="primary"
            onDelete={() => setAutoFollow(false)}
            sx={{
              position: 'absolute',
              top: 100,
              left: 16,
            }}
          />
        )}

        {/* Loading indicator */}
        {isLoading && (
          <LinearProgress
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
            }}
          />
        )}
      </Box>

      {/* Filter Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 320, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Filtros y Configuración
          </Typography>
          <Stack spacing={3}>
            <FormControl fullWidth>
              <InputLabel>Estado del Vehículo</InputLabel>
              <Select
                multiple
                value={filters.status || []}
                onChange={(e) => setFilters({ ...filters, status: e.target.value as string[] })}
              >
                <MenuItem value="active">Activo</MenuItem>
                <MenuItem value="idle">En espera</MenuItem>
                <MenuItem value="stopped">Detenido</MenuItem>
                <MenuItem value="offline">Fuera de línea</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={showTraffic}
                  onChange={(e) => setShowTraffic(e.target.checked)}
                />
              }
              label="Mostrar información de tráfico"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={autoFollow}
                  onChange={(e) => setAutoFollow(e.target.checked)}
                />
              }
              label="Seguimiento automático"
            />

            <Divider />

            <Button 
              variant="contained" 
              onClick={() => setDrawerOpen(false)}
              fullWidth
            >
              Aplicar Filtros
            </Button>
          </Stack>
        </Box>
      </Drawer>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Configuración de Tracking GPS</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <Box>
              <Typography gutterBottom>
                Frecuencia de actualización (segundos)
              </Typography>
              <Slider
                value={5}
                min={1}
                max={30}
                marks={[
                  { value: 1, label: '1s' },
                  { value: 5, label: '5s' },
                  { value: 10, label: '10s' },
                  { value: 30, label: '30s' },
                ]}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value}s`}
              />
            </Box>

            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Notificaciones de alertas"
            />

            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Sonido de alertas"
            />

            <FormControlLabel
              control={<Switch />}
              label="Modo de alto contraste"
            />

            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Mostrar histórico de rutas"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={() => setSettingsOpen(false)}
          >
            Guardar Configuración
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Tracking;