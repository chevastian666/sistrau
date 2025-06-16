const { mockDb } = require('../config/database');
const logger = require('../utils/logger');
const crypto = require('crypto');

class Tachograph {
  // Estados de actividad del conductor según estándar europeo
  static DRIVER_ACTIVITIES = {
    DRIVING: 'driving',           // Conduciendo
    REST: 'rest',                 // Descanso
    WORK: 'work',                 // Otro trabajo
    AVAILABLE: 'available'        // Disponible
  };

  // Tipos de tarjetas según estándar europeo
  static CARD_TYPES = {
    DRIVER: 'driver',             // Tarjeta de conductor
    COMPANY: 'company',           // Tarjeta de empresa
    CONTROL: 'control',           // Tarjeta de control (autoridades)
    WORKSHOP: 'workshop'          // Tarjeta de taller (mantenimiento)
  };

  // Crear registro de tacógrafo
  static async createRecord(data) {
    const record = {
      id: `tach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      vehicleId: data.vehicleId,
      driverId: data.driverId,
      activity: data.activity,
      timestamp: new Date().toISOString(),
      position: data.position, // { lat, lng }
      speed: data.speed,
      distance: data.distance,
      engineHours: data.engineHours,
      cardNumber: data.cardNumber,
      signature: null, // Se generará después
      encrypted: false,
      createdAt: new Date().toISOString()
    };

    // Generar firma digital
    record.signature = this.generateSignature(record);
    
    // Cifrar datos sensibles
    record.encrypted = true;
    record.encryptedData = this.encryptData({
      position: record.position,
      speed: record.speed,
      activity: record.activity
    });

    if (!mockDb.tachographRecords) {
      mockDb.tachographRecords = [];
    }
    mockDb.tachographRecords.push(record);

    logger.info(`Tachograph record created: ${record.id}`);
    return record;
  }

  // Obtener registros por vehículo
  static async getByVehicle(vehicleId, options = {}) {
    const { startDate, endDate, limit = 100 } = options;
    
    let records = mockDb.tachographRecords?.filter(r => r.vehicleId === vehicleId) || [];
    
    if (startDate) {
      records = records.filter(r => new Date(r.timestamp) >= new Date(startDate));
    }
    
    if (endDate) {
      records = records.filter(r => new Date(r.timestamp) <= new Date(endDate));
    }
    
    // Ordenar por timestamp descendente
    records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return records.slice(0, limit);
  }

  // Obtener registros por conductor
  static async getByDriver(driverId, options = {}) {
    const { startDate, endDate, limit = 100 } = options;
    
    let records = mockDb.tachographRecords?.filter(r => r.driverId === driverId) || [];
    
    if (startDate) {
      records = records.filter(r => new Date(r.timestamp) >= new Date(startDate));
    }
    
    if (endDate) {
      records = records.filter(r => new Date(r.timestamp) <= new Date(endDate));
    }
    
    records.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return records.slice(0, limit);
  }

  // Calcular horas de conducción y descanso
  static async calculateDriverHours(driverId, date = new Date()) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const records = await this.getByDriver(driverId, {
      startDate: startOfDay,
      endDate: endOfDay
    });

    const summary = {
      date: date.toISOString().split('T')[0],
      driverId,
      totalDriving: 0,
      totalRest: 0,
      totalWork: 0,
      totalAvailable: 0,
      violations: []
    };

    // Calcular tiempo por actividad
    for (let i = 0; i < records.length - 1; i++) {
      const current = records[i];
      const next = records[i + 1];
      const duration = new Date(current.timestamp) - new Date(next.timestamp);
      const hours = duration / (1000 * 60 * 60);

      switch (current.activity) {
        case this.DRIVER_ACTIVITIES.DRIVING:
          summary.totalDriving += hours;
          break;
        case this.DRIVER_ACTIVITIES.REST:
          summary.totalRest += hours;
          break;
        case this.DRIVER_ACTIVITIES.WORK:
          summary.totalWork += hours;
          break;
        case this.DRIVER_ACTIVITIES.AVAILABLE:
          summary.totalAvailable += hours;
          break;
      }
    }

    // Verificar violaciones según regulación europea
    // Máximo 9 horas de conducción diaria (puede extenderse a 10h dos veces por semana)
    if (summary.totalDriving > 9) {
      summary.violations.push({
        type: 'DAILY_DRIVING_EXCEEDED',
        message: `Conducción diaria excedida: ${summary.totalDriving.toFixed(2)}h (máximo 9h)`,
        severity: 'high'
      });
    }

    // Mínimo 11 horas de descanso diario (puede reducirse a 9h tres veces por semana)
    if (summary.totalRest < 11) {
      summary.violations.push({
        type: 'INSUFFICIENT_DAILY_REST',
        message: `Descanso insuficiente: ${summary.totalRest.toFixed(2)}h (mínimo 11h)`,
        severity: 'high'
      });
    }

    // Conducción continua máxima 4.5 horas sin pausa
    const continuousDriving = this.calculateContinuousDriving(records);
    if (continuousDriving > 4.5) {
      summary.violations.push({
        type: 'CONTINUOUS_DRIVING_EXCEEDED',
        message: `Conducción continua excedida: ${continuousDriving.toFixed(2)}h (máximo 4.5h)`,
        severity: 'medium'
      });
    }

    return summary;
  }

  // Calcular conducción continua
  static calculateContinuousDriving(records) {
    let maxContinuous = 0;
    let currentContinuous = 0;

    for (let i = 0; i < records.length - 1; i++) {
      const current = records[i];
      const next = records[i + 1];
      const duration = (new Date(current.timestamp) - new Date(next.timestamp)) / (1000 * 60 * 60);

      if (current.activity === this.DRIVER_ACTIVITIES.DRIVING) {
        currentContinuous += duration;
        maxContinuous = Math.max(maxContinuous, currentContinuous);
      } else if (current.activity === this.DRIVER_ACTIVITIES.REST && duration >= 0.75) {
        // Pausa de al menos 45 minutos reinicia el contador
        currentContinuous = 0;
      }
    }

    return maxContinuous;
  }

  // Generar firma digital para el registro
  static generateSignature(record) {
    const dataToSign = JSON.stringify({
      vehicleId: record.vehicleId,
      driverId: record.driverId,
      activity: record.activity,
      timestamp: record.timestamp,
      position: record.position,
      speed: record.speed
    });

    return crypto
      .createHash('sha256')
      .update(dataToSign)
      .digest('hex');
  }

  // Cifrar datos sensibles
  static encryptData(data) {
    // En producción, usar cifrado real con clave privada
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'sistrau-key', 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  // Descargar datos con tarjeta de control
  static async downloadWithControlCard(cardNumber, cardType, vehicleId, options = {}) {
    // Verificar tipo de tarjeta
    if (cardType !== this.CARD_TYPES.CONTROL && cardType !== this.CARD_TYPES.COMPANY) {
      throw new Error('Unauthorized card type for data download');
    }

    // Registrar acceso
    const accessLog = {
      id: `access_${Date.now()}`,
      cardNumber,
      cardType,
      vehicleId,
      timestamp: new Date().toISOString(),
      dataRequested: options
    };

    if (!mockDb.tachographAccessLogs) {
      mockDb.tachographAccessLogs = [];
    }
    mockDb.tachographAccessLogs.push(accessLog);

    // Obtener registros
    const records = await this.getByVehicle(vehicleId, options);

    // En producción, aquí se aplicarían más validaciones y cifrado
    return {
      accessLog,
      records,
      downloadedAt: new Date().toISOString()
    };
  }

  // Obtener resumen semanal del conductor
  static async getWeeklySummary(driverId, weekStart = new Date()) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const records = await this.getByDriver(driverId, {
      startDate: weekStart,
      endDate: weekEnd
    });

    const summary = {
      driverId,
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      totalDriving: 0,
      totalRest: 0,
      totalWork: 0,
      dailySummaries: [],
      weeklyViolations: []
    };

    // Calcular por día
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      
      const dailySummary = await this.calculateDriverHours(driverId, date);
      summary.dailySummaries.push(dailySummary);
      
      summary.totalDriving += dailySummary.totalDriving;
      summary.totalRest += dailySummary.totalRest;
      summary.totalWork += dailySummary.totalWork;
    }

    // Verificar límites semanales
    // Máximo 56 horas de conducción semanal
    if (summary.totalDriving > 56) {
      summary.weeklyViolations.push({
        type: 'WEEKLY_DRIVING_EXCEEDED',
        message: `Conducción semanal excedida: ${summary.totalDriving.toFixed(2)}h (máximo 56h)`,
        severity: 'high'
      });
    }

    // Descanso semanal mínimo 45 horas continuas
    const hasWeeklyRest = this.checkWeeklyRest(records);
    if (!hasWeeklyRest) {
      summary.weeklyViolations.push({
        type: 'INSUFFICIENT_WEEKLY_REST',
        message: 'No se detectó período de descanso semanal de 45 horas continuas',
        severity: 'high'
      });
    }

    return summary;
  }

  // Verificar descanso semanal
  static checkWeeklyRest(records) {
    let maxRestPeriod = 0;
    let currentRestPeriod = 0;

    for (let i = 0; i < records.length - 1; i++) {
      const current = records[i];
      const next = records[i + 1];
      const duration = (new Date(current.timestamp) - new Date(next.timestamp)) / (1000 * 60 * 60);

      if (current.activity === this.DRIVER_ACTIVITIES.REST) {
        currentRestPeriod += duration;
        maxRestPeriod = Math.max(maxRestPeriod, currentRestPeriod);
      } else {
        currentRestPeriod = 0;
      }
    }

    return maxRestPeriod >= 45; // 45 horas mínimas de descanso semanal
  }
}

module.exports = Tachograph;