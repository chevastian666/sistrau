const knex = require('knex');
const logger = require('../utils/logger');

let db;

const initializeDatabase = async () => {
  try {
    db = knex({
      client: 'pg',
      connection: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER || 'sistrau_user',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'sistrau'
      },
      pool: {
        min: 2,
        max: 10,
        createTimeoutMillis: 3000,
        acquireTimeoutMillis: 30000,
        idleTimeoutMillis: 30000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 100,
      },
      debug: process.env.NODE_ENV === 'development'
    });

    // Test connection
    await db.raw('SELECT 1');
    logger.info('Database connection established successfully');

    // Run migrations if needed
    if (process.env.RUN_MIGRATIONS === 'true') {
      await db.migrate.latest();
      logger.info('Database migrations completed');
    }

    return db;
  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  }
};

const getDb = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
};

const closeDatabase = async () => {
  if (db) {
    await db.destroy();
    logger.info('Database connection closed');
  }
};

// Transaction helper
const withTransaction = async (callback) => {
  const trx = await db.transaction();
  try {
    const result = await callback(trx);
    await trx.commit();
    return result;
  } catch (error) {
    await trx.rollback();
    throw error;
  }
};

module.exports = {
  initializeDatabase,
  getDb,
  closeDatabase,
  withTransaction
};