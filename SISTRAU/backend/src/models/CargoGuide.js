const { v4: uuidv4 } = require('uuid');

// Mock implementation
class CargoGuide {
  static async findAll(options = {}) {
    return {
      data: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
      }
    };
  }

  static async findById(id) {
    return null;
  }

  static async create(data) {
    return { id: uuidv4(), ...data };
  }

  static async update(id, data) {
    return { id, ...data };
  }

  static async verify(id, userId) {
    return { id, verified_by: userId, verified_at: new Date() };
  }

  static async getStatistics(filters = {}) {
    return {
      summary: {
        totalGuides: 0,
        verifiedGuides: 0,
        totalWeightKg: 0,
        totalVolumeM3: 0,
        totalDeclaredValue: 0,
        avgWeightKg: 0,
        uniqueShippers: 0,
        uniqueReceivers: 0,
        verificationRate: 0
      },
      topCargoTypes: [],
      guidesByDay: []
    };
  }
}

module.exports = CargoGuide;