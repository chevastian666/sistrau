const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const logger = require('../utils/logger');

// Rate limiting for public API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  skipSuccessfulRequests: true,
});

// API Key validation middleware
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'API key is required',
      message: 'Please provide your API key in the x-api-key header'
    });
  }

  // In production, validate against database
  const validApiKeys = [
    process.env.PUBLIC_API_KEY_1,
    process.env.PUBLIC_API_KEY_2,
    // Add more API keys as needed
  ];

  if (!validApiKeys.includes(apiKey)) {
    return res.status(401).json({
      error: 'Invalid API key',
      message: 'The provided API key is not valid'
    });
  }

  // Log API usage
  logger.info('Public API accessed', {
    apiKey: apiKey.substring(0, 8) + '...',
    endpoint: req.path,
    method: req.method,
    ip: req.ip
  });

  next();
};

// Apply rate limiting to all routes
router.use(apiLimiter);

/**
 * @api {get} /api/v1/status API Status
 * @apiName GetAPIStatus
 * @apiGroup General
 * @apiVersion 1.0.0
 * 
 * @apiSuccess {String} status API status
 * @apiSuccess {String} version API version
 * @apiSuccess {String} timestamp Current timestamp
 */
router.get('/status', (req, res) => {
  res.json({
    status: 'operational',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      vehicles: '/api/v1/vehicles',
      tracking: '/api/v1/tracking',
      trips: '/api/v1/trips',
      alerts: '/api/v1/alerts'
    }
  });
});

/**
 * @api {post} /api/v1/auth/token Generate Access Token
 * @apiName GenerateToken
 * @apiGroup Authentication
 * @apiVersion 1.0.0
 * 
 * @apiHeader {String} x-api-key API Key
 * @apiBody {String} client_id Client ID
 * @apiBody {String} client_secret Client Secret
 * 
 * @apiSuccess {String} access_token JWT access token
 * @apiSuccess {String} token_type Token type (Bearer)
 * @apiSuccess {Number} expires_in Token expiration time in seconds
 */
router.post('/auth/token', authLimiter, validateApiKey, [
  body('client_id').notEmpty().withMessage('Client ID is required'),
  body('client_secret').notEmpty().withMessage('Client secret is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { client_id, client_secret } = req.body;

    // Validate client credentials (in production, check against database)
    if (client_id !== process.env.API_CLIENT_ID || 
        client_secret !== process.env.API_CLIENT_SECRET) {
      return res.status(401).json({
        error: 'Invalid client credentials'
      });
    }

    // Generate access token
    const token = jwt.sign(
      { 
        client_id,
        type: 'api_access',
        iat: Math.floor(Date.now() / 1000)
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      access_token: token,
      token_type: 'Bearer',
      expires_in: 3600
    });
  } catch (error) {
    logger.error('Error generating API token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Middleware to validate access token
const validateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Access token required',
      message: 'Please provide a valid Bearer token'
    });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'api_access') {
      return res.status(401).json({
        error: 'Invalid token type'
      });
    }

    req.apiClient = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Invalid or expired token'
    });
  }
};

/**
 * @api {get} /api/v1/vehicles List Vehicles
 * @apiName GetVehicles
 * @apiGroup Vehicles
 * @apiVersion 1.0.0
 * 
 * @apiHeader {String} Authorization Bearer token
 * @apiQuery {Number} [page=1] Page number
 * @apiQuery {Number} [limit=20] Items per page
 * @apiQuery {String} [status] Filter by status (active, inactive, maintenance)
 * @apiQuery {String} [type] Filter by vehicle type
 * 
 * @apiSuccess {Object[]} vehicles List of vehicles
 * @apiSuccess {Object} pagination Pagination info
 */
router.get('/vehicles', validateToken, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['active', 'inactive', 'maintenance']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Mock data - replace with actual database query
    const vehicles = [
      {
        id: 'VEH-001',
        plate_number: 'ABC-1234',
        type: 'truck',
        brand: 'Volvo',
        model: 'FH16',
        year: 2022,
        status: 'active',
        current_location: {
          lat: -34.9011,
          lng: -56.1645,
          address: 'Montevideo, Uruguay',
          timestamp: new Date().toISOString()
        },
        driver: {
          id: 'DRV-001',
          name: 'Juan Pérez',
          license: 'A123456'
        }
      }
    ];

    res.json({
      vehicles,
      pagination: {
        page,
        limit,
        total: 150,
        pages: Math.ceil(150 / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching vehicles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @api {get} /api/v1/tracking/realtime Real-time Vehicle Tracking
 * @apiName GetRealtimeTracking
 * @apiGroup Tracking
 * @apiVersion 1.0.0
 * 
 * @apiHeader {String} Authorization Bearer token
 * @apiQuery {String} [vehicle_id] Filter by vehicle ID
 * @apiQuery {String} [bounds] Geographical bounds (lat1,lng1,lat2,lng2)
 * 
 * @apiSuccess {Object[]} vehicles List of vehicles with real-time location
 */
router.get('/tracking/realtime', validateToken, async (req, res) => {
  try {
    const { vehicle_id, bounds } = req.query;

    // Mock real-time data
    const tracking = [
      {
        vehicle_id: 'VEH-001',
        location: {
          lat: -34.9011,
          lng: -56.1645,
          speed: 65,
          heading: 45,
          timestamp: new Date().toISOString()
        },
        status: 'in_transit',
        engine: 'on',
        fuel_level: 75,
        temperature: 22
      }
    ];

    res.json({
      tracking,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching tracking data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @api {post} /api/v1/tracking/update Update Vehicle Position
 * @apiName UpdateVehiclePosition
 * @apiGroup Tracking
 * @apiVersion 1.0.0
 * 
 * @apiHeader {String} Authorization Bearer token
 * @apiBody {String} vehicle_id Vehicle ID
 * @apiBody {Number} lat Latitude
 * @apiBody {Number} lng Longitude
 * @apiBody {Number} [speed] Speed in km/h
 * @apiBody {Number} [heading] Heading in degrees
 * @apiBody {Object} [telemetry] Additional telemetry data
 * 
 * @apiSuccess {String} message Success message
 * @apiSuccess {String} tracking_id Tracking record ID
 */
router.post('/tracking/update', validateToken, [
  body('vehicle_id').notEmpty(),
  body('lat').isFloat({ min: -90, max: 90 }),
  body('lng').isFloat({ min: -180, max: 180 }),
  body('speed').optional().isFloat({ min: 0 }),
  body('heading').optional().isFloat({ min: 0, max: 360 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const trackingId = crypto.randomUUID();

    // Process and store tracking data
    logger.info('Vehicle position updated', {
      vehicle_id: req.body.vehicle_id,
      tracking_id: trackingId
    });

    res.json({
      message: 'Position updated successfully',
      tracking_id: trackingId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error updating vehicle position:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @api {get} /api/v1/alerts List Alerts
 * @apiName GetAlerts
 * @apiGroup Alerts
 * @apiVersion 1.0.0
 * 
 * @apiHeader {String} Authorization Bearer token
 * @apiQuery {String} [status] Filter by status (active, resolved, acknowledged)
 * @apiQuery {String} [severity] Filter by severity (low, medium, high, critical)
 * @apiQuery {String} [from] Start date (ISO 8601)
 * @apiQuery {String} [to] End date (ISO 8601)
 */
router.get('/alerts', validateToken, async (req, res) => {
  try {
    const { status, severity, from, to } = req.query;

    // Mock alerts data
    const alerts = [
      {
        id: 'ALT-001',
        type: 'speed_violation',
        severity: 'high',
        status: 'active',
        vehicle_id: 'VEH-001',
        message: 'Vehicle exceeded speed limit',
        details: {
          speed: 120,
          limit: 90,
          location: 'Route 5 Km 45'
        },
        created_at: new Date().toISOString()
      }
    ];

    res.json({
      alerts,
      total: alerts.length,
      filters: { status, severity, from, to }
    });
  } catch (error) {
    logger.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @api {post} /api/v1/webhooks/register Register Webhook
 * @apiName RegisterWebhook
 * @apiGroup Webhooks
 * @apiVersion 1.0.0
 * 
 * @apiHeader {String} Authorization Bearer token
 * @apiBody {String} url Webhook URL
 * @apiBody {String[]} events Events to subscribe to
 * @apiBody {String} [secret] Webhook secret for signature validation
 */
router.post('/webhooks/register', validateToken, [
  body('url').isURL(),
  body('events').isArray().notEmpty(),
  body('secret').optional().isLength({ min: 16 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const webhookId = crypto.randomUUID();
    const { url, events, secret } = req.body;

    // Register webhook (store in database)
    logger.info('Webhook registered', {
      webhook_id: webhookId,
      url,
      events
    });

    res.json({
      webhook_id: webhookId,
      url,
      events,
      status: 'active',
      created_at: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error registering webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;