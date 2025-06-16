const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

// Placeholder routes
router.get('/', authenticate, (req, res) => {
  res.json({ data: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } });
});

module.exports = router;