const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const Vehicle = require('../models/Vehicle');
const logger = require('../utils/logger');

// Validation rules
const vehicleValidation = [
  body('plateNumber').trim().notEmpty().withMessage('Plate number is required'),
  body('brand').optional().trim(),
  body('model').optional().trim(),
  body('year').optional().isInt({ min: 1990, max: new Date().getFullYear() + 1 }),
  body('type').optional().isIn(['truck', 'van', 'pickup', 'trailer', 'semi']),
  body('maxWeightKg').optional().isFloat({ min: 0 }),
  body('status').optional().isIn(['active', 'inactive', 'maintenance', 'suspended'])
];

// GET /api/vehicles - List vehicles
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    
    // Filter by company if user is transporter
    const companyId = req.user.role === 'transporter' ? req.user.companyId : req.query.companyId;
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      search
    };

    const result = await Vehicle.findByCompany(companyId, options);
    res.json(result);
  } catch (error) {
    logger.error('Error fetching vehicles:', error);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

// GET /api/vehicles/positions - Get real-time vehicle positions
router.get('/positions', authenticate, async (req, res) => {
  try {
    const companyId = req.user.role === 'transporter' ? req.user.companyId : req.query.companyId;
    
    if (!companyId) {
      return res.status(400).json({ error: 'Company ID required' });
    }

    const positions = await Vehicle.getCompanyVehiclePositions(companyId);
    res.json(positions);
  } catch (error) {
    logger.error('Error fetching vehicle positions:', error);
    res.status(500).json({ error: 'Failed to fetch vehicle positions' });
  }
});

// GET /api/vehicles/:id - Get specific vehicle
router.get('/:id', authenticate, param('id').isUUID(), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const vehicle = await Vehicle.getWithCurrentStatus(req.params.id);
    
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Check permissions
    if (req.user.role === 'transporter' && vehicle.company_id !== req.user.companyId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(vehicle);
  } catch (error) {
    logger.error('Error fetching vehicle:', error);
    res.status(500).json({ error: 'Failed to fetch vehicle' });
  }
});

// POST /api/vehicles - Create new vehicle
router.post('/', 
  authenticate,
  authorize(['admin', 'transporter']),
  vehicleValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const vehicleData = {
        ...req.body,
        company_id: req.user.role === 'transporter' ? req.user.companyId : req.body.companyId
      };

      if (!vehicleData.company_id) {
        return res.status(400).json({ error: 'Company ID is required' });
      }

      const vehicle = await Vehicle.create(vehicleData);
      
      logger.info(`Vehicle created: ${vehicle.plate_number} by user ${req.user.id}`);
      res.status(201).json(vehicle);
    } catch (error) {
      logger.error('Error creating vehicle:', error);
      res.status(500).json({ error: 'Failed to create vehicle' });
    }
});

// PUT /api/vehicles/:id - Update vehicle
router.put('/:id',
  authenticate,
  authorize(['admin', 'transporter']),
  param('id').isUUID(),
  vehicleValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const vehicle = await Vehicle.findById(req.params.id);
      
      if (!vehicle) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }

      // Check permissions
      if (req.user.role === 'transporter' && vehicle.company_id !== req.user.companyId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const updateData = { ...req.body };
      delete updateData.company_id; // Can't change company
      delete updateData.plate_number; // Can't change plate number

      const updatedVehicle = await Vehicle.update(req.params.id, updateData);
      
      logger.info(`Vehicle updated: ${vehicle.plate_number} by user ${req.user.id}`);
      res.json(updatedVehicle);
    } catch (error) {
      logger.error('Error updating vehicle:', error);
      res.status(500).json({ error: 'Failed to update vehicle' });
    }
});

// DELETE /api/vehicles/:id - Delete vehicle
router.delete('/:id',
  authenticate,
  authorize(['admin', 'transporter']),
  param('id').isUUID(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const vehicle = await Vehicle.findById(req.params.id);
      
      if (!vehicle) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }

      // Check permissions
      if (req.user.role === 'transporter' && vehicle.company_id !== req.user.companyId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Check if vehicle has active trips
      const activeTrips = await Vehicle.getActiveTrips(req.params.id);
      if (activeTrips.length > 0) {
        return res.status(400).json({ 
          error: 'Cannot delete vehicle with active trips' 
        });
      }

      await Vehicle.delete(req.params.id);
      
      logger.info(`Vehicle deleted: ${vehicle.plate_number} by user ${req.user.id}`);
      res.json({ message: 'Vehicle deleted successfully' });
    } catch (error) {
      logger.error('Error deleting vehicle:', error);
      res.status(500).json({ error: 'Failed to delete vehicle' });
    }
});

// GET /api/vehicles/:id/telemetry - Get vehicle telemetry
router.get('/:id/telemetry',
  authenticate,
  param('id').isUUID(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const vehicle = await Vehicle.findById(req.params.id);
      
      if (!vehicle) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }

      // Check permissions
      if (req.user.role === 'transporter' && vehicle.company_id !== req.user.companyId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const telemetry = await Vehicle.getLatestTelemetry(req.params.id);
      res.json(telemetry || {});
    } catch (error) {
      logger.error('Error fetching telemetry:', error);
      res.status(500).json({ error: 'Failed to fetch telemetry' });
    }
});

// GET /api/vehicles/nearby - Get nearby vehicles
router.get('/nearby',
  authenticate,
  authorize(['admin', 'authority']),
  async (req, res) => {
    try {
      const { latitude, longitude, radius = 50 } = req.query;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ error: 'Latitude and longitude required' });
      }

      const vehicles = await Vehicle.getNearbyVehicles(
        parseFloat(latitude),
        parseFloat(longitude),
        parseFloat(radius)
      );

      res.json(vehicles);
    } catch (error) {
      logger.error('Error fetching nearby vehicles:', error);
      res.status(500).json({ error: 'Failed to fetch nearby vehicles' });
    }
});

module.exports = router;