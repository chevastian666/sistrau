import api from '../api';

export interface Alert {
  id: string;
  type: 'speed' | 'geofence' | 'route' | 'stop' | 'engine' | 'battery' | 'signal' | 'maintenance' | 'driver' | 'security' | 'fuel' | 'temperature';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
  title: string;
  message: string;
  description?: string;
  timestamp: string;
  vehicleId?: string;
  vehiclePlate?: string;
  driverId?: string;
  driverName?: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  metadata?: {
    speed?: number;
    speedLimit?: number;
    batteryLevel?: number;
    fuelLevel?: number;
    temperature?: number;
    geofenceName?: string;
    routeName?: string;
    [key: string]: any;
  };
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  escalationLevel?: number;
  notificationsSent?: string[];
  actions?: AlertAction[];
}

export interface AlertAction {
  id: string;
  type: 'notification' | 'email' | 'sms' | 'call' | 'emergency' | 'disable_vehicle' | 'route_change';
  status: 'pending' | 'executed' | 'failed';
  executedAt?: string;
  result?: string;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  type: Alert['type'];
  severity: Alert['severity'];
  enabled: boolean;
  conditions: {
    field: string;
    operator: 'gt' | 'lt' | 'eq' | 'neq' | 'gte' | 'lte' | 'contains' | 'in' | 'out';
    value: any;
  }[];
  actions: {
    type: AlertAction['type'];
    delay?: number;
    recipients?: string[];
    template?: string;
  }[];
  filters?: {
    vehicleIds?: string[];
    driverIds?: string[];
    timeRanges?: Array<{
      start: string;
      end: string;
      days: number[];
    }>;
    geofences?: string[];
  };
  cooldown?: number; // minutes
  escalation?: {
    levels: Array<{
      afterMinutes: number;
      severity: Alert['severity'];
      actions: AlertRule['actions'];
    }>;
  };
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface AlertFilters {
  types?: Alert['type'][];
  severities?: Alert['severity'][];
  statuses?: Alert['status'][];
  vehicleIds?: string[];
  driverIds?: string[];
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface AlertStats {
  total: number;
  active: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  acknowledged: number;
  resolved: number;
  byType: Record<Alert['type'], number>;
  trends: {
    period: string;
    count: number;
    change: number;
  }[];
}

export const alertsAPI = {
  // Get alerts with filters
  getAlerts: async (filters?: AlertFilters) => {
    const response = await api.get<Alert[]>('/alerts', {
      params: filters
    });
    return response.data;
  },

  // Get single alert
  getAlert: async (id: string) => {
    const response = await api.get<Alert>(`/alerts/${id}`);
    return response.data;
  },

  // Create alert
  createAlert: async (alert: Partial<Alert>) => {
    const response = await api.post<Alert>('/alerts', alert);
    return response.data;
  },

  // Update alert
  updateAlert: async (id: string, updates: Partial<Alert>) => {
    const response = await api.patch<Alert>(`/alerts/${id}`, updates);
    return response.data;
  },

  // Acknowledge alert
  acknowledgeAlert: async (id: string, note?: string) => {
    const response = await api.post<Alert>(`/alerts/${id}/acknowledge`, { note });
    return response.data;
  },

  // Resolve alert
  resolveAlert: async (id: string, resolution: string) => {
    const response = await api.post<Alert>(`/alerts/${id}/resolve`, { resolution });
    return response.data;
  },

  // Dismiss alert
  dismissAlert: async (id: string, reason: string) => {
    const response = await api.post<Alert>(`/alerts/${id}/dismiss`, { reason });
    return response.data;
  },

  // Bulk operations
  bulkAcknowledge: async (alertIds: string[], note?: string) => {
    const response = await api.post('/alerts/bulk/acknowledge', { alertIds, note });
    return response.data;
  },

  bulkResolve: async (alertIds: string[], resolution: string) => {
    const response = await api.post('/alerts/bulk/resolve', { alertIds, resolution });
    return response.data;
  },

  bulkDismiss: async (alertIds: string[], reason: string) => {
    const response = await api.post('/alerts/bulk/dismiss', { alertIds, reason });
    return response.data;
  },

  // Get alert statistics
  getAlertStats: async (period?: string) => {
    const response = await api.get<AlertStats>('/alerts/stats', {
      params: { period }
    });
    return response.data;
  },

  // Alert Rules Management
  getRules: async () => {
    const response = await api.get<AlertRule[]>('/alerts/rules');
    return response.data;
  },

  getRule: async (id: string) => {
    const response = await api.get<AlertRule>(`/alerts/rules/${id}`);
    return response.data;
  },

  createRule: async (rule: Partial<AlertRule>) => {
    const response = await api.post<AlertRule>('/alerts/rules', rule);
    return response.data;
  },

  updateRule: async (id: string, updates: Partial<AlertRule>) => {
    const response = await api.patch<AlertRule>(`/alerts/rules/${id}`, updates);
    return response.data;
  },

  deleteRule: async (id: string) => {
    await api.delete(`/alerts/rules/${id}`);
  },

  toggleRule: async (id: string, enabled: boolean) => {
    const response = await api.patch<AlertRule>(`/alerts/rules/${id}/toggle`, { enabled });
    return response.data;
  },

  testRule: async (id: string, testData?: any) => {
    const response = await api.post(`/alerts/rules/${id}/test`, testData);
    return response.data;
  },

  // Notification settings
  getNotificationSettings: async () => {
    const response = await api.get('/alerts/notifications/settings');
    return response.data;
  },

  updateNotificationSettings: async (settings: any) => {
    const response = await api.patch('/alerts/notifications/settings', settings);
    return response.data;
  },

  // Export alerts
  exportAlerts: async (filters: AlertFilters & { format: 'csv' | 'xlsx' | 'pdf' }) => {
    const response = await api.post('/alerts/export', filters, {
      responseType: 'blob'
    });
    return response.data;
  }
};

export default alertsAPI;