const { getDb } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Vehicle {
  static tableName = 'vehicles';

  static async create(vehicleData) {
    const db = getDb();
    
    const vehicle = {
      id: uuidv4(),
      ...vehicleData,
      created_at: new Date(),
      updated_at: new Date()
    };

    const [createdVehicle] = await db(this.tableName)
      .insert(vehicle)
      .returning('*');

    return createdVehicle;
  }

  static async findById(id) {
    const db = getDb();
    return db(this.tableName)
      .where({ id })
      .first();
  }

  static async findByPlate(plateNumber) {
    const db = getDb();
    return db(this.tableName)
      .where({ plate_number: plateNumber })
      .first();
  }

  static async findByCompany(companyId, options = {}) {
    const db = getDb();
    const { page = 1, limit = 20, status, search } = options;
    const offset = (page - 1) * limit;

    let query = db(this.tableName)
      .where({ company_id: companyId });

    if (status) {
      query = query.where({ status });
    }

    if (search) {
      query = query.where(function() {
        this.where('plate_number', 'ilike', `%${search}%`)
          .orWhere('brand', 'ilike', `%${search}%`)
          .orWhere('model', 'ilike', `%${search}%`);
      });
    }

    const [vehicles, [{ count }]] = await Promise.all([
      query.clone().limit(limit).offset(offset),
      query.clone().count()
    ]);

    return {
      data: vehicles,
      pagination: {
        page,
        limit,
        total: parseInt(count),
        pages: Math.ceil(count / limit)
      }
    };
  }

  static async update(id, updateData) {
    const db = getDb();
    
    const dataToUpdate = {
      ...updateData,
      updated_at: new Date()
    };

    const [updatedVehicle] = await db(this.tableName)
      .where({ id })
      .update(dataToUpdate)
      .returning('*');

    return updatedVehicle;
  }

  static async updateStatus(id, status) {
    return this.update(id, { status });
  }

  static async delete(id) {
    const db = getDb();
    return db(this.tableName)
      .where({ id })
      .del();
  }

  static async getWithCurrentStatus(id) {
    const db = getDb();
    
    const vehicle = await db('vehicle_current_status')
      .where({ id })
      .first();

    if (vehicle && vehicle.current_driver_id) {
      const driver = await db('users')
        .where({ id: vehicle.current_driver_id })
        .select(['id', 'first_name', 'last_name', 'document_number'])
        .first();
      
      vehicle.current_driver = driver;
    }

    return vehicle;
  }

  static async getActiveTrips(vehicleId) {
    const db = getDb();
    
    return db('trips')
      .where({ vehicle_id: vehicleId })
      .whereIn('status', ['planned', 'in_progress'])
      .orderBy('planned_departure', 'desc');
  }

  static async getMaintenanceHistory(vehicleId, limit = 10) {
    const db = getDb();
    
    return db('vehicle_maintenance')
      .where({ vehicle_id: vehicleId })
      .orderBy('maintenance_date', 'desc')
      .limit(limit);
  }

  static async getLatestTelemetry(vehicleId) {
    const db = getDb();
    
    return db('vehicle_telemetry')
      .where({ vehicle_id: vehicleId })
      .orderBy('timestamp', 'desc')
      .first();
  }

  static async getStatsByCompany(companyId, dateFrom, dateTo) {
    const db = getDb();
    
    const baseQuery = db('daily_statistics')
      .join('vehicles', 'daily_statistics.vehicle_id', 'vehicles.id')
      .where('vehicles.company_id', companyId);

    if (dateFrom) {
      baseQuery.where('date', '>=', dateFrom);
    }
    if (dateTo) {
      baseQuery.where('date', '<=', dateTo);
    }

    const stats = await baseQuery
      .select(
        db.raw('SUM(total_trips) as total_trips'),
        db.raw('SUM(total_distance_km) as total_distance_km'),
        db.raw('SUM(total_weight_kg) as total_weight_kg'),
        db.raw('SUM(total_driving_time_minutes) as total_driving_time_minutes'),
        db.raw('AVG(avg_speed_kmh) as avg_speed_kmh'),
        db.raw('SUM(fuel_consumed_liters) as fuel_consumed_liters')
      )
      .first();

    const vehicleCount = await db(this.tableName)
      .where({ company_id: companyId })
      .count('* as count')
      .first();

    return {
      ...stats,
      vehicle_count: parseInt(vehicleCount.count)
    };
  }

  static async getNearbyVehicles(latitude, longitude, radiusKm = 50) {
    const db = getDb();
    
    // Using PostGIS for geographic queries
    const vehicles = await db.raw(`
      SELECT DISTINCT ON (v.id) 
        v.*,
        ST_Distance(
          g.location::geography,
          ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography
        ) / 1000 as distance_km,
        g.speed_kmh,
        g.heading,
        g.timestamp as last_position_time
      FROM vehicles v
      JOIN trips t ON v.id = t.vehicle_id AND t.status = 'in_progress'
      JOIN gps_tracking g ON t.id = g.trip_id
      WHERE 
        ST_DWithin(
          g.location::geography,
          ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography,
          ? * 1000
        )
        AND g.timestamp > NOW() - INTERVAL '15 minutes'
      ORDER BY v.id, g.timestamp DESC
    `, [longitude, latitude, longitude, latitude, radiusKm]);

    return vehicles.rows;
  }

  static async checkExpiredDocuments(companyId) {
    const db = getDb();
    
    const expiredVehicles = await db(this.tableName)
      .where({ company_id: companyId })
      .where(function() {
        this.where('insurance_expiry', '<', new Date())
          .orWhere('last_maintenance', '<', db.raw("NOW() - INTERVAL '6 months'"));
      })
      .select(['id', 'plate_number', 'insurance_expiry', 'last_maintenance']);

    return expiredVehicles;
  }
}

module.exports = Vehicle;