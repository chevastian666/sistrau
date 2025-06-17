import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  CardActions,
  Tooltip,
  Badge,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  LocalShipping,
  Build,
  Warning,
  CheckCircle,
  Cancel,
  GpsFixed,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { api, endpoints } from '../config/api';
import { Vehicle, VehicleStatus } from '../types';
import { useAppSelector } from '../hooks/redux';

const vehicleSchema = yup.object({
  plateNumber: yup.string().required('Matrícula requerida'),
  brand: yup.string().required('Marca requerida'),
  model: yup.string().required('Modelo requerido'),
  year: yup.number()
    .min(1990, 'Año debe ser mayor a 1990')
    .max(new Date().getFullYear() + 1, 'Año inválido')
    .required('Año requerido'),
  type: yup.string().required('Tipo requerido'),
  maxWeightKg: yup.number()
    .positive('Peso debe ser positivo')
    .required('Peso máximo requerido'),
  status: yup.string().oneOf(['active', 'inactive', 'maintenance', 'suspended']).required(),
});

const statusColors: Record<VehicleStatus, 'success' | 'default' | 'warning' | 'error'> = {
  active: 'success',
  inactive: 'default',
  maintenance: 'warning',
  suspended: 'error',
};

const statusIcons: Record<VehicleStatus, React.ReactNode> = {
  active: <CheckCircle fontSize="small" />,
  inactive: <Cancel fontSize="small" />,
  maintenance: <Build fontSize="small" />,
  suspended: <Warning fontSize="small" />,
};

const Vehicles: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAppSelector((state) => state.auth);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | ''>('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(vehicleSchema),
    defaultValues: {
      plateNumber: '',
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      type: 'truck',
      maxWeightKg: 0,
      status: 'active' as VehicleStatus,
    },
  });

  // Fetch vehicles
  const { data: vehiclesData, isLoading } = useQuery({
    queryKey: ['vehicles', searchTerm, statusFilter],
    queryFn: async () => {
      const params: any = {
        page: 1,
        limit: 50,
      };
      
      if (searchTerm) params.search = searchTerm;
      if (statusFilter) params.status = statusFilter;
      
      const response = await api.get(endpoints.vehicles.list, { params });
      return response.data;
    },
  });

  // Create/Update vehicle mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (selectedVehicle) {
        return api.put(endpoints.vehicles.update(selectedVehicle.id), data);
      }
      return api.post(endpoints.vehicles.create, { ...data, companyId: user?.companyId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      handleCloseDialog();
    },
  });

  // Delete vehicle mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(endpoints.vehicles.delete(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });

  const handleOpenDialog = (vehicle?: Vehicle) => {
    if (vehicle) {
      setSelectedVehicle(vehicle);
      reset({
        plateNumber: vehicle.plateNumber,
        brand: vehicle.brand || '',
        model: vehicle.model || '',
        year: vehicle.year || new Date().getFullYear(),
        type: vehicle.type || 'truck',
        maxWeightKg: vehicle.maxWeightKg || 0,
        status: vehicle.status,
      });
    } else {
      setSelectedVehicle(null);
      reset();
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedVehicle(null);
    reset();
  };

  const onSubmit = (data: any) => {
    saveMutation.mutate(data);
  };

  const handleViewVehicle = (vehicle: Vehicle) => {
    navigate(`/vehicles/${vehicle.id}`);
  };

  const handleTrackVehicle = (vehicle: Vehicle) => {
    navigate(`/tracking?vehicleId=${vehicle.id}`);
  };

  const columns: GridColDef[] = [
    {
      field: 'plateNumber',
      headerName: 'Matrícula',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="bold">
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'brand',
      headerName: 'Marca',
      width: 120,
    },
    {
      field: 'model',
      headerName: 'Modelo',
      width: 120,
    },
    {
      field: 'year',
      headerName: 'Año',
      width: 80,
    },
    {
      field: 'status',
      headerName: 'Estado',
      width: 130,
      renderCell: (params: GridRenderCellParams<Vehicle>) => (
        <Chip
          icon={statusIcons[params.value as VehicleStatus]}
          label={params.value}
          color={statusColors[params.value as VehicleStatus]}
          size="small"
        />
      ),
    },
    {
      field: 'currentPosition',
      headerName: 'Ubicación',
      width: 150,
      renderCell: (params) => {
        if (params.value) {
          return (
            <Chip
              icon={<GpsFixed fontSize="small" />}
              label={`${params.value.speed || 0} km/h`}
              size="small"
              color="primary"
              variant="outlined"
            />
          );
        }
        return <Typography variant="caption" color="textSecondary">Sin señal</Typography>;
      },
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 200,
      sortable: false,
      renderCell: (params: GridRenderCellParams<Vehicle>) => (
        <Box>
          <Tooltip title="Ver detalles">
            <IconButton size="small" onClick={() => handleViewVehicle(params.row)}>
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Rastrear">
            <IconButton size="small" onClick={() => handleTrackVehicle(params.row)}>
              <GpsFixed fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Editar">
            <IconButton size="small" onClick={() => handleOpenDialog(params.row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar">
            <IconButton 
              size="small" 
              onClick={() => {
                if (window.confirm('¿Está seguro de eliminar este vehículo?')) {
                  deleteMutation.mutate(params.row.id);
                }
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const VehicleCard = ({ vehicle }: { vehicle: Vehicle }) => (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" component="div">
            {vehicle.plateNumber}
          </Typography>
          <Chip
            icon={statusIcons[vehicle.status]}
            label={vehicle.status}
            color={statusColors[vehicle.status]}
            size="small"
          />
        </Box>
        
        <Typography variant="body2" color="textSecondary" gutterBottom>
          {vehicle.brand} {vehicle.model} ({vehicle.year})
        </Typography>
        
        <Typography variant="body2" color="textSecondary">
          Tipo: {vehicle.type}
        </Typography>
        
        <Typography variant="body2" color="textSecondary">
          Peso máx: {vehicle.maxWeightKg} kg
        </Typography>
        
        {vehicle.currentPosition && (
          <Box mt={1}>
            <Chip
              icon={<GpsFixed fontSize="small" />}
              label={`${vehicle.currentPosition.speed || 0} km/h`}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>
        )}
      </CardContent>
      
      <CardActions>
        <Button size="small" onClick={() => handleViewVehicle(vehicle)}>
          Ver
        </Button>
        <Button size="small" onClick={() => handleTrackVehicle(vehicle)}>
          Rastrear
        </Button>
        <Button size="small" onClick={() => handleOpenDialog(vehicle)}>
          Editar
        </Button>
      </CardActions>
    </Card>
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Vehículos</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Agregar Vehículo
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Buscar por matrícula, marca o modelo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as VehicleStatus | '')}
                label="Estado"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="active">Activo</MenuItem>
                <MenuItem value="inactive">Inactivo</MenuItem>
                <MenuItem value="maintenance">Mantenimiento</MenuItem>
                <MenuItem value="suspended">Suspendido</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid xs={12} md={3}>
            <Box display="flex" gap={1}>
              <Button
                variant={viewMode === 'table' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('table')}
              >
                Tabla
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('grid')}
              >
                Cuadrícula
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {viewMode === 'table' ? (
        <Paper sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={vehiclesData?.data || []}
            columns={columns}
            loading={isLoading}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10 },
              },
            }}
            pageSizeOptions={[10, 25, 50]}
            checkboxSelection
            disableRowSelectionOnClick
          />
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {vehiclesData?.data.map((vehicle: Vehicle) => (
            <Grid xs={12} sm={6} md={4} key={vehicle.id}>
              <VehicleCard vehicle={vehicle} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>
            {selectedVehicle ? 'Editar Vehículo' : 'Agregar Vehículo'}
          </DialogTitle>
          
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid xs={12} sm={6}>
                <Controller
                  name="plateNumber"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Matrícula"
                      error={!!errors.plateNumber}
                      helperText={errors.plateNumber?.message}
                      disabled={!!selectedVehicle}
                    />
                  )}
                />
              </Grid>
              
              <Grid xs={12} sm={6}>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.status}>
                      <InputLabel>Estado</InputLabel>
                      <Select {...field} label="Estado">
                        <MenuItem value="active">Activo</MenuItem>
                        <MenuItem value="inactive">Inactivo</MenuItem>
                        <MenuItem value="maintenance">Mantenimiento</MenuItem>
                        <MenuItem value="suspended">Suspendido</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              
              <Grid xs={12} sm={6}>
                <Controller
                  name="brand"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Marca"
                      error={!!errors.brand}
                      helperText={errors.brand?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid xs={12} sm={6}>
                <Controller
                  name="model"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Modelo"
                      error={!!errors.model}
                      helperText={errors.model?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid xs={12} sm={6}>
                <Controller
                  name="year"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="number"
                      label="Año"
                      error={!!errors.year}
                      helperText={errors.year?.message}
                    />
                  )}
                />
              </Grid>
              
              <Grid xs={12} sm={6}>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.type}>
                      <InputLabel>Tipo</InputLabel>
                      <Select {...field} label="Tipo">
                        <MenuItem value="truck">Camión</MenuItem>
                        <MenuItem value="van">Furgoneta</MenuItem>
                        <MenuItem value="pickup">Camioneta</MenuItem>
                        <MenuItem value="trailer">Remolque</MenuItem>
                        <MenuItem value="semi">Semirremolque</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              
              <Grid xs={12}>
                <Controller
                  name="maxWeightKg"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="number"
                      label="Peso Máximo (kg)"
                      error={!!errors.maxWeightKg}
                      helperText={errors.maxWeightKg?.message}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Vehicles;