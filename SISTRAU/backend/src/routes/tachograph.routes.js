const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');
const crypto = require('crypto');

// Mock data para desarrollo
const mockRecords = [];
const driverActivities = {};
const violations = [];

// Tipos de actividades según el estándar del tacógrafo digital
const ACTIVITY_TYPES = {
  DRIVING: 'driving',
  REST: 'rest',
  WORK: 'work',
  AVAILABLE: 'available'
};

// Límites normativos (basados en regulación europea)
const REGULATIONS = {
  MAX_DAILY_DRIVING: 9, // horas
  MAX_CONTINUOUS_DRIVING: 4.5, // horas
  MIN_BREAK_TIME: 0.75, // 45 minutos
  MIN_DAILY_REST: 11, // horas
  MIN_WEEKLY_REST: 45, // horas
  MAX_WEEKLY_DRIVING: 56, // horas
  MAX_BIWEEKLY_DRIVING: 90 // horas
};

// Función para generar firma digital
const generateSignature = (data) => {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
};

// Función para calcular violaciones
const checkViolations = (driverId, date, hours) => {
  const violations = [];
  
  // Verificar límite de conducción diaria
  if (hours.totalDriving > REGULATIONS.MAX_DAILY_DRIVING) {
    violations.push({
      type: 'daily_driving_exceeded',
      severity: 'high',
      message: `Excedido el límite diario de conducción: ${hours.totalDriving.toFixed(1)}h de ${REGULATIONS.MAX_DAILY_DRIVING}h`,
      value: hours.totalDriving,
      limit: REGULATIONS.MAX_DAILY_DRIVING,
      timestamp: new Date().toISOString()
    });
  }
  
  // Verificar descanso mínimo
  if (hours.totalRest < REGULATIONS.MIN_DAILY_REST && hours.totalDriving > 0) {
    violations.push({
      type: 'insufficient_rest',
      severity: 'high',
      message: `Descanso insuficiente: ${hours.totalRest.toFixed(1)}h de ${REGULATIONS.MIN_DAILY_REST}h mínimo`,
      value: hours.totalRest,
      limit: REGULATIONS.MIN_DAILY_REST,
      timestamp: new Date().toISOString()
    });
  }
  
  // Verificar conducción continua
  const continuousDriving = checkContinuousDriving(driverId, date);
  if (continuousDriving > REGULATIONS.MAX_CONTINUOUS_DRIVING) {
    violations.push({
      type: 'continuous_driving_exceeded',
      severity: 'medium',
      message: `Conducción continua excedida: ${continuousDriving.toFixed(1)}h de ${REGULATIONS.MAX_CONTINUOUS_DRIVING}h`,
      value: continuousDriving,
      limit: REGULATIONS.MAX_CONTINUOUS_DRIVING,
      timestamp: new Date().toISOString()
    });
  }
  
  return violations;
};

// Función para verificar conducción continua
const checkContinuousDriving = (driverId, date) => {
  const driverRecords = mockRecords.filter(r => 
    r.driverId === driverId &&
    new Date(r.timestamp).toDateString() === new Date(date).toDateString()
  ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  let maxContinuous = 0;
  let currentContinuous = 0;
  let lastActivity = null;
  let lastTimestamp = null;
  
  for (const record of driverRecords) {
    if (record.activity === ACTIVITY_TYPES.DRIVING) {
      if (lastActivity === ACTIVITY_TYPES.DRIVING && lastTimestamp) {
        const timeDiff = (new Date(record.timestamp) - new Date(lastTimestamp)) / (1000 * 60 * 60);
        currentContinuous += timeDiff;
      } else {
        currentContinuous = 0;
      }
      maxContinuous = Math.max(maxContinuous, currentContinuous);
    } else if (record.activity === ACTIVITY_TYPES.REST || record.activity === ACTIVITY_TYPES.BREAK) {
      currentContinuous = 0;
    }
    
    lastActivity = record.activity;
    lastTimestamp = record.timestamp;
  }
  
  return maxContinuous;
};

// Función para calcular horas del conductor
const calculateDriverHours = (driverId, date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const dayRecords = mockRecords.filter(r => 
    r.driverId === driverId &&
    new Date(r.timestamp) >= startOfDay &&
    new Date(r.timestamp) <= endOfDay
  ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  const hours = {
    totalDriving: 0,
    totalRest: 0,
    totalWork: 0,
    totalAvailable: 0,
    violations: []
  };
  
  // Calcular horas por actividad
  for (let i = 0; i < dayRecords.length - 1; i++) {
    const current = dayRecords[i];
    const next = dayRecords[i + 1];
    const duration = (new Date(next.timestamp) - new Date(current.timestamp)) / (1000 * 60 * 60);
    
    switch (current.activity) {
      case ACTIVITY_TYPES.DRIVING:
        hours.totalDriving += duration;
        break;
      case ACTIVITY_TYPES.REST:
        hours.totalRest += duration;
        break;
      case ACTIVITY_TYPES.WORK:
        hours.totalWork += duration;
        break;
      case ACTIVITY_TYPES.AVAILABLE:
        hours.totalAvailable += duration;
        break;
    }
  }
  
  // Calcular desde el último registro hasta el final del día si es necesario
  if (dayRecords.length > 0) {
    const lastRecord = dayRecords[dayRecords.length - 1];
    const now = new Date();
    const endTime = now < endOfDay ? now : endOfDay;
    const duration = (endTime - new Date(lastRecord.timestamp)) / (1000 * 60 * 60);
    
    switch (lastRecord.activity) {
      case ACTIVITY_TYPES.DRIVING:
        hours.totalDriving += duration;
        break;
      case ACTIVITY_TYPES.REST:
        hours.totalRest += duration;
        break;
      case ACTIVITY_TYPES.WORK:
        hours.totalWork += duration;
        break;
      case ACTIVITY_TYPES.AVAILABLE:
        hours.totalAvailable += duration;
        break;
    }
  }
  
  // Verificar violaciones
  hours.violations = checkViolations(driverId, date, hours);
  
  return hours;
};

// GET /api/tachograph/driver/:driverId/hours - Obtener horas del conductor
router.get('/driver/:driverId/hours', authenticateToken, async (req, res) => {
  try {
    const { driverId } = req.params;
    const date = req.query.date ? new Date(req.query.date) : new Date();
    
    // Para 'current', usar el ID del usuario actual
    const actualDriverId = driverId === 'current' ? req.user.id : driverId;
    
    const hours = calculateDriverHours(actualDriverId, date);
    
    res.json({
      driverId: actualDriverId,
      date: date.toISOString(),
      ...hours,
      lastUpdate: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error calculating driver hours:', error);
    res.status(500).json({ error: 'Failed to calculate driver hours' });
  }
});

// GET /api/tachograph/driver/:driverId/weekly-summary - Resumen semanal
router.get('/driver/:driverId/weekly-summary', authenticateToken, async (req, res) => {
  try {
    const { driverId } = req.params;
    const weekStart = req.query.weekStart ? new Date(req.query.weekStart) : new Date();
    
    // Para 'current', usar el ID del usuario actual
    const actualDriverId = driverId === 'current' ? req.user.id : driverId;
    
    // Ajustar al inicio de la semana
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const dailySummaries = [];
    let totalDriving = 0;
    let totalRest = 0;
    let totalWork = 0;
    let totalAvailable = 0;
    const weeklyViolations = [];
    
    // Calcular para cada día de la semana
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      
      const dayHours = calculateDriverHours(actualDriverId, date);
      dailySummaries.push({
        date: date.toISOString(),
        ...dayHours
      });
      
      totalDriving += dayHours.totalDriving;
      totalRest += dayHours.totalRest;
      totalWork += dayHours.totalWork;
      totalAvailable += dayHours.totalAvailable;
      if (dayHours.violations && dayHours.violations.length > 0) {
        weeklyViolations.push(...dayHours.violations);
      }
    }
    
    // Verificar violaciones semanales
    if (totalDriving > REGULATIONS.MAX_WEEKLY_DRIVING) {
      weeklyViolations.push({
        type: 'weekly_driving_exceeded',
        severity: 'high',
        message: `Excedido el límite semanal de conducción: ${totalDriving.toFixed(1)}h de ${REGULATIONS.MAX_WEEKLY_DRIVING}h`,
        value: totalDriving,
        limit: REGULATIONS.MAX_WEEKLY_DRIVING,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      driverId: actualDriverId,
      weekStart: weekStart.toISOString(),
      weekEnd: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString(),
      totalDriving,
      totalRest,
      totalWork,
      totalAvailable,
      dailySummaries,
      weeklyViolations,
      compliance: {
        weeklyDrivingLimit: totalDriving <= REGULATIONS.MAX_WEEKLY_DRIVING,
        weeklyRestCompleted: totalRest >= REGULATIONS.MIN_WEEKLY_REST
      }
    });
  } catch (error) {
    logger.error('Error getting weekly summary:', error);
    res.status(500).json({ error: 'Failed to get weekly summary' });
  }
});

// GET /api/tachograph/driver/:driverId/records - Obtener registros del conductor
router.get('/driver/:driverId/records', authenticateToken, async (req, res) => {
  try {
    const { driverId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    // Para 'current', usar el ID del usuario actual
    const actualDriverId = driverId === 'current' ? req.user.id : driverId;
    
    const driverRecords = mockRecords
      .filter(r => r.driverId === actualDriverId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(offset, offset + limit);
    
    res.json({
      driverId: actualDriverId,
      total: mockRecords.filter(r => r.driverId === actualDriverId).length,
      limit: parseInt(limit),
      offset: parseInt(offset),
      records: driverRecords
    });
  } catch (error) {
    logger.error('Error fetching driver records:', error);
    res.status(500).json({ error: 'Failed to fetch driver records' });
  }
});

// POST /api/tachograph/record - Crear nuevo registro
router.post('/record', authenticateToken, async (req, res) => {
  try {
    const { vehicleId, activity, position, speed, cardNumber } = req.body;
    
    // Validar actividad
    if (!Object.values(ACTIVITY_TYPES).includes(activity)) {
      return res.status(400).json({ error: 'Invalid activity type' });
    }
    
    const record = {
      id: `REC-${Date.now()}`,
      driverId: req.user.id,
      vehicleId,
      activity,
      position,
      speed,
      cardNumber,
      timestamp: new Date().toISOString(),
      signature: null
    };
    
    // Generar firma digital
    record.signature = generateSignature(record);
    
    // Guardar registro
    mockRecords.push(record);
    
    // Actualizar actividad actual del conductor
    driverActivities[req.user.id] = {
      activity,
      since: record.timestamp,
      vehicleId,
      position
    };
    
    logger.info(`Tachograph record created: ${record.id} for driver ${req.user.id}`);
    
    res.status(201).json({
      message: 'Record created successfully',
      record: {
        id: record.id,
        timestamp: record.timestamp,
        activity: record.activity,
        signature: record.signature
      }
    });
  } catch (error) {
    logger.error('Error creating tachograph record:', error);
    res.status(500).json({ error: 'Failed to create tachograph record' });
  }
});

// POST /api/tachograph/download - Descargar datos con tarjeta de control
router.post('/download', authenticateToken, async (req, res) => {
  try {
    const { cardNumber, cardType, vehicleId, startDate, endDate } = req.body;
    
    // Validar tipo de tarjeta
    if (!['control', 'company'].includes(cardType)) {
      return res.status(400).json({ error: 'Invalid card type' });
    }
    
    // Validar autorización según tipo de tarjeta
    if (cardType === 'control' && req.user.role !== 'authority' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Control card access requires authority role' });
    }
    
    // Filtrar registros por vehículo y fechas
    let filteredRecords = mockRecords.filter(r => r.vehicleId === vehicleId);
    
    if (startDate) {
      filteredRecords = filteredRecords.filter(r => new Date(r.timestamp) >= new Date(startDate));
    }
    
    if (endDate) {
      filteredRecords = filteredRecords.filter(r => new Date(r.timestamp) <= new Date(endDate));
    }
    
    // Crear log de acceso
    const accessLog = {
      id: `ACCESS-${Date.now()}`,
      cardNumber,
      cardType,
      vehicleId,
      downloadedBy: req.user.id,
      downloadedAt: new Date().toISOString(),
      recordCount: filteredRecords.length,
      signature: generateSignature({
        cardNumber,
        vehicleId,
        timestamp: new Date().toISOString(),
        recordCount: filteredRecords.length
      })
    };
    
    logger.info(`Tachograph data downloaded: ${accessLog.id} by ${req.user.id}`);
    
    res.json({
      message: 'Data downloaded successfully',
      accessLog: {
        id: accessLog.id,
        downloadedAt: accessLog.downloadedAt,
        recordCount: accessLog.recordCount,
        signature: accessLog.signature
      },
      downloadUrl: `/api/tachograph/download/${accessLog.id}` // En producción sería una URL real
    });
  } catch (error) {
    logger.error('Error downloading tachograph data:', error);
    res.status(500).json({ error: 'Failed to download data' });
  }
});

// GET /api/tachograph/violations - Obtener violaciones
router.get('/violations', authenticateToken, async (req, res) => {
  try {
    const { driverId, vehicleId, startDate, endDate, severity } = req.query;
    
    let filteredViolations = [...violations];
    
    if (driverId) {
      filteredViolations = filteredViolations.filter(v => v.driverId === driverId);
    }
    
    if (vehicleId) {
      filteredViolations = filteredViolations.filter(v => v.vehicleId === vehicleId);
    }
    
    if (startDate) {
      filteredViolations = filteredViolations.filter(v => new Date(v.timestamp) >= new Date(startDate));
    }
    
    if (endDate) {
      filteredViolations = filteredViolations.filter(v => new Date(v.timestamp) <= new Date(endDate));
    }
    
    if (severity) {
      filteredViolations = filteredViolations.filter(v => v.severity === severity);
    }
    
    res.json({
      count: filteredViolations.length,
      violations: filteredViolations,
      filters: req.query
    });
  } catch (error) {
    logger.error('Error fetching violations:', error);
    res.status(500).json({ error: 'Failed to fetch violations' });
  }
});

// Generar algunos datos de ejemplo al iniciar
const generateMockData = () => {
  const drivers = ['user-001', 'user-002', 'user-003'];
  const vehicles = ['VEH-001', 'VEH-002', 'VEH-003'];
  const activities = Object.values(ACTIVITY_TYPES);
  
  // Generar registros para los últimos 7 días
  const now = new Date();
  for (let day = 0; day < 7; day++) {
    for (const driverId of drivers) {
      const date = new Date(now);
      date.setDate(date.getDate() - day);
      
      // Generar registros para el día
      let currentTime = new Date(date);
      currentTime.setHours(6, 0, 0, 0); // Empezar a las 6 AM
      
      while (currentTime.getHours() < 22) { // Hasta las 10 PM
        const activity = activities[Math.floor(Math.random() * activities.length)];
        const vehicleId = vehicles[Math.floor(Math.random() * vehicles.length)];
        
        const record = {
          id: `REC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          driverId,
          vehicleId,
          activity,
          position: {
            lat: -34.9011 + (Math.random() - 0.5) * 0.1,
            lng: -56.1645 + (Math.random() - 0.5) * 0.1
          },
          speed: activity === ACTIVITY_TYPES.DRIVING ? Math.floor(Math.random() * 80) + 20 : 0,
          cardNumber: `CARD-${driverId}`,
          timestamp: currentTime.toISOString(),
          signature: null
        };
        
        record.signature = generateSignature(record);
        mockRecords.push(record);
        
        // Avanzar tiempo aleatoriamente
        currentTime = new Date(currentTime.getTime() + Math.random() * 2 * 60 * 60 * 1000); // 0-2 horas
      }
    }
  }
  
  logger.info(`Generated ${mockRecords.length} mock tachograph records`);
};

// Generar datos de ejemplo al cargar el módulo
generateMockData();

module.exports = router;