const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

// Dashboard stats
router.get('/dashboard', authenticate, (req, res) => {
  res.json({
    vehicles: {
      total: 5,
      active: 3,
      maintenance: 1
    },
    trips: {
      total: 100,
      inProgress: 2,
      completed: 95,
      cancelled: 3
    },
    alerts: {
      total: 5,
      critical: 1,
      high: 1,
      medium: 2,
      low: 1
    },
    performance: {
      avgSpeed: 75,
      totalDistance: 15000,
      fuelEfficiency: 8.5
    }
  });
});

module.exports = router;