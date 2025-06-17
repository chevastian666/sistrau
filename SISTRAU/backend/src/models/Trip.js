const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const Vehicle = require('./Vehicle');
const User = require('./User');
const ECMR = require('./ECMR');
const logger = require('../utils/logger');

class Trip {
  // Trip statuses
  static STATUS = {
    SCHEDULED: 'scheduled',
    IN_TRANSIT: 'in_transit',
    PAUSED: 'paused',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    DELAYED: 'delayed'
  };

  // Alert severities
  static ALERT_SEVERITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
  };

  // Document types
  static DOCUMENT_TYPES = {
    CARGO_GUIDE: 'guia',
    INVOICE: 'factura',
    PERMIT: 'permiso',
    INSURANCE: 'seguro',
    CUSTOMS: 'aduana',
    OTHER: 'otro'
  };

  static async create(data) {
    try {
      const id = uuidv4();
      const now = new Date().toISOString();

      const trip = {
        id,
        vehicle_id: data.vehicleId,
        driver_id: data.driverId,
        ecmr_id: data.ecmrId || null,
        route: {
          origin: data.origin,
          destination: data.destination,
          waypoints: data.waypoints || [],
          distance: data.distance || 0,
          estimated_duration: data.estimatedDuration || 0,
          planned_route: data.plannedRoute || null
        },
        cargo: {
          description: data.cargoDescription,
          weight: data.cargoWeight,
          volume: data.cargoVolume || 0,
          value: data.cargoValue || 0,
          dangerous_goods: data.dangerousGoods || false,
          special_requirements: data.specialRequirements || [],
          units: data.cargoUnits || 1,
          type: data.cargoType || 'general'
        },
        schedule: {
          departure_time: data.departureTime,
          estimated_arrival: data.estimatedArrival,
          actual_departure: null,
          actual_arrival: null,
          planned_stops: data.plannedStops || []
        },
        status: this.STATUS.SCHEDULED,
        checkpoints: [],
        expenses: {
          fuel: 0,
          tolls: 0,
          maintenance: 0,
          other: 0,
          currency: 'UYU'
        },
        documents: [],
        alerts: [],
        metrics: {
          total_distance_covered: 0,
          average_speed: 0,
          fuel_consumption: 0,
          stops_count: 0,
          delays_count: 0,
          efficiency_score: 100
        },
        created_at: now,
        updated_at: now,
        created_by: data.createdBy,
        company_id: data.companyId
      };

      // Store in database
      await db.query(
        `INSERT INTO trips (
          id, vehicle_id, driver_id, ecmr_id, route, cargo, schedule,
          status, checkpoints, expenses, documents, alerts, metrics,
          created_at, updated_at, created_by, company_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
        [
          trip.id, trip.vehicle_id, trip.driver_id, trip.ecmr_id,
          JSON.stringify(trip.route), JSON.stringify(trip.cargo),
          JSON.stringify(trip.schedule), trip.status,
          JSON.stringify(trip.checkpoints), JSON.stringify(trip.expenses),
          JSON.stringify(trip.documents), JSON.stringify(trip.alerts),
          JSON.stringify(trip.metrics), trip.created_at, trip.updated_at,
          trip.created_by, trip.company_id
        ]
      );

      // Create initial alert
      await this.addAlert(id, {
        type: 'system',
        message: 'Viaje creado exitosamente',
        severity: this.ALERT_SEVERITY.LOW
      });

      logger.info(`Trip created: ${id}`);
      return trip;
    } catch (error) {
      logger.error('Error creating trip:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const result = await db.query(
        `SELECT t.*, 
          v.plate_number, v.brand, v.model, v.type as vehicle_type,
          d.first_name as driver_first_name, d.last_name as driver_last_name,
          d.license_number, d.phone as driver_phone
        FROM trips t
        LEFT JOIN vehicles v ON t.vehicle_id = v.id
        LEFT JOIN users d ON t.driver_id = d.id
        WHERE t.id = $1`,
        [id]
      );

      if (result.rows.length === 0) return null;

      const trip = result.rows[0];
      
      // Format the response
      return {
        id: trip.id,
        vehicleId: trip.vehicle_id,
        vehicle: {
          plateNumber: trip.plate_number,
          brand: trip.brand,
          model: trip.model,
          type: trip.vehicle_type
        },
        driverId: trip.driver_id,
        driver: {
          firstName: trip.driver_first_name,
          lastName: trip.driver_last_name,
          licenseNumber: trip.license_number,
          phone: trip.driver_phone
        },
        ecmrId: trip.ecmr_id,
        route: trip.route,
        cargo: trip.cargo,
        schedule: trip.schedule,
        status: trip.status,
        checkpoints: trip.checkpoints || [],
        expenses: trip.expenses,
        documents: trip.documents || [],
        alerts: trip.alerts || [],
        metrics: trip.metrics,
        createdAt: trip.created_at,
        updatedAt: trip.updated_at
      };
    } catch (error) {
      logger.error('Error finding trip:', error);
      throw error;
    }
  }

  static async findAll(filters = {}) {
    try {
      let query = `
        SELECT t.*, 
          v.plate_number, v.brand, v.model, v.type as vehicle_type,
          d.first_name as driver_first_name, d.last_name as driver_last_name,
          d.license_number, d.phone as driver_phone
        FROM trips t
        LEFT JOIN vehicles v ON t.vehicle_id = v.id
        LEFT JOIN users d ON t.driver_id = d.id
        WHERE 1=1
      `;
      const params = [];
      let paramCount = 1;

      // Apply filters
      if (filters.status) {
        query += ` AND t.status = $${paramCount}`;
        params.push(filters.status);
        paramCount++;
      }

      if (filters.vehicleId) {
        query += ` AND t.vehicle_id = $${paramCount}`;
        params.push(filters.vehicleId);
        paramCount++;
      }

      if (filters.driverId) {
        query += ` AND t.driver_id = $${paramCount}`;
        params.push(filters.driverId);
        paramCount++;
      }

      if (filters.companyId) {
        query += ` AND t.company_id = $${paramCount}`;
        params.push(filters.companyId);
        paramCount++;
      }

      if (filters.dateFrom) {
        query += ` AND t.created_at >= $${paramCount}`;
        params.push(filters.dateFrom);
        paramCount++;
      }

      if (filters.dateTo) {
        query += ` AND t.created_at <= $${paramCount}`;
        params.push(filters.dateTo);
        paramCount++;
      }

      // Order and pagination
      query += ` ORDER BY t.created_at DESC`;
      
      if (filters.limit) {
        query += ` LIMIT $${paramCount}`;
        params.push(filters.limit);
        paramCount++;
      }

      if (filters.offset) {
        query += ` OFFSET $${paramCount}`;
        params.push(filters.offset);
      }

      const result = await db.query(query, params);

      return result.rows.map(trip => ({
        id: trip.id,
        vehicleId: trip.vehicle_id,
        vehicle: {
          plateNumber: trip.plate_number,
          brand: trip.brand,
          model: trip.model,
          type: trip.vehicle_type
        },
        driverId: trip.driver_id,
        driver: {
          firstName: trip.driver_first_name,
          lastName: trip.driver_last_name,
          licenseNumber: trip.license_number,
          phone: trip.driver_phone
        },
        ecmrId: trip.ecmr_id,
        route: trip.route,
        cargo: trip.cargo,
        schedule: trip.schedule,
        status: trip.status,
        checkpoints: trip.checkpoints || [],
        expenses: trip.expenses,
        documents: trip.documents || [],
        alerts: trip.alerts || [],
        metrics: trip.metrics,
        createdAt: trip.created_at,
        updatedAt: trip.updated_at
      }));
    } catch (error) {
      logger.error('Error finding trips:', error);
      throw error;
    }
  }

  static async updateStatus(id, status, userId) {
    try {
      const validStatuses = Object.values(this.STATUS);
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status: ${status}`);
      }

      const now = new Date().toISOString();
      
      // Update status
      await db.query(
        `UPDATE trips SET status = $1, updated_at = $2 WHERE id = $3`,
        [status, now, id]
      );

      // Update schedule based on status
      if (status === this.STATUS.IN_TRANSIT) {
        await db.query(
          `UPDATE trips 
          SET schedule = jsonb_set(schedule, '{actual_departure}', to_jsonb($1))
          WHERE id = $2`,
          [now, id]
        );
      } else if (status === this.STATUS.COMPLETED) {
        await db.query(
          `UPDATE trips 
          SET schedule = jsonb_set(schedule, '{actual_arrival}', to_jsonb($1))
          WHERE id = $2`,
          [now, id]
        );
      }

      // Add status change alert
      await this.addAlert(id, {
        type: 'status_change',
        message: `Estado cambiado a: ${status}`,
        severity: this.ALERT_SEVERITY.LOW,
        metadata: { previousStatus: status, newStatus: status, changedBy: userId }
      });

      logger.info(`Trip ${id} status updated to ${status}`);
      return true;
    } catch (error) {
      logger.error('Error updating trip status:', error);
      throw error;
    }
  }

  static async addCheckpoint(id, checkpointData) {
    try {
      const checkpoint = {
        id: uuidv4(),
        location: checkpointData.location,
        arrived_at: checkpointData.arrivedAt || new Date().toISOString(),
        departed_at: checkpointData.departedAt || null,
        notes: checkpointData.notes || '',
        photos: checkpointData.photos || [],
        coordinates: checkpointData.coordinates || null,
        type: checkpointData.type || 'waypoint',
        created_at: new Date().toISOString()
      };

      // Add checkpoint to array
      await db.query(
        `UPDATE trips 
        SET checkpoints = checkpoints || $1::jsonb,
            updated_at = $2
        WHERE id = $3`,
        [JSON.stringify(checkpoint), new Date().toISOString(), id]
      );

      // Update metrics
      await this.updateMetrics(id);

      logger.info(`Checkpoint added to trip ${id}`);
      return checkpoint;
    } catch (error) {
      logger.error('Error adding checkpoint:', error);
      throw error;
    }
  }

  static async updateExpenses(id, expenses) {
    try {
      const now = new Date().toISOString();
      
      await db.query(
        `UPDATE trips 
        SET expenses = $1,
            updated_at = $2
        WHERE id = $3`,
        [JSON.stringify(expenses), now, id]
      );

      logger.info(`Expenses updated for trip ${id}`);
      return true;
    } catch (error) {
      logger.error('Error updating expenses:', error);
      throw error;
    }
  }

  static async addDocument(id, documentData) {
    try {
      const document = {
        id: uuidv4(),
        type: documentData.type || this.DOCUMENT_TYPES.OTHER,
        name: documentData.name,
        url: documentData.url,
        size: documentData.size || 0,
        mime_type: documentData.mimeType || 'application/octet-stream',
        uploaded_at: new Date().toISOString(),
        uploaded_by: documentData.uploadedBy
      };

      await db.query(
        `UPDATE trips 
        SET documents = documents || $1::jsonb,
            updated_at = $2
        WHERE id = $3`,
        [JSON.stringify(document), new Date().toISOString(), id]
      );

      logger.info(`Document added to trip ${id}`);
      return document;
    } catch (error) {
      logger.error('Error adding document:', error);
      throw error;
    }
  }

  static async addAlert(id, alertData) {
    try {
      const alert = {
        id: uuidv4(),
        type: alertData.type,
        message: alertData.message,
        severity: alertData.severity || this.ALERT_SEVERITY.MEDIUM,
        timestamp: new Date().toISOString(),
        resolved: false,
        resolved_at: null,
        resolved_by: null,
        metadata: alertData.metadata || {}
      };

      await db.query(
        `UPDATE trips 
        SET alerts = alerts || $1::jsonb,
            updated_at = $2
        WHERE id = $3`,
        [JSON.stringify(alert), new Date().toISOString(), id]
      );

      // TODO: Send real-time notification via WebSocket
      
      logger.info(`Alert added to trip ${id}: ${alert.message}`);
      return alert;
    } catch (error) {
      logger.error('Error adding alert:', error);
      throw error;
    }
  }

  static async resolveAlert(tripId, alertId, userId) {
    try {
      const trip = await this.findById(tripId);
      if (!trip) throw new Error('Trip not found');

      const alerts = trip.alerts.map(alert => {
        if (alert.id === alertId) {
          return {
            ...alert,
            resolved: true,
            resolved_at: new Date().toISOString(),
            resolved_by: userId
          };
        }
        return alert;
      });

      await db.query(
        `UPDATE trips 
        SET alerts = $1,
            updated_at = $2
        WHERE id = $3`,
        [JSON.stringify(alerts), new Date().toISOString(), tripId]
      );

      logger.info(`Alert ${alertId} resolved for trip ${tripId}`);
      return true;
    } catch (error) {
      logger.error('Error resolving alert:', error);
      throw error;
    }
  }

  static async updateMetrics(id) {
    try {
      const trip = await this.findById(id);
      if (!trip) throw new Error('Trip not found');

      const metrics = {
        total_distance_covered: 0,
        average_speed: 0,
        fuel_consumption: 0,
        stops_count: trip.checkpoints.length,
        delays_count: trip.alerts.filter(a => a.type === 'delay').length,
        efficiency_score: 100
      };

      // Calculate distance covered based on checkpoints
      if (trip.checkpoints.length > 0) {
        // This would normally calculate based on GPS coordinates
        metrics.total_distance_covered = trip.route.distance * 0.65; // Mock: 65% completed
      }

      // Calculate average speed
      if (trip.status === this.STATUS.IN_TRANSIT && trip.schedule.actual_departure) {
        const hoursInTransit = (new Date() - new Date(trip.schedule.actual_departure)) / (1000 * 60 * 60);
        metrics.average_speed = metrics.total_distance_covered / hoursInTransit;
      }

      // Calculate efficiency score
      const delayPenalty = metrics.delays_count * 5;
      metrics.efficiency_score = Math.max(0, 100 - delayPenalty);

      await db.query(
        `UPDATE trips 
        SET metrics = $1,
            updated_at = $2
        WHERE id = $3`,
        [JSON.stringify(metrics), new Date().toISOString(), id]
      );

      return metrics;
    } catch (error) {
      logger.error('Error updating metrics:', error);
      throw error;
    }
  }

  static async getStats(companyId, dateRange = 'today') {
    try {
      const now = new Date();
      let dateFrom;

      switch (dateRange) {
        case 'today':
          dateFrom = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          dateFrom = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          dateFrom = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          dateFrom = new Date(now.setHours(0, 0, 0, 0));
      }

      const result = await db.query(
        `SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = $1) as in_transit,
          COUNT(*) FILTER (WHERE status = $2) as completed,
          COUNT(*) FILTER (WHERE status = $3) as delayed,
          SUM((route->>'distance')::float) as total_distance,
          AVG((metrics->>'efficiency_score')::float) as avg_efficiency
        FROM trips
        WHERE company_id = $4 AND created_at >= $5`,
        [
          this.STATUS.IN_TRANSIT,
          this.STATUS.COMPLETED,
          this.STATUS.DELAYED,
          companyId,
          dateFrom.toISOString()
        ]
      );

      return result.rows[0];
    } catch (error) {
      logger.error('Error getting trip stats:', error);
      throw error;
    }
  }

  static async getVehicle(id) {
    try {
      const trip = await this.findById(id);
      if (!trip) return null;

      const vehicle = await Vehicle.findById(trip.vehicleId);
      return vehicle;
    } catch (error) {
      logger.error('Error getting trip vehicle:', error);
      throw error;
    }
  }

  static async checkDelays() {
    try {
      // Find all active trips
      const activeTrips = await this.findAll({ status: this.STATUS.IN_TRANSIT });

      for (const trip of activeTrips) {
        const estimatedArrival = new Date(trip.schedule.estimated_arrival);
        const now = new Date();

        // Check if trip is delayed
        if (now > estimatedArrival && trip.status !== this.STATUS.COMPLETED) {
          await this.updateStatus(trip.id, this.STATUS.DELAYED, 'system');
          
          await this.addAlert(trip.id, {
            type: 'delay',
            message: `Viaje retrasado - Llegada estimada: ${estimatedArrival.toLocaleString()}`,
            severity: this.ALERT_SEVERITY.HIGH
          });
        }
      }
    } catch (error) {
      logger.error('Error checking delays:', error);
    }
  }

  // Mock data for development
  static getMockTrips() {
    const now = new Date();
    return [
      {
        id: 'TRIP-001',
        vehicleId: 'VEH-001',
        vehicle: {
          plateNumber: 'ABC-1234',
          brand: 'Mercedes-Benz',
          model: 'Actros'
        },
        driverId: 'DRV-001',
        driver: {
          firstName: 'Juan',
          lastName: 'Pérez',
          licenseNumber: 'LIC-12345',
          phone: '+598 99 123 456'
        },
        route: {
          origin: 'Montevideo',
          destination: 'Salto',
          waypoints: ['Durazno', 'Tacuarembó'],
          distance: 498,
          estimatedDuration: 6.5
        },
        cargo: {
          description: 'Productos electrónicos',
          weight: 8500,
          volume: 45,
          value: 150000,
          dangerousGoods: false,
          specialRequirements: ['Frágil', 'Mantener seco']
        },
        schedule: {
          departureTime: now.toISOString(),
          estimatedArrival: new Date(now.getTime() + 7 * 60 * 60 * 1000).toISOString(),
          actualDeparture: now.toISOString()
        },
        status: 'in_transit',
        checkpoints: [
          {
            id: 'CHK-001',
            location: 'Montevideo - Terminal',
            arrivedAt: now.toISOString(),
            departedAt: new Date(now.getTime() + 30 * 60 * 1000).toISOString(),
            notes: 'Carga completa verificada'
          }
        ],
        expenses: {
          fuel: 2500,
          tolls: 450,
          maintenance: 0,
          other: 200
        },
        documents: [],
        alerts: [
          {
            id: 'ALERT-001',
            type: 'traffic',
            message: 'Congestión en Ruta 5 km 45',
            severity: 'medium',
            timestamp: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
            resolved: false
          }
        ],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      }
    ];
  }
}

module.exports = Trip;