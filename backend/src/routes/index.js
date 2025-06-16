const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const vehicleRoutes = require('./vehicle.routes');
const tripRoutes = require('./trip.routes');
const trackingRoutes = require('./tracking.routes');
const cargoRoutes = require('./cargo.routes');
const alertRoutes = require('./alert.routes');
const statsRoutes = require('./stats.routes');

// Public routes
router.use('/auth', authRoutes);

// Protected routes (add auth middleware later)
router.use('/users', userRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/trips', tripRoutes);
router.use('/tracking', trackingRoutes);
router.use('/cargo', cargoRoutes);
router.use('/alerts', alertRoutes);
router.use('/stats', statsRoutes);

// API documentation
router.get('/', (req, res) => {
  res.json({
    message: 'SISTRAU API v1.0',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      vehicles: '/api/vehicles',
      trips: '/api/trips',
      tracking: '/api/tracking',
      cargo: '/api/cargo',
      alerts: '/api/alerts',
      stats: '/api/stats'
    },
    documentation: 'https://docs.sistrau.gub.uy',
    health: '/health'
  });
});

module.exports = router;