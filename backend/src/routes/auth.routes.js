const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');
const { rateLimiter } = require('../middleware/rateLimiter');

// Login validation rules
const loginValidation = [
  body('username').optional().trim().notEmpty(),
  body('email').optional().isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  body().custom((value, { req }) => {
    if (!req.body.username && !req.body.email) {
      throw new Error('Either username or email is required');
    }
    return true;
  })
];

// Registration validation rules
const registerValidation = [
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').isIn(['transporter', 'driver', 'authority', 'union', 'viewer']),
  body('first_name').trim().notEmpty(),
  body('last_name').trim().notEmpty(),
  body('document_number').trim().notEmpty(),
  body('company_id').optional().isUUID()
];

// Generate JWT token
const generateToken = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    company_id: user.company_id
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// POST /api/auth/login
router.post('/login', rateLimiter, loginValidation, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    // Find user by username or email
    let user;
    if (username) {
      user = await User.findByUsername(username);
    } else {
      user = await User.findByEmail(email);
    }

    if (!user) {
      logger.warn(`Failed login attempt for ${username || email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    // Verify password
    const isValidPassword = await User.verifyPassword(user, password);
    if (!isValidPassword) {
      logger.warn(`Failed login attempt for user ${user.id}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await User.updateLastLogin(user.id);

    // Generate token
    const token = generateToken(user);

    // Log successful login
    logger.info(`User ${user.id} logged in successfully`);

    // Return user data and token
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        company_id: user.company_id
      }
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/register
router.post('/register', registerValidation, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userData = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(userData.email);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const existingUsername = await User.findByUsername(userData.username);
    if (existingUsername) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    // Create user
    const user = await User.create(userData);

    // Generate token
    const token = generateToken(user);

    // Log registration
    logger.info(`New user registered: ${user.id}`);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        company_id: user.company_id
      }
    });

  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Verify current token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get fresh user data
    const user = await User.findById(decoded.id);
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    // Generate new token
    const newToken = generateToken(user);

    res.json({ token: newToken });

  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  // In a stateless JWT setup, logout is handled client-side
  // Here we could implement token blacklisting if needed
  res.json({ message: 'Logged out successfully' });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists
      return res.json({ message: 'If the email exists, a reset link has been sent' });
    }

    // TODO: Implement password reset logic
    // - Generate reset token
    // - Send email with reset link
    // - Store token in database with expiry

    logger.info(`Password reset requested for user ${user.id}`);

    res.json({ message: 'If the email exists, a reset link has been sent' });

  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', [
  body('token').notEmpty(),
  body('password').isLength({ min: 8 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // TODO: Implement password reset logic
    // - Verify reset token
    // - Update user password
    // - Invalidate token

    res.json({ message: 'Password reset successfully' });

  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;