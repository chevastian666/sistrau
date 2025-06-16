import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { api, endpoints, buildUrl } from '../../config/api';
import { Vehicle, VehicleFilters, PaginatedResponse } from '../../types';

interface VehicleState {
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const initialState: VehicleState = {
  vehicles: [],
  selectedVehicle: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
};

// Async thunks
export const fetchVehicles = createAsyncThunk(
  'vehicles/fetchVehicles',
  async (filters?: VehicleFilters) => {
    const url = buildUrl(endpoints.vehicles.list, filters);
    const response = await api.get<PaginatedResponse<Vehicle>>(url);
    return response.data;
  }
);

export const fetchVehicle = createAsyncThunk(
  'vehicles/fetchVehicle',
  async (id: string) => {
    const response = await api.get<Vehicle>(endpoints.vehicles.get(id));
    return response.data;
  }
);

export const createVehicle = createAsyncThunk(
  'vehicles/createVehicle',
  async (vehicleData: Partial<Vehicle>) => {
    const response = await api.post<Vehicle>(endpoints.vehicles.create, vehicleData);
    return response.data;
  }
);

export const updateVehicle = createAsyncThunk(
  'vehicles/updateVehicle',
  async ({ id, data }: { id: string; data: Partial<Vehicle> }) => {
    const response = await api.put<Vehicle>(endpoints.vehicles.update(id), data);
    return response.data;
  }
);

export const deleteVehicle = createAsyncThunk(
  'vehicles/deleteVehicle',
  async (id: string) => {
    await api.delete(endpoints.vehicles.delete(id));
    return id;
  }
);

// Slice
const vehicleSlice = createSlice({
  name: 'vehicles',
  initialState,
  reducers: {
    setSelectedVehicle: (state, action: PayloadAction<Vehicle | null>) => {
      state.selectedVehicle = action.payload;
    },
    updateVehiclePosition: (state, action: PayloadAction<{ vehicleId: string; position: any }>) => {
      const vehicle = state.vehicles.find(v => v.id === action.payload.vehicleId);
      if (vehicle) {
        vehicle.currentPosition = action.payload.position;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch vehicles
    builder
      .addCase(fetchVehicles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVehicles.fulfilled, (state, action) => {
        state.loading = false;
        state.vehicles = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchVehicles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch vehicles';
      });

    // Fetch single vehicle
    builder
      .addCase(fetchVehicle.fulfilled, (state, action) => {
        state.selectedVehicle = action.payload;
      });

    // Create vehicle
    builder
      .addCase(createVehicle.fulfilled, (state, action) => {
        state.vehicles.push(action.payload);
      });

    // Update vehicle
    builder
      .addCase(updateVehicle.fulfilled, (state, action) => {
        const index = state.vehicles.findIndex(v => v.id === action.payload.id);
        if (index !== -1) {
          state.vehicles[index] = action.payload;
        }
        if (state.selectedVehicle?.id === action.payload.id) {
          state.selectedVehicle = action.payload;
        }
      });

    // Delete vehicle
    builder
      .addCase(deleteVehicle.fulfilled, (state, action) => {
        state.vehicles = state.vehicles.filter(v => v.id !== action.payload);
        if (state.selectedVehicle?.id === action.payload) {
          state.selectedVehicle = null;
        }
      });
  },
});

export const { setSelectedVehicle, updateVehiclePosition } = vehicleSlice.actions;
export default vehicleSlice.reducer;