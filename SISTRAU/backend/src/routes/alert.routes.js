const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

// Placeholder routes
router.get('/', authenticate, (req, res) => {
  res.json({ data: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } });
});

router.get('/stats', authenticate, (req, res) => {
  res.json({ total: 0, critical: 0, high: 0, medium: 0, low: 0 });
});

module.exports = router;