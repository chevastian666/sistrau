const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});

// Import configurations
const { initializeDatabase } = require('./config/database');
const { initializeRedis } = require('./config/redis');
const { initializeMQTT } = require('./config/mqtt');

// Import services
const { socketHandler } = require('./services/socketService');
const { startCronJobs } = require('./services/cronService');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const vehicleRoutes = require('./routes/vehicle.routes');
const tripRoutes = require('./routes/trip.routes');
const cargoRoutes = require('./routes/cargo.routes');
const trackingRoutes = require('./routes/tracking.routes');
const alertRoutes = require('./routes/alert.routes');
const statsRoutes = require('./routes/stats.routes');
const tachographRoutes = require('./routes/tachograph.routes');
const ecmrRoutes = require('./routes/ecmr.routes');
const workingHoursRoutes = require('./routes/working-hours.routes');

// Import middleware
const { authenticateToken } = require('./middleware/auth');

// Logger setup
const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'sistrau-backend' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Global error handler
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection:', error);
  process.exit(1);
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'SISTRAU Backend'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/cargo', cargoRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/tachograph', tachographRoutes);
app.use('/api/ecmr', ecmrRoutes);
app.use('/api/working-hours', workingHoursRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize services and start server
const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();
    logger.info('Database initialized');

    // Initialize Redis
    await initializeRedis();
    logger.info('Redis initialized');

    // Initialize MQTT
    await initializeMQTT();
    logger.info('MQTT initialized');

    // Initialize Socket.io service
    socketHandler(io);
    logger.info('Socket.io service initialized');

    // Start cron jobs
    startCronJobs();
    logger.info('Cron jobs started');

    // Start server
    server.listen(PORT, () => {
      logger.info(`SISTRAU Backend running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

// Export for testing
module.exports = { app, server, io };