const { getDb } = require('../config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

class User {
  static tableName = 'users';

  static async create(userData) {
    const db = getDb();
    const { password, ...otherData } = userData;
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = {
      id: uuidv4(),
      ...otherData,
      password_hash: passwordHash,
      created_at: new Date(),
      updated_at: new Date()
    };

    const [createdUser] = await db(this.tableName)
      .insert(user)
      .returning(['id', 'username', 'email', 'role', 'first_name', 'last_name', 'company_id', 'created_at']);

    return createdUser;
  }

  static async findById(id) {
    const db = getDb();
    return db(this.tableName)
      .where({ id })
      .first();
  }

  static async findByEmail(email) {
    const db = getDb();
    return db(this.tableName)
      .where({ email })
      .first();
  }

  static async findByUsername(username) {
    const db = getDb();
    return db(this.tableName)
      .where({ username })
      .first();
  }

  static async update(id, updateData) {
    const db = getDb();
    const { password, ...otherData } = updateData;

    const dataToUpdate = {
      ...otherData,
      updated_at: new Date()
    };

    // If password is being updated, hash it
    if (password) {
      const salt = await bcrypt.genSalt(10);
      dataToUpdate.password_hash = await bcrypt.hash(password, salt);
    }

    const [updatedUser] = await db(this.tableName)
      .where({ id })
      .update(dataToUpdate)
      .returning(['id', 'username', 'email', 'role', 'first_name', 'last_name', 'company_id', 'updated_at']);

    return updatedUser;
  }

  static async delete(id) {
    const db = getDb();
    return db(this.tableName)
      .where({ id })
      .del();
  }

  static async verifyPassword(user, password) {
    return bcrypt.compare(password, user.password_hash);
  }

  static async updateLastLogin(id) {
    const db = getDb();
    return db(this.tableName)
      .where({ id })
      .update({ last_login: new Date() });
  }

  static async findByCompany(companyId, options = {}) {
    const db = getDb();
    const { page = 1, limit = 20, role, isActive } = options;
    const offset = (page - 1) * limit;

    let query = db(this.tableName)
      .where({ company_id: companyId })
      .select(['id', 'username', 'email', 'role', 'first_name', 'last_name', 'is_active', 'last_login', 'created_at']);

    if (role) {
      query = query.where({ role });
    }

    if (isActive !== undefined) {
      query = query.where({ is_active: isActive });
    }

    const [users, [{ count }]] = await Promise.all([
      query.limit(limit).offset(offset),
      db(this.tableName).where({ company_id: companyId }).count()
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total: parseInt(count),
        pages: Math.ceil(count / limit)
      }
    };
  }

  static async search(searchTerm, options = {}) {
    const db = getDb();
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const query = db(this.tableName)
      .where('username', 'ilike', `%${searchTerm}%`)
      .orWhere('email', 'ilike', `%${searchTerm}%`)
      .orWhere('first_name', 'ilike', `%${searchTerm}%`)
      .orWhere('last_name', 'ilike', `%${searchTerm}%`)
      .select(['id', 'username', 'email', 'role', 'first_name', 'last_name', 'company_id', 'is_active']);

    const [users, [{ count }]] = await Promise.all([
      query.clone().limit(limit).offset(offset),
      query.clone().count()
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total: parseInt(count),
        pages: Math.ceil(count / limit)
      }
    };
  }

  static async getStatsByCompany(companyId) {
    const db = getDb();
    const stats = await db(this.tableName)
      .where({ company_id: companyId })
      .select('role')
      .count('* as count')
      .groupBy('role');

    const total = await db(this.tableName)
      .where({ company_id: companyId })
      .count('* as total');

    return {
      total: parseInt(total[0].total),
      byRole: stats.reduce((acc, curr) => {
        acc[curr.role] = parseInt(curr.count);
        return acc;
      }, {})
    };
  }
}

module.exports = User;