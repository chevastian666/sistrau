const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const crypto = require('crypto');
const logger = require('../utils/logger');
const { emitECMRUpdate, emitECMREvent } = require('../services/socketService');

// Mock data generators
const generateMockCompany = (type) => {
  const companies = {
    sender: [
      { name: 'Logística del Este S.A.', taxId: 'UY214587963', address: 'Av. Italia 4567, Montevideo', contact: '+598 94 123 456' },
      { name: 'Transportes Unidos Ltda.', taxId: 'UY215896347', address: 'Ruta 5 Km 23, Canelones', contact: '+598 94 234 567' },
      { name: 'Exportadora Nacional', taxId: 'UY216985234', address: 'Camino Maldonado 1234, Montevideo', contact: '+598 94 345 678' }
    ],
    receiver: [
      { name: 'Importadora del Sur', taxId: 'AR30589674123', address: 'Av. Libertador 2345, Buenos Aires', contact: '+54 11 4567 8901' },
      { name: 'Distribuidora Brasileña', taxId: 'BR12345678901', address: 'Rua das Flores 789, Porto Alegre', contact: '+55 51 3456 7890' },
      { name: 'Comercial Rivera', taxId: 'UY217896523', address: 'Av. Sarandí 567, Rivera', contact: '+598 94 456 789' }
    ],
    carrier: [
      { name: 'Trans Uruguay S.A.', taxId: 'UY218965478', address: 'Ruta 1 Km 45, Colonia', contact: '+598 94 567 890', license: 'MTOP-2024-0123' },
      { name: 'Flota Internacional', taxId: 'UY219874563', address: 'Av. del Puerto 234, Montevideo', contact: '+598 94 678 901', license: 'MTOP-2024-0234' },
      { name: 'Logística Express', taxId: 'UY220985647', address: 'Camino Carrasco 890, Montevideo', contact: '+598 94 789 012', license: 'MTOP-2024-0345' }
    ]
  };
  const companyList = companies[type] || companies.sender;
  return companyList[Math.floor(Math.random() * companyList.length)];
};

const generateMockGoods = () => {
  const goods = [
    { description: 'Contenedor 40ft - Productos electrónicos', packages: 1, weight: 18500, volume: 67.7, dangerousGoods: false, unCode: null },
    { description: 'Pallets - Alimentos no perecederos', packages: 24, weight: 12000, volume: 28.8, dangerousGoods: false, unCode: null },
    { description: 'Carga general - Textiles', packages: 150, weight: 8500, volume: 45.0, dangerousGoods: false, unCode: null },
    { description: 'Tanque - Productos químicos Clase 3', packages: 1, weight: 20000, volume: 25.0, dangerousGoods: true, unCode: 'UN1203', hazardClass: '3' },
    { description: 'Maquinaria agrícola', packages: 3, weight: 15000, volume: 52.0, dangerousGoods: false, unCode: null },
    { description: 'Madera aserrada', packages: 1, weight: 22000, volume: 33.0, dangerousGoods: false, unCode: null }
  ];
  return goods[Math.floor(Math.random() * goods.length)];
};

const generateBlockchainHash = (data) => {
  const serialized = JSON.stringify({
    ...data,
    timestamp: new Date().toISOString(),
    nonce: Math.random().toString(36).substr(2, 9)
  });
  return '0x' + crypto.createHash('sha256').update(serialized).digest('hex');
};

// In-memory storage for mock data
const mockECMRs = new Map();
let ecmrCounter = 1000;

// POST /api/ecmr - Crear nuevo e-CMR
router.post('/',
  authenticateToken,
  authorize(['admin', 'operator', 'transporter']),
  [
    body('vehicleId').notEmpty().withMessage('Vehicle ID is required'),
    body('driverId').notEmpty().withMessage('Driver ID is required'),
    body('tripId').optional()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const ecmrNumber = `ECMR-UY-2024-${String(ecmrCounter++).padStart(6, '0')}`;
      const sender = generateMockCompany('sender');
      const receiver = generateMockCompany('receiver');
      const carrier = generateMockCompany('carrier');
      const goods = generateMockGoods();

      const ecmr = {
        id: crypto.randomUUID(),
        ecmrNumber,
        status: 'draft',
        createdAt: new Date().toISOString(),
        createdBy: req.user.id,
        vehicleId: req.body.vehicleId,
        driverId: req.body.driverId,
        tripId: req.body.tripId || null,
        
        // Parties
        sender: {
          ...sender,
          signature: null,
          signedAt: null
        },
        receiver: {
          ...receiver,
          signature: null,
          signedAt: null,
          notes: null
        },
        carrier: {
          ...carrier,
          vehicleId: req.body.vehicleId,
          driverId: req.body.driverId,
          signature: null,
          signedAt: null
        },
        
        // Cargo details
        goods: {
          ...goods,
          specialInstructions: goods.dangerousGoods ? 'Handle with care - Hazardous materials' : null,
          temperature: null,
          markings: `ECMR/${ecmrNumber}`
        },
        
        // Journey details
        journey: {
          origin: {
            address: sender.address,
            coordinates: { lat: -34.9011, lng: -56.1645 }, // Montevideo
            plannedDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          },
          destination: {
            address: receiver.address,
            coordinates: { lat: -34.6037, lng: -58.3816 }, // Buenos Aires example
            plannedDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
          },
          distance: Math.floor(Math.random() * 500) + 200, // 200-700 km
          estimatedDuration: Math.floor(Math.random() * 8) + 4 // 4-12 hours
        },
        
        // Tracking
        tracking: {
          currentLocation: null,
          lastUpdate: null,
          route: [],
          events: [
            {
              type: 'created',
              timestamp: new Date().toISOString(),
              location: sender.address,
              description: 'e-CMR created',
              userId: req.user.id
            }
          ]
        },
        
        // Documents and attachments
        documents: [],
        
        // Blockchain
        blockchain: {
          hash: null,
          previousHash: null,
          blockNumber: null,
          transactionId: null
        },
        
        // Compliance
        compliance: {
          aduanaStatus: 'pending',
          customsDeclaration: null,
          inspections: [],
          permits: []
        }
      };

      mockECMRs.set(ecmr.id, ecmr);
      
      // Emit real-time update
      emitECMRUpdate(ecmr.id, {
        type: 'created',
        ecmr
      });
      
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
      const ecmr = mockECMRs.get(req.params.id);
      
      if (!ecmr) {
        return res.status(404).json({ error: 'e-CMR not found' });
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
      const ecmr = mockECMRs.get(req.params.id);
      
      if (!ecmr) {
        return res.status(404).json({ error: 'e-CMR not found' });
      }
      
      if (ecmr.status !== 'draft') {
        return res.status(400).json({ error: 'e-CMR must be in draft status to issue' });
      }
      
      // Update status
      ecmr.status = 'issued';
      ecmr.issuedAt = new Date().toISOString();
      ecmr.issuedBy = req.user.id;
      
      // Generate blockchain hash
      ecmr.blockchain.hash = generateBlockchainHash(ecmr);
      ecmr.blockchain.blockNumber = Math.floor(Math.random() * 1000000) + 5000000;
      ecmr.blockchain.transactionId = crypto.randomUUID();
      
      // Add event
      ecmr.tracking.events.push({
        type: 'issued',
        timestamp: new Date().toISOString(),
        description: 'e-CMR issued and registered on blockchain',
        userId: req.user.id,
        blockchainHash: ecmr.blockchain.hash
      });
      
      // Emit real-time update
      emitECMRUpdate(ecmr.id, {
        type: 'issued',
        ecmr
      });
      
      res.json({
        message: 'e-CMR issued successfully',
        ecmr
      });
    } catch (error) {
      logger.error('Error issuing e-CMR:', error);
      res.status(500).json({ error: 'Failed to issue e-CMR' });
    }
  }
);

// POST /api/ecmr/:id/sign - Firmar e-CMR
router.post('/:id/sign',
  authenticateToken,
  [
    param('id').notEmpty(),
    body('type').isIn(['sender', 'carrier', 'receiver']).withMessage('Invalid signature type'),
    body('signature').notEmpty().withMessage('Signature is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const ecmr = mockECMRs.get(req.params.id);
      
      if (!ecmr) {
        return res.status(404).json({ error: 'e-CMR not found' });
      }
      
      if (ecmr.status !== 'issued' && ecmr.status !== 'in_transit') {
        return res.status(400).json({ error: 'e-CMR must be issued to sign' });
      }
      
      // Apply signature
      const signatureData = {
        userId: req.user.id,
        signature: req.body.signature,
        signedAt: new Date().toISOString(),
        location: req.body.location || ecmr[req.body.type].address,
        ipAddress: req.ip,
        hash: crypto.createHash('sha256').update(req.body.signature).digest('hex')
      };
      
      ecmr[req.body.type].signature = signatureData;
      
      // Update status based on signatures
      if (req.body.type === 'carrier' && !ecmr.carrier.signature) {
        ecmr.status = 'in_transit';
      }
      
      if (ecmr.sender.signature && ecmr.carrier.signature && ecmr.receiver.signature) {
        ecmr.status = 'completed';
        ecmr.completedAt = new Date().toISOString();
      }
      
      // Add event
      ecmr.tracking.events.push({
        type: 'signed',
        timestamp: new Date().toISOString(),
        party: req.body.type,
        description: `${req.body.type} signed the e-CMR`,
        userId: req.user.id,
        signatureHash: signatureData.hash
      });
      
      // Emit real-time update
      emitECMRUpdate(ecmr.id, {
        type: 'signed',
        party: req.body.type,
        ecmr
      });
      
      res.json({
        message: 'e-CMR signed successfully',
        ecmr
      });
    } catch (error) {
      logger.error('Error signing e-CMR:', error);
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

      const ecmr = mockECMRs.get(req.params.id);
      
      if (!ecmr) {
        return res.status(404).json({ error: 'e-CMR not found' });
      }
      
      const locationData = {
        lat: req.body.lat,
        lng: req.body.lng,
        address: req.body.address || 'Unknown location',
        timestamp: new Date().toISOString(),
        speed: req.body.speed || 0,
        heading: req.body.heading || 0
      };

      // Update current location
      ecmr.tracking.currentLocation = locationData;
      ecmr.tracking.lastUpdate = locationData.timestamp;
      
      // Add to route history
      ecmr.tracking.route.push(locationData);
      
      // Check if near destination
      const destLat = ecmr.journey.destination.coordinates.lat;
      const destLng = ecmr.journey.destination.coordinates.lng;
      const distance = Math.sqrt(
        Math.pow(locationData.lat - destLat, 2) + 
        Math.pow(locationData.lng - destLng, 2)
      );
      
      if (distance < 0.01 && ecmr.status === 'in_transit') { // ~1km
        ecmr.tracking.events.push({
          type: 'arrived',
          timestamp: new Date().toISOString(),
          location: ecmr.journey.destination.address,
          description: 'Arrived at destination'
        });
      }
      
      // Emit real-time update
      emitECMRUpdate(ecmr.id, {
        type: 'location_update',
        location: locationData,
        ecmr
      });
      
      res.json({
        message: 'Location updated successfully',
        location: locationData
      });
    } catch (error) {
      logger.error('Error updating location:', error);
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
      const ecmr = mockECMRs.get(req.params.id);
      
      if (!ecmr) {
        return res.status(404).json({ error: 'e-CMR not found' });
      }
      
      // Check all signatures
      if (!ecmr.sender.signature || !ecmr.carrier.signature || !ecmr.receiver.signature) {
        return res.status(400).json({ 
          error: 'Missing required signatures',
          missing: [
            !ecmr.sender.signature && 'sender',
            !ecmr.carrier.signature && 'carrier',
            !ecmr.receiver.signature && 'receiver'
          ].filter(Boolean)
        });
      }
      
      ecmr.status = 'completed';
      ecmr.completedAt = new Date().toISOString();
      ecmr.completedBy = req.user.id;
      
      // Final blockchain registration
      ecmr.blockchain.finalHash = generateBlockchainHash({
        ...ecmr,
        status: 'completed'
      });
      
      // Add completion event
      ecmr.tracking.events.push({
        type: 'completed',
        timestamp: new Date().toISOString(),
        description: 'e-CMR completed and finalized',
        userId: req.user.id,
        finalHash: ecmr.blockchain.finalHash
      });
      
      // Update compliance
      ecmr.compliance.aduanaStatus = 'completed';
      ecmr.compliance.completedAt = new Date().toISOString();
      
      // Emit real-time update
      emitECMRUpdate(ecmr.id, {
        type: 'completed',
        ecmr
      });
      
      res.json({
        message: 'e-CMR completed successfully',
        ecmr
      });
    } catch (error) {
      logger.error('Error completing e-CMR:', error);
      res.status(500).json({ error: 'Failed to complete e-CMR' });
    }
  }
);

// GET /api/ecmr/vehicle/:vehicleId - Obtener e-CMRs por vehículo
router.get('/vehicle/:vehicleId',
  authenticateToken,
  [
    param('vehicleId').notEmpty(),
    query('status').optional().isIn(['draft', 'issued', 'in_transit', 'completed', 'cancelled']),
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

      let ecmrs = Array.from(mockECMRs.values())
        .filter(e => e.vehicleId === req.params.vehicleId);
      
      // Apply filters
      if (req.query.status) {
        ecmrs = ecmrs.filter(e => e.status === req.query.status);
      }
      
      if (req.query.startDate) {
        ecmrs = ecmrs.filter(e => new Date(e.createdAt) >= new Date(req.query.startDate));
      }
      
      if (req.query.endDate) {
        ecmrs = ecmrs.filter(e => new Date(e.createdAt) <= new Date(req.query.endDate));
      }
      
      // Sort by date descending
      ecmrs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Apply limit
      const limit = parseInt(req.query.limit) || 50;
      ecmrs = ecmrs.slice(0, limit);

      res.json({
        data: ecmrs,
        total: ecmrs.length
      });
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
    query('status').optional().isIn(['draft', 'issued', 'in_transit', 'completed', 'cancelled']),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const companyId = req.params.companyId === 'current' 
        ? (req.user.companyId || req.user.company_id || req.user.id)
        : req.params.companyId;

      let ecmrs = Array.from(mockECMRs.values());
      
      // Filter by company role
      if (req.query.role && req.query.role !== 'any') {
        ecmrs = ecmrs.filter(e => {
          switch(req.query.role) {
            case 'sender': return e.sender.taxId === companyId;
            case 'receiver': return e.receiver.taxId === companyId;
            case 'carrier': return e.carrier.taxId === companyId;
            default: return false;
          }
        });
      } else {
        // Any role
        ecmrs = ecmrs.filter(e => 
          e.sender.taxId === companyId ||
          e.receiver.taxId === companyId ||
          e.carrier.taxId === companyId
        );
      }
      
      // Apply status filter
      if (req.query.status) {
        ecmrs = ecmrs.filter(e => e.status === req.query.status);
      }
      
      // Sort by date descending
      ecmrs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Apply limit
      const limit = parseInt(req.query.limit) || 50;
      ecmrs = ecmrs.slice(0, limit);

      res.json({
        data: ecmrs,
        total: ecmrs.length,
        companyId,
        role: req.query.role || 'any'
      });
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
      const ecmr = mockECMRs.get(req.params.id);
      
      if (!ecmr) {
        return res.status(404).json({ error: 'e-CMR not found' });
      }
      
      // Verify blockchain integrity
      const currentHash = generateBlockchainHash({
        ecmrNumber: ecmr.ecmrNumber,
        sender: ecmr.sender,
        receiver: ecmr.receiver,
        carrier: ecmr.carrier,
        goods: ecmr.goods,
        status: ecmr.status
      });
      
      const verification = {
        valid: true,
        ecmrId: ecmr.id,
        ecmrNumber: ecmr.ecmrNumber,
        status: ecmr.status,
        blockchain: {
          originalHash: ecmr.blockchain.hash,
          currentHash,
          match: ecmr.blockchain.hash === currentHash,
          blockNumber: ecmr.blockchain.blockNumber,
          transactionId: ecmr.blockchain.transactionId
        },
        signatures: {
          sender: {
            signed: !!ecmr.sender.signature,
            signedAt: ecmr.sender.signature?.signedAt,
            valid: !!ecmr.sender.signature
          },
          carrier: {
            signed: !!ecmr.carrier.signature,
            signedAt: ecmr.carrier.signature?.signedAt,
            valid: !!ecmr.carrier.signature
          },
          receiver: {
            signed: !!ecmr.receiver.signature,
            signedAt: ecmr.receiver.signature?.signedAt,
            valid: !!ecmr.receiver.signature
          }
        },
        verifiedAt: new Date().toISOString(),
        verifiedBy: req.user.id
      };
      
      // Check for tampering
      if (ecmr.blockchain.hash && ecmr.blockchain.hash !== currentHash) {
        verification.valid = false;
        verification.errors = ['Blockchain hash mismatch - possible data tampering'];
      }
      
      res.json(verification);
    } catch (error) {
      logger.error('Error verifying e-CMR:', error);
      res.status(500).json({ error: 'Failed to verify e-CMR' });
    }
  }
);

// GET /api/ecmr - List all e-CMRs with filters
router.get('/',
  authenticateToken,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['draft', 'issued', 'in_transit', 'completed', 'cancelled']),
    query('search').optional().isString()
  ],
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;
      
      let ecmrs = Array.from(mockECMRs.values());
      
      // Apply filters
      if (req.query.status) {
        ecmrs = ecmrs.filter(e => e.status === req.query.status);
      }
      
      if (req.query.search) {
        const search = req.query.search.toLowerCase();
        ecmrs = ecmrs.filter(e => 
          e.ecmrNumber.toLowerCase().includes(search) ||
          e.sender.name.toLowerCase().includes(search) ||
          e.receiver.name.toLowerCase().includes(search) ||
          e.carrier.name.toLowerCase().includes(search)
        );
      }
      
      // Sort by date descending
      ecmrs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Paginate
      const total = ecmrs.length;
      ecmrs = ecmrs.slice(offset, offset + limit);
      
      res.json({
        data: ecmrs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error('Error fetching e-CMRs:', error);
      res.status(500).json({ error: 'Failed to fetch e-CMRs' });
    }
  }
);

// GET /api/ecmr/statistics - Obtener estadísticas
router.get('/statistics',
  authenticateToken,
  authorize(['admin', 'operator', 'authority']),
  async (req, res) => {
    try {
      const allECMRs = Array.from(mockECMRs.values());
      
      // Calculate statistics
      const stats = {
        total: allECMRs.length,
        byStatus: {
          draft: allECMRs.filter(e => e.status === 'draft').length,
          issued: allECMRs.filter(e => e.status === 'issued').length,
          in_transit: allECMRs.filter(e => e.status === 'in_transit').length,
          completed: allECMRs.filter(e => e.status === 'completed').length,
          cancelled: allECMRs.filter(e => e.status === 'cancelled').length
        },
        dailyAverage: Math.round(allECMRs.length / 30), // Last 30 days
        completionRate: allECMRs.length > 0 
          ? ((allECMRs.filter(e => e.status === 'completed').length / allECMRs.length) * 100).toFixed(1)
          : 0,
        averageTransitTime: '8.5 hours',
        topRoutes: [
          { origin: 'Montevideo', destination: 'Buenos Aires', count: 45 },
          { origin: 'Montevideo', destination: 'Porto Alegre', count: 32 },
          { origin: 'Rivera', destination: 'Santana do Livramento', count: 28 }
        ],
        topCarriers: [
          { name: 'Trans Uruguay S.A.', count: 42, percentage: 35 },
          { name: 'Flota Internacional', count: 38, percentage: 32 },
          { name: 'Logística Express', count: 28, percentage: 23 }
        ],
        cargoTypes: [
          { type: 'General Cargo', count: 45, percentage: 38 },
          { type: 'Containers', count: 35, percentage: 29 },
          { type: 'Dangerous Goods', count: 15, percentage: 13 },
          { type: 'Machinery', count: 25, percentage: 20 }
        ],
        blockchain: {
          registered: allECMRs.filter(e => e.blockchain.hash).length,
          verified: allECMRs.filter(e => e.blockchain.finalHash).length
        },
        timestamp: new Date().toISOString()
      };
      
      res.json(stats);
    } catch (error) {
      logger.error('Error fetching statistics:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  }
);

// Generate sample e-CMRs on startup
const generateSampleECMRs = () => {
  const statuses = ['draft', 'issued', 'in_transit', 'completed'];
  const vehicles = ['ABC-1234', 'DEF-5678', 'GHI-9012', 'JKL-3456'];
  const drivers = ['driver1', 'driver2', 'driver3', 'driver4'];
  
  for (let i = 0; i < 10; i++) {
    const ecmrNumber = `ECMR-UY-2024-${String(ecmrCounter++).padStart(6, '0')}`;
    const sender = generateMockCompany('sender');
    const receiver = generateMockCompany('receiver');
    const carrier = generateMockCompany('carrier');
    const goods = generateMockGoods();
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    const ecmr = {
      id: crypto.randomUUID(),
      ecmrNumber,
      status,
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: 'system',
      vehicleId: vehicles[Math.floor(Math.random() * vehicles.length)],
      driverId: drivers[Math.floor(Math.random() * drivers.length)],
      
      sender: {
        ...sender,
        signature: status !== 'draft' ? {
          userId: 'sender-user',
          signature: 'data:image/png;base64,mockSignature',
          signedAt: new Date(Date.now() - Math.random() * 6 * 24 * 60 * 60 * 1000).toISOString(),
          hash: crypto.randomUUID()
        } : null
      },
      
      receiver: {
        ...receiver,
        signature: status === 'completed' ? {
          userId: 'receiver-user',
          signature: 'data:image/png;base64,mockSignature',
          signedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
          hash: crypto.randomUUID()
        } : null
      },
      
      carrier: {
        ...carrier,
        vehicleId: vehicles[Math.floor(Math.random() * vehicles.length)],
        driverId: drivers[Math.floor(Math.random() * drivers.length)],
        signature: (status === 'in_transit' || status === 'completed') ? {
          userId: 'carrier-user',
          signature: 'data:image/png;base64,mockSignature',
          signedAt: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString(),
          hash: crypto.randomUUID()
        } : null
      },
      
      goods: {
        ...goods,
        markings: `ECMR/${ecmrNumber}`
      },
      
      journey: {
        origin: {
          address: sender.address,
          coordinates: { lat: -34.9011, lng: -56.1645 },
          plannedDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        destination: {
          address: receiver.address,
          coordinates: { lat: -34.6037 + Math.random() * 2, lng: -58.3816 + Math.random() * 2 },
          plannedDate: new Date(Date.now() + Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        distance: Math.floor(Math.random() * 500) + 200,
        estimatedDuration: Math.floor(Math.random() * 8) + 4
      },
      
      tracking: {
        currentLocation: (status === 'in_transit' || status === 'completed') ? {
          lat: -34.7 + Math.random() * 0.4,
          lng: -57.0 + Math.random() * 1.5,
          timestamp: new Date().toISOString()
        } : null,
        lastUpdate: new Date().toISOString(),
        route: [],
        events: []
      },
      
      blockchain: {
        hash: status !== 'draft' ? generateBlockchainHash({ ecmrNumber, status }) : null,
        blockNumber: status !== 'draft' ? Math.floor(Math.random() * 1000000) + 5000000 : null,
        transactionId: status !== 'draft' ? crypto.randomUUID() : null,
        finalHash: status === 'completed' ? generateBlockchainHash({ ecmrNumber, status: 'completed' }) : null
      },
      
      compliance: {
        aduanaStatus: status === 'completed' ? 'completed' : 'pending',
        customsDeclaration: status === 'completed' ? `DUA-2024-${Math.floor(Math.random() * 10000)}` : null,
        inspections: [],
        permits: goods.dangerousGoods ? ['ADR-2024-001', 'HAZMAT-UY-2024'] : []
      },
      
      documents: [],
      issuedAt: status !== 'draft' ? new Date(Date.now() - Math.random() * 6 * 24 * 60 * 60 * 1000).toISOString() : null,
      completedAt: status === 'completed' ? new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString() : null
    };
    
    mockECMRs.set(ecmr.id, ecmr);
  }
};

// Initialize sample data
setTimeout(() => {
  generateSampleECMRs();
  logger.info('Sample e-CMR data generated');
}, 1000);

module.exports = router;