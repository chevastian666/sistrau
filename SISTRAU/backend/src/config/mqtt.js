const logger = require('../utils/logger');

// Mock MQTT for development
const initializeMQTT = async () => {
  logger.info('Using mock MQTT (no MQTT broker connection)');
  return true;
};

const getMQTTClient = () => {
  return {
    publish: (topic, message) => {
      logger.debug(`Mock MQTT publish to ${topic}: ${message}`);
    },
    subscribe: (topic) => {
      logger.debug(`Mock MQTT subscribe to ${topic}`);
    }
  };
};

const closeMQTT = async () => {
  logger.info('Mock MQTT closed');
};

const publishCommand = async (deviceId, command, data) => {
  logger.debug(`Mock command to device ${deviceId}: ${command}`);
  return Promise.resolve();
};

module.exports = {
  initializeMQTT,
  getMQTTClient,
  closeMQTT,
  publishCommand,
  TOPICS: {
    GPS: 'sistrau/+/gps',
    TELEMETRY: 'sistrau/+/telemetry',
    ALERTS: 'sistrau/+/alerts',
    COMMANDS: 'sistrau/+/commands',
    STATUS: 'sistrau/+/status'
  }
};