const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const gpsSimulator = require('../services/gpsSimulator');

// Mock vehicle positions for development
const mockVehiclePositions = [
  {
    vehicleId: 'VEH-001',
    plateNumber: 'ABC-1234',
    driverId: 'DRV-001',
    driverName: 'Juan Pérez',
    position: { lat: -34.9011, lng: -56.1645 },
    speed: 45,
    heading: 135,
    timestamp: new Date().toISOString(),
    status: 'active',
    battery: 85,
    signal: 90,
    engineStatus: true,
    fuel: 65,
    temperature: 22,
    tripId: 'TRIP-001',
  },
  {
    vehicleId: 'VEH-002',
    plateNumber: 'XYZ-5678',
    driverId: 'DRV-002',
    driverName: 'María González',
    position: { lat: -34.8721, lng: -56.1819 },
    speed: 0,
    heading: 45,
    timestamp: new Date().toISOString(),
    status: 'idle',
    battery: 92,
    signal: 85,
    engineStatus: false,
    fuel: 80,
    temperature: 21,
  },
  {
    vehicleId: 'VEH-003',
    plateNumber: 'DEF-9012',
    driverId: 'DRV-003',
    driverName: 'Carlos Rodriguez',
    position: { lat: -34.8854, lng: -56.1953 },
    speed: 62,
    heading: 270,
    timestamp: new Date().toISOString(),
    status: 'active',
    battery: 70,
    signal: 75,
    engineStatus: true,
    fuel: 45,
    temperature: 23,
    tripId: 'TRIP-002',
    alerts: [
      {
        id: 'ALERT-001',
        type: 'speed',
        severity: 'medium',
        message: 'Velocidad sobre el límite permitido',
        timestamp: new Date().toISOString(),
      },
    ],
  },
];

// Mock geofences
const mockGeofences = [
  {
    id: 'GEO-001',
    name: 'Terminal Montevideo',
    type: 'circle',
    coordinates: { lat: -34.9011, lng: -56.1645 },
    radius: 500,
    active: true,
    vehicleIds: ['VEH-001', 'VEH-002'],
    alertOnEntry: true,
    alertOnExit: true,
  },
  {
    id: 'GEO-002',
    name: 'Zona Restringida Centro',
    type: 'polygon',
    coordinates: [
      [-56.1745, -34.9111],
      [-56.1545, -34.9111],
      [-56.1545, -34.8911],
      [-56.1745, -34.8911],
    ],
    active: true,
    alertOnEntry: true,
  },
];

// Mock routes
const mockRoutes = [
  {
    id: 'ROUTE-001',
    name: 'Ruta Montevideo - Salto',
    waypoints: [
      [-56.1645, -34.9011], // Montevideo
      [-56.2878, -34.7633], // Canelones
      [-56.3908, -34.3375], // Florida
      [-56.5000, -33.5167], // Durazno
      [-56.8967, -31.7167], // Tacuarembó
      [-57.9605, -31.3833], // Salto
    ],
    color: '#1976D2',
    active: true,
    vehicleIds: ['VEH-001'],
  },
];

// Get real-time vehicle positions
router.get('/positions', authenticateToken, async (req, res) => {
  try {
    const { status, vehicles, alerts } = req.query;
    
    // Get live positions from GPS simulator
    let positions = gpsSimulator.getVehiclePositions();
    
    // Apply filters
    if (status) {
      const statusFilter = Array.isArray(status) ? status : [status];
      positions = positions.filter(p => statusFilter.includes(p.status));
    }
    
    if (vehicles) {
      const vehicleFilter = Array.isArray(vehicles) ? vehicles : [vehicles];
      positions = positions.filter(p => vehicleFilter.includes(p.vehicleId));
    }
    
    if (alerts === 'true') {
      positions = positions.filter(p => p.alerts && p.alerts.length > 0);
    }
    
    res.json(positions);
  } catch (error) {
    logger.error('Error getting vehicle positions:', error);
    res.status(500).json({ message: 'Error retrieving positions' });
  }
});

// Get single vehicle position
router.get('/positions/:vehicleId', authenticateToken, async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const position = gpsSimulator.getVehiclePosition(vehicleId);
    
    if (!position) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    
    res.json(position);
  } catch (error) {
    logger.error('Error getting vehicle position:', error);
    res.status(500).json({ message: 'Error retrieving position' });
  }
});

// Get vehicle history
router.get('/history/:vehicleId', authenticateToken, async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { dateFrom, dateTo } = req.query;
    
    // Generate mock history data
    const history = {
      vehicleId,
      positions: [],
      dateFrom,
      dateTo,
    };
    
    // Generate positions for last 24 hours
    const now = new Date();
    for (let i = 0; i < 288; i++) { // Every 5 minutes for 24 hours
      const timestamp = new Date(now.getTime() - i * 5 * 60 * 1000);
      history.positions.push({
        lat: -34.9011 + (Math.random() - 0.5) * 0.1,
        lng: -56.1645 + (Math.random() - 0.5) * 0.1,
        timestamp: timestamp.toISOString(),
        speed: Math.random() * 80,
        heading: Math.random() * 360,
      });
    }
    
    res.json(history);
  } catch (error) {
    logger.error('Error getting vehicle history:', error);
    res.status(500).json({ message: 'Error retrieving history' });
  }
});

// Legacy endpoints for compatibility
router.get('/live', authenticateToken, async (req, res) => {
  try {
    const positions = gpsSimulator.getVehiclePositions();
    res.json({ vehicles: positions });
  } catch (error) {
    res.json({ vehicles: gpsSimulator.getVehiclePositions() });
  }
});

router.get('/history', authenticateToken, async (req, res) => {
  try {
    res.json({ data: [] });
  } catch (error) {
    res.json({ data: [] });
  }
});

// Get all geofences
router.get('/geofences', authenticateToken, async (req, res) => {
  try {
    res.json(mockGeofences);
  } catch (error) {
    logger.error('Error getting geofences:', error);
    res.status(500).json({ message: 'Error retrieving geofences' });
  }
});

// Create geofence
router.post('/geofences', authenticateToken, async (req, res) => {
  try {
    const geofence = {
      id: uuidv4(),
      ...req.body,
      createdAt: new Date().toISOString(),
      createdBy: req.user.id,
    };
    
    mockGeofences.push(geofence);
    logger.info(`Geofence created: ${geofence.id}`);
    res.status(201).json(geofence);
  } catch (error) {
    logger.error('Error creating geofence:', error);
    res.status(500).json({ message: 'Error creating geofence' });
  }
});

// Update geofence
router.put('/geofences/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const index = mockGeofences.findIndex(g => g.id === id);
    
    if (index === -1) {
      return res.status(404).json({ message: 'Geofence not found' });
    }
    
    mockGeofences[index] = {
      ...mockGeofences[index],
      ...req.body,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.id,
    };
    
    res.json(mockGeofences[index]);
  } catch (error) {
    logger.error('Error updating geofence:', error);
    res.status(500).json({ message: 'Error updating geofence' });
  }
});

// Delete geofence
router.delete('/geofences/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const index = mockGeofences.findIndex(g => g.id === id);
    
    if (index === -1) {
      return res.status(404).json({ message: 'Geofence not found' });
    }
    
    mockGeofences.splice(index, 1);
    res.status(204).send();
  } catch (error) {
    logger.error('Error deleting geofence:', error);
    res.status(500).json({ message: 'Error deleting geofence' });
  }
});

// Get all routes
router.get('/routes', authenticateToken, async (req, res) => {
  try {
    res.json(mockRoutes);
  } catch (error) {
    logger.error('Error getting routes:', error);
    res.status(500).json({ message: 'Error retrieving routes' });
  }
});

// Create route
router.post('/routes', authenticateToken, async (req, res) => {
  try {
    const route = {
      id: uuidv4(),
      ...req.body,
      createdAt: new Date().toISOString(),
      createdBy: req.user.id,
    };
    
    mockRoutes.push(route);
    logger.info(`Route created: ${route.id}`);
    res.status(201).json(route);
  } catch (error) {
    logger.error('Error creating route:', error);
    res.status(500).json({ message: 'Error creating route' });
  }
});

// Get tracking alerts
router.get('/alerts', authenticateToken, async (req, res) => {
  try {
    const { vehicleId, severity, resolved } = req.query;
    
    // Collect all alerts from vehicles in GPS simulator
    let alerts = [];
    const vehicles = gpsSimulator.getVehiclePositions();
    vehicles.forEach(vehicle => {
      if (vehicle.alerts) {
        alerts = [...alerts, ...vehicle.alerts.map(alert => ({
          ...alert,
          vehicleId: vehicle.vehicleId,
          plateNumber: vehicle.plateNumber,
        }))];
      }
    });
    
    // Apply filters
    if (vehicleId) {
      alerts = alerts.filter(a => a.vehicleId === vehicleId);
    }
    
    if (severity) {
      alerts = alerts.filter(a => a.severity === severity);
    }
    
    res.json(alerts);
  } catch (error) {
    logger.error('Error getting alerts:', error);
    res.status(500).json({ message: 'Error retrieving alerts' });
  }
});

// Send command to vehicle
router.post('/vehicles/:vehicleId/commands', authenticateToken, async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { command, params } = req.body;
    
    // Simulate command execution
    logger.info(`Command sent to vehicle ${vehicleId}: ${command}`);
    
    res.json({
      success: true,
      vehicleId,
      command,
      executedAt: new Date().toISOString(),
      response: 'Command executed successfully',
    });
  } catch (error) {
    logger.error('Error sending command:', error);
    res.status(500).json({ message: 'Error sending command' });
  }
});

// Export tracking data
router.post('/export', authenticateToken, async (req, res) => {
  try {
    const { format = 'csv' } = req.body;
    
    // For now, just return a success message
    // In production, this would generate the actual file
    res.json({
      success: true,
      message: `Export in ${format} format initiated`,
      downloadUrl: `/api/tracking/download/${uuidv4()}`,
    });
  } catch (error) {
    logger.error('Error exporting data:', error);
    res.status(500).json({ message: 'Error exporting data' });
  }
});

// Get traffic data
router.get('/traffic', authenticateToken, async (req, res) => {
  try {
    const { north, south, east, west } = req.query;
    
    // Return mock traffic data
    res.json({
      congestionSegments: [
        {
          id: 'traffic-001',
          level: 'heavy',
          coordinates: [[-56.1645, -34.9011], [-56.1745, -34.9111]],
        },
        {
          id: 'traffic-002',
          level: 'moderate',
          coordinates: [[-56.1545, -34.8911], [-56.1445, -34.8811]],
        },
      ],
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error getting traffic data:', error);
    res.status(500).json({ message: 'Error retrieving traffic data' });
  }
});

module.exports = router;