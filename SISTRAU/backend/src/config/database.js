const logger = require('../utils/logger');

// Mock database for development without PostgreSQL
let mockDb = {
  users: [
    {
      id: '550e8400-e29b-41d4-a716-446655440011',
      username: 'admin',
      email: 'admin@sistrau.gub.uy',
      password_hash: '$2a$10$ssMkGFzokqxD9dvQnTECG.CEGHvz5bMdSCjIIOnloqkUg.pYqrzeq', // admin123
      role: 'admin',
      firstName: 'Admin',
      lastName: 'Sistema',
      documentNumber: '12345678',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440012',
      username: 'transportista',
      email: 'transportista@test.com',
      password_hash: '$2a$10$xRmB9Fr0rYSKwpUbDSc5B.MjjQm0TYO5lZDU5Hp7xuE3OT3lVz9YS', // demo123
      role: 'transporter',
      firstName: 'Juan',
      lastName: 'Pérez',
      documentNumber: '87654321',
      companyId: '550e8400-e29b-41d4-a716-446655440001',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  vehicles: []
};

const initializeDatabase = async () => {
  logger.info('Using mock database (no PostgreSQL connection)');
  return true;
};

const getDb = () => {
  // Return mock database functions
  return {
    raw: () => ({ rows: [] }),
    transaction: async (callback) => {
      return callback({
        commit: async () => {},
        rollback: async () => {}
      });
    },
    // Mock table function
    table: (tableName) => ({
      select: () => Promise.resolve(mockDb[tableName] || []),
      where: () => ({
        first: () => Promise.resolve(mockDb[tableName]?.[0] || null),
        select: () => Promise.resolve([])
      }),
      insert: (data) => ({
        returning: () => Promise.resolve([data])
      }),
      update: () => ({
        returning: () => Promise.resolve([])
      })
    }),
    // Direct access for specific tables
    users: mockDb.users,
    vehicles: mockDb.vehicles
  };
};

const closeDatabase = async () => {
  logger.info('Mock database closed');
};

const withTransaction = async (callback) => {
  return callback({
    commit: async () => {},
    rollback: async () => {}
  });
};

module.exports = {
  initializeDatabase,
  getDb,
  closeDatabase,
  withTransaction,
  mockDb
};