import React, { useState } from 'react';
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
  Stepper,
  Step,
  StepLabel,
  StepContent,
  TextField,
  Chip,
  Stack,
  Alert,
  AlertTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Avatar,
  AvatarGroup,
  LinearProgress,
  Tooltip,
  useTheme,
  alpha,
  FormControlLabel,
  Switch,
  Badge,
  Fab,
  Zoom,
  Fade,
  Collapse,
  Skeleton,
  CircularProgress,
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
  Description as DocumentIcon,
  LocalShipping as ShippingIcon,
  Create as CreateIcon,
  Draw as SignIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  QrCode as QrCodeIcon,
  Link as BlockchainIcon,
  Security as SecurityIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  VerifiedUser as VerifiedIcon,
  Warning as WarningIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  DirectionsCar as VehicleIcon,
  AttachFile as AttachmentIcon,
  Add as AddIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Map as MapIcon,
  TrendingUp as TrendingUpIcon,
  CloudUpload as CloudUploadIcon,
  Fingerprint as FingerprintIcon,
  AccessTime as TimeIcon,
  EventNote as EventIcon,
  BarChart as ChartIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ecmrAPI } from '../services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ECMR_STATUS_COLORS = {
  draft: '#757575',
  issued: '#2196F3',
  in_transit: '#FF9800',
  delivered: '#4CAF50',
  completed: '#00BCD4',
  cancelled: '#F44336',
};

const ECMR_STATUS_GRADIENTS = {
  draft: 'linear-gradient(135deg, #757575 0%, #9E9E9E 100%)',
  issued: 'linear-gradient(135deg, #2196F3 0%, #21CBF3 100%)',
  in_transit: 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)',
  delivered: 'linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%)',
  completed: 'linear-gradient(135deg, #00BCD4 0%, #26C6DA 100%)',
  cancelled: 'linear-gradient(135deg, #F44336 0%, #EF5350 100%)',
};

const ECMR_STATUS_LABELS = {
  draft: 'Borrador',
  issued: 'Emitido',
  in_transit: 'En Tránsito',
  delivered: 'Entregado',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

const SIGNATURE_TYPE_LABELS = {
  sender: 'Remitente',
  carrier: 'Transportista',
  receiver: 'Destinatario',
  driver: 'Conductor',
};

const ECMR: React.FC = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedECMR, setSelectedECMR] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [signatureType, setSignatureType] = useState('');
  const [createMode, setCreateMode] = useState(false);
  
  // Estado del formulario de creación
  const [formData, setFormData] = useState({
    // Detalles del envío
    description: '',
    weight: '',
    volume: '',
    packages: '',
    value: '',
    dangerousGoods: false,
    temperature: '',
    
    // Remitente
    senderName: '',
    senderAddress: '',
    senderTaxId: '',
    senderContact: '',
    
    // Destinatario
    receiverName: '',
    receiverAddress: '',
    receiverTaxId: '',
    receiverContact: '',
    
    // Transportista
    carrierName: '',
    carrierTaxId: '',
    carrierLicense: '',
    vehicleId: '',
    driverId: '',
    
    // Ruta
    origin: '',
    destination: '',
    estimatedDistance: '',
    estimatedDuration: '',
    pickupScheduled: '',
    deliveryScheduled: '',
  });

  // Obtener lista de e-CMRs
  const { data: ecmrList, isLoading } = useQuery({
    queryKey: ['ecmr-list'],
    queryFn: () => ecmrAPI.getByCompany('current', { limit: 50 }),
  });

  // Mutación para crear e-CMR
  const createMutation = useMutation({
    mutationFn: ecmrAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ecmr-list'] });
      setActiveStep(0);
      setCreateMode(false);
      // Reset form
      setFormData({
        description: '',
        weight: '',
        volume: '',
        packages: '',
        value: '',
        dangerousGoods: false,
        temperature: '',
        senderName: '',
        senderAddress: '',
        senderTaxId: '',
        senderContact: '',
        receiverName: '',
        receiverAddress: '',
        receiverTaxId: '',
        receiverContact: '',
        carrierName: '',
        carrierTaxId: '',
        carrierLicense: '',
        vehicleId: '',
        driverId: '',
        origin: '',
        destination: '',
        estimatedDistance: '',
        estimatedDuration: '',
        pickupScheduled: '',
        deliveryScheduled: '',
      });
    },
  });

  // Mutación para emitir e-CMR
  const issueMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => ecmrAPI.issue(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ecmr-list'] });
    },
  });

  // Mutación para firmar e-CMR
  const signMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => ecmrAPI.sign(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ecmr-list'] });
      setSignDialogOpen(false);
    },
  });

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = () => {
    createMutation.mutate(formData);
  };

  const handleSign = (ecmr: any, type: string) => {
    setSelectedECMR(ecmr);
    setSignatureType(type);
    setSignDialogOpen(true);
  };

  const handleSignSubmit = () => {
    if (selectedECMR && signatureType) {
      signMutation.mutate({
        id: selectedECMR.id,
        data: {
          type: signatureType,
          signature: 'DIGITAL_SIGNATURE_PLACEHOLDER', // En producción sería firma real
          location: { lat: -34.9011, lng: -56.1645 },
          ipAddress: '192.168.1.1',
        },
      });
    }
  };

  const steps = [
    {
      label: 'Información del Envío',
      icon: <ShippingIcon />,
      color: '#2196F3',
    },
    {
      label: 'Datos del Remitente',
      icon: <PersonIcon />,
      color: '#4CAF50',
    },
    {
      label: 'Datos del Destinatario',
      icon: <BusinessIcon />,
      color: '#FF9800',
    },
    {
      label: 'Datos del Transportista',
      icon: <VehicleIcon />,
      color: '#9C27B0',
    },
    {
      label: 'Detalles de la Ruta',
      icon: <LocationIcon />,
      color: '#00BCD4',
    },
  ];

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción de la Carga"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={3}
                variant="outlined"
                InputProps={{
                  startAdornment: <DocumentIcon sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Peso (kg)"
                type="number"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>kg</Typography>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Volumen (m³)"
                type="number"
                value={formData.volume}
                onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>m³</Typography>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Número de Bultos"
                type="number"
                value={formData.packages}
                onChange={(e) => setFormData({ ...formData, packages: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Valor Declarado"
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>$</Typography>,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.dangerousGoods}
                    onChange={(e) => setFormData({ ...formData, dangerousGoods: e.target.checked })}
                    color="warning"
                  />
                }
                label="Mercancías Peligrosas"
              />
            </Grid>
          </Grid>
        );
      
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre del Remitente"
                value={formData.senderName}
                onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                InputProps={{
                  startAdornment: <PersonIcon sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Dirección"
                value={formData.senderAddress}
                onChange={(e) => setFormData({ ...formData, senderAddress: e.target.value })}
                multiline
                rows={2}
                InputProps={{
                  startAdornment: <LocationIcon sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="RUT/ID Fiscal"
                value={formData.senderTaxId}
                onChange={(e) => setFormData({ ...formData, senderTaxId: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Teléfono de Contacto"
                value={formData.senderContact}
                onChange={(e) => setFormData({ ...formData, senderContact: e.target.value })}
                InputProps={{
                  startAdornment: <PhoneIcon sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
            </Grid>
          </Grid>
        );
      
      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre del Destinatario"
                value={formData.receiverName}
                onChange={(e) => setFormData({ ...formData, receiverName: e.target.value })}
                InputProps={{
                  startAdornment: <BusinessIcon sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Dirección de Entrega"
                value={formData.receiverAddress}
                onChange={(e) => setFormData({ ...formData, receiverAddress: e.target.value })}
                multiline
                rows={2}
                InputProps={{
                  startAdornment: <LocationIcon sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="RUT/ID Fiscal"
                value={formData.receiverTaxId}
                onChange={(e) => setFormData({ ...formData, receiverTaxId: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Teléfono de Contacto"
                value={formData.receiverContact}
                onChange={(e) => setFormData({ ...formData, receiverContact: e.target.value })}
                InputProps={{
                  startAdornment: <PhoneIcon sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
            </Grid>
          </Grid>
        );
      
      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Empresa Transportista"
                value={formData.carrierName}
                onChange={(e) => setFormData({ ...formData, carrierName: e.target.value })}
                InputProps={{
                  startAdornment: <LocalShipping sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="RUT de la Empresa"
                value={formData.carrierTaxId}
                onChange={(e) => setFormData({ ...formData, carrierTaxId: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Licencia de Transporte"
                value={formData.carrierLicense}
                onChange={(e) => setFormData({ ...formData, carrierLicense: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="ID del Vehículo"
                value={formData.vehicleId}
                onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                InputProps={{
                  startAdornment: <VehicleIcon sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="ID del Conductor"
                value={formData.driverId}
                onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                InputProps={{
                  startAdornment: <PersonIcon sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
            </Grid>
          </Grid>
        );
      
      case 4:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Origen"
                value={formData.origin}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                InputProps={{
                  startAdornment: <LocationIcon sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Destino"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                InputProps={{
                  startAdornment: <LocationIcon sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Distancia Estimada (km)"
                type="number"
                value={formData.estimatedDistance}
                onChange={(e) => setFormData({ ...formData, estimatedDistance: e.target.value })}
                InputProps={{
                  endAdornment: <Typography sx={{ ml: 1, color: 'text.secondary' }}>km</Typography>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Duración Estimada (horas)"
                type="number"
                value={formData.estimatedDuration}
                onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
                InputProps={{
                  endAdornment: <Typography sx={{ ml: 1, color: 'text.secondary' }}>horas</Typography>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Fecha de Recogida"
                type="datetime-local"
                value={formData.pickupScheduled}
                onChange={(e) => setFormData({ ...formData, pickupScheduled: e.target.value })}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: <EventIcon sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Fecha de Entrega"
                type="datetime-local"
                value={formData.deliveryScheduled}
                onChange={(e) => setFormData({ ...formData, deliveryScheduled: e.target.value })}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: <EventIcon sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
            </Grid>
          </Grid>
        );
      
      default:
        return null;
    }
  };

  // Estadísticas
  const stats = {
    total: ecmrList?.length || 0,
    inTransit: ecmrList?.filter((e: any) => e.status === 'in_transit').length || 0,
    deliveredToday: ecmrList?.filter((e: any) => 
      e.status === 'delivered' && 
      new Date(e.dates.deliveryActual).toDateString() === new Date().toDateString()
    ).length || 0,
    pendingSignatures: ecmrList?.filter((e: any) => 
      e.status === 'issued' && e.signatures.length < 3
    ).length || 0,
    blockchain: ecmrList?.filter((e: any) => e.blockchainHash).length || 0,
  };

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
              e-CMR Electrónico
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sistema digital de guías de carga con firma electrónica y blockchain
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<ChartIcon />}
              sx={{
                borderColor: alpha(theme.palette.primary.main, 0.3),
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                },
              }}
            >
              Estadísticas
            </Button>
            <Button
              variant="contained"
              startIcon={<CreateIcon />}
              onClick={() => setCreateMode(!createMode)}
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
                boxShadow: '0 8px 32px rgba(25, 118, 210, 0.3)',
                '&:hover': {
                  boxShadow: '0 12px 48px rgba(25, 118, 210, 0.4)',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              {createMode ? 'Cerrar Formulario' : 'Nuevo e-CMR'}
            </Button>
          </Stack>
        </Stack>

        {/* Estadísticas Rápidas */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={6} sm={3}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card
                sx={{
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.9)} 0%, ${alpha(theme.palette.primary.light, 0.9)} 100%)`,
                  color: 'white',
                  boxShadow: '0 8px 32px rgba(25, 118, 210, 0.3)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -20,
                      right: -20,
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                    }}
                  />
                  <Stack spacing={1}>
                    <Typography variant="h3" fontWeight={700}>
                      {stats.total}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Total e-CMRs
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card
                sx={{
                  background: ECMR_STATUS_GRADIENTS.in_transit,
                  color: 'white',
                  boxShadow: `0 8px 32px ${alpha(ECMR_STATUS_COLORS.in_transit, 0.3)}`,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: -20,
                      left: -20,
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                    }}
                  />
                  <Stack spacing={1}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <ShippingIcon />
                      <Typography variant="h3" fontWeight={700}>
                        {stats.inTransit}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      En Tránsito
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card
                sx={{
                  background: ECMR_STATUS_GRADIENTS.delivered,
                  color: 'white',
                  boxShadow: `0 8px 32px ${alpha(ECMR_STATUS_COLORS.delivered, 0.3)}`,
                }}
              >
                <CardContent>
                  <Stack spacing={1}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <CheckIcon />
                      <Typography variant="h3" fontWeight={700}>
                        {stats.deliveredToday}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Entregados Hoy
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.light} 100%)`,
                  color: 'white',
                  boxShadow: `0 8px 32px ${alpha(theme.palette.success.main, 0.3)}`,
                }}
              >
                <CardContent>
                  <Stack spacing={1}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <BlockchainIcon />
                      <Typography variant="h3" fontWeight={700}>
                        {stats.blockchain}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      En Blockchain
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Panel de creación */}
          <AnimatePresence>
            {createMode && (
              <Grid item xs={12}>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Paper 
                    sx={{ 
                      p: 3,
                      background: alpha(theme.palette.background.paper, 0.95),
                      backdropFilter: 'blur(20px)',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                      borderRadius: 2,
                    }}
                  >
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
                          color: 'white',
                          boxShadow: '0 4px 16px rgba(25, 118, 210, 0.3)',
                        }}
                      >
                        <DocumentIcon />
                      </Box>
                      <Box>
                        <Typography variant="h6" fontWeight={600}>
                          Crear Nueva Guía Electrónica
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Complete los datos para generar un nuevo e-CMR
                        </Typography>
                      </Box>
                    </Stack>
                    
                    <Stepper activeStep={activeStep} orientation="vertical">
                      {steps.map((step, index) => (
                        <Step key={step.label}>
                          <StepLabel
                            StepIconComponent={() => (
                              <Avatar
                                sx={{
                                  bgcolor: activeStep >= index ? step.color : 'grey.300',
                                  width: 40,
                                  height: 40,
                                  boxShadow: activeStep === index ? `0 4px 16px ${alpha(step.color, 0.4)}` : 'none',
                                  transition: 'all 0.3s ease',
                                }}
                              >
                                {step.icon}
                              </Avatar>
                            )}
                          >
                            <Typography variant="subtitle1" fontWeight={600}>
                              {step.label}
                            </Typography>
                          </StepLabel>
                          <StepContent>
                            <Box sx={{ mb: 3, mt: 2 }}>
                              {getStepContent(index)}
                            </Box>
                            <Box sx={{ mb: 2 }}>
                              <Stack direction="row" spacing={2}>
                                {index === steps.length - 1 ? (
                                  <Button
                                    variant="contained"
                                    onClick={handleSubmit}
                                    disabled={createMutation.isPending}
                                    startIcon={createMutation.isPending ? <CircularProgress size={20} /> : <CheckIcon />}
                                    sx={{
                                      background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.light} 100%)`,
                                      boxShadow: '0 4px 16px rgba(76, 175, 80, 0.3)',
                                      '&:hover': {
                                        boxShadow: '0 8px 24px rgba(76, 175, 80, 0.4)',
                                      },
                                    }}
                                  >
                                    Crear e-CMR
                                  </Button>
                                ) : (
                                  <Button
                                    variant="contained"
                                    onClick={handleNext}
                                    endIcon={<ChevronRight />}
                                    sx={{
                                      background: `linear-gradient(135deg, ${step.color} 0%, ${alpha(step.color, 0.8)} 100%)`,
                                    }}
                                  >
                                    Continuar
                                  </Button>
                                )}
                                <Button
                                  disabled={index === 0}
                                  onClick={handleBack}
                                  startIcon={<ChevronLeft />}
                                >
                                  Atrás
                                </Button>
                              </Stack>
                            </Box>
                          </StepContent>
                        </Step>
                      ))}
                    </Stepper>
                  </Paper>
                </motion.div>
              </Grid>
            )}
          </AnimatePresence>

          {/* Lista de e-CMRs */}
          <Grid item xs={12}>
            <Paper 
              sx={{ 
                p: 3,
                background: alpha(theme.palette.background.paper, 0.95),
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                borderRadius: 2,
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" fontWeight={600}>
                  Guías Electrónicas Recientes
                </Typography>
                <Stack direction="row" spacing={1}>
                  <IconButton size="small" sx={{ color: 'text.secondary' }}>
                    <FilterListIcon />
                  </IconButton>
                  <IconButton size="small" sx={{ color: 'text.secondary' }}>
                    <SortIcon />
                  </IconButton>
                </Stack>
              </Stack>
              
              {isLoading ? (
                <Stack spacing={2}>
                  {[...Array(3)].map((_, index) => (
                    <Skeleton key={index} variant="rounded" height={120} />
                  ))}
                </Stack>
              ) : (
                <Stack spacing={2}>
                  {ecmrList?.map((ecmr: any) => (
                    <motion.div
                      key={ecmr.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card
                        sx={{
                          border: '1px solid',
                          borderColor: alpha(ECMR_STATUS_COLORS[ecmr.status as keyof typeof ECMR_STATUS_COLORS], 0.3),
                          borderRadius: 2,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            borderColor: ECMR_STATUS_COLORS[ecmr.status as keyof typeof ECMR_STATUS_COLORS],
                            boxShadow: `0 8px 24px ${alpha(ECMR_STATUS_COLORS[ecmr.status as keyof typeof ECMR_STATUS_COLORS], 0.15)}`,
                          },
                        }}
                      >
                        <CardContent>
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} md={3}>
                              <Stack spacing={1}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Typography variant="subtitle2" fontWeight={700}>
                                    {ecmr.id}
                                  </Typography>
                                  {ecmr.blockchainHash && (
                                    <Tooltip title="Verificado en Blockchain">
                                      <BlockchainIcon sx={{ fontSize: 16, color: 'success.main' }} />
                                    </Tooltip>
                                  )}
                                </Stack>
                                <Chip
                                  label={ECMR_STATUS_LABELS[ecmr.status as keyof typeof ECMR_STATUS_LABELS]}
                                  size="small"
                                  sx={{
                                    background: alpha(ECMR_STATUS_COLORS[ecmr.status as keyof typeof ECMR_STATUS_COLORS], 0.1),
                                    color: ECMR_STATUS_COLORS[ecmr.status as keyof typeof ECMR_STATUS_COLORS],
                                    border: '1px solid',
                                    borderColor: alpha(ECMR_STATUS_COLORS[ecmr.status as keyof typeof ECMR_STATUS_COLORS], 0.3),
                                    fontWeight: 600,
                                  }}
                                />
                              </Stack>
                            </Grid>
                            
                            <Grid item xs={12} md={4}>
                              <Stack spacing={0.5}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <LocationIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                  <Typography variant="body2" color="text.secondary">
                                    {ecmr.route.origin} → {ecmr.route.destination}
                                  </Typography>
                                </Stack>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <TimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                  <Typography variant="caption" color="text.secondary">
                                    Creado: {format(new Date(ecmr.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                                  </Typography>
                                </Stack>
                              </Stack>
                            </Grid>
                            
                            <Grid item xs={12} md={3}>
                              <Stack direction="row" spacing={1}>
                                <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 32, height: 32, fontSize: 14 } }}>
                                  {ecmr.signatures.map((sig: any, index: number) => (
                                    <Tooltip key={index} title={`${SIGNATURE_TYPE_LABELS[sig.type as keyof typeof SIGNATURE_TYPE_LABELS]} - Firmado`}>
                                      <Avatar sx={{ bgcolor: 'success.main' }}>
                                        <CheckIcon sx={{ fontSize: 16 }} />
                                      </Avatar>
                                    </Tooltip>
                                  ))}
                                  {Object.keys(SIGNATURE_TYPE_LABELS).length - ecmr.signatures.length > 0 && (
                                    <Tooltip title={`${Object.keys(SIGNATURE_TYPE_LABELS).length - ecmr.signatures.length} firmas pendientes`}>
                                      <Avatar sx={{ bgcolor: 'warning.main' }}>
                                        +{Object.keys(SIGNATURE_TYPE_LABELS).length - ecmr.signatures.length}
                                      </Avatar>
                                    </Tooltip>
                                  )}
                                </AvatarGroup>
                              </Stack>
                            </Grid>
                            
                            <Grid item xs={12} md={2}>
                              <Stack direction="row" spacing={1} justifyContent="flex-end">
                                <Tooltip title="Ver detalles">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setSelectedECMR(ecmr);
                                      setViewDialogOpen(true);
                                    }}
                                    sx={{
                                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                                      '&:hover': {
                                        bgcolor: alpha(theme.palette.primary.main, 0.2),
                                      },
                                    }}
                                  >
                                    <ViewIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                
                                {ecmr.status === 'draft' && (
                                  <Tooltip title="Emitir">
                                    <IconButton
                                      size="small"
                                      onClick={() => issueMutation.mutate({ id: ecmr.id })}
                                      sx={{
                                        bgcolor: alpha(theme.palette.success.main, 0.1),
                                        '&:hover': {
                                          bgcolor: alpha(theme.palette.success.main, 0.2),
                                        },
                                      }}
                                    >
                                      <CheckIcon fontSize="small" sx={{ color: 'success.main' }} />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                
                                {ecmr.status !== 'draft' && ecmr.status !== 'cancelled' && (
                                  <Tooltip title="Firmar">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleSign(ecmr, 'sender')}
                                      sx={{
                                        bgcolor: alpha(theme.palette.info.main, 0.1),
                                        '&:hover': {
                                          bgcolor: alpha(theme.palette.info.main, 0.2),
                                        },
                                      }}
                                    >
                                      <SignIcon fontSize="small" sx={{ color: 'info.main' }} />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Stack>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </Stack>
              )}
            </Paper>
          </Grid>
        </Grid>
      </motion.div>

      {/* Dialog de vista detallada */}
      <Dialog 
        open={viewDialogOpen} 
        onClose={() => setViewDialogOpen(false)} 
        maxWidth="md" 
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
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  background: ECMR_STATUS_GRADIENTS[selectedECMR?.status as keyof typeof ECMR_STATUS_GRADIENTS],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  boxShadow: `0 4px 16px ${alpha(ECMR_STATUS_COLORS[selectedECMR?.status as keyof typeof ECMR_STATUS_COLORS], 0.3)}`,
                }}
              >
                <DocumentIcon />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  {selectedECMR?.id}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Guía Electrónica de Carga
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1}>
              <IconButton size="small">
                <PrintIcon />
              </IconButton>
              <IconButton size="small">
                <DownloadIcon />
              </IconButton>
              <IconButton size="small">
                <ShareIcon />
              </IconButton>
            </Stack>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {selectedECMR && (
            <Stack spacing={3}>
              {/* Estado y verificación */}
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Paper
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      background: alpha(ECMR_STATUS_COLORS[selectedECMR.status as keyof typeof ECMR_STATUS_COLORS], 0.05),
                      border: '1px solid',
                      borderColor: alpha(ECMR_STATUS_COLORS[selectedECMR.status as keyof typeof ECMR_STATUS_COLORS], 0.2),
                    }}
                  >
                    <Typography variant="overline" color="text.secondary">
                      Estado Actual
                    </Typography>
                    <Typography variant="h6" fontWeight={600} sx={{ color: ECMR_STATUS_COLORS[selectedECMR.status as keyof typeof ECMR_STATUS_COLORS] }}>
                      {ECMR_STATUS_LABELS[selectedECMR.status as keyof typeof ECMR_STATUS_LABELS]}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      background: alpha(theme.palette.info.main, 0.05),
                      border: '1px solid',
                      borderColor: alpha(theme.palette.info.main, 0.2),
                    }}
                  >
                    <Typography variant="overline" color="text.secondary">
                      Código QR
                    </Typography>
                    <QrCodeIcon sx={{ fontSize: 48, color: 'info.main' }} />
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      background: selectedECMR.blockchainHash 
                        ? alpha(theme.palette.success.main, 0.05)
                        : alpha(theme.palette.warning.main, 0.05),
                      border: '1px solid',
                      borderColor: selectedECMR.blockchainHash 
                        ? alpha(theme.palette.success.main, 0.2)
                        : alpha(theme.palette.warning.main, 0.2),
                    }}
                  >
                    <Typography variant="overline" color="text.secondary">
                      Blockchain
                    </Typography>
                    {selectedECMR.blockchainHash ? (
                      <Stack alignItems="center" spacing={1}>
                        <VerifiedIcon sx={{ fontSize: 32, color: 'success.main' }} />
                        <Typography variant="caption" color="success.main" fontWeight={600}>
                          Verificado
                        </Typography>
                      </Stack>
                    ) : (
                      <Stack alignItems="center" spacing={1}>
                        <WarningIcon sx={{ fontSize: 32, color: 'warning.main' }} />
                        <Typography variant="caption" color="warning.main" fontWeight={600}>
                          Pendiente
                        </Typography>
                      </Stack>
                    )}
                  </Paper>
                </Grid>
              </Grid>

              {/* Timeline */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Línea de Tiempo
                </Typography>
                <Timeline position="alternate">
                  {selectedECMR.tracking.events.map((event: any, index: number) => (
                    <TimelineItem key={event.id}>
                      <TimelineOppositeContent sx={{ m: 'auto 0' }}>
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(event.timestamp), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </Typography>
                      </TimelineOppositeContent>
                      <TimelineSeparator>
                        <TimelineConnector sx={{ bgcolor: index === 0 ? 'primary.main' : 'grey.300' }} />
                        <TimelineDot sx={{ bgcolor: index === 0 ? 'primary.main' : 'grey.400' }}>
                          {event.type === 'issued' && <CheckIcon />}
                          {event.type === 'signed' && <SignIcon />}
                          {event.type === 'location_update' && <LocationIcon />}
                        </TimelineDot>
                        <TimelineConnector sx={{ bgcolor: 'grey.300' }} />
                      </TimelineSeparator>
                      <TimelineContent sx={{ py: '12px', px: 2 }}>
                        <Typography variant="body2" fontWeight={500}>
                          {event.details}
                        </Typography>
                      </TimelineContent>
                    </TimelineItem>
                  ))}
                </Timeline>
              </Paper>

              {/* Información del envío */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Detalles del Envío
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Descripción
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {selectedECMR.shipmentDetails.description}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={3}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Peso
                          </Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {selectedECMR.shipmentDetails.weight} kg
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Volumen
                          </Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {selectedECMR.shipmentDetails.volume} m³
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Bultos
                          </Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {selectedECMR.shipmentDetails.packages}
                          </Typography>
                        </Box>
                      </Stack>
                    </Stack>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Ruta
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip label={selectedECMR.route.origin} size="small" />
                          <TrendingUpIcon sx={{ color: 'text.secondary' }} />
                          <Chip label={selectedECMR.route.destination} size="small" />
                        </Stack>
                      </Box>
                      <Stack direction="row" spacing={3}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Distancia
                          </Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {selectedECMR.route.estimatedDistance} km
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Duración
                          </Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {selectedECMR.route.estimatedDuration} horas
                          </Typography>
                        </Box>
                      </Stack>
                    </Stack>
                  </Grid>
                </Grid>
              </Paper>

              {/* Firmas */}
              <Paper sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Firmas Digitales
                </Typography>
                <Grid container spacing={2}>
                  {Object.entries(SIGNATURE_TYPE_LABELS).map(([type, label]) => {
                    const signature = selectedECMR.signatures.find((s: any) => s.type === type);
                    return (
                      <Grid item xs={12} sm={6} key={type}>
                        <Card
                          variant="outlined"
                          sx={{
                            borderColor: signature 
                              ? alpha(theme.palette.success.main, 0.3)
                              : alpha(theme.palette.divider, 0.5),
                            bgcolor: signature 
                              ? alpha(theme.palette.success.main, 0.05) 
                              : 'transparent',
                          }}
                        >
                          <CardContent>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Box>
                                <Typography variant="subtitle2" fontWeight={600}>
                                  {label}
                                </Typography>
                                {signature ? (
                                  <Stack spacing={0.5} mt={1}>
                                    <Typography variant="caption" color="text.secondary">
                                      Firmado: {format(new Date(signature.signedAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                                    </Typography>
                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                      <FingerprintIcon sx={{ fontSize: 14, color: 'success.main' }} />
                                      <Typography variant="caption" color="success.main" fontWeight={600}>
                                        Verificado
                                      </Typography>
                                    </Stack>
                                  </Stack>
                                ) : (
                                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                    Pendiente de firma
                                  </Typography>
                                )}
                              </Box>
                              {signature ? (
                                <Avatar sx={{ bgcolor: 'success.main', width: 40, height: 40 }}>
                                  <CheckIcon />
                                </Avatar>
                              ) : (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<SignIcon />}
                                  onClick={() => handleSign(selectedECMR, type)}
                                  sx={{
                                    borderColor: alpha(theme.palette.primary.main, 0.3),
                                    '&:hover': {
                                      borderColor: theme.palette.primary.main,
                                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                                    },
                                  }}
                                >
                                  Firmar
                                </Button>
                              )}
                            </Stack>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </Paper>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setViewDialogOpen(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de firma */}
      <Dialog 
        open={signDialogOpen} 
        onClose={() => setSignDialogOpen(false)} 
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
                background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.light} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                boxShadow: '0 4px 16px rgba(33, 150, 243, 0.3)',
              }}
            >
              <SignIcon />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                Firma Digital
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Firmar como {SIGNATURE_TYPE_LABELS[signatureType as keyof typeof SIGNATURE_TYPE_LABELS]}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} mt={2}>
            <Alert 
              severity="info" 
              sx={{ 
                borderRadius: 2,
                bgcolor: alpha(theme.palette.info.main, 0.05),
              }}
            >
              <AlertTitle>Información Legal</AlertTitle>
              Al firmar este documento, usted confirma que la información es correcta y acepta las responsabilidades legales correspondientes según la normativa vigente.
            </Alert>
            
            <Paper
              sx={{
                p: 3,
                background: alpha(theme.palette.primary.main, 0.02),
                border: '2px dashed',
                borderColor: alpha(theme.palette.primary.main, 0.2),
                borderRadius: 2,
                textAlign: 'center',
              }}
            >
              <SecurityIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Firma Digital Segura
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Su firma será verificada mediante certificado digital y almacenada de forma segura en la blockchain
              </Typography>
              
              <Stack spacing={2} mt={3}>
                <Stack direction="row" spacing={2} justifyContent="center">
                  <Chip 
                    icon={<DocumentIcon />} 
                    label={selectedECMR?.id} 
                    variant="outlined"
                  />
                  <Chip 
                    icon={<TimeIcon />} 
                    label={format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: es })} 
                    variant="outlined"
                  />
                </Stack>
                <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                  <LocationIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">
                    Montevideo, Uruguay
                  </Typography>
                </Stack>
              </Stack>
            </Paper>
            
            <TextField
              fullWidth
              label="PIN de Seguridad"
              type="password"
              placeholder="Ingrese su PIN de 4 dígitos"
              InputProps={{
                startAdornment: <FingerprintIcon sx={{ mr: 1, color: 'action.active' }} />,
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setSignDialogOpen(false)} sx={{ mr: 1 }}>
            Cancelar
          </Button>
          <Button
            onClick={handleSignSubmit}
            variant="contained"
            disabled={signMutation.isPending}
            startIcon={signMutation.isPending ? <CircularProgress size={20} /> : <SignIcon />}
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.light} 100%)`,
              boxShadow: '0 4px 16px rgba(33, 150, 243, 0.3)',
              '&:hover': {
                boxShadow: '0 8px 24px rgba(33, 150, 243, 0.4)',
              },
            }}
          >
            Confirmar Firma
          </Button>
        </DialogActions>
      </Dialog>

      {/* FAB para crear nuevo */}
      <Zoom in={!createMode}>
        <Fab
          color="primary"
          aria-label="add"
          onClick={() => setCreateMode(true)}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
            boxShadow: '0 8px 32px rgba(25, 118, 210, 0.3)',
            '&:hover': {
              transform: 'scale(1.1)',
            },
          }}
        >
          <AddIcon />
        </Fab>
      </Zoom>
    </Box>
  );
};

// Importaciones necesarias para los iconos que faltaban
import { 
  ChevronRight, 
  ChevronLeft,
  FilterList as FilterListIcon,
  Sort as SortIcon,
} from '@mui/icons-material';

export default ECMR;