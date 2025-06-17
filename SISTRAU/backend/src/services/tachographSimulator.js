const logger = require('../utils/logger');
const { emitTachographUpdate } = require('./socketService');

class TachographSimulator {
  constructor() {
    this.activities = {};
    this.simulationInterval = null;
  }

  // Simular actividad realista de un conductor
  generateRealisticSchedule(driverId) {
    const schedule = [];
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(6, 0, 0, 0); // Empezar a las 6 AM

    let currentTime = new Date(startOfDay);
    
    // Patrón típico de conducción
    const patterns = [
      { activity: 'rest', duration: 0.5 }, // 30 min preparación
      { activity: 'driving', duration: 2 }, // 2 horas conduciendo
      { activity: 'rest', duration: 0.25 }, // 15 min descanso
      { activity: 'driving', duration: 2.25 }, // 2:15 horas conduciendo
      { activity: 'rest', duration: 0.75 }, // 45 min almuerzo
      { activity: 'driving', duration: 2 }, // 2 horas conduciendo
      { activity: 'work', duration: 0.5 }, // 30 min descarga
      { activity: 'driving', duration: 2.5 }, // 2:30 horas conduciendo
      { activity: 'available', duration: 0.5 }, // 30 min esperando
      { activity: 'rest', duration: 11 }, // 11 horas descanso nocturno
    ];

    for (const pattern of patterns) {
      const endTime = new Date(currentTime.getTime() + pattern.duration * 60 * 60 * 1000);
      
      schedule.push({
        activity: pattern.activity,
        startTime: new Date(currentTime),
        endTime: new Date(endTime),
        duration: pattern.duration,
      });

      currentTime = new Date(endTime);
      
      // Si llegamos al día actual, parar
      if (currentTime > now) {
        schedule[schedule.length - 1].endTime = now;
        schedule[schedule.length - 1].duration = (now - schedule[schedule.length - 1].startTime) / (60 * 60 * 1000);
        break;
      }
    }

    return schedule;
  }

  // Obtener actividad actual de un conductor
  getCurrentActivity(driverId) {
    const schedule = this.activities[driverId];
    if (!schedule) return null;

    const now = new Date();
    for (const period of schedule) {
      if (now >= period.startTime && now <= period.endTime) {
        return {
          activity: period.activity,
          startedAt: period.startTime,
          duration: (now - period.startTime) / (60 * 60 * 1000), // horas
        };
      }
    }

    return null;
  }

  // Calcular resumen de horas
  calculateHoursSummary(driverId, date = new Date()) {
    const schedule = this.activities[driverId];
    if (!schedule) return null;

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const summary = {
      driving: 0,
      rest: 0,
      work: 0,
      available: 0,
    };

    for (const period of schedule) {
      // Calcular overlap con el día solicitado
      const periodStart = period.startTime > startOfDay ? period.startTime : startOfDay;
      const periodEnd = period.endTime < endOfDay ? period.endTime : endOfDay;

      if (periodEnd > periodStart) {
        const hours = (periodEnd - periodStart) / (60 * 60 * 1000);
        summary[period.activity] += hours;
      }
    }

    return summary;
  }

  // Verificar violaciones
  checkViolations(driverId) {
    const summary = this.calculateHoursSummary(driverId);
    if (!summary) return [];

    const violations = [];

    // Verificar límite de conducción diaria (9 horas)
    if (summary.driving > 9) {
      violations.push({
        type: 'daily_driving_exceeded',
        severity: 'high',
        message: `Excedido el límite diario de conducción: ${summary.driving.toFixed(1)}h de 9h`,
        value: summary.driving,
        limit: 9,
      });
    }

    // Verificar descanso mínimo (11 horas)
    if (summary.rest < 11 && summary.driving > 0) {
      violations.push({
        type: 'insufficient_rest',
        severity: 'high',
        message: `Descanso insuficiente: ${summary.rest.toFixed(1)}h de 11h mínimo`,
        value: summary.rest,
        limit: 11,
      });
    }

    return violations;
  }

  // Iniciar simulación
  start(drivers = ['user-001', 'user-002', 'user-003']) {
    // Generar horarios para cada conductor
    for (const driverId of drivers) {
      this.activities[driverId] = this.generateRealisticSchedule(driverId);
      logger.info(`Generated tachograph schedule for driver ${driverId}`);
    }

    // Actualizar cada minuto
    this.simulationInterval = setInterval(() => {
      for (const driverId of drivers) {
        const currentActivity = this.getCurrentActivity(driverId);
        if (currentActivity) {
          const data = {
            driverId,
            activity: currentActivity.activity,
            duration: currentActivity.duration,
            summary: this.calculateHoursSummary(driverId),
            violations: this.checkViolations(driverId),
            timestamp: new Date().toISOString(),
          };

          // Emitir actualización via Socket.io
          emitTachographUpdate(driverId, data);
        }
      }
    }, 60000); // Cada minuto

    logger.info('Tachograph simulator started');
  }

  // Detener simulación
  stop() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
      logger.info('Tachograph simulator stopped');
    }
  }

  // Obtener datos para un conductor
  getDriverData(driverId) {
    return {
      currentActivity: this.getCurrentActivity(driverId),
      hoursSummary: this.calculateHoursSummary(driverId),
      violations: this.checkViolations(driverId),
      schedule: this.activities[driverId] || [],
    };
  }
}

module.exports = new TachographSimulator();