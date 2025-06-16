const { mockDb } = require('../config/database');
const logger = require('../utils/logger');
const Tachograph = require('./Tachograph');

class WorkingHours {
  // Límites según regulación europea (Reglamento (CE) No 561/2006)
  static LIMITS = {
    DAILY_DRIVING: 9, // horas máximas de conducción diaria
    EXTENDED_DAILY_DRIVING: 10, // horas máximas extendidas (2 veces por semana)
    WEEKLY_DRIVING: 56, // horas máximas de conducción semanal
    BIWEEKLY_DRIVING: 90, // horas máximas de conducción en 2 semanas
    CONTINUOUS_DRIVING: 4.5, // horas máximas de conducción continua
    BREAK_DURATION: 0.75, // 45 minutos de pausa mínima
    DAILY_REST: 11, // horas mínimas de descanso diario
    REDUCED_DAILY_REST: 9, // horas mínimas de descanso reducido (3 veces por semana)
    WEEKLY_REST: 45, // horas mínimas de descanso semanal
    REDUCED_WEEKLY_REST: 24, // horas mínimas de descanso semanal reducido
    WORKING_WEEK_MAX: 60, // horas máximas de trabajo semanal
    WORKING_AVERAGE_MAX: 48, // promedio máximo de horas de trabajo
  };

  // Estados de cumplimiento
  static COMPLIANCE_STATUS = {
    COMPLIANT: 'compliant',
    WARNING: 'warning',
    VIOLATION: 'violation',
    CRITICAL: 'critical'
  };

  // Tipos de violaciones
  static VIOLATION_TYPES = {
    DAILY_DRIVING_EXCEEDED: 'daily_driving_exceeded',
    WEEKLY_DRIVING_EXCEEDED: 'weekly_driving_exceeded',
    CONTINUOUS_DRIVING_EXCEEDED: 'continuous_driving_exceeded',
    INSUFFICIENT_BREAK: 'insufficient_break',
    INSUFFICIENT_DAILY_REST: 'insufficient_daily_rest',
    INSUFFICIENT_WEEKLY_REST: 'insufficient_weekly_rest',
    WORKING_TIME_EXCEEDED: 'working_time_exceeded',
  };

  // Calcular resumen de horas de trabajo para un conductor
  static async calculateWorkingSummary(driverId, startDate, endDate) {
    const records = await Tachograph.getByDriver(driverId, { startDate, endDate });
    
    const summary = {
      driverId,
      period: {
        start: startDate,
        end: endDate
      },
      totals: {
        driving: 0,
        work: 0,
        rest: 0,
        available: 0
      },
      dailyBreakdown: [],
      weeklyBreakdown: [],
      violations: [],
      complianceScore: 100,
      recommendations: []
    };

    // Agrupar registros por día
    const dailyRecords = this.groupRecordsByDay(records);
    
    // Analizar cada día
    for (const [date, dayRecords] of Object.entries(dailyRecords)) {
      const dailyAnalysis = this.analyzeDailyRecords(dayRecords, date);
      summary.dailyBreakdown.push(dailyAnalysis);
      
      // Acumular totales
      summary.totals.driving += dailyAnalysis.totals.driving;
      summary.totals.work += dailyAnalysis.totals.work;
      summary.totals.rest += dailyAnalysis.totals.rest;
      summary.totals.available += dailyAnalysis.totals.available;
      
      // Agregar violaciones
      summary.violations.push(...dailyAnalysis.violations);
    }

    // Análisis semanal
    summary.weeklyBreakdown = this.analyzeWeeklyCompliance(summary.dailyBreakdown);
    
    // Calcular puntaje de cumplimiento
    summary.complianceScore = this.calculateComplianceScore(summary.violations);
    
    // Generar recomendaciones
    summary.recommendations = this.generateRecommendations(summary);

    return summary;
  }

  // Agrupar registros por día
  static groupRecordsByDay(records) {
    const grouped = {};
    
    records.forEach(record => {
      const date = new Date(record.timestamp).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(record);
    });
    
    return grouped;
  }

  // Analizar registros diarios
  static analyzeDailyRecords(records, date) {
    const analysis = {
      date,
      totals: {
        driving: 0,
        work: 0,
        rest: 0,
        available: 0
      },
      continuousDriving: [],
      breaks: [],
      violations: [],
      restPeriods: [],
      compliance: this.COMPLIANCE_STATUS.COMPLIANT
    };

    // Ordenar registros por timestamp
    records.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    let currentActivity = null;
    let currentStartTime = null;
    let continuousDrivingTime = 0;
    let lastBreakTime = null;

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const nextRecord = records[i + 1];
      
      if (currentActivity !== record.activity) {
        // Cambio de actividad
        if (currentActivity && currentStartTime) {
          const duration = (new Date(record.timestamp) - currentStartTime) / (1000 * 60 * 60);
          
          // Registrar la actividad previa
          this.recordActivityDuration(analysis, currentActivity, duration);
          
          // Verificar conducción continua
          if (currentActivity === Tachograph.DRIVER_ACTIVITIES.DRIVING) {
            continuousDrivingTime += duration;
            
            if (continuousDrivingTime > this.LIMITS.CONTINUOUS_DRIVING) {
              analysis.violations.push({
                type: this.VIOLATION_TYPES.CONTINUOUS_DRIVING_EXCEEDED,
                severity: 'high',
                duration: continuousDrivingTime,
                limit: this.LIMITS.CONTINUOUS_DRIVING,
                timestamp: record.timestamp
              });
            }
          }
          
          // Verificar pausas
          if (record.activity === Tachograph.DRIVER_ACTIVITIES.REST) {
            if (nextRecord) {
              const breakDuration = (new Date(nextRecord.timestamp) - new Date(record.timestamp)) / (1000 * 60 * 60);
              
              if (breakDuration >= this.LIMITS.BREAK_DURATION) {
                continuousDrivingTime = 0; // Reset conducción continua
                lastBreakTime = new Date(record.timestamp);
                analysis.breaks.push({
                  start: record.timestamp,
                  end: nextRecord.timestamp,
                  duration: breakDuration
                });
              }
            }
          }
        }
        
        currentActivity = record.activity;
        currentStartTime = new Date(record.timestamp);
      }
    }

    // Verificar violaciones diarias
    this.checkDailyViolations(analysis);
    
    // Determinar estado de cumplimiento
    if (analysis.violations.some(v => v.severity === 'critical')) {
      analysis.compliance = this.COMPLIANCE_STATUS.CRITICAL;
    } else if (analysis.violations.some(v => v.severity === 'high')) {
      analysis.compliance = this.COMPLIANCE_STATUS.VIOLATION;
    } else if (analysis.violations.some(v => v.severity === 'medium')) {
      analysis.compliance = this.COMPLIANCE_STATUS.WARNING;
    }

    return analysis;
  }

  // Registrar duración de actividad
  static recordActivityDuration(analysis, activity, duration) {
    switch (activity) {
      case Tachograph.DRIVER_ACTIVITIES.DRIVING:
        analysis.totals.driving += duration;
        break;
      case Tachograph.DRIVER_ACTIVITIES.WORK:
        analysis.totals.work += duration;
        break;
      case Tachograph.DRIVER_ACTIVITIES.REST:
        analysis.totals.rest += duration;
        analysis.restPeriods.push({ duration });
        break;
      case Tachograph.DRIVER_ACTIVITIES.AVAILABLE:
        analysis.totals.available += duration;
        break;
    }
  }

  // Verificar violaciones diarias
  static checkDailyViolations(analysis) {
    // Verificar límite de conducción diaria
    if (analysis.totals.driving > this.LIMITS.EXTENDED_DAILY_DRIVING) {
      analysis.violations.push({
        type: this.VIOLATION_TYPES.DAILY_DRIVING_EXCEEDED,
        severity: 'critical',
        actual: analysis.totals.driving,
        limit: this.LIMITS.DAILY_DRIVING,
        extendedLimit: this.LIMITS.EXTENDED_DAILY_DRIVING
      });
    } else if (analysis.totals.driving > this.LIMITS.DAILY_DRIVING) {
      analysis.violations.push({
        type: this.VIOLATION_TYPES.DAILY_DRIVING_EXCEEDED,
        severity: 'medium',
        actual: analysis.totals.driving,
        limit: this.LIMITS.DAILY_DRIVING,
        note: 'Usando extensión permitida (máx 2 veces/semana)'
      });
    }

    // Verificar descanso diario
    const totalRestPeriod = analysis.restPeriods
      .filter(r => r.duration >= this.LIMITS.REDUCED_DAILY_REST)
      .reduce((sum, r) => sum + r.duration, 0);

    if (totalRestPeriod < this.LIMITS.REDUCED_DAILY_REST) {
      analysis.violations.push({
        type: this.VIOLATION_TYPES.INSUFFICIENT_DAILY_REST,
        severity: 'critical',
        actual: totalRestPeriod,
        minimum: this.LIMITS.REDUCED_DAILY_REST
      });
    } else if (totalRestPeriod < this.LIMITS.DAILY_REST) {
      analysis.violations.push({
        type: this.VIOLATION_TYPES.INSUFFICIENT_DAILY_REST,
        severity: 'medium',
        actual: totalRestPeriod,
        minimum: this.LIMITS.DAILY_REST,
        note: 'Usando descanso reducido (máx 3 veces/semana)'
      });
    }

    // Verificar tiempo de trabajo total
    const totalWorkTime = analysis.totals.driving + analysis.totals.work;
    if (totalWorkTime > 13) { // Límite diario general de trabajo
      analysis.violations.push({
        type: this.VIOLATION_TYPES.WORKING_TIME_EXCEEDED,
        severity: 'high',
        actual: totalWorkTime,
        limit: 13
      });
    }
  }

  // Analizar cumplimiento semanal
  static analyzeWeeklyCompliance(dailyBreakdowns) {
    const weeklyAnalysis = [];
    
    // Agrupar por semanas
    const weeks = this.groupByWeek(dailyBreakdowns);
    
    for (const [weekStart, weekDays] of Object.entries(weeks)) {
      const weekSummary = {
        weekStart,
        totalDriving: 0,
        totalWork: 0,
        totalRest: 0,
        extendedDrivingDays: 0,
        reducedRestDays: 0,
        violations: [],
        compliance: this.COMPLIANCE_STATUS.COMPLIANT
      };

      weekDays.forEach(day => {
        weekSummary.totalDriving += day.totals.driving;
        weekSummary.totalWork += day.totals.work;
        weekSummary.totalRest += day.totals.rest;
        
        if (day.totals.driving > this.LIMITS.DAILY_DRIVING) {
          weekSummary.extendedDrivingDays++;
        }
        
        if (day.totals.rest < this.LIMITS.DAILY_REST) {
          weekSummary.reducedRestDays++;
        }
      });

      // Verificar límites semanales
      if (weekSummary.totalDriving > this.LIMITS.WEEKLY_DRIVING) {
        weekSummary.violations.push({
          type: this.VIOLATION_TYPES.WEEKLY_DRIVING_EXCEEDED,
          severity: 'critical',
          actual: weekSummary.totalDriving,
          limit: this.LIMITS.WEEKLY_DRIVING
        });
      }

      if (weekSummary.extendedDrivingDays > 2) {
        weekSummary.violations.push({
          type: 'EXTENDED_DRIVING_LIMIT_EXCEEDED',
          severity: 'high',
          actual: weekSummary.extendedDrivingDays,
          limit: 2
        });
      }

      if (weekSummary.reducedRestDays > 3) {
        weekSummary.violations.push({
          type: 'REDUCED_REST_LIMIT_EXCEEDED',
          severity: 'high',
          actual: weekSummary.reducedRestDays,
          limit: 3
        });
      }

      // Verificar descanso semanal
      const hasWeeklyRest = this.checkWeeklyRest(weekDays);
      if (!hasWeeklyRest) {
        weekSummary.violations.push({
          type: this.VIOLATION_TYPES.INSUFFICIENT_WEEKLY_REST,
          severity: 'critical',
          minimum: this.LIMITS.REDUCED_WEEKLY_REST
        });
      }

      weeklyAnalysis.push(weekSummary);
    }

    return weeklyAnalysis;
  }

  // Agrupar por semana
  static groupByWeek(dailyBreakdowns) {
    const weeks = {};
    
    dailyBreakdowns.forEach(day => {
      const date = new Date(day.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeks[weekKey]) {
        weeks[weekKey] = [];
      }
      weeks[weekKey].push(day);
    });
    
    return weeks;
  }

  // Verificar descanso semanal
  static checkWeeklyRest(weekDays) {
    let maxConsecutiveRest = 0;
    let currentRest = 0;
    
    weekDays.forEach(day => {
      if (day.totals.rest >= 24) {
        currentRest += day.totals.rest;
        maxConsecutiveRest = Math.max(maxConsecutiveRest, currentRest);
      } else {
        currentRest = 0;
      }
    });
    
    return maxConsecutiveRest >= this.LIMITS.REDUCED_WEEKLY_REST;
  }

  // Calcular puntaje de cumplimiento
  static calculateComplianceScore(violations) {
    let score = 100;
    
    violations.forEach(violation => {
      switch (violation.severity) {
        case 'critical':
          score -= 25;
          break;
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    });
    
    return Math.max(0, score);
  }

  // Generar recomendaciones
  static generateRecommendations(summary) {
    const recommendations = [];
    
    // Analizar patrones de violaciones
    const violationTypes = summary.violations.map(v => v.type);
    
    if (violationTypes.includes(this.VIOLATION_TYPES.CONTINUOUS_DRIVING_EXCEEDED)) {
      recommendations.push({
        priority: 'high',
        category: 'rest_management',
        message: 'Planificar pausas regulares cada 4 horas de conducción',
        action: 'Configurar alertas automáticas a las 4 horas de conducción continua'
      });
    }
    
    if (violationTypes.includes(this.VIOLATION_TYPES.DAILY_DRIVING_EXCEEDED)) {
      recommendations.push({
        priority: 'high',
        category: 'route_planning',
        message: 'Optimizar rutas para cumplir con límites de conducción diaria',
        action: 'Revisar planificación de rutas y considerar conductores adicionales'
      });
    }
    
    if (violationTypes.includes(this.VIOLATION_TYPES.INSUFFICIENT_WEEKLY_REST)) {
      recommendations.push({
        priority: 'critical',
        category: 'schedule_management',
        message: 'Asegurar períodos de descanso semanal adecuados',
        action: 'Implementar rotación de conductores para garantizar descansos'
      });
    }
    
    // Recomendaciones basadas en puntaje
    if (summary.complianceScore < 50) {
      recommendations.push({
        priority: 'critical',
        category: 'training',
        message: 'Capacitación urgente sobre normativas de tiempos de conducción',
        action: 'Programar sesión de formación sobre regulaciones europeas'
      });
    }
    
    // Recomendaciones preventivas
    const avgDailyDriving = summary.totals.driving / summary.dailyBreakdown.length;
    if (avgDailyDriving > 8) {
      recommendations.push({
        priority: 'medium',
        category: 'workload',
        message: 'Carga de trabajo cercana a límites permitidos',
        action: 'Considerar redistribución de rutas o contratación adicional'
      });
    }
    
    return recommendations;
  }

  // Generar informe de cumplimiento
  static async generateComplianceReport(driverId, period = 'monthly') {
    const endDate = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'weekly':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'quarterly':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case 'yearly':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }
    
    const summary = await this.calculateWorkingSummary(driverId, startDate, endDate);
    
    const report = {
      id: `RPT-${Date.now()}`,
      driverId,
      period: {
        type: period,
        start: startDate,
        end: endDate
      },
      summary: {
        totalDrivingHours: summary.totals.driving,
        totalWorkingHours: summary.totals.driving + summary.totals.work,
        totalRestHours: summary.totals.rest,
        complianceScore: summary.complianceScore,
        totalViolations: summary.violations.length,
        criticalViolations: summary.violations.filter(v => v.severity === 'critical').length
      },
      violations: summary.violations,
      recommendations: summary.recommendations,
      trends: this.analyzeTrends(summary),
      generatedAt: new Date().toISOString(),
      certifiedBy: 'SISTRAU Compliance System'
    };
    
    // Guardar informe
    if (!mockDb.complianceReports) {
      mockDb.complianceReports = [];
    }
    mockDb.complianceReports.push(report);
    
    logger.info(`Compliance report generated for driver ${driverId}`);
    
    return report;
  }

  // Analizar tendencias
  static analyzeTrends(summary) {
    const trends = {
      drivingPattern: 'normal',
      restPattern: 'adequate',
      complianceTrend: 'stable',
      riskLevel: 'low',
      improvementAreas: []
    };
    
    // Analizar patrón de conducción
    const avgDailyDriving = summary.totals.driving / summary.dailyBreakdown.length;
    if (avgDailyDriving > 8.5) {
      trends.drivingPattern = 'intensive';
      trends.riskLevel = 'medium';
      trends.improvementAreas.push('driving_hours_management');
    } else if (avgDailyDriving < 4) {
      trends.drivingPattern = 'light';
    }
    
    // Analizar patrón de descanso
    const avgDailyRest = summary.totals.rest / summary.dailyBreakdown.length;
    if (avgDailyRest < 10) {
      trends.restPattern = 'insufficient';
      trends.riskLevel = 'high';
      trends.improvementAreas.push('rest_period_planning');
    } else if (avgDailyRest > 12) {
      trends.restPattern = 'excellent';
    }
    
    // Tendencia de cumplimiento
    const recentViolations = summary.violations.filter(v => {
      const violationDate = new Date(v.timestamp || v.date);
      const daysSince = (new Date() - violationDate) / (1000 * 60 * 60 * 24);
      return daysSince <= 7;
    });
    
    if (recentViolations.length > summary.violations.length * 0.5) {
      trends.complianceTrend = 'deteriorating';
      trends.riskLevel = 'high';
    } else if (recentViolations.length === 0 && summary.violations.length > 0) {
      trends.complianceTrend = 'improving';
    }
    
    return trends;
  }

  // Obtener alertas activas
  static async getActiveAlerts(driverId) {
    const currentHours = await Tachograph.calculateDriverHours(driverId, new Date());
    const alerts = [];
    
    // Alerta de conducción cercana al límite
    if (currentHours.totalDriving >= this.LIMITS.DAILY_DRIVING * 0.9) {
      alerts.push({
        id: `ALERT-${Date.now()}-1`,
        type: 'DRIVING_LIMIT_WARNING',
        severity: 'high',
        message: `Conducción diaria al ${Math.round((currentHours.totalDriving / this.LIMITS.DAILY_DRIVING) * 100)}% del límite`,
        remainingTime: Math.max(0, this.LIMITS.DAILY_DRIVING - currentHours.totalDriving),
        action: 'Planificar parada en los próximos 30 minutos'
      });
    }
    
    // Alerta de descanso necesario
    const timeSinceLastRest = this.calculateTimeSinceLastRest(currentHours);
    if (timeSinceLastRest >= 4) {
      alerts.push({
        id: `ALERT-${Date.now()}-2`,
        type: 'REST_REQUIRED',
        severity: 'critical',
        message: 'Pausa obligatoria requerida',
        timeSinceRest: timeSinceLastRest,
        requiredRestDuration: this.LIMITS.BREAK_DURATION,
        action: 'Detener el vehículo y tomar un descanso de 45 minutos'
      });
    }
    
    // Alerta predictiva
    const prediction = this.predictViolation(currentHours);
    if (prediction.risk > 0.7) {
      alerts.push({
        id: `ALERT-${Date.now()}-3`,
        type: 'VIOLATION_RISK',
        severity: 'medium',
        message: 'Riesgo alto de violación normativa',
        riskScore: prediction.risk,
        estimatedViolationTime: prediction.estimatedTime,
        action: prediction.preventiveAction
      });
    }
    
    return alerts;
  }

  // Calcular tiempo desde último descanso
  static calculateTimeSinceLastRest(currentHours) {
    // Implementación simplificada
    return 3.5; // En producción, calcular desde registros reales
  }

  // Predecir violaciones
  static predictViolation(currentHours) {
    const drivingRate = currentHours.totalDriving / 8; // Tasa de conducción
    const projectedTotal = currentHours.totalDriving + (drivingRate * 2); // Proyección 2 horas
    
    let risk = 0;
    let estimatedTime = null;
    let preventiveAction = '';
    
    if (projectedTotal > this.LIMITS.DAILY_DRIVING) {
      risk = 0.9;
      estimatedTime = ((this.LIMITS.DAILY_DRIVING - currentHours.totalDriving) / drivingRate) * 60; // minutos
      preventiveAction = 'Reducir tiempo de conducción o planificar cambio de conductor';
    } else if (projectedTotal > this.LIMITS.DAILY_DRIVING * 0.9) {
      risk = 0.7;
      estimatedTime = ((this.LIMITS.DAILY_DRIVING * 0.9 - currentHours.totalDriving) / drivingRate) * 60;
      preventiveAction = 'Monitorear tiempo de conducción restante';
    }
    
    return { risk, estimatedTime, preventiveAction };
  }
}

module.exports = WorkingHours;