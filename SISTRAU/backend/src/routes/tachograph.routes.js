const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const Tachograph = require('../models/Tachograph');
const logger = require('../utils/logger');

// POST /api/tachograph/record - Crear registro de tacógrafo
router.post('/record',
  authenticateToken,
  authorize(['driver', 'admin']),
  [
    body('vehicleId').notEmpty().withMessage('Vehicle ID is required'),
    body('activity').isIn(Object.values(Tachograph.DRIVER_ACTIVITIES)).withMessage('Invalid activity'),
    body('position.lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    body('position.lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
    body('speed').isFloat({ min: 0 }).withMessage('Invalid speed'),
    body('cardNumber').notEmpty().withMessage('Card number is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const recordData = {
        ...req.body,
        driverId: req.user.id
      };

      const record = await Tachograph.createRecord(recordData);
      
      res.status(201).json({
        message: 'Tachograph record created successfully',
        record: {
          id: record.id,
          timestamp: record.timestamp,
          activity: record.activity,
          signature: record.signature
        }
      });
    } catch (error) {
      logger.error('Error creating tachograph record:', error);
      res.status(500).json({ error: 'Failed to create tachograph record' });
    }
  }
);

// GET /api/tachograph/vehicle/:vehicleId - Obtener registros por vehículo
router.get('/vehicle/:vehicleId',
  authenticateToken,
  authorize(['admin', 'operator', 'transporter']),
  [
    param('vehicleId').notEmpty(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 1000 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const records = await Tachograph.getByVehicle(req.params.vehicleId, {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        limit: parseInt(req.query.limit) || 100
      });

      res.json({
        vehicleId: req.params.vehicleId,
        count: records.length,
        records
      });
    } catch (error) {
      logger.error('Error fetching vehicle tachograph records:', error);
      res.status(500).json({ error: 'Failed to fetch records' });
    }
  }
);

// GET /api/tachograph/driver/:driverId - Obtener registros por conductor
router.get('/driver/:driverId',
  authenticateToken,
  [
    param('driverId').notEmpty(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 1000 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Los conductores solo pueden ver sus propios registros
      if (req.user.role === 'driver' && req.user.id !== req.params.driverId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const records = await Tachograph.getByDriver(req.params.driverId, {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        limit: parseInt(req.query.limit) || 100
      });

      res.json({
        driverId: req.params.driverId,
        count: records.length,
        records
      });
    } catch (error) {
      logger.error('Error fetching driver tachograph records:', error);
      res.status(500).json({ error: 'Failed to fetch records' });
    }
  }
);

// GET /api/tachograph/driver/:driverId/hours - Obtener horas de conducción
router.get('/driver/:driverId/hours',
  authenticateToken,
  [
    param('driverId').notEmpty(),
    query('date').optional().isISO8601()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Los conductores solo pueden ver sus propias horas
      if (req.user.role === 'driver' && req.user.id !== req.params.driverId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const date = req.query.date ? new Date(req.query.date) : new Date();
      const summary = await Tachograph.calculateDriverHours(req.params.driverId, date);

      res.json(summary);
    } catch (error) {
      logger.error('Error calculating driver hours:', error);
      res.status(500).json({ error: 'Failed to calculate hours' });
    }
  }
);

// GET /api/tachograph/driver/:driverId/weekly-summary - Resumen semanal
router.get('/driver/:driverId/weekly-summary',
  authenticateToken,
  [
    param('driverId').notEmpty(),
    query('weekStart').optional().isISO8601()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Los conductores solo pueden ver su propio resumen
      if (req.user.role === 'driver' && req.user.id !== req.params.driverId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const weekStart = req.query.weekStart ? new Date(req.query.weekStart) : new Date();
      const summary = await Tachograph.getWeeklySummary(req.params.driverId, weekStart);

      res.json(summary);
    } catch (error) {
      logger.error('Error getting weekly summary:', error);
      res.status(500).json({ error: 'Failed to get weekly summary' });
    }
  }
);

// POST /api/tachograph/download - Descargar datos con tarjeta de control
router.post('/download',
  authenticateToken,
  authorize(['admin', 'authority', 'operator']),
  [
    body('cardNumber').notEmpty().withMessage('Card number is required'),
    body('cardType').isIn(Object.values(Tachograph.CARD_TYPES)).withMessage('Invalid card type'),
    body('vehicleId').notEmpty().withMessage('Vehicle ID is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Verificar autorización según tipo de tarjeta
      const { cardType } = req.body;
      if (cardType === Tachograph.CARD_TYPES.CONTROL && req.user.role !== 'authority') {
        return res.status(403).json({ error: 'Control card access requires authority role' });
      }

      const downloadData = await Tachograph.downloadWithControlCard(
        req.body.cardNumber,
        req.body.cardType,
        req.body.vehicleId,
        {
          startDate: req.body.startDate,
          endDate: req.body.endDate
        }
      );

      res.json({
        message: 'Data downloaded successfully',
        accessLog: downloadData.accessLog,
        recordCount: downloadData.records.length,
        downloadedAt: downloadData.downloadedAt
      });
    } catch (error) {
      logger.error('Error downloading tachograph data:', error);
      res.status(500).json({ error: 'Failed to download data' });
    }
  }
);

// GET /api/tachograph/violations - Obtener violaciones
router.get('/violations',
  authenticateToken,
  authorize(['admin', 'authority', 'operator']),
  [
    query('driverId').optional(),
    query('vehicleId').optional(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('severity').optional().isIn(['low', 'medium', 'high'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Aquí se implementaría la lógica para buscar violaciones
      // Por ahora, devolvemos un ejemplo
      const violations = [];
      
      res.json({
        count: violations.length,
        violations,
        filters: req.query
      });
    } catch (error) {
      logger.error('Error fetching violations:', error);
      res.status(500).json({ error: 'Failed to fetch violations' });
    }
  }
);

module.exports = router;