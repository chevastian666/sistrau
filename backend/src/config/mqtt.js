const mqtt = require('mqtt');
const logger = require('../utils/logger');
const { handleGPSData } = require('../services/trackingService');
const { handleTelemetryData } = require('../services/telemetryService');
const { handleAlertData } = require('../services/alertService');

let mqttClient;

const TOPICS = {
  GPS: 'sistrau/+/gps',           // sistrau/{deviceId}/gps
  TELEMETRY: 'sistrau/+/telemetry', // sistrau/{deviceId}/telemetry
  ALERTS: 'sistrau/+/alerts',       // sistrau/{deviceId}/alerts
  COMMANDS: 'sistrau/+/commands',   // sistrau/{deviceId}/commands
  STATUS: 'sistrau/+/status'        // sistrau/{deviceId}/status
};

const initializeMQTT = async () => {
  return new Promise((resolve, reject) => {
    try {
      const options = {
        clientId: `sistrau-backend-${process.env.NODE_ENV}-${Date.now()}`,
        clean: true,
        connectTimeout: 30000,
        reconnectPeriod: 1000,
        username: process.env.MQTT_USERNAME,
        password: process.env.MQTT_PASSWORD
      };

      mqttClient = mqtt.connect(process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883', options);

      mqttClient.on('connect', () => {
        logger.info('MQTT client connected successfully');
        
        // Subscribe to all topics
        Object.values(TOPICS).forEach(topic => {
          mqttClient.subscribe(topic, { qos: 1 }, (err) => {
            if (err) {
              logger.error(`Failed to subscribe to topic ${topic}:`, err);
            } else {
              logger.info(`Subscribed to MQTT topic: ${topic}`);
            }
          });
        });

        resolve(mqttClient);
      });

      mqttClient.on('error', (error) => {
        logger.error('MQTT client error:', error);
        reject(error);
      });

      mqttClient.on('message', handleMQTTMessage);

      mqttClient.on('disconnect', () => {
        logger.warn('MQTT client disconnected');
      });

      mqttClient.on('reconnect', () => {
        logger.info('MQTT client reconnecting...');
      });

    } catch (error) {
      logger.error('MQTT initialization error:', error);
      reject(error);
    }
  });
};

const handleMQTTMessage = async (topic, message) => {
  try {
    const topicParts = topic.split('/');
    const deviceId = topicParts[1];
    const dataType = topicParts[2];
    
    const data = JSON.parse(message.toString());
    
    logger.debug(`MQTT message received - Device: ${deviceId}, Type: ${dataType}`);

    switch (dataType) {
      case 'gps':
        await handleGPSData(deviceId, data);
        break;
      
      case 'telemetry':
        await handleTelemetryData(deviceId, data);
        break;
      
      case 'alerts':
        await handleAlertData(deviceId, data);
        break;
      
      case 'status':
        await handleDeviceStatus(deviceId, data);
        break;
      
      default:
        logger.warn(`Unknown MQTT topic type: ${dataType}`);
    }

  } catch (error) {
    logger.error('Error processing MQTT message:', error);
  }
};

const handleDeviceStatus = async (deviceId, data) => {
  // Update device last seen timestamp
  const { getDb } = require('../config/database');
  const db = getDb();
  
  await db('iot_devices')
    .where({ device_id: deviceId })
    .update({
      last_seen: new Date(),
      is_active: data.online || true
    });
};

const publishCommand = async (deviceId, command, data) => {
  const topic = `sistrau/${deviceId}/commands`;
  const message = JSON.stringify({
    command,
    data,
    timestamp: new Date().toISOString()
  });

  return new Promise((resolve, reject) => {
    mqttClient.publish(topic, message, { qos: 1 }, (err) => {
      if (err) {
        logger.error(`Failed to publish command to device ${deviceId}:`, err);
        reject(err);
      } else {
        logger.info(`Command published to device ${deviceId}: ${command}`);
        resolve();
      }
    });
  });
};

const getMQTTClient = () => {
  if (!mqttClient) {
    throw new Error('MQTT client not initialized. Call initializeMQTT() first.');
  }
  return mqttClient;
};

const closeMQTT = async () => {
  if (mqttClient) {
    await mqttClient.end();
    logger.info('MQTT connection closed');
  }
};

module.exports = {
  initializeMQTT,
  getMQTTClient,
  closeMQTT,
  publishCommand,
  TOPICS
};