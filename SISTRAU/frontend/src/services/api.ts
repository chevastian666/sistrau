import axios from 'axios';
import { store } from '../store';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.auth.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      store.dispatch({ type: 'auth/logout' });
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  login: (credentials: { username: string; password: string }) =>
    api.post('/auth/login', credentials),
  
  register: (userData: any) =>
    api.post('/auth/register', userData),
  
  logout: () =>
    api.post('/auth/logout'),
  
  me: () =>
    api.get('/auth/me'),
};

// Vehicle endpoints
export const vehicleAPI = {
  getAll: (params?: any) =>
    api.get('/vehicles', { params }),
  
  getById: (id: string) =>
    api.get(`/vehicles/${id}`),
  
  create: (data: any) =>
    api.post('/vehicles', data),
  
  update: (id: string, data: any) =>
    api.put(`/vehicles/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/vehicles/${id}`),
  
  updateStatus: (id: string, status: string) =>
    api.patch(`/vehicles/${id}/status`, { status }),
};

// Trip endpoints
export const tripAPI = {
  getAll: (params?: any) =>
    api.get('/trips', { params }),
  
  getById: (id: string) =>
    api.get(`/trips/${id}`),
  
  create: (data: any) =>
    api.post('/trips', data),
  
  update: (id: string, data: any) =>
    api.put(`/trips/${id}`, data),
  
  updateStatus: (id: string, status: string) =>
    api.patch(`/trips/${id}/status`, { status }),
  
  addCheckpoint: (id: string, checkpoint: any) =>
    api.post(`/trips/${id}/checkpoints`, checkpoint),
};

// Tracking endpoints
export const trackingAPI = {
  getRealtime: () =>
    api.get('/tracking/realtime'),
  
  getByVehicle: (vehicleId: string, params?: any) =>
    api.get(`/tracking/vehicle/${vehicleId}`, { params }),
  
  getByTrip: (tripId: string, params?: any) =>
    api.get(`/tracking/trip/${tripId}`, { params }),
  
  updatePosition: (data: any) =>
    api.post('/tracking/position', data),
};

// Alert endpoints
export const alertAPI = {
  getAll: (params?: any) =>
    api.get('/alerts', { params }),
  
  getById: (id: string) =>
    api.get(`/alerts/${id}`),
  
  resolve: (id: string, resolution: string) =>
    api.patch(`/alerts/${id}/resolve`, { resolution }),
  
  acknowledge: (id: string) =>
    api.patch(`/alerts/${id}/acknowledge`),
};

// Guide endpoints
export const guideAPI = {
  getAll: (params?: any) =>
    api.get('/guides', { params }),
  
  getById: (id: string) =>
    api.get(`/guides/${id}`),
  
  create: (data: any) =>
    api.post('/guides', data),
  
  update: (id: string, data: any) =>
    api.put(`/guides/${id}`, data),
  
  sign: (id: string, signature: any) =>
    api.post(`/guides/${id}/sign`, signature),
  
  verify: (id: string) =>
    api.get(`/guides/${id}/verify`),
};

// Report endpoints
export const reportAPI = {
  getVehicleUtilization: (params?: any) =>
    api.get('/reports/vehicle-utilization', { params }),
  
  getDeliveryPerformance: (params?: any) =>
    api.get('/reports/delivery-performance', { params }),
  
  getAlertSummary: (params?: any) =>
    api.get('/reports/alert-summary', { params }),
  
  getDriverPerformance: (params?: any) =>
    api.get('/reports/driver-performance', { params }),
  
  exportReport: (type: string, params?: any) =>
    api.get(`/reports/export/${type}`, { params, responseType: 'blob' }),
};

// Dashboard endpoints
export const dashboardAPI = {
  getStats: () =>
    api.get('/dashboard/stats'),
  
  getRecentActivity: () =>
    api.get('/dashboard/recent-activity'),
  
  getPerformanceMetrics: () =>
    api.get('/dashboard/performance'),
};

// User management endpoints
export const userAPI = {
  getAll: (params?: any) =>
    api.get('/users', { params }),
  
  getById: (id: string) =>
    api.get(`/users/${id}`),
  
  create: (data: any) =>
    api.post('/users', data),
  
  update: (id: string, data: any) =>
    api.put(`/users/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/users/${id}`),
  
  updateRole: (id: string, role: string) =>
    api.patch(`/users/${id}/role`, { role }),
};

// Tachograph endpoints
export const tachographAPI = {
  createRecord: (data: any) =>
    api.post('/tachograph/record', data),
  
  getByVehicle: (vehicleId: string, params?: any) =>
    api.get(`/tachograph/vehicle/${vehicleId}`, { params }),
  
  getByDriver: (driverId: string, params?: any) =>
    api.get(`/tachograph/driver/${driverId}`, { params }),
  
  getDriverHours: (driverId: string, date?: Date) =>
    api.get(`/tachograph/driver/${driverId}/hours`, { 
      params: { date: date?.toISOString() } 
    }),
  
  getWeeklySummary: (driverId: string, weekStart?: Date) =>
    api.get(`/tachograph/driver/${driverId}/weekly-summary`, { 
      params: { weekStart: weekStart?.toISOString() } 
    }),
  
  downloadData: (data: { cardNumber: string; cardType: string; vehicleId: string }) =>
    api.post('/tachograph/download', data),
  
  getViolations: (params?: any) =>
    api.get('/tachograph/violations', { params }),
  
  getDriverRecords: (driverId: string, params?: any) =>
    api.get(`/tachograph/driver/${driverId}`, { params }).then(res => res.data),
};

// e-CMR endpoints
export const ecmrAPI = {
  create: (data: any) =>
    api.post('/ecmr', data),
  
  getById: (id: string) =>
    api.get(`/ecmr/${id}`),
  
  getByVehicle: (vehicleId: string, params?: any) =>
    api.get(`/ecmr/vehicle/${vehicleId}`, { params }),
  
  getByCompany: (companyId: string, params?: any) =>
    api.get(`/ecmr/company/${companyId}`, { params }).then(res => res.data),
  
  issue: (id: string) =>
    api.post(`/ecmr/${id}/issue`),
  
  sign: (id: string, signatureData: any) =>
    api.post(`/ecmr/${id}/sign`, signatureData),
  
  updateLocation: (id: string, locationData: any) =>
    api.patch(`/ecmr/${id}/location`, locationData),
  
  complete: (id: string) =>
    api.post(`/ecmr/${id}/complete`),
  
  verify: (id: string) =>
    api.get(`/ecmr/${id}/verify`),
  
  getStatistics: (params?: any) =>
    api.get('/ecmr/statistics', { params }),
};

// Working Hours endpoints
export const workingHoursAPI = {
  getSummary: (driverId: string, startDate?: string, endDate?: string) =>
    api.get(`/working-hours/summary/${driverId}`, { 
      params: { startDate, endDate } 
    }).then(res => res.data),
  
  getReport: (driverId: string, period?: string) =>
    api.get(`/working-hours/report/${driverId}`, { 
      params: { period } 
    }).then(res => res.data),
  
  getAlerts: (driverId: string) =>
    api.get(`/working-hours/alerts/${driverId}`).then(res => res.data),
  
  getFleetCompliance: (params?: any) =>
    api.get('/working-hours/compliance/fleet', { params }).then(res => res.data),
  
  createSchedule: (data: any) =>
    api.post('/working-hours/schedule', data),
  
  getRecommendations: (driverId: string) =>
    api.get(`/working-hours/recommendations/${driverId}`).then(res => res.data),
  
  simulateSchedule: (data: any) =>
    api.post('/working-hours/simulate', data).then(res => res.data),
};

export default api;