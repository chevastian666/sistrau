const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const { emitVehicleAlert } = require('../services/socketService');

// Mock alerts data for development
const mockAlerts = [
  {
    id: 'alert-001',
    type: 'speed',
    severity: 'high',
    status: 'active',
    title: 'Exceso de velocidad',
    message: 'Vehículo ABC-1234 excedió el límite de velocidad',
    description: 'El vehículo ha superado los 120 km/h en zona de 80 km/h',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    vehicleId: 'VEH-001',
    vehiclePlate: 'ABC-1234',
    driverId: 'DRV-001',
    driverName: 'Juan Pérez',
    location: {
      lat: -34.9011,
      lng: -56.1645,
      address: 'Av. 18 de Julio, Montevideo'
    },
    metadata: {
      speed: 125,
      speedLimit: 80
    },
    escalationLevel: 1,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString()
  },
  {
    id: 'alert-002',
    type: 'battery',
    severity: 'medium',
    status: 'acknowledged',
    title: 'Batería baja',
    message: 'Batería del dispositivo GPS al 15%',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    vehicleId: 'VEH-002',
    vehiclePlate: 'XYZ-5678',
    driverId: 'DRV-002',
    driverName: 'María González',
    metadata: {
      batteryLevel: 15
    },
    acknowledgedBy: 'user-001',
    acknowledgedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString()
  },
  {
    id: 'alert-003',
    type: 'geofence',
    severity: 'critical',
    status: 'active',
    title: 'Violación de geocerca',
    message: 'Vehículo DEF-9012 salió de zona autorizada',
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    vehicleId: 'VEH-003',
    vehiclePlate: 'DEF-9012',
    driverId: 'DRV-003',
    driverName: 'Carlos Rodriguez',
    location: {
      lat: -34.8854,
      lng: -56.1953,
      address: 'Zona Industrial, Montevideo'
    },
    metadata: {
      geofenceName: 'Zona Restringida Centro'
    },
    escalationLevel: 2,
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString()
  },
  {
    id: 'alert-004',
    type: 'maintenance',
    severity: 'medium',
    status: 'active',
    title: 'Mantenimiento pendiente',
    message: 'Vehículo requiere mantenimiento preventivo',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    vehicleId: 'VEH-001',
    vehiclePlate: 'ABC-1234',
    metadata: {
      mileage: 15000,
      lastMaintenance: '2024-01-15'
    },
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  },
  {
    id: 'alert-005',
    type: 'fuel',
    severity: 'low',
    status: 'resolved',
    title: 'Combustible bajo',
    message: 'Nivel de combustible inferior al 20%',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    vehicleId: 'VEH-002',
    vehiclePlate: 'XYZ-5678',
    driverId: 'DRV-002',
    driverName: 'María González',
    metadata: {
      fuelLevel: 18
    },
    resolvedBy: 'user-002',
    resolvedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
  }
];

// Mock alert rules
const mockRules = [
  {
    id: 'rule-001',
    name: 'Límite de velocidad',
    description: 'Alerta cuando un vehículo excede el límite de velocidad',
    type: 'speed',
    severity: 'high',
    enabled: true,
    conditions: [
      { field: 'speed', operator: 'gt', value: 80 }
    ],
    actions: [
      { type: 'notification', recipients: ['admin@example.com'] },
      { type: 'email', template: 'speed_violation' }
    ],
    cooldown: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'admin'
  },
  {
    id: 'rule-002',
    name: 'Batería baja',
    description: 'Alerta cuando la batería del GPS está baja',
    type: 'battery',
    severity: 'medium',
    enabled: true,
    conditions: [
      { field: 'battery', operator: 'lt', value: 20 }
    ],
    actions: [
      { type: 'notification', recipients: ['maintenance@example.com'] }
    ],
    cooldown: 60,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'admin'
  }
];

// Get alert statistics (must be before /:id route)
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { period = '24h' } = req.query;
    
    const stats = {
      total: mockAlerts.length,
      active: mockAlerts.filter(a => a.status === 'active').length,
      critical: mockAlerts.filter(a => a.severity === 'critical').length,
      high: mockAlerts.filter(a => a.severity === 'high').length,
      medium: mockAlerts.filter(a => a.severity === 'medium').length,
      low: mockAlerts.filter(a => a.severity === 'low').length,
      acknowledged: mockAlerts.filter(a => a.status === 'acknowledged').length,
      resolved: mockAlerts.filter(a => a.status === 'resolved').length,
      byType: {
        speed: mockAlerts.filter(a => a.type === 'speed').length,
        geofence: mockAlerts.filter(a => a.type === 'geofence').length,
        route: mockAlerts.filter(a => a.type === 'route').length,
        stop: mockAlerts.filter(a => a.type === 'stop').length,
        engine: mockAlerts.filter(a => a.type === 'engine').length,
        battery: mockAlerts.filter(a => a.type === 'battery').length,
        signal: mockAlerts.filter(a => a.type === 'signal').length,
        maintenance: mockAlerts.filter(a => a.type === 'maintenance').length,
        driver: mockAlerts.filter(a => a.type === 'driver').length,
        security: mockAlerts.filter(a => a.type === 'security').length,
        fuel: mockAlerts.filter(a => a.type === 'fuel').length,
        temperature: mockAlerts.filter(a => a.type === 'temperature').length
      },
      trends: [
        { period: '00:00', count: 12, change: 5 },
        { period: '06:00', count: 8, change: -2 },
        { period: '12:00', count: 15, change: 3 },
        { period: '18:00', count: 23, change: 8 }
      ]
    };
    
    res.json(stats);
  } catch (error) {
    logger.error('Error getting alert stats:', error);
    res.status(500).json({ message: 'Error retrieving alert statistics' });
  }
});

// Get all alerts with filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      types, 
      severities, 
      statuses, 
      vehicleIds, 
      driverIds, 
      dateFrom, 
      dateTo, 
      search,
      page = 1,
      limit = 20
    } = req.query;
    
    let alerts = [...mockAlerts];
    
    // Apply filters
    if (types) {
      const typeFilter = Array.isArray(types) ? types : [types];
      alerts = alerts.filter(alert => typeFilter.includes(alert.type));
    }
    
    if (severities) {
      const severityFilter = Array.isArray(severities) ? severities : [severities];
      alerts = alerts.filter(alert => severityFilter.includes(alert.severity));
    }
    
    if (statuses) {
      const statusFilter = Array.isArray(statuses) ? statuses : [statuses];
      alerts = alerts.filter(alert => statusFilter.includes(alert.status));
    }
    
    if (vehicleIds) {
      const vehicleFilter = Array.isArray(vehicleIds) ? vehicleIds : [vehicleIds];
      alerts = alerts.filter(alert => vehicleFilter.includes(alert.vehicleId));
    }
    
    if (driverIds) {
      const driverFilter = Array.isArray(driverIds) ? driverIds : [driverIds];
      alerts = alerts.filter(alert => driverFilter.includes(alert.driverId));
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      alerts = alerts.filter(alert => 
        alert.title.toLowerCase().includes(searchLower) ||
        alert.message.toLowerCase().includes(searchLower) ||
        alert.vehiclePlate?.toLowerCase().includes(searchLower) ||
        alert.driverName?.toLowerCase().includes(searchLower)
      );
    }
    
    if (dateFrom) {
      alerts = alerts.filter(alert => new Date(alert.timestamp) >= new Date(dateFrom));
    }
    
    if (dateTo) {
      alerts = alerts.filter(alert => new Date(alert.timestamp) <= new Date(dateTo));
    }
    
    // Sort by timestamp (most recent first)
    alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedAlerts = alerts.slice(startIndex, endIndex);
    
    res.json({
      data: paginatedAlerts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: alerts.length,
        pages: Math.ceil(alerts.length / limit)
      }
    });
  } catch (error) {
    logger.error('Error getting alerts:', error);
    res.status(500).json({ message: 'Error retrieving alerts' });
  }
});

// Get alert statistics (must be before /:id route)
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { period = '24h' } = req.query;
    
    const stats = {
      total: mockAlerts.length,
      active: mockAlerts.filter(a => a.status === 'active').length,
      critical: mockAlerts.filter(a => a.severity === 'critical').length,
      high: mockAlerts.filter(a => a.severity === 'high').length,
      medium: mockAlerts.filter(a => a.severity === 'medium').length,
      low: mockAlerts.filter(a => a.severity === 'low').length,
      acknowledged: mockAlerts.filter(a => a.status === 'acknowledged').length,
      resolved: mockAlerts.filter(a => a.status === 'resolved').length,
      byType: {
        speed: mockAlerts.filter(a => a.type === 'speed').length,
        geofence: mockAlerts.filter(a => a.type === 'geofence').length,
        route: mockAlerts.filter(a => a.type === 'route').length,
        stop: mockAlerts.filter(a => a.type === 'stop').length,
        engine: mockAlerts.filter(a => a.type === 'engine').length,
        battery: mockAlerts.filter(a => a.type === 'battery').length,
        signal: mockAlerts.filter(a => a.type === 'signal').length,
        maintenance: mockAlerts.filter(a => a.type === 'maintenance').length,
        driver: mockAlerts.filter(a => a.type === 'driver').length,
        security: mockAlerts.filter(a => a.type === 'security').length,
        fuel: mockAlerts.filter(a => a.type === 'fuel').length,
        temperature: mockAlerts.filter(a => a.type === 'temperature').length
      },
      trends: [
        { period: '00:00', count: 12, change: 5 },
        { period: '06:00', count: 8, change: -2 },
        { period: '12:00', count: 15, change: 3 },
        { period: '18:00', count: 23, change: 8 }
      ]
    };
    
    res.json(stats);
  } catch (error) {
    logger.error('Error getting alert stats:', error);
    res.status(500).json({ message: 'Error retrieving alert statistics' });
  }
});

// Alert Rules Management
router.get('/rules', authenticateToken, async (req, res) => {
  try {
    res.json(mockRules);
  } catch (error) {
    logger.error('Error getting alert rules:', error);
    res.status(500).json({ message: 'Error retrieving alert rules' });
  }
});

router.get('/rules/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const rule = mockRules.find(r => r.id === id);
    
    if (!rule) {
      return res.status(404).json({ message: 'Alert rule not found' });
    }
    
    res.json(rule);
  } catch (error) {
    logger.error('Error getting alert rule:', error);
    res.status(500).json({ message: 'Error retrieving alert rule' });
  }
});

router.post('/rules', authenticateToken, async (req, res) => {
  try {
    const rule = {
      id: uuidv4(),
      ...req.body,
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: req.user.id
    };
    
    mockRules.push(rule);
    
    logger.info(`Alert rule created: ${rule.id}`);
    res.status(201).json(rule);
  } catch (error) {
    logger.error('Error creating alert rule:', error);
    res.status(500).json({ message: 'Error creating alert rule' });
  }
});

router.patch('/rules/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const index = mockRules.findIndex(r => r.id === id);
    
    if (index === -1) {
      return res.status(404).json({ message: 'Alert rule not found' });
    }
    
    mockRules[index] = {
      ...mockRules[index],
      ...req.body,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.id
    };
    
    logger.info(`Alert rule updated: ${id}`);
    res.json(mockRules[index]);
  } catch (error) {
    logger.error('Error updating alert rule:', error);
    res.status(500).json({ message: 'Error updating alert rule' });
  }
});

router.delete('/rules/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const index = mockRules.findIndex(r => r.id === id);
    
    if (index === -1) {
      return res.status(404).json({ message: 'Alert rule not found' });
    }
    
    mockRules.splice(index, 1);
    
    logger.info(`Alert rule deleted: ${id}`);
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting alert rule:', error);
    res.status(500).json({ message: 'Error deleting alert rule' });
  }
});

router.patch('/rules/:id/toggle', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { enabled } = req.body;
    const index = mockRules.findIndex(r => r.id === id);
    
    if (index === -1) {
      return res.status(404).json({ message: 'Alert rule not found' });
    }
    
    mockRules[index] = {
      ...mockRules[index],
      enabled: enabled,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.id
    };
    
    logger.info(`Alert rule ${enabled ? 'enabled' : 'disabled'}: ${id}`);
    res.json(mockRules[index]);
  } catch (error) {
    logger.error('Error toggling alert rule:', error);
    res.status(500).json({ message: 'Error toggling alert rule' });
  }
});

// Test alert rule
router.post('/rules/:id/test', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const rule = mockRules.find(r => r.id === id);
    
    if (!rule) {
      return res.status(404).json({ message: 'Alert rule not found' });
    }
    
    // Simulate rule test
    const testResult = {
      success: true,
      message: 'Rule test completed successfully',
      conditions_met: rule.conditions.length,
      actions_triggered: rule.actions.length,
      execution_time: Math.floor(Math.random() * 100) + 50 // ms
    };
    
    logger.info(`Alert rule tested: ${id}`);
    res.json(testResult);
  } catch (error) {
    logger.error('Error testing alert rule:', error);
    res.status(500).json({ message: 'Error testing alert rule' });
  }
});

// Export alerts
router.post('/export', authenticateToken, async (req, res) => {
  try {
    const { format = 'csv', ...filters } = req.body;
    
    // For now, just return a success message
    // In production, this would generate the actual file
    res.json({
      success: true,
      message: `Export in ${format} format initiated`,
      downloadUrl: `/api/alerts/download/${uuidv4()}`,
      estimatedCompletion: new Date(Date.now() + 30000).toISOString()
    });
  } catch (error) {
    logger.error('Error exporting alerts:', error);
    res.status(500).json({ message: 'Error exporting alerts' });
  }
});

// Notification settings
router.get('/notifications/settings', authenticateToken, async (req, res) => {
  try {
    const settings = {
      realTimeNotifications: true,
      soundAlerts: true,
      emailNotifications: false,
      smsNotifications: false,
      emailRecipients: ['admin@example.com'],
      smsRecipients: ['+59899123456'],
      quietHours: {
        enabled: true,
        start: '22:00',
        end: '08:00'
      },
      escalationSettings: {
        enabled: true,
        levels: [
          { afterMinutes: 5, action: 'email' },
          { afterMinutes: 15, action: 'sms' },
          { afterMinutes: 30, action: 'call' }
        ]
      }
    };
    
    res.json(settings);
  } catch (error) {
    logger.error('Error getting notification settings:', error);
    res.status(500).json({ message: 'Error retrieving notification settings' });
  }
});

router.patch('/notifications/settings', authenticateToken, async (req, res) => {
  try {
    const settings = req.body;
    
    // In production, save to database
    logger.info(`Notification settings updated by ${req.user.id}`);
    res.json({ success: true, message: 'Notification settings updated' });
  } catch (error) {
    logger.error('Error updating notification settings:', error);
    res.status(500).json({ message: 'Error updating notification settings' });
  }
});

module.exports = router;