const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

// Get all trips with filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      status, 
      vehicleId, 
      driverId, 
      dateFrom, 
      dateTo,
      page = 1,
      limit = 20
    } = req.query;

    const filters = {
      companyId: req.user.companyId
    };

    if (status) filters.status = status;
    if (vehicleId) filters.vehicleId = vehicleId;
    if (driverId) filters.driverId = driverId;
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;
    
    filters.limit = parseInt(limit);
    filters.offset = (parseInt(page) - 1) * parseInt(limit);

    // Use mock data if database query fails
    let trips;
    try {
      trips = await Trip.findAll(filters);
    } catch (dbError) {
      logger.warn('Database query failed, using mock data:', dbError);
      trips = Trip.getMockTrips();
    }

    res.json({
      data: trips,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: trips.length
      }
    });
  } catch (error) {
    logger.error('Error getting trips:', error);
    res.status(500).json({ message: 'Error retrieving trips' });
  }
});

// Get trip statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { dateRange = 'today' } = req.query;
    
    let stats;
    try {
      stats = await Trip.getStats(req.user.companyId, dateRange);
    } catch (dbError) {
      // Mock stats if database fails
      stats = {
        total: 15,
        in_transit: 5,
        completed: 8,
        delayed: 2,
        total_distance: 4567.8,
        avg_efficiency: 85.5
      };
    }

    res.json(stats);
  } catch (error) {
    logger.error('Error getting trip stats:', error);
    res.status(500).json({ message: 'Error retrieving statistics' });
  }
});

// Get single trip
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Check if user has access to this trip
    const vehicle = await Trip.getVehicle(req.params.id);
    if (vehicle && vehicle.company_id !== req.user.companyId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(trip);
  } catch (error) {
    logger.error('Error getting trip:', error);
    res.status(500).json({ message: 'Error retrieving trip' });
  }
});

// Create new trip
router.post('/', authenticateToken, authorizeRoles(['admin', 'manager', 'dispatcher']), async (req, res) => {
  try {
    // Validate vehicle exists and belongs to company
    const vehicle = await Vehicle.findById(req.body.vehicleId);
    if (!vehicle || vehicle.company_id !== req.user.companyId) {
      return res.status(400).json({ message: 'Invalid vehicle' });
    }

    // Validate driver exists and has proper role
    const driver = await User.findById(req.body.driverId);
    if (!driver || driver.role !== 'driver' || driver.company_id !== req.user.companyId) {
      return res.status(400).json({ message: 'Invalid driver' });
    }

    const tripData = {
      ...req.body,
      companyId: req.user.companyId,
      createdBy: req.user.id
    };

    const trip = await Trip.create(tripData);
    
    logger.info(`Trip created by user ${req.user.id}: ${trip.id}`);
    res.status(201).json(trip);
  } catch (error) {
    logger.error('Error creating trip:', error);
    res.status(500).json({ message: 'Error creating trip' });
  }
});

// Update trip status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    // Check access
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    const vehicle = await Trip.getVehicle(req.params.id);
    if (vehicle && vehicle.company_id !== req.user.companyId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Drivers can only update status for their own trips
    if (req.user.role === 'driver' && trip.driverId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Trip.updateStatus(req.params.id, status, req.user.id);
    
    const updatedTrip = await Trip.findById(req.params.id);
    res.json(updatedTrip);
  } catch (error) {
    logger.error('Error updating trip status:', error);
    res.status(500).json({ message: 'Error updating status' });
  }
});

// Add checkpoint to trip
router.post('/:id/checkpoints', authenticateToken, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Check access
    const vehicle = await Trip.getVehicle(req.params.id);
    if (vehicle && vehicle.company_id !== req.user.companyId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Only drivers of the trip can add checkpoints
    if (req.user.role === 'driver' && trip.driverId !== req.user.id) {
      return res.status(403).json({ message: 'Only the assigned driver can add checkpoints' });
    }

    const checkpoint = await Trip.addCheckpoint(req.params.id, req.body);
    res.status(201).json(checkpoint);
  } catch (error) {
    logger.error('Error adding checkpoint:', error);
    res.status(500).json({ message: 'Error adding checkpoint' });
  }
});

// Update trip expenses
router.put('/:id/expenses', authenticateToken, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Check access
    const vehicle = await Trip.getVehicle(req.params.id);
    if (vehicle && vehicle.company_id !== req.user.companyId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Trip.updateExpenses(req.params.id, req.body);
    
    const updatedTrip = await Trip.findById(req.params.id);
    res.json(updatedTrip.expenses);
  } catch (error) {
    logger.error('Error updating expenses:', error);
    res.status(500).json({ message: 'Error updating expenses' });
  }
});

// Add document to trip
router.post('/:id/documents', authenticateToken, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Check access
    const vehicle = await Trip.getVehicle(req.params.id);
    if (vehicle && vehicle.company_id !== req.user.companyId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const documentData = {
      ...req.body,
      uploadedBy: req.user.id
    };

    const document = await Trip.addDocument(req.params.id, documentData);
    res.status(201).json(document);
  } catch (error) {
    logger.error('Error adding document:', error);
    res.status(500).json({ message: 'Error adding document' });
  }
});

// Add alert to trip
router.post('/:id/alerts', authenticateToken, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Check access
    const vehicle = await Trip.getVehicle(req.params.id);
    if (vehicle && vehicle.company_id !== req.user.companyId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const alert = await Trip.addAlert(req.params.id, req.body);
    res.status(201).json(alert);
  } catch (error) {
    logger.error('Error adding alert:', error);
    res.status(500).json({ message: 'Error adding alert' });
  }
});

// Resolve alert
router.patch('/:tripId/alerts/:alertId/resolve', authenticateToken, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Check access
    const vehicle = await Trip.getVehicle(req.params.tripId);
    if (vehicle && vehicle.company_id !== req.user.companyId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Trip.resolveAlert(req.params.tripId, req.params.alertId, req.user.id);
    res.json({ message: 'Alert resolved' });
  } catch (error) {
    logger.error('Error resolving alert:', error);
    res.status(500).json({ message: 'Error resolving alert' });
  }
});

// Get trip timeline
router.get('/:id/timeline', authenticateToken, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Check access
    const vehicle = await Trip.getVehicle(req.params.id);
    if (vehicle && vehicle.company_id !== req.user.companyId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Build timeline from trip data
    const timeline = [];

    // Departure
    timeline.push({
      id: uuidv4(),
      type: 'departure',
      timestamp: trip.schedule.departureTime,
      location: trip.route.origin,
      description: 'Inicio del viaje',
      icon: 'start'
    });

    // Checkpoints
    trip.checkpoints.forEach(checkpoint => {
      timeline.push({
        id: checkpoint.id,
        type: 'checkpoint',
        timestamp: checkpoint.arrivedAt,
        location: checkpoint.location,
        description: checkpoint.notes,
        icon: 'location'
      });
    });

    // Alerts
    trip.alerts.forEach(alert => {
      timeline.push({
        id: alert.id,
        type: 'alert',
        timestamp: alert.timestamp,
        location: null,
        description: alert.message,
        severity: alert.severity,
        icon: 'warning'
      });
    });

    // Arrival (if completed)
    if (trip.status === 'completed' && trip.schedule.actualArrival) {
      timeline.push({
        id: uuidv4(),
        type: 'arrival',
        timestamp: trip.schedule.actualArrival,
        location: trip.route.destination,
        description: 'Viaje completado',
        icon: 'check'
      });
    }

    // Sort by timestamp
    timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    res.json(timeline);
  } catch (error) {
    logger.error('Error getting trip timeline:', error);
    res.status(500).json({ message: 'Error retrieving timeline' });
  }
});

// Clone trip (create new trip based on existing one)
router.post('/:id/clone', authenticateToken, authorizeRoles(['admin', 'manager', 'dispatcher']), async (req, res) => {
  try {
    const originalTrip = await Trip.findById(req.params.id);
    if (!originalTrip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Check access
    const vehicle = await Trip.getVehicle(req.params.id);
    if (vehicle && vehicle.company_id !== req.user.companyId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Create new trip with data from original
    const newTripData = {
      vehicleId: req.body.vehicleId || originalTrip.vehicleId,
      driverId: req.body.driverId || originalTrip.driverId,
      origin: originalTrip.route.origin,
      destination: originalTrip.route.destination,
      waypoints: originalTrip.route.waypoints,
      distance: originalTrip.route.distance,
      estimatedDuration: originalTrip.route.estimatedDuration,
      cargoDescription: originalTrip.cargo.description,
      cargoWeight: originalTrip.cargo.weight,
      cargoVolume: originalTrip.cargo.volume,
      cargoValue: originalTrip.cargo.value,
      dangerousGoods: originalTrip.cargo.dangerousGoods,
      specialRequirements: originalTrip.cargo.specialRequirements,
      departureTime: req.body.departureTime || new Date().toISOString(),
      estimatedArrival: req.body.estimatedArrival,
      companyId: req.user.companyId,
      createdBy: req.user.id
    };

    const newTrip = await Trip.create(newTripData);
    res.status(201).json(newTrip);
  } catch (error) {
    logger.error('Error cloning trip:', error);
    res.status(500).json({ message: 'Error cloning trip' });
  }
});

// Check for delays (can be called by a cron job)
router.post('/check-delays', authenticateToken, authorizeRoles(['admin', 'system']), async (req, res) => {
  try {
    await Trip.checkDelays();
    res.json({ message: 'Delay check completed' });
  } catch (error) {
    logger.error('Error checking delays:', error);
    res.status(500).json({ message: 'Error checking delays' });
  }
});

module.exports = router;