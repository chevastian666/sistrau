import api from '../api';
import { Trip, TripStatus, TripFilters, TripStats, TripTimeline, TripCheckpoint, TripExpenses, TripDocument, TripAlert } from '../../types/trip.types';

export const tripAPI = {
  // Get all trips with filters
  getTrips: async (filters?: TripFilters) => {
    const response = await api.get<{ data: Trip[]; meta: any }>('/trips', {
      params: filters
    });
    return response.data;
  },

  // Get trip statistics
  getStats: async (dateRange: 'today' | 'week' | 'month' = 'today') => {
    const response = await api.get<TripStats>('/trips/stats', {
      params: { dateRange }
    });
    return response.data;
  },

  // Get single trip
  getTrip: async (id: string) => {
    const response = await api.get<Trip>(`/trips/${id}`);
    return response.data;
  },

  // Create new trip
  createTrip: async (tripData: Partial<Trip>) => {
    const response = await api.post<Trip>('/trips', tripData);
    return response.data;
  },

  // Update trip status
  updateStatus: async (id: string, status: TripStatus) => {
    const response = await api.patch<Trip>(`/trips/${id}/status`, { status });
    return response.data;
  },

  // Add checkpoint
  addCheckpoint: async (id: string, checkpoint: Partial<TripCheckpoint>) => {
    const response = await api.post<TripCheckpoint>(`/trips/${id}/checkpoints`, checkpoint);
    return response.data;
  },

  // Update expenses
  updateExpenses: async (id: string, expenses: TripExpenses) => {
    const response = await api.put<TripExpenses>(`/trips/${id}/expenses`, expenses);
    return response.data;
  },

  // Add document
  addDocument: async (id: string, document: Partial<TripDocument>) => {
    const response = await api.post<TripDocument>(`/trips/${id}/documents`, document);
    return response.data;
  },

  // Add alert
  addAlert: async (id: string, alert: Partial<TripAlert>) => {
    const response = await api.post<TripAlert>(`/trips/${id}/alerts`, alert);
    return response.data;
  },

  // Resolve alert
  resolveAlert: async (tripId: string, alertId: string) => {
    const response = await api.patch(`/trips/${tripId}/alerts/${alertId}/resolve`);
    return response.data;
  },

  // Get trip timeline
  getTimeline: async (id: string) => {
    const response = await api.get<TripTimeline[]>(`/trips/${id}/timeline`);
    return response.data;
  },

  // Clone trip
  cloneTrip: async (id: string, data: { vehicleId?: string; driverId?: string; departureTime?: string; estimatedArrival?: string }) => {
    const response = await api.post<Trip>(`/trips/${id}/clone`, data);
    return response.data;
  },

  // Check delays (admin only)
  checkDelays: async () => {
    const response = await api.post('/trips/check-delays');
    return response.data;
  }
};

export default tripAPI;