const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');

const router = express.Router();

// Mock database
const { mockDb } = require('../config/database');

// Login endpoint
router.post('/login', [
  body('username').optional().isString(),
  body('email').optional().isEmail(),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    logger.info(`Login attempt for username: ${username}, email: ${email}`);

    // Find user by username or email
    const user = mockDb.users.find(u => 
      (username && u.username === username) || 
      (email && u.email === email)
    );

    if (!user) {
      logger.warn(`User not found: ${username || email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    logger.info(`User found: ${user.username}, comparing passwords...`);

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    logger.info(`Password validation result: ${isValidPassword}`);
    
    if (!isValidPassword) {
      logger.warn(`Invalid password for user: ${user.username}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username,
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Return user data without password
    const { password_hash, ...userWithoutPassword } = user;

    logger.info(`User ${user.username} logged in successfully`);

    res.json({
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register endpoint
router.post('/register', [
  body('username').notEmpty().withMessage('Username is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('documentNumber').notEmpty().withMessage('Document number is required'),
  body('role').isIn(['admin', 'operator', 'transporter', 'authority']).withMessage('Valid role is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, firstName, lastName, documentNumber, role, companyId, phone } = req.body;

    // Check if user already exists
    const existingUser = mockDb.users.find(u => 
      u.username === username || u.email === email
    );

    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      username,
      email,
      password_hash: passwordHash,
      role,
      firstName,
      lastName,
      documentNumber,
      companyId,
      phone,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    mockDb.users.push(newUser);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: newUser.id, 
        username: newUser.username,
        role: newUser.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Return user data without password
    const { password_hash, ...userWithoutPassword } = newUser;

    logger.info(`New user ${username} registered successfully`);

    res.status(201).json({
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  // In a real application, you might want to invalidate the token here
  res.json({ message: 'Logged out successfully' });
});

// Get current user
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = mockDb.users.find(u => u.id === decoded.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password_hash, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;