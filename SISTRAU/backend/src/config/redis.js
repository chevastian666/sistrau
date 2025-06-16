const logger = require('../utils/logger');

// Mock Redis for development without Redis
let mockCache = {};

const initializeRedis = async () => {
  logger.info('Using mock Redis (no Redis connection)');
  return true;
};

const getRedisClient = () => {
  return {
    ping: async () => 'PONG',
    get: async (key) => mockCache[key] || null,
    set: async (key, value) => {
      mockCache[key] = value;
      return 'OK';
    },
    del: async (key) => {
      delete mockCache[key];
      return 1;
    }
  };
};

const closeRedis = async () => {
  logger.info('Mock Redis closed');
};

const cache = {
  async get(key) {
    try {
      const value = mockCache[key];
      return value ? JSON.parse(value) : null;
    } catch (error) {
      return null;
    }
  },

  async set(key, value, ttlSeconds = 3600) {
    try {
      mockCache[key] = JSON.stringify(value);
      // Note: TTL not implemented in mock
      return true;
    } catch (error) {
      return false;
    }
  },

  async del(key) {
    delete mockCache[key];
    return true;
  },

  async flush() {
    mockCache = {};
    return true;
  }
};

module.exports = {
  initializeRedis,
  getRedisClient,
  closeRedis,
  cache
};