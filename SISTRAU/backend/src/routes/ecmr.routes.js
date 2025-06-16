const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const ECMR = require('../models/ECMR');
const logger = require('../utils/logger');

// POST /api/ecmr - Crear nuevo e-CMR
router.post('/',
  authenticateToken,
  authorize(['admin', 'operator', 'transporter']),
  [
    body('description').notEmpty().withMessage('Description is required'),
    body('weight').isFloat({ min: 0 }).withMessage('Invalid weight'),
    body('senderName').notEmpty().withMessage('Sender name is required'),
    body('receiverName').notEmpty().withMessage('Receiver name is required'),
    body('carrierName').notEmpty().withMessage('Carrier name is required'),
    body('origin').notEmpty().withMessage('Origin is required'),
    body('destination').notEmpty().withMessage('Destination is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const ecmrData = {
        ...req.body,
        createdBy: req.user.id
      };

      const ecmr = await ECMR.create(ecmrData);
      
      res.status(201).json({
        message: 'e-CMR created successfully',
        ecmr
      });
    } catch (error) {
      logger.error('Error creating e-CMR:', error);
      res.status(500).json({ error: 'Failed to create e-CMR' });
    }
  }
);

// GET /api/ecmr/:id - Obtener e-CMR por ID
router.get('/:id',
  authenticateToken,
  [
    param('id').notEmpty()
  ],
  async (req, res) => {
    try {
      const ecmr = await ECMR.findById(req.params.id);
      
      if (!ecmr) {
        return res.status(404).json({ error: 'e-CMR not found' });
      }

      // Verificar permisos de acceso
      const userCompanyId = req.user.companyId || req.user.company_id;
      const hasAccess = 
        req.user.role === 'admin' ||
        req.user.role === 'authority' ||
        ecmr.sender.taxId === userCompanyId ||
        ecmr.receiver.taxId === userCompanyId ||
        ecmr.carrier.taxId === userCompanyId ||
        ecmr.carrier.driverId === req.user.id;

      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json(ecmr);
    } catch (error) {
      logger.error('Error fetching e-CMR:', error);
      res.status(500).json({ error: 'Failed to fetch e-CMR' });
    }
  }
);

// POST /api/ecmr/:id/issue - Emitir e-CMR
router.post('/:id/issue',
  authenticateToken,
  authorize(['admin', 'operator', 'transporter']),
  [
    param('id').notEmpty()
  ],
  async (req, res) => {
    try {
      const ecmr = await ECMR.issue(req.params.id, req.user.id);
      
      res.json({
        message: 'e-CMR issued successfully',
        ecmr
      });
    } catch (error) {
      logger.error('Error issuing e-CMR:', error);
      if (error.message === 'e-CMR not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'e-CMR must be in draft status to issue') {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to issue e-CMR' });
    }
  }
);

// POST /api/ecmr/:id/sign - Firmar e-CMR
router.post('/:id/sign',
  authenticateToken,
  [
    param('id').notEmpty(),
    body('type').isIn(Object.values(ECMR.SIGNATURE_TYPES)).withMessage('Invalid signature type'),
    body('signature').notEmpty().withMessage('Signature is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const signatureData = {
        type: req.body.type,
        userId: req.user.id,
        signature: req.body.signature,
        location: req.body.location,
        ipAddress: req.ip
      };

      const ecmr = await ECMR.sign(req.params.id, signatureData);
      
      res.json({
        message: 'e-CMR signed successfully',
        ecmr
      });
    } catch (error) {
      logger.error('Error signing e-CMR:', error);
      if (error.message === 'e-CMR not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to sign e-CMR' });
    }
  }
);

// PATCH /api/ecmr/:id/location - Actualizar ubicación
router.patch('/:id/location',
  authenticateToken,
  authorize(['driver', 'admin', 'operator']),
  [
    param('id').notEmpty(),
    body('lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    body('lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const locationData = {
        lat: req.body.lat,
        lng: req.body.lng,
        address: req.body.address
      };

      const ecmr = await ECMR.updateLocation(req.params.id, locationData);
      
      res.json({
        message: 'Location updated successfully',
        ecmr
      });
    } catch (error) {
      logger.error('Error updating location:', error);
      if (error.message === 'e-CMR not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to update location' });
    }
  }
);

// POST /api/ecmr/:id/complete - Completar e-CMR
router.post('/:id/complete',
  authenticateToken,
  authorize(['admin', 'operator']),
  [
    param('id').notEmpty()
  ],
  async (req, res) => {
    try {
      const ecmr = await ECMR.complete(req.params.id, req.user.id);
      
      res.json({
        message: 'e-CMR completed successfully',
        ecmr
      });
    } catch (error) {
      logger.error('Error completing e-CMR:', error);
      if (error.message === 'e-CMR not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('Missing required signatures')) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to complete e-CMR' });
    }
  }
);

// GET /api/ecmr/vehicle/:vehicleId - Obtener e-CMRs por vehículo
router.get('/vehicle/:vehicleId',
  authenticateToken,
  [
    param('vehicleId').notEmpty(),
    query('status').optional().isIn(Object.values(ECMR.STATUS)),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const ecmrs = await ECMR.findByVehicle(req.params.vehicleId, {
        status: req.query.status,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        limit: parseInt(req.query.limit) || 50
      });

      res.json(ecmrs);
    } catch (error) {
      logger.error('Error fetching vehicle e-CMRs:', error);
      res.status(500).json({ error: 'Failed to fetch e-CMRs' });
    }
  }
);

// GET /api/ecmr/company/:companyId - Obtener e-CMRs por empresa
router.get('/company/:companyId',
  authenticateToken,
  [
    param('companyId').notEmpty(),
    query('role').optional().isIn(['sender', 'receiver', 'carrier', 'any']),
    query('status').optional().isIn(Object.values(ECMR.STATUS)),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Si el companyId es 'current', usar el ID de la empresa del usuario
      const companyId = req.params.companyId === 'current' 
        ? (req.user.companyId || req.user.company_id || req.user.id)
        : req.params.companyId;

      const ecmrs = await ECMR.findByCompany(companyId, {
        role: req.query.role || 'any',
        status: req.query.status,
        limit: parseInt(req.query.limit) || 50
      });

      res.json(ecmrs);
    } catch (error) {
      logger.error('Error fetching company e-CMRs:', error);
      res.status(500).json({ error: 'Failed to fetch e-CMRs' });
    }
  }
);

// GET /api/ecmr/:id/verify - Verificar integridad del e-CMR
router.get('/:id/verify',
  authenticateToken,
  [
    param('id').notEmpty()
  ],
  async (req, res) => {
    try {
      const verification = await ECMR.verifyIntegrity(req.params.id);
      
      res.json(verification);
    } catch (error) {
      logger.error('Error verifying e-CMR:', error);
      if (error.message === 'e-CMR not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to verify e-CMR' });
    }
  }
);

// GET /api/ecmr/statistics - Obtener estadísticas
router.get('/statistics',
  authenticateToken,
  authorize(['admin', 'operator', 'authority']),
  async (req, res) => {
    try {
      const stats = await ECMR.getStatistics(req.query);
      
      res.json(stats);
    } catch (error) {
      logger.error('Error fetching statistics:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  }
);

module.exports = router;