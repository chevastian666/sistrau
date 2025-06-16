const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const User = require('../models/User');
const logger = require('../utils/logger');

// GET /api/users/me - Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove sensitive data
    delete user.password_hash;
    
    res.json(user);
  } catch (error) {
    logger.error('Error fetching current user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// GET /api/users - List users (admin/transporter can see their company users)
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    
    let companyId = null;
    if (req.user.role === 'transporter') {
      companyId = req.user.companyId;
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      role,
      isActive: true
    };

    let result;
    if (search) {
      result = await User.search(search, options);
    } else if (companyId) {
      result = await User.findByCompany(companyId, options);
    } else {
      // Admin can see all users
      result = await User.search('', options);
    }

    res.json(result);
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/users/:id - Get specific user
router.get('/:id', authenticate, param('id').isUUID(), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check permissions
    if (req.user.role === 'transporter' && user.company_id !== req.user.companyId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    delete user.password_hash;
    res.json(user);
  } catch (error) {
    logger.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// PUT /api/users/:id - Update user
router.put('/:id', 
  authenticate,
  param('id').isUUID(),
  body('email').optional().isEmail(),
  body('first_name').optional().trim().notEmpty(),
  body('last_name').optional().trim().notEmpty(),
  body('phone').optional().trim(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Users can only update their own profile unless admin
      if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const updateData = req.body;
      
      // Only admin can change role or active status
      if (req.user.role !== 'admin') {
        delete updateData.role;
        delete updateData.is_active;
        delete updateData.company_id;
      }

      const updatedUser = await User.update(req.params.id, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(updatedUser);
    } catch (error) {
      logger.error('Error updating user:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
});

// DELETE /api/users/:id - Delete user (admin only)
router.delete('/:id',
  authenticate,
  authorize(['admin']),
  param('id').isUUID(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = await User.findById(req.params.id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Soft delete by setting is_active to false
      await User.update(req.params.id, { is_active: false });
      
      logger.info(`User ${req.params.id} deactivated by admin ${req.user.id}`);
      res.json({ message: 'User deactivated successfully' });
    } catch (error) {
      logger.error('Error deleting user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
});

// GET /api/users/company/:companyId/stats - Get company user statistics
router.get('/company/:companyId/stats',
  authenticate,
  authorize(['admin', 'transporter']),
  param('companyId').isUUID(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Transporters can only see their own company stats
      if (req.user.role === 'transporter' && req.user.companyId !== req.params.companyId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const stats = await User.getStatsByCompany(req.params.companyId);
      res.json(stats);
    } catch (error) {
      logger.error('Error fetching company user stats:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

module.exports = router;