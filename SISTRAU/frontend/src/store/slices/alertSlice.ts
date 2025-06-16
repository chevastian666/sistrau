import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { api, endpoints, buildUrl } from '../../config/api';
import { Alert, AlertFilters, PaginatedResponse } from '../../types';

interface AlertState {
  alerts: Alert[];
  unresolvedAlerts: Alert[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  stats: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

const initialState: AlertState = {
  alerts: [],
  unresolvedAlerts: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
  stats: {
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  },
};

// Async thunks
export const fetchAlerts = createAsyncThunk(
  'alerts/fetchAlerts',
  async (filters?: AlertFilters) => {
    const url = buildUrl(endpoints.alerts.list, filters);
    const response = await api.get<PaginatedResponse<Alert>>(url);
    return response.data;
  }
);

export const fetchUnresolvedAlerts = createAsyncThunk(
  'alerts/fetchUnresolvedAlerts',
  async () => {
    const url = buildUrl(endpoints.alerts.list, { isResolved: false });
    const response = await api.get<PaginatedResponse<Alert>>(url);
    return response.data.data;
  }
);

export const resolveAlert = createAsyncThunk(
  'alerts/resolveAlert',
  async (id: string) => {
    const response = await api.post<Alert>(endpoints.alerts.resolve(id));
    return response.data;
  }
);

export const fetchAlertStats = createAsyncThunk(
  'alerts/fetchStats',
  async () => {
    const response = await api.get(endpoints.alerts.stats);
    return response.data;
  }
);

// Slice
const alertSlice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {
    addAlert: (state, action: PayloadAction<Alert>) => {
      state.alerts.unshift(action.payload);
      if (!action.payload.isResolved) {
        state.unresolvedAlerts.unshift(action.payload);
      }
      state.stats.total++;
      state.stats[action.payload.severity]++;
    },
    updateAlert: (state, action: PayloadAction<Alert>) => {
      const index = state.alerts.findIndex(a => a.id === action.payload.id);
      if (index !== -1) {
        state.alerts[index] = action.payload;
      }
      
      const unresolvedIndex = state.unresolvedAlerts.findIndex(a => a.id === action.payload.id);
      if (action.payload.isResolved && unresolvedIndex !== -1) {
        state.unresolvedAlerts.splice(unresolvedIndex, 1);
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch alerts
    builder
      .addCase(fetchAlerts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAlerts.fulfilled, (state, action) => {
        state.loading = false;
        state.alerts = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAlerts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch alerts';
      });

    // Fetch unresolved alerts
    builder
      .addCase(fetchUnresolvedAlerts.fulfilled, (state, action) => {
        state.unresolvedAlerts = action.payload;
      });

    // Resolve alert
    builder
      .addCase(resolveAlert.fulfilled, (state, action) => {
        const index = state.alerts.findIndex(a => a.id === action.payload.id);
        if (index !== -1) {
          state.alerts[index] = action.payload;
        }
        state.unresolvedAlerts = state.unresolvedAlerts.filter(a => a.id !== action.payload.id);
      });

    // Fetch stats
    builder
      .addCase(fetchAlertStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });
  },
});

export const { addAlert, updateAlert } = alertSlice.actions;
export default alertSlice.reducer;