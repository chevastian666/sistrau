const { getDb } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class CargoGuide {
  static tableName = 'cargo_guides';

  static async create(guideData) {
    const db = getDb();
    
    const guide = {
      id: uuidv4(),
      ...guideData,
      created_at: new Date(),
    };

    const [createdGuide] = await db(this.tableName)
      .insert(guide)
      .returning('*');

    return createdGuide;
  }

  static async findById(id) {
    const db = getDb();
    
    const guide = await db(this.tableName)
      .where({ id })
      .first();

    if (guide && guide.trip_id) {
      // Get associated trip info
      guide.trip = await db('trips')
        .where({ id: guide.trip_id })
        .select(['id', 'origin_address', 'destination_address', 'status'])
        .first();
    }

    return guide;
  }

  static async findByGuideNumber(guideNumber) {
    const db = getDb();
    return db(this.tableName)
      .where({ guide_number: guideNumber })
      .first();
  }

  static async findAll(options = {}) {
    const db = getDb();
    const { filters = {}, page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    let query = db(this.tableName)
      .leftJoin('trips', 'cargo_guides.trip_id', 'trips.id')
      .leftJoin('vehicles', 'trips.vehicle_id', 'vehicles.id');

    // Apply filters
    if (filters.companyId) {
      query = query.where('vehicles.company_id', filters.companyId);
    }

    if (filters.tripId) {
      query = query.where('cargo_guides.trip_id', filters.tripId);
    }

    if (filters.search) {
      query = query.where(function() {
        this.where('guide_number', 'ilike', `%${filters.search}%`)
          .orWhere('shipper_name', 'ilike', `%${filters.search}%`)
          .orWhere('receiver_name', 'ilike', `%${filters.search}%`)
          .orWhere('cargo_description', 'ilike', `%${filters.search}%`);
      });
    }

    if (filters.dateRange) {
      if (filters.dateRange.startDate) {
        query = query.where('cargo_guides.created_at', '>=', filters.dateRange.startDate);
      }
      if (filters.dateRange.endDate) {
        query = query.where('cargo_guides.created_at', '<=', filters.dateRange.endDate);
      }
    }

    if (filters.isVerified !== undefined) {
      query = query.where('cargo_guides.is_verified', filters.isVerified);
    }

    // Select specific fields
    const selectFields = [
      'cargo_guides.*',
      'trips.origin_address',
      'trips.destination_address',
      'trips.status as trip_status',
      'vehicles.plate_number',
    ];

    const [guides, [{ count }]] = await Promise.all([
      query.clone()
        .select(selectFields)
        .orderBy('cargo_guides.created_at', 'desc')
        .limit(limit)
        .offset(offset),
      query.clone()
        .count('cargo_guides.id as count')
    ]);

    return {
      data: guides,
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

    // Remove fields that shouldn't be updated
    delete dataToUpdate.id;
    delete dataToUpdate.guide_number;
    delete dataToUpdate.created_at;

    const [updatedGuide] = await db(this.tableName)
      .where({ id })
      .update(dataToUpdate)
      .returning('*');

    return updatedGuide;
  }

  static async verify(id, verifiedBy) {
    const db = getDb();
    
    const [verifiedGuide] = await db(this.tableName)
      .where({ id })
      .update({
        is_verified: true,
        verified_by: verifiedBy,
        verified_at: new Date()
      })
      .returning('*');

    return verifiedGuide;
  }

  static async delete(id) {
    const db = getDb();
    return db(this.tableName)
      .where({ id })
      .del();
  }

  static async getStatistics(filters = {}) {
    const db = getDb();
    
    let query = db(this.tableName)
      .leftJoin('trips', 'cargo_guides.trip_id', 'trips.id')
      .leftJoin('vehicles', 'trips.vehicle_id', 'vehicles.id');

    if (filters.companyId) {
      query = query.where('vehicles.company_id', filters.companyId);
    }

    if (filters.dateRange) {
      if (filters.dateRange.startDate) {
        query = query.where('cargo_guides.created_at', '>=', filters.dateRange.startDate);
      }
      if (filters.dateRange.endDate) {
        query = query.where('cargo_guides.created_at', '<=', filters.dateRange.endDate);
      }
    }

    const stats = await query
      .select(
        db.raw('COUNT(*) as total_guides'),
        db.raw('COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_guides'),
        db.raw('SUM(weight_kg) as total_weight_kg'),
        db.raw('SUM(volume_m3) as total_volume_m3'),
        db.raw('SUM(declared_value) as total_declared_value'),
        db.raw('AVG(weight_kg) as avg_weight_kg'),
        db.raw('COUNT(DISTINCT shipper_rut) as unique_shippers'),
        db.raw('COUNT(DISTINCT receiver_rut) as unique_receivers')
      )
      .first();

    // Get top cargo types
    const topCargoTypes = await query.clone()
      .select('cargo_description')
      .count('* as count')
      .groupBy('cargo_description')
      .orderBy('count', 'desc')
      .limit(5);

    // Get guides by day for the period
    const guidesByDay = await query.clone()
      .select(
        db.raw('DATE(created_at) as date'),
        db.raw('COUNT(*) as count')
      )
      .groupBy(db.raw('DATE(created_at)'))
      .orderBy('date', 'desc')
      .limit(30);

    return {
      summary: {
        totalGuides: parseInt(stats.total_guides),
        verifiedGuides: parseInt(stats.verified_guides),
        totalWeightKg: parseFloat(stats.total_weight_kg) || 0,
        totalVolumeM3: parseFloat(stats.total_volume_m3) || 0,
        totalDeclaredValue: parseFloat(stats.total_declared_value) || 0,
        avgWeightKg: parseFloat(stats.avg_weight_kg) || 0,
        uniqueShippers: parseInt(stats.unique_shippers),
        uniqueReceivers: parseInt(stats.unique_receivers),
        verificationRate: stats.total_guides > 0 
          ? (stats.verified_guides / stats.total_guides * 100).toFixed(2) 
          : 0,
      },
      topCargoTypes: topCargoTypes.map(item => ({
        description: item.cargo_description,
        count: parseInt(item.count)
      })),
      guidesByDay: guidesByDay.map(item => ({
        date: item.date,
        count: parseInt(item.count)
      }))
    };
  }

  static async getByTrip(tripId) {
    const db = getDb();
    
    return db(this.tableName)
      .where({ trip_id: tripId })
      .orderBy('created_at', 'desc');
  }

  static async validateBlockchainHash(id, hash) {
    const db = getDb();
    
    const guide = await db(this.tableName)
      .where({ id })
      .select(['blockchain_hash'])
      .first();

    return guide && guide.blockchain_hash === hash;
  }

  static async getRecentActivity(companyId, limit = 10) {
    const db = getDb();
    
    let query = db(this.tableName)
      .leftJoin('trips', 'cargo_guides.trip_id', 'trips.id')
      .leftJoin('vehicles', 'trips.vehicle_id', 'vehicles.id')
      .select([
        'cargo_guides.id',
        'cargo_guides.guide_number',
        'cargo_guides.shipper_name',
        'cargo_guides.receiver_name',
        'cargo_guides.created_at',
        'cargo_guides.is_verified',
        'vehicles.plate_number'
      ])
      .orderBy('cargo_guides.created_at', 'desc')
      .limit(limit);

    if (companyId) {
      query = query.where('vehicles.company_id', companyId);
    }

    return query;
  }
}

module.exports = CargoGuide;