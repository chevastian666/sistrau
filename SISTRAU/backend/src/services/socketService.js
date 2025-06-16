const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');

let io;

const socketHandler = (socketIo) => {
  io = socketIo;

  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      socket.companyId = decoded.company_id;
      
      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`User ${socket.userId} connected via WebSocket`);

    // Join rooms based on user role and company
    socket.join(`user:${socket.userId}`);
    
    if (socket.companyId) {
      socket.join(`company:${socket.companyId}`);
    }
    
    socket.join(`role:${socket.userRole}`);

    // Subscribe to vehicle updates
    socket.on('subscribe:vehicle', (vehicleId) => {
      socket.join(`vehicle:${vehicleId}`);
      logger.debug(`User ${socket.userId} subscribed to vehicle ${vehicleId}`);
    });

    // Unsubscribe from vehicle updates
    socket.on('unsubscribe:vehicle', (vehicleId) => {
      socket.leave(`vehicle:${vehicleId}`);
      logger.debug(`User ${socket.userId} unsubscribed from vehicle ${vehicleId}`);
    });

    // Subscribe to trip updates
    socket.on('subscribe:trip', (tripId) => {
      socket.join(`trip:${tripId}`);
      logger.debug(`User ${socket.userId} subscribed to trip ${tripId}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`User ${socket.userId} disconnected`);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error for user ${socket.userId}:`, error);
    });
  });

  return io;
};

const getIO = () => io;

// Emit functions for different events
const emitVehicleUpdate = (vehicleId, data) => {
  if (io) {
    io.to(`vehicle:${vehicleId}`).emit('vehicle:update', data);
  }
};

const emitTripUpdate = (tripId, data) => {
  if (io) {
    io.to(`trip:${tripId}`).emit('trip:update', data);
  }
};

const emitCompanyUpdate = (companyId, event, data) => {
  if (io) {
    io.to(`company:${companyId}`).emit(event, data);
  }
};

const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

const emitToRole = (role, event, data) => {
  if (io) {
    io.to(`role:${role}`).emit(event, data);
  }
};

module.exports = {
  socketHandler,
  getIO,
  emitVehicleUpdate,
  emitTripUpdate,
  emitCompanyUpdate,
  emitToUser,
  emitToRole
};