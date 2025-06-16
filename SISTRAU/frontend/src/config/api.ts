import axios from 'axios';
import { store } from '../store';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
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
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Try to refresh token
      try {
        const state = store.getState();
        const currentToken = state.auth.token;
        
        if (currentToken) {
          const response = await api.post('/auth/refresh', { token: currentToken });
          const newToken = response.data.token;
          
          // Update token in store
          store.dispatch({ type: 'auth/setToken', payload: newToken });
          
          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        store.dispatch({ type: 'auth/logout' });
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// API endpoints
export const endpoints = {
  // Auth
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
  },

  // Users
  users: {
    list: '/users',
    get: (id: string) => `/users/${id}`,
    create: '/users',
    update: (id: string) => `/users/${id}`,
    delete: (id: string) => `/users/${id}`,
    me: '/users/me',
  },

  // Vehicles
  vehicles: {
    list: '/vehicles',
    get: (id: string) => `/vehicles/${id}`,
    create: '/vehicles',
    update: (id: string) => `/vehicles/${id}`,
    delete: (id: string) => `/vehicles/${id}`,
    status: (id: string) => `/vehicles/${id}/status`,
    telemetry: (id: string) => `/vehicles/${id}/telemetry`,
    positions: '/vehicles/positions',
  },

  // Trips
  trips: {
    list: '/trips',
    get: (id: string) => `/trips/${id}`,
    create: '/trips',
    update: (id: string) => `/trips/${id}`,
    cancel: (id: string) => `/trips/${id}/cancel`,
    start: (id: string) => `/trips/${id}/start`,
    complete: (id: string) => `/trips/${id}/complete`,
    tracking: (id: string) => `/trips/${id}/tracking`,
  },

  // Cargo
  cargo: {
    guides: '/cargo/guides',
    getGuide: (id: string) => `/cargo/guides/${id}`,
    createGuide: '/cargo/guides',
    updateGuide: (id: string) => `/cargo/guides/${id}`,
    verifyGuide: (id: string) => `/cargo/guides/${id}/verify`,
  },

  // Tracking
  tracking: {
    live: '/tracking/live',
    history: '/tracking/history',
    replay: '/tracking/replay',
  },

  // Alerts
  alerts: {
    list: '/alerts',
    get: (id: string) => `/alerts/${id}`,
    resolve: (id: string) => `/alerts/${id}/resolve`,
    stats: '/alerts/stats',
  },

  // Statistics
  stats: {
    dashboard: '/stats/dashboard',
    vehicles: '/stats/vehicles',
    drivers: '/stats/drivers',
    trips: '/stats/trips',
    company: '/stats/company',
  },

  // Reports
  reports: {
    generate: '/reports/generate',
    list: '/reports',
    download: (id: string) => `/reports/${id}/download`,
  },
};

// Helper functions
export const buildUrl = (endpoint: string, params?: Record<string, any>) => {
  if (!params) return endpoint;
  
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  
  return `${endpoint}?${searchParams.toString()}`;
};