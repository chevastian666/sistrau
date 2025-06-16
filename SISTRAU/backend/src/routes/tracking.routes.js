const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

// Placeholder routes
router.get('/live', authenticate, (req, res) => {
  res.json({ vehicles: [] });
});

router.get('/history', authenticate, (req, res) => {
  res.json({ data: [] });
});

module.exports = router;