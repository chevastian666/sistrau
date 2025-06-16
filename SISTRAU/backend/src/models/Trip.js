const { v4: uuidv4 } = require('uuid');

// Mock implementation
class Trip {
  static async findById(id) {
    return null;
  }

  static async getVehicle() {
    return { company_id: '550e8400-e29b-41d4-a716-446655440001' };
  }
}

module.exports = Trip;