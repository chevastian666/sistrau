const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const { getRedisClient } = require('../config/redis');

// Create different rate limiters for different endpoints
const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again later.',
    ...options
  };

  // Use Redis store if available
  try {
    const redisClient = getRedisClient();
    if (redisClient) {
      defaultOptions.store = new RedisStore({
        client: redisClient,
        prefix: 'rl:'
      });
    }
  } catch (error) {
    console.warn('Redis not available for rate limiting, using memory store');
  }

  return rateLimit(defaultOptions);
};

// General rate limiter
const rateLimiter = createRateLimiter();

// Strict rate limiter for auth endpoints
const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true // Don't count successful requests
});

// API rate limiter for general endpoints
const apiRateLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60 // 60 requests per minute
});

// IoT device rate limiter (more permissive)
const iotRateLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300, // 300 requests per minute
  keyGenerator: (req) => {
    // Use device ID as key if available
    return req.headers['x-device-id'] || req.ip;
  }
});

module.exports = {
  rateLimiter,
  authRateLimiter,
  apiRateLimiter,
  iotRateLimiter,
  createRateLimiter
};