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

// Tracking-specific emit functions
const emitVehiclePosition = (vehicleId, position) => {
  if (io) {
    io.to(`vehicle:${vehicleId}`).emit('vehicle:position:update', position);
    // Also emit to company room for general tracking
    if (position.companyId) {
      io.to(`company:${position.companyId}`).emit('vehicle:position:update', position);
    }
  }
};

const emitVehicleAlert = (vehicleId, alert) => {
  if (io) {
    io.to(`vehicle:${vehicleId}`).emit('vehicle:alert', alert);
    // Emit to relevant roles for critical alerts
    if (alert.severity === 'critical' || alert.severity === 'high') {
      io.to('role:admin').emit('vehicle:alert', alert);
      io.to('role:manager').emit('vehicle:alert', alert);
    }
  }
};

const emitGeofenceEvent = (vehicleId, geofenceId, eventType, data) => {
  if (io) {
    io.to(`vehicle:${vehicleId}`).emit('geofence:event', {
      vehicleId,
      geofenceId,
      eventType, // 'entry' or 'exit'
      data,
      timestamp: new Date().toISOString()
    });
  }
};

const emitTrafficUpdate = (bounds, trafficData) => {
  if (io) {
    // Emit to all connected tracking clients
    io.emit('traffic:update', {
      bounds,
      data: trafficData,
      timestamp: new Date().toISOString()
    });
  }
};

// Tachograph-specific emit functions
const emitTachographUpdate = (driverId, data) => {
  if (io) {
    io.to(`user:${driverId}`).emit('tachograph:update', data);
    // Also emit to company and relevant roles
    if (data.violations && data.violations.length > 0) {
      io.to('role:admin').emit('tachograph:violation', {
        driverId,
        violations: data.violations,
        timestamp: new Date().toISOString()
      });
    }
  }
};

const emitTachographViolation = (driverId, violation) => {
  if (io) {
    io.to(`user:${driverId}`).emit('tachograph:violation', violation);
    io.to('role:admin').emit('tachograph:violation', violation);
    io.to('role:authority').emit('tachograph:violation', violation);
  }
};

// e-CMR specific emit functions
const emitECMRUpdate = (ecmrId, data) => {
  if (io) {
    io.emit(`ecmr:update:${ecmrId}`, data);
    
    // Emit to specific roles for important events
    if (data.type === 'completed' || data.type === 'issued') {
      io.to('role:admin').emit('ecmr:event', {
        ecmrId,
        type: data.type,
        timestamp: new Date().toISOString()
      });
      io.to('role:authority').emit('ecmr:event', {
        ecmrId,
        type: data.type,
        timestamp: new Date().toISOString()
      });
    }
  }
};

const emitECMREvent = (ecmrId, eventType, data) => {
  if (io) {
    io.emit(`ecmr:${eventType}:${ecmrId}`, data);
    
    // Also emit to general e-CMR channel
    io.emit('ecmr:event', {
      ecmrId,
      eventType,
      data,
      timestamp: new Date().toISOString()
    });
  }
};

// Working Hours specific emit functions
const emitWorkingHoursUpdate = (driverId, data) => {
  if (io) {
    io.to(`user:${driverId}`).emit('workinghours:update', data);
    
    // Emit to company room
    io.to(`company:${data.companyId || 'default'}`).emit('workinghours:update', {
      driverId,
      ...data
    });
    
    // Alert admins for violations
    if (data.compliance && data.compliance.status === 'violation') {
      io.to('role:admin').emit('workinghours:violation', {
        driverId,
        violations: data.compliance.violations,
        timestamp: new Date().toISOString()
      });
    }
  }
};

module.exports = {
  socketHandler,
  getIO,
  emitVehicleUpdate,
  emitTripUpdate,
  emitCompanyUpdate,
  emitToUser,
  emitToRole,
  emitVehiclePosition,
  emitVehicleAlert,
  emitGeofenceEvent,
  emitTrafficUpdate,
  emitTachographUpdate,
  emitTachographViolation,
  emitECMRUpdate,
  emitECMREvent,
  emitWorkingHoursUpdate
};