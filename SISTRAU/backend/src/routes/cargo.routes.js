const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const CargoGuide = require('../models/CargoGuide');
const Trip = require('../models/Trip');
const { generateGuideNumber } = require('../utils/helpers');
const { createBlockchainRecord } = require('../services/blockchainService');
const logger = require('../utils/logger');

// Validation rules
const cargoGuideValidation = [
  body('tripId').optional().isUUID(),
  body('shipperName').trim().notEmpty().withMessage('Shipper name is required'),
  body('shipperRut').trim().notEmpty().withMessage('Shipper RUT is required'),
  body('receiverName').trim().notEmpty().withMessage('Receiver name is required'),
  body('receiverRut').trim().notEmpty().withMessage('Receiver RUT is required'),
  body('cargoDescription').trim().notEmpty().withMessage('Cargo description is required'),
  body('weightKg').isFloat({ min: 0 }).withMessage('Weight must be a positive number'),
  body('volumeM3').optional().isFloat({ min: 0 }),
  body('declaredValue').optional().isFloat({ min: 0 }),
];

// GET /api/cargo/guides - List cargo guides
router.get('/guides', authenticate, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      tripId,
      startDate,
      endDate,
      status,
    } = req.query;

    const filters = {};
    
    // Apply filters based on user role
    if (req.user.role === 'transporter' && req.user.companyId) {
      filters.companyId = req.user.companyId;
    }
    
    if (tripId) filters.tripId = tripId;
    if (search) filters.search = search;
    if (startDate || endDate) {
      filters.dateRange = { startDate, endDate };
    }
    if (status) filters.status = status;

    const result = await CargoGuide.findAll({
      filters,
      page: parseInt(page),
      limit: parseInt(limit),
    });

    res.json(result);
  } catch (error) {
    logger.error('Error fetching cargo guides:', error);
    res.status(500).json({ error: 'Failed to fetch cargo guides' });
  }
});

// GET /api/cargo/guides/:id - Get specific cargo guide
router.get('/guides/:id', authenticate, param('id').isUUID(), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const guide = await CargoGuide.findById(req.params.id);
    
    if (!guide) {
      return res.status(404).json({ error: 'Cargo guide not found' });
    }

    // Check access permissions
    if (req.user.role === 'transporter' && guide.companyId !== req.user.companyId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(guide);
  } catch (error) {
    logger.error('Error fetching cargo guide:', error);
    res.status(500).json({ error: 'Failed to fetch cargo guide' });
  }
});

// POST /api/cargo/guides - Create new cargo guide
router.post('/guides', authenticate, cargoGuideValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const guideData = {
      ...req.body,
      guideNumber: await generateGuideNumber(),
      createdBy: req.user.id,
    };

    // If tripId is provided, validate it exists and user has access
    if (guideData.tripId) {
      const trip = await Trip.findById(guideData.tripId);
      if (!trip) {
        return res.status(400).json({ error: 'Invalid trip ID' });
      }
      
      // Check if user has access to this trip
      if (req.user.role === 'transporter') {
        const vehicle = await trip.getVehicle();
        if (vehicle.companyId !== req.user.companyId) {
          return res.status(403).json({ error: 'Access denied to this trip' });
        }
      }
    }

    // Create cargo guide
    const guide = await CargoGuide.create(guideData);

    // Create blockchain record for immutability
    try {
      const blockchainHash = await createBlockchainRecord({
        type: 'cargo_guide',
        guideId: guide.id,
        guideNumber: guide.guideNumber,
        shipperRut: guide.shipperRut,
        receiverRut: guide.receiverRut,
        weightKg: guide.weightKg,
        timestamp: guide.createdAt,
      });

      // Update guide with blockchain hash
      await CargoGuide.update(guide.id, { blockchainHash });
      guide.blockchainHash = blockchainHash;
    } catch (blockchainError) {
      logger.error('Blockchain recording failed:', blockchainError);
      // Continue without blockchain (can be retried later)
    }

    logger.info(`Cargo guide created: ${guide.guideNumber} by user ${req.user.id}`);
    res.status(201).json(guide);

  } catch (error) {
    logger.error('Error creating cargo guide:', error);
    res.status(500).json({ error: 'Failed to create cargo guide' });
  }
});

// PUT /api/cargo/guides/:id - Update cargo guide
router.put('/guides/:id', 
  authenticate, 
  param('id').isUUID(),
  cargoGuideValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const guide = await CargoGuide.findById(req.params.id);
      
      if (!guide) {
        return res.status(404).json({ error: 'Cargo guide not found' });
      }

      // Check permissions
      if (req.user.role === 'transporter' && guide.companyId !== req.user.companyId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Don't allow updates if guide is already verified
      if (guide.isVerified) {
        return res.status(400).json({ error: 'Cannot update verified cargo guide' });
      }

      // Update guide
      const updatedGuide = await CargoGuide.update(req.params.id, {
        ...req.body,
        updatedBy: req.user.id,
      });

      // Create new blockchain record for the update
      try {
        const blockchainHash = await createBlockchainRecord({
          type: 'cargo_guide_update',
          guideId: updatedGuide.id,
          guideNumber: updatedGuide.guideNumber,
          updateBy: req.user.id,
          timestamp: new Date(),
        });

        await CargoGuide.update(updatedGuide.id, { blockchainHash });
        updatedGuide.blockchainHash = blockchainHash;
      } catch (blockchainError) {
        logger.error('Blockchain update failed:', blockchainError);
      }

      logger.info(`Cargo guide updated: ${guide.guideNumber} by user ${req.user.id}`);
      res.json(updatedGuide);

    } catch (error) {
      logger.error('Error updating cargo guide:', error);
      res.status(500).json({ error: 'Failed to update cargo guide' });
    }
});

// POST /api/cargo/guides/:id/verify - Verify cargo guide
router.post('/guides/:id/verify',
  authenticate,
  authorize(['authority', 'admin']),
  param('id').isUUID(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const guide = await CargoGuide.findById(req.params.id);
      
      if (!guide) {
        return res.status(404).json({ error: 'Cargo guide not found' });
      }

      if (guide.isVerified) {
        return res.status(400).json({ error: 'Cargo guide already verified' });
      }

      // Verify the guide
      const verifiedGuide = await CargoGuide.verify(req.params.id, req.user.id);

      // Record verification in blockchain
      try {
        const blockchainHash = await createBlockchainRecord({
          type: 'cargo_guide_verification',
          guideId: verifiedGuide.id,
          guideNumber: verifiedGuide.guideNumber,
          verifiedBy: req.user.id,
          timestamp: new Date(),
        });

        await CargoGuide.update(verifiedGuide.id, { blockchainHash });
      } catch (blockchainError) {
        logger.error('Blockchain verification failed:', blockchainError);
      }

      logger.info(`Cargo guide verified: ${guide.guideNumber} by authority ${req.user.id}`);
      res.json(verifiedGuide);

    } catch (error) {
      logger.error('Error verifying cargo guide:', error);
      res.status(500).json({ error: 'Failed to verify cargo guide' });
    }
});

// GET /api/cargo/guides/:id/qr - Generate QR code for cargo guide
router.get('/guides/:id/qr',
  authenticate,
  param('id').isUUID(),
  async (req, res) => {
    try {
      const guide = await CargoGuide.findById(req.params.id);
      
      if (!guide) {
        return res.status(404).json({ error: 'Cargo guide not found' });
      }

      // Generate QR code data
      const qrData = {
        guideNumber: guide.guideNumber,
        id: guide.id,
        verificationUrl: `${process.env.FRONTEND_URL}/verify-cargo/${guide.id}`,
        blockchainHash: guide.blockchainHash,
      };

      // In production, generate actual QR code image
      // For now, return the data that would be encoded
      res.json({
        qrData: JSON.stringify(qrData),
        guide: {
          guideNumber: guide.guideNumber,
          shipperName: guide.shipperName,
          receiverName: guide.receiverName,
          isVerified: guide.isVerified,
        },
      });

    } catch (error) {
      logger.error('Error generating QR code:', error);
      res.status(500).json({ error: 'Failed to generate QR code' });
    }
});

// GET /api/cargo/statistics - Get cargo statistics
router.get('/statistics',
  authenticate,
  authorize(['admin', 'authority', 'transporter']),
  async (req, res) => {
    try {
      const { startDate, endDate, companyId } = req.query;

      const filters = {};
      if (startDate || endDate) {
        filters.dateRange = { startDate, endDate };
      }
      
      // Transporters can only see their own statistics
      if (req.user.role === 'transporter') {
        filters.companyId = req.user.companyId;
      } else if (companyId) {
        filters.companyId = companyId;
      }

      const stats = await CargoGuide.getStatistics(filters);

      res.json(stats);

    } catch (error) {
      logger.error('Error fetching cargo statistics:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// POST /api/cargo/guides/bulk-verify - Bulk verify cargo guides
router.post('/guides/bulk-verify',
  authenticate,
  authorize(['authority', 'admin']),
  body('guideIds').isArray().withMessage('Guide IDs must be an array'),
  body('guideIds.*').isUUID(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { guideIds } = req.body;
      const results = {
        verified: [],
        failed: [],
      };

      for (const guideId of guideIds) {
        try {
          const guide = await CargoGuide.findById(guideId);
          if (guide && !guide.isVerified) {
            await CargoGuide.verify(guideId, req.user.id);
            results.verified.push(guideId);
          } else {
            results.failed.push({
              id: guideId,
              reason: guide ? 'Already verified' : 'Not found',
            });
          }
        } catch (error) {
          results.failed.push({
            id: guideId,
            reason: error.message,
          });
        }
      }

      logger.info(`Bulk verification completed: ${results.verified.length} verified, ${results.failed.length} failed`);
      res.json(results);

    } catch (error) {
      logger.error('Error in bulk verification:', error);
      res.status(500).json({ error: 'Failed to process bulk verification' });
    }
});

module.exports = router;