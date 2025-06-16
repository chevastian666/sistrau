import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { api, endpoints, buildUrl } from '../../config/api';
import { Trip, TripFilters, PaginatedResponse, TripStatus } from '../../types';

interface TripState {
  trips: Trip[];
  selectedTrip: Trip | null;
  activeTrips: Trip[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const initialState: TripState = {
  trips: [],
  selectedTrip: null,
  activeTrips: [],
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
export const fetchTrips = createAsyncThunk(
  'trips/fetchTrips',
  async (filters?: TripFilters) => {
    const url = buildUrl(endpoints.trips.list, filters);
    const response = await api.get<PaginatedResponse<Trip>>(url);
    return response.data;
  }
);

export const fetchTrip = createAsyncThunk(
  'trips/fetchTrip',
  async (id: string) => {
    const response = await api.get<Trip>(endpoints.trips.get(id));
    return response.data;
  }
);

export const createTrip = createAsyncThunk(
  'trips/createTrip',
  async (tripData: Partial<Trip>) => {
    const response = await api.post<Trip>(endpoints.trips.create, tripData);
    return response.data;
  }
);

export const updateTrip = createAsyncThunk(
  'trips/updateTrip',
  async ({ id, data }: { id: string; data: Partial<Trip> }) => {
    const response = await api.put<Trip>(endpoints.trips.update(id), data);
    return response.data;
  }
);

export const startTrip = createAsyncThunk(
  'trips/startTrip',
  async (id: string) => {
    const response = await api.post<Trip>(endpoints.trips.start(id));
    return response.data;
  }
);

export const completeTrip = createAsyncThunk(
  'trips/completeTrip',
  async (id: string) => {
    const response = await api.post<Trip>(endpoints.trips.complete(id));
    return response.data;
  }
);

export const cancelTrip = createAsyncThunk(
  'trips/cancelTrip',
  async (id: string) => {
    const response = await api.post<Trip>(endpoints.trips.cancel(id));
    return response.data;
  }
);

export const fetchActiveTrips = createAsyncThunk(
  'trips/fetchActiveTrips',
  async () => {
    const url = buildUrl(endpoints.trips.list, { status: 'in_progress' });
    const response = await api.get<PaginatedResponse<Trip>>(url);
    return response.data.data;
  }
);

// Slice
const tripSlice = createSlice({
  name: 'trips',
  initialState,
  reducers: {
    setSelectedTrip: (state, action: PayloadAction<Trip | null>) => {
      state.selectedTrip = action.payload;
    },
    updateTripStatus: (state, action: PayloadAction<{ tripId: string; status: TripStatus }>) => {
      const trip = state.trips.find(t => t.id === action.payload.tripId);
      if (trip) {
        trip.status = action.payload.status;
      }
      if (state.selectedTrip?.id === action.payload.tripId) {
        state.selectedTrip.status = action.payload.status;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch trips
    builder
      .addCase(fetchTrips.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTrips.fulfilled, (state, action) => {
        state.loading = false;
        state.trips = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchTrips.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch trips';
      });

    // Fetch single trip
    builder
      .addCase(fetchTrip.fulfilled, (state, action) => {
        state.selectedTrip = action.payload;
      });

    // Create trip
    builder
      .addCase(createTrip.fulfilled, (state, action) => {
        state.trips.unshift(action.payload);
      });

    // Update trip
    builder
      .addCase(updateTrip.fulfilled, (state, action) => {
        const index = state.trips.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.trips[index] = action.payload;
        }
        if (state.selectedTrip?.id === action.payload.id) {
          state.selectedTrip = action.payload;
        }
      });

    // Start trip
    builder
      .addCase(startTrip.fulfilled, (state, action) => {
        const index = state.trips.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.trips[index] = action.payload;
        }
        state.activeTrips.push(action.payload);
      });

    // Complete trip
    builder
      .addCase(completeTrip.fulfilled, (state, action) => {
        const index = state.trips.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.trips[index] = action.payload;
        }
        state.activeTrips = state.activeTrips.filter(t => t.id !== action.payload.id);
      });

    // Cancel trip
    builder
      .addCase(cancelTrip.fulfilled, (state, action) => {
        const index = state.trips.findIndex(t => t.id === action.payload.id);
        if (index !== -1) {
          state.trips[index] = action.payload;
        }
        state.activeTrips = state.activeTrips.filter(t => t.id !== action.payload.id);
      });

    // Fetch active trips
    builder
      .addCase(fetchActiveTrips.fulfilled, (state, action) => {
        state.activeTrips = action.payload;
      });
  },
});

export const { setSelectedTrip, updateTripStatus } = tripSlice.actions;
export default tripSlice.reducer;