const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { mockDb } = require('../config/database');

class User {
  static tableName = 'users';

  static async create(userData) {
    const { password, ...otherData } = userData;
    
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = {
      id: uuidv4(),
      ...otherData,
      password_hash: passwordHash,
      created_at: new Date(),
      updated_at: new Date()
    };

    mockDb.users.push(user);
    
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async findById(id) {
    return mockDb.users.find(u => u.id === id) || null;
  }

  static async findByEmail(email) {
    return mockDb.users.find(u => u.email === email) || null;
  }

  static async findByUsername(username) {
    return mockDb.users.find(u => u.username === username) || null;
  }

  static async update(id, updateData) {
    const userIndex = mockDb.users.findIndex(u => u.id === id);
    if (userIndex === -1) return null;

    const { password, ...otherData } = updateData;
    
    if (password) {
      const salt = await bcrypt.genSalt(10);
      otherData.password_hash = await bcrypt.hash(password, salt);
    }

    mockDb.users[userIndex] = {
      ...mockDb.users[userIndex],
      ...otherData,
      updated_at: new Date()
    };

    const { password_hash, ...userWithoutPassword } = mockDb.users[userIndex];
    return userWithoutPassword;
  }

  static async verifyPassword(user, password) {
    return bcrypt.compare(password, user.password_hash);
  }

  static async updateLastLogin(id) {
    const userIndex = mockDb.users.findIndex(u => u.id === id);
    if (userIndex !== -1) {
      mockDb.users[userIndex].last_login = new Date();
    }
  }

  static async findByCompany(companyId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const users = mockDb.users.filter(u => u.company_id === companyId);
    
    return {
      data: users.slice((page - 1) * limit, page * limit),
      pagination: {
        page,
        limit,
        total: users.length,
        pages: Math.ceil(users.length / limit)
      }
    };
  }

  static async search(searchTerm, options = {}) {
    const { page = 1, limit = 20 } = options;
    const users = mockDb.users.filter(u => 
      u.username.includes(searchTerm) ||
      u.email.includes(searchTerm) ||
      u.first_name?.includes(searchTerm) ||
      u.last_name?.includes(searchTerm)
    );
    
    return {
      data: users.slice((page - 1) * limit, page * limit),
      pagination: {
        page,
        limit,
        total: users.length,
        pages: Math.ceil(users.length / limit)
      }
    };
  }

  static async getStatsByCompany(companyId) {
    const users = mockDb.users.filter(u => u.company_id === companyId);
    const byRole = {};
    
    users.forEach(user => {
      byRole[user.role] = (byRole[user.role] || 0) + 1;
    });

    return {
      total: users.length,
      byRole
    };
  }
}

module.exports = User;