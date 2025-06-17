import api from '../api';

export interface VehiclePosition {
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

export interface Alert {
  id: string;
  type: 'speed' | 'geofence' | 'route' | 'stop' | 'engine' | 'battery' | 'signal';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
}

export interface TrackingFilters {
  vehicles?: string[];
  status?: string[];
  routes?: string[];
  alerts?: boolean;
}

export interface VehicleHistory {
  vehicleId: string;
  positions: {
    lat: number;
    lng: number;
    timestamp: string;
    speed: number;
    heading: number;
  }[];
  dateFrom: string;
  dateTo: string;
}

export interface Geofence {
  id: string;
  name: string;
  type: 'circle' | 'polygon';
  coordinates: any;
  radius?: number;
  active: boolean;
  vehicleIds?: string[];
  alertOnEntry?: boolean;
  alertOnExit?: boolean;
}

export interface Route {
  id: string;
  name: string;
  waypoints: [number, number][];
  color: string;
  active: boolean;
  vehicleIds?: string[];
}

export const trackingAPI = {
  // Get real-time vehicle positions
  getVehiclePositions: async (filters?: TrackingFilters) => {
    const response = await api.get<VehiclePosition[]>('/tracking/positions', {
      params: filters
    });
    return response.data;
  },

  // Get single vehicle position
  getVehiclePosition: async (vehicleId: string) => {
    const response = await api.get<VehiclePosition>(`/tracking/positions/${vehicleId}`);
    return response.data;
  },

  // Get vehicle history
  getVehicleHistory: async (vehicleId: string, dateFrom: string, dateTo: string) => {
    const response = await api.get<VehicleHistory>(`/tracking/history/${vehicleId}`, {
      params: { dateFrom, dateTo }
    });
    return response.data;
  },

  // Create/Update geofence
  saveGeofence: async (geofence: Partial<Geofence>) => {
    if (geofence.id) {
      const response = await api.put<Geofence>(`/tracking/geofences/${geofence.id}`, geofence);
      return response.data;
    } else {
      const response = await api.post<Geofence>('/tracking/geofences', geofence);
      return response.data;
    }
  },

  // Get all geofences
  getGeofences: async () => {
    const response = await api.get<Geofence[]>('/tracking/geofences');
    return response.data;
  },

  // Delete geofence
  deleteGeofence: async (id: string) => {
    await api.delete(`/tracking/geofences/${id}`);
  },

  // Create/Update route
  saveRoute: async (route: Partial<Route>) => {
    if (route.id) {
      const response = await api.put<Route>(`/tracking/routes/${route.id}`, route);
      return response.data;
    } else {
      const response = await api.post<Route>('/tracking/routes', route);
      return response.data;
    }
  },

  // Get all routes
  getRoutes: async () => {
    const response = await api.get<Route[]>('/tracking/routes');
    return response.data;
  },

  // Delete route
  deleteRoute: async (id: string) => {
    await api.delete(`/tracking/routes/${id}`);
  },

  // Get tracking alerts
  getAlerts: async (filters?: { vehicleId?: string; severity?: string; resolved?: boolean }) => {
    const response = await api.get<Alert[]>('/tracking/alerts', {
      params: filters
    });
    return response.data;
  },

  // Resolve alert
  resolveAlert: async (alertId: string) => {
    const response = await api.patch(`/tracking/alerts/${alertId}/resolve`);
    return response.data;
  },

  // Send command to vehicle
  sendCommand: async (vehicleId: string, command: string, params?: any) => {
    const response = await api.post(`/tracking/vehicles/${vehicleId}/commands`, {
      command,
      params
    });
    return response.data;
  },

  // Export tracking data
  exportData: async (filters: TrackingFilters & { format: 'csv' | 'xlsx' | 'pdf' }) => {
    const response = await api.post('/tracking/export', filters, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Get live traffic data
  getTrafficData: async (bounds: { north: number; south: number; east: number; west: number }) => {
    const response = await api.get('/tracking/traffic', {
      params: bounds
    });
    return response.data;
  }
};

export default trackingAPI;