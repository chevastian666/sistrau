const { getDb, mockDb } = require('../config/database');
const logger = require('../utils/logger');

const createAlert = async (alertData) => {
  try {
    // Check if similar alert already exists in mock database
    const oneHourAgo = new Date(Date.now() - 3600000);
    const existingAlert = mockDb.alerts?.find(alert => 
      alert.type === alertData.type &&
      alert.vehicle_id === alertData.vehicle_id &&
      !alert.is_resolved &&
      new Date(alert.created_at) > oneHourAgo
    );

    if (existingAlert) {
      logger.debug(`Similar alert already exists for vehicle ${alertData.vehicle_id}`);
      return existingAlert;
    }

    // Create new alert
    const alert = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...alertData,
      created_at: new Date(),
      is_resolved: false
    };

    // Store in mock database
    if (!mockDb.alerts) {
      mockDb.alerts = [];
    }
    mockDb.alerts.push(alert);

    // Emit alert via WebSocket
    const io = require('./socketService').getIO();
    if (io) {
      io.emit('alert:new', alert);
    }

    logger.info(`Alert created: ${alert.type} for vehicle ${alert.vehicle_id || 'system'}`);
    
    return alert;

  } catch (error) {
    logger.error('Error creating alert:', error);
    throw error;
  }
};

const handleAlertData = async (deviceId, data) => {
  try {
    // Get vehicle from mock device data
    const device = mockDb.iot_devices?.find(d => d.device_id === deviceId);

    if (!device || !device.vehicle_id) {
      logger.warn(`No vehicle found for device ${deviceId}`);
      return;
    }

    // Create alert with device data
    await createAlert({
      ...data,
      vehicle_id: device.vehicle_id
    });

  } catch (error) {
    logger.error(`Error processing alert from device ${deviceId}:`, error);
  }
};

module.exports = {
  createAlert,
  handleAlertData
};