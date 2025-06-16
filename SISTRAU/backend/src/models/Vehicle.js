const { v4: uuidv4 } = require('uuid');
const { mockDb } = require('../config/database');

// Initialize mock vehicles
if (!mockDb.vehicles) {
  mockDb.vehicles = [
    {
      id: '550e8400-e29b-41d4-a716-446655440020',
      company_id: '550e8400-e29b-41d4-a716-446655440001',
      plateNumber: 'ABC 1234',
      brand: 'Mercedes-Benz',
      model: 'Actros',
      year: 2022,
      type: 'truck',
      maxWeightKg: 40000,
      status: 'active',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440021',
      company_id: '550e8400-e29b-41d4-a716-446655440001',
      plateNumber: 'DEF 5678',
      brand: 'Scania',
      model: 'R450',
      year: 2021,
      type: 'truck',
      maxWeightKg: 35000,
      status: 'active',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440022',
      company_id: '550e8400-e29b-41d4-a716-446655440001',
      plateNumber: 'GHI 9012',
      brand: 'Volvo',
      model: 'FH16',
      year: 2023,
      type: 'truck',
      maxWeightKg: 42000,
      status: 'maintenance',
      created_at: new Date(),
      updated_at: new Date()
    }
  ];
}

class Vehicle {
  static tableName = 'vehicles';

  static async create(vehicleData) {
    const vehicle = {
      id: uuidv4(),
      ...vehicleData,
      created_at: new Date(),
      updated_at: new Date()
    };

    mockDb.vehicles.push(vehicle);
    return vehicle;
  }

  static async findById(id) {
    return mockDb.vehicles.find(v => v.id === id) || null;
  }

  static async findByPlate(plateNumber) {
    return mockDb.vehicles.find(v => v.plateNumber === plateNumber) || null;
  }

  static async findByCompany(companyId, options = {}) {
    const { page = 1, limit = 20, status, search } = options;
    
    let vehicles = companyId 
      ? mockDb.vehicles.filter(v => v.company_id === companyId)
      : mockDb.vehicles;

    if (status) {
      vehicles = vehicles.filter(v => v.status === status);
    }

    if (search) {
      vehicles = vehicles.filter(v => 
        v.plateNumber.toLowerCase().includes(search.toLowerCase()) ||
        v.brand?.toLowerCase().includes(search.toLowerCase()) ||
        v.model?.toLowerCase().includes(search.toLowerCase())
      );
    }

    const start = (page - 1) * limit;
    const end = start + limit;

    return {
      data: vehicles.slice(start, end),
      pagination: {
        page,
        limit,
        total: vehicles.length,
        pages: Math.ceil(vehicles.length / limit)
      }
    };
  }

  static async update(id, updateData) {
    const vehicleIndex = mockDb.vehicles.findIndex(v => v.id === id);
    if (vehicleIndex === -1) return null;

    mockDb.vehicles[vehicleIndex] = {
      ...mockDb.vehicles[vehicleIndex],
      ...updateData,
      updated_at: new Date()
    };

    return mockDb.vehicles[vehicleIndex];
  }

  static async updateStatus(id, status) {
    return this.update(id, { status });
  }

  static async delete(id) {
    const index = mockDb.vehicles.findIndex(v => v.id === id);
    if (index !== -1) {
      mockDb.vehicles.splice(index, 1);
      return 1;
    }
    return 0;
  }

  static async getWithCurrentStatus(id) {
    const vehicle = await this.findById(id);
    if (!vehicle) return null;

    // Add mock current position
    vehicle.currentPosition = {
      latitude: -34.9011,
      longitude: -56.1645,
      speed: Math.floor(Math.random() * 90),
      heading: Math.floor(Math.random() * 360),
      timestamp: new Date().toISOString()
    };

    return vehicle;
  }

  static async getActiveTrips(vehicleId) {
    // Mock: no active trips
    return [];
  }

  static async getMaintenanceHistory(vehicleId, limit = 10) {
    // Mock maintenance history
    return [];
  }

  static async getLatestTelemetry(vehicleId) {
    // Mock telemetry
    return {
      vehicle_id: vehicleId,
      timestamp: new Date(),
      fuel_level_percent: 75,
      odometer_km: 125000,
      engine_rpm: 1500,
      coolant_temp_c: 85
    };
  }

  static async getStatsByCompany(companyId, dateFrom, dateTo) {
    const vehicles = mockDb.vehicles.filter(v => v.company_id === companyId);
    
    return {
      total_trips: 100,
      total_distance_km: 15000,
      total_weight_kg: 500000,
      total_driving_time_minutes: 12000,
      avg_speed_kmh: 75,
      fuel_consumed_liters: 4500,
      vehicle_count: vehicles.length
    };
  }

  static async getCompanyVehiclePositions(companyId) {
    const vehicles = mockDb.vehicles.filter(v => v.company_id === companyId);
    
    return vehicles.map(v => ({
      ...v,
      longitude: -56.1645 + (Math.random() - 0.5) * 0.1,
      latitude: -34.9011 + (Math.random() - 0.5) * 0.1,
      speed_kmh: Math.floor(Math.random() * 90),
      heading: Math.floor(Math.random() * 360),
      timestamp: new Date()
    }));
  }

  static async getNearbyVehicles(latitude, longitude, radiusKm = 50) {
    // Mock: return some vehicles as if they were nearby
    return mockDb.vehicles.slice(0, 3).map(v => ({
      ...v,
      distance_km: Math.random() * radiusKm,
      speed_kmh: Math.floor(Math.random() * 90),
      heading: Math.floor(Math.random() * 360),
      last_position_time: new Date()
    }));
  }

  static async checkExpiredDocuments(companyId) {
    // Mock: no expired documents
    return [];
  }
}

module.exports = Vehicle;