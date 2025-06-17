const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const crypto = require('crypto');
const logger = require('../utils/logger');
const { emitWorkingHoursUpdate } = require('../services/socketService');

// EU Working Time Regulations
const REGULATIONS = {
  MAX_DAILY_DRIVING: 9, // horas
  MAX_DAILY_DRIVING_EXTENDED: 10, // horas (máximo 2 veces por semana)
  MAX_CONTINUOUS_DRIVING: 4.5, // horas
  MIN_BREAK_TIME: 0.75, // 45 minutos
  MIN_DAILY_REST: 11, // horas
  MIN_DAILY_REST_REDUCED: 9, // horas (máximo 3 veces por semana)
  MAX_WEEKLY_DRIVING: 56, // horas
  MAX_BIWEEKLY_DRIVING: 90, // horas
  MIN_WEEKLY_REST: 45, // horas
  MIN_WEEKLY_REST_REDUCED: 24, // horas
  MAX_DAILY_WORK: 13, // horas (conducción + otro trabajo)
  MAX_WEEKLY_WORK: 60, // horas
  MAX_AVERAGE_WEEKLY_WORK: 48 // horas (promedio en 17 semanas)
};

// Mock data storage
const workingHoursData = new Map();
const schedules = new Map();

// Generate mock historical data
const generateMockHistory = (driverId, days = 30) => {
  const history = [];
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    // Skip Sundays (rest day)
    if (date.getDay() === 0) {
      history.push({
        id: crypto.randomUUID(),
        driverId,
        date: date.toISOString(),
        type: 'rest',
        totalDriving: 0,
        totalWork: 0,
        totalRest: 24,
        activities: [{
          type: 'rest',
          startTime: date.toISOString(),
          endTime: new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString(),
          duration: 24,
          location: 'Home'
        }],
        compliance: { status: 'compliant', violations: [] }
      });
      continue;
    }
    
    // Generate realistic daily activities
    const activities = [];
    let currentTime = new Date(date);
    currentTime.setHours(6, 0, 0, 0); // Start at 6 AM
    
    // Morning driving session
    const morningDriving = 3.5 + Math.random() * 1;
    activities.push({
      type: 'driving',
      startTime: currentTime.toISOString(),
      endTime: new Date(currentTime.getTime() + morningDriving * 60 * 60 * 1000).toISOString(),
      duration: morningDriving,
      vehicleId: `ABC-${1000 + Math.floor(Math.random() * 9000)}`,
      distance: Math.floor(morningDriving * 80),
      from: 'Montevideo',
      to: 'Canelones'
    });
    currentTime = new Date(currentTime.getTime() + morningDriving * 60 * 60 * 1000);
    
    // Break
    activities.push({
      type: 'break',
      startTime: currentTime.toISOString(),
      endTime: new Date(currentTime.getTime() + 45 * 60 * 1000).toISOString(),
      duration: 0.75,
      location: 'Rest Area Km 45'
    });
    currentTime = new Date(currentTime.getTime() + 45 * 60 * 1000);
    
    // Afternoon driving
    const afternoonDriving = 3 + Math.random() * 1.5;
    activities.push({
      type: 'driving',
      startTime: currentTime.toISOString(),
      endTime: new Date(currentTime.getTime() + afternoonDriving * 60 * 60 * 1000).toISOString(),
      duration: afternoonDriving,
      vehicleId: `ABC-${1000 + Math.floor(Math.random() * 9000)}`,
      distance: Math.floor(afternoonDriving * 75),
      from: 'Canelones',
      to: 'Colonia'
    });
    currentTime = new Date(currentTime.getTime() + afternoonDriving * 60 * 60 * 1000);
    
    // Other work (loading/unloading)
    const otherWork = 1 + Math.random() * 0.5;
    activities.push({
      type: 'other_work',
      startTime: currentTime.toISOString(),
      endTime: new Date(currentTime.getTime() + otherWork * 60 * 60 * 1000).toISOString(),
      duration: otherWork,
      description: 'Carga y descarga',
      location: 'Terminal de Carga Colonia'
    });
    currentTime = new Date(currentTime.getTime() + otherWork * 60 * 60 * 1000);
    
    // Daily rest
    const restStart = new Date(currentTime);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    nextDay.setHours(6, 0, 0, 0);
    
    activities.push({
      type: 'daily_rest',
      startTime: restStart.toISOString(),
      endTime: nextDay.toISOString(),
      duration: (nextDay - restStart) / (1000 * 60 * 60),
      location: 'Hotel del Conductor'
    });
    
    const totalDriving = morningDriving + afternoonDriving;
    const totalWork = totalDriving + otherWork;
    const totalRest = (nextDay - restStart) / (1000 * 60 * 60);
    
    // Check compliance
    const violations = [];
    if (totalDriving > REGULATIONS.MAX_DAILY_DRIVING) {
      violations.push({
        type: 'EXCEEDED_DAILY_DRIVING',
        severity: 'high',
        message: `Conducción diaria excedida: ${totalDriving.toFixed(1)}h (máximo: ${REGULATIONS.MAX_DAILY_DRIVING}h)`
      });
    }
    if (totalRest < REGULATIONS.MIN_DAILY_REST_REDUCED) {
      violations.push({
        type: 'INSUFFICIENT_DAILY_REST',
        severity: 'high',
        message: `Descanso diario insuficiente: ${totalRest.toFixed(1)}h (mínimo: ${REGULATIONS.MIN_DAILY_REST_REDUCED}h)`
      });
    }
    
    history.push({
      id: crypto.randomUUID(),
      driverId,
      date: date.toISOString(),
      type: 'work',
      totalDriving: Number(totalDriving.toFixed(2)),
      totalWork: Number(totalWork.toFixed(2)),
      totalRest: Number(totalRest.toFixed(2)),
      totalBreak: 0.75,
      activities,
      compliance: {
        status: violations.length === 0 ? 'compliant' : 'violation',
        violations
      }
    });
  }
  
  return history;
};

// Initialize mock data for drivers
const initializeMockData = () => {
  const drivers = ['driver1', 'driver2', 'driver3', 'driver4'];
  
  drivers.forEach(driverId => {
    const history = generateMockHistory(driverId);
    workingHoursData.set(driverId, history);
    
    // Create current week schedule
    const schedule = generateWeeklySchedule(driverId);
    schedules.set(driverId, schedule);
  });
  
  logger.info('Mock working hours data initialized');
};

// Generate weekly schedule
const generateWeeklySchedule = (driverId) => {
  const schedule = [];
  const startOfWeek = new Date();
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(date.getDate() + i);
    
    if (i === 6) { // Sunday rest
      schedule.push({
        date: date.toISOString(),
        dayOfWeek: 'Domingo',
        shifts: [],
        type: 'rest',
        totalHours: 0
      });
    } else {
      const startHour = 6 + Math.floor(Math.random() * 2);
      const duration = 8 + Math.floor(Math.random() * 2);
      
      schedule.push({
        date: date.toISOString(),
        dayOfWeek: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][i],
        shifts: [{
          startTime: `${startHour}:00`,
          endTime: `${startHour + duration}:00`,
          vehicleId: `ABC-${1000 + Math.floor(Math.random() * 9000)}`,
          route: 'Montevideo - Rivera',
          type: 'driving'
        }],
        type: 'work',
        totalHours: duration
      });
    }
  }
  
  return schedule;
};

// Calculate compliance statistics
const calculateCompliance = (history) => {
  const violations = history.filter(day => day.compliance.status === 'violation');
  const workDays = history.filter(day => day.type === 'work');
  
  const stats = {
    totalDays: history.length,
    workDays: workDays.length,
    restDays: history.length - workDays.length,
    compliantDays: history.filter(day => day.compliance.status === 'compliant').length,
    violationDays: violations.length,
    complianceRate: workDays.length > 0 
      ? ((workDays.length - violations.length) / workDays.length * 100).toFixed(1)
      : 100,
    totalDrivingHours: workDays.reduce((sum, day) => sum + day.totalDriving, 0),
    totalWorkHours: workDays.reduce((sum, day) => sum + day.totalWork, 0),
    totalRestHours: history.reduce((sum, day) => sum + day.totalRest, 0),
    averageDailyDriving: workDays.length > 0 
      ? (workDays.reduce((sum, day) => sum + day.totalDriving, 0) / workDays.length).toFixed(1)
      : 0,
    violations: {
      drivingTime: violations.filter(day => 
        day.compliance.violations.some(v => v.type === 'EXCEEDED_DAILY_DRIVING')
      ).length,
      restTime: violations.filter(day => 
        day.compliance.violations.some(v => v.type === 'INSUFFICIENT_DAILY_REST')
      ).length,
      breakTime: violations.filter(day => 
        day.compliance.violations.some(v => v.type === 'INSUFFICIENT_BREAK')
      ).length
    }
  };
  
  return stats;
};

// GET /api/working-hours/summary/:driverId - Get working hours summary
router.get('/summary/:driverId',
  authenticateToken,
  [
    param('driverId').notEmpty(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const driverId = req.params.driverId === 'current' ? req.user.id : req.params.driverId;
      
      // Get driver's history
      let history = workingHoursData.get(driverId) || [];
      
      // Filter by date range if provided
      if (req.query.startDate || req.query.endDate) {
        const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(0);
        const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
        
        history = history.filter(day => {
          const dayDate = new Date(day.date);
          return dayDate >= startDate && dayDate <= endDate;
        });
      }
      
      const compliance = calculateCompliance(history);
      
      // Get current week and month totals
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
      weekStart.setHours(0, 0, 0, 0);
      
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const currentWeek = history.filter(day => new Date(day.date) >= weekStart);
      const currentMonth = history.filter(day => new Date(day.date) >= monthStart);
      
      const summary = {
        driverId,
        period: {
          start: history[0]?.date || new Date().toISOString(),
          end: history[history.length - 1]?.date || new Date().toISOString()
        },
        compliance,
        currentWeek: {
          totalDriving: currentWeek.reduce((sum, day) => sum + day.totalDriving, 0).toFixed(1),
          totalWork: currentWeek.reduce((sum, day) => sum + day.totalWork, 0).toFixed(1),
          remainingDriving: Math.max(0, REGULATIONS.MAX_WEEKLY_DRIVING - 
            currentWeek.reduce((sum, day) => sum + day.totalDriving, 0)).toFixed(1),
          daysWorked: currentWeek.filter(day => day.type === 'work').length
        },
        currentMonth: {
          totalDriving: currentMonth.reduce((sum, day) => sum + day.totalDriving, 0).toFixed(1),
          totalWork: currentMonth.reduce((sum, day) => sum + day.totalWork, 0).toFixed(1),
          violations: currentMonth.filter(day => day.compliance.status === 'violation').length,
          complianceRate: currentMonth.length > 0
            ? ((currentMonth.filter(day => day.compliance.status === 'compliant').length / 
                currentMonth.length) * 100).toFixed(1)
            : 100
        },
        recentViolations: history
          .filter(day => day.compliance.status === 'violation')
          .slice(-5)
          .map(day => ({
            date: day.date,
            violations: day.compliance.violations
          })),
        upcomingSchedule: schedules.get(driverId) || []
      };

      res.json(summary);
    } catch (error) {
      logger.error('Error calculating working hours summary:', error);
      res.status(500).json({ error: 'Failed to calculate working hours summary' });
    }
  }
);

// GET /api/working-hours/report/:driverId - Generate compliance report
router.get('/report/:driverId',
  authenticateToken,
  authorize(['admin', 'operator', 'driver']),
  [
    param('driverId').notEmpty(),
    query('period').optional().isIn(['week', 'month', 'quarter', 'year'])
  ],
  async (req, res) => {
    try {
      const driverId = req.params.driverId === 'current' ? req.user.id : req.params.driverId;
      const period = req.query.period || 'month';
      
      const history = workingHoursData.get(driverId) || [];
      
      // Calculate period dates
      const now = new Date();
      let startDate;
      
      switch (period) {
        case 'week':
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate = new Date(now);
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate = new Date(now);
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case 'year':
          startDate = new Date(now);
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }
      
      const periodHistory = history.filter(day => new Date(day.date) >= startDate);
      const compliance = calculateCompliance(periodHistory);
      
      const report = {
        driverId,
        period,
        generatedAt: new Date().toISOString(),
        summary: compliance,
        dailyDetails: periodHistory,
        recommendations: generateRecommendations(compliance),
        trends: calculateTrends(periodHistory),
        regulatory: {
          maxDailyDriving: REGULATIONS.MAX_DAILY_DRIVING,
          maxWeeklyDriving: REGULATIONS.MAX_WEEKLY_DRIVING,
          minDailyRest: REGULATIONS.MIN_DAILY_REST,
          minBreakTime: REGULATIONS.MIN_BREAK_TIME
        }
      };
      
      res.json(report);
    } catch (error) {
      logger.error('Error generating compliance report:', error);
      res.status(500).json({ error: 'Failed to generate compliance report' });
    }
  }
);

// GET /api/working-hours/compliance/check - Real-time compliance check
router.get('/compliance/check',
  authenticateToken,
  authorize(['driver']),
  async (req, res) => {
    try {
      const driverId = req.user.id;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const history = workingHoursData.get(driverId) || [];
      const todayData = history.find(day => 
        new Date(day.date).toDateString() === today.toDateString()
      );
      
      if (!todayData) {
        return res.json({
          status: 'no_data',
          message: 'No hay datos de trabajo para hoy',
          canDrive: true,
          remainingDriving: REGULATIONS.MAX_DAILY_DRIVING,
          nextBreakIn: REGULATIONS.MAX_CONTINUOUS_DRIVING
        });
      }
      
      // Calculate current status
      const remainingDriving = Math.max(0, REGULATIONS.MAX_DAILY_DRIVING - todayData.totalDriving);
      const continuousDriving = calculateContinuousDriving(todayData.activities);
      const nextBreakIn = Math.max(0, REGULATIONS.MAX_CONTINUOUS_DRIVING - continuousDriving);
      
      const warnings = [];
      if (remainingDriving < 1) {
        warnings.push({
          type: 'LOW_REMAINING_DRIVING',
          message: `Solo quedan ${remainingDriving.toFixed(1)} horas de conducción`
        });
      }
      if (nextBreakIn < 0.5) {
        warnings.push({
          type: 'BREAK_REQUIRED_SOON',
          message: `Descanso requerido en ${(nextBreakIn * 60).toFixed(0)} minutos`
        });
      }
      
      res.json({
        status: todayData.compliance.status,
        canDrive: remainingDriving > 0 && todayData.compliance.status === 'compliant',
        remainingDriving: remainingDriving.toFixed(1),
        nextBreakIn: nextBreakIn.toFixed(1),
        todayStats: {
          driving: todayData.totalDriving.toFixed(1),
          work: todayData.totalWork.toFixed(1),
          rest: todayData.totalRest.toFixed(1)
        },
        warnings,
        violations: todayData.compliance.violations
      });
    } catch (error) {
      logger.error('Error checking compliance:', error);
      res.status(500).json({ error: 'Failed to check compliance' });
    }
  }
);

// POST /api/working-hours/activity - Record new activity
router.post('/activity',
  authenticateToken,
  authorize(['driver', 'admin']),
  [
    body('type').isIn(['driving', 'other_work', 'break', 'daily_rest']),
    body('startTime').isISO8601(),
    body('endTime').optional().isISO8601(),
    body('vehicleId').optional(),
    body('location').optional()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const driverId = req.user.role === 'admin' && req.body.driverId 
        ? req.body.driverId 
        : req.user.id;
      
      const activity = {
        id: crypto.randomUUID(),
        type: req.body.type,
        startTime: req.body.startTime,
        endTime: req.body.endTime || null,
        vehicleId: req.body.vehicleId,
        location: req.body.location,
        active: !req.body.endTime
      };
      
      // Update today's data
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let history = workingHoursData.get(driverId) || [];
      let todayData = history.find(day => 
        new Date(day.date).toDateString() === today.toDateString()
      );
      
      if (!todayData) {
        todayData = {
          id: crypto.randomUUID(),
          driverId,
          date: today.toISOString(),
          type: 'work',
          totalDriving: 0,
          totalWork: 0,
          totalRest: 0,
          totalBreak: 0,
          activities: [],
          compliance: { status: 'compliant', violations: [] }
        };
        history.push(todayData);
      }
      
      todayData.activities.push(activity);
      
      // Recalculate totals if activity is completed
      if (req.body.endTime) {
        const duration = (new Date(req.body.endTime) - new Date(req.body.startTime)) / (1000 * 60 * 60);
        
        switch (activity.type) {
          case 'driving':
            todayData.totalDriving += duration;
            todayData.totalWork += duration;
            break;
          case 'other_work':
            todayData.totalWork += duration;
            break;
          case 'break':
            todayData.totalBreak += duration;
            break;
          case 'daily_rest':
            todayData.totalRest += duration;
            break;
        }
        
        // Check compliance
        todayData.compliance = checkDailyCompliance(todayData);
      }
      
      workingHoursData.set(driverId, history);
      
      // Emit real-time update
      emitWorkingHoursUpdate(driverId, {
        type: 'activity_recorded',
        activity,
        compliance: todayData.compliance
      });
      
      res.json({
        message: 'Activity recorded successfully',
        activity,
        currentStats: {
          totalDriving: todayData.totalDriving.toFixed(1),
          totalWork: todayData.totalWork.toFixed(1),
          compliance: todayData.compliance
        }
      });
    } catch (error) {
      logger.error('Error recording activity:', error);
      res.status(500).json({ error: 'Failed to record activity' });
    }
  }
);

// GET /api/working-hours/schedule/:driverId - Get driver schedule
router.get('/schedule/:driverId',
  authenticateToken,
  [
    param('driverId').notEmpty(),
    query('week').optional().isISO8601()
  ],
  async (req, res) => {
    try {
      const driverId = req.params.driverId === 'current' ? req.user.id : req.params.driverId;
      
      const schedule = schedules.get(driverId) || generateWeeklySchedule(driverId);
      
      res.json({
        driverId,
        week: req.query.week || 'current',
        schedule,
        summary: {
          totalHours: schedule.reduce((sum, day) => sum + day.totalHours, 0),
          workDays: schedule.filter(day => day.type === 'work').length,
          restDays: schedule.filter(day => day.type === 'rest').length
        }
      });
    } catch (error) {
      logger.error('Error fetching schedule:', error);
      res.status(500).json({ error: 'Failed to fetch schedule' });
    }
  }
);

// POST /api/working-hours/schedule - Create/update schedule
router.post('/schedule',
  authenticateToken,
  authorize(['admin', 'operator']),
  [
    body('driverId').notEmpty(),
    body('schedule').isArray(),
    body('schedule.*.date').isISO8601(),
    body('schedule.*.shifts').isArray()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const { driverId, schedule } = req.body;
      
      // Validate schedule doesn't exceed regulations
      const weeklyHours = schedule.reduce((sum, day) => sum + day.totalHours, 0);
      if (weeklyHours > REGULATIONS.MAX_WEEKLY_WORK) {
        return res.status(400).json({
          error: 'Schedule exceeds maximum weekly working hours',
          maxAllowed: REGULATIONS.MAX_WEEKLY_WORK,
          scheduled: weeklyHours
        });
      }
      
      schedules.set(driverId, schedule);
      
      res.json({
        message: 'Schedule updated successfully',
        schedule,
        compliance: {
          weeklyHours,
          maxAllowed: REGULATIONS.MAX_WEEKLY_WORK,
          status: 'compliant'
        }
      });
    } catch (error) {
      logger.error('Error updating schedule:', error);
      res.status(500).json({ error: 'Failed to update schedule' });
    }
  }
);

// GET /api/working-hours/compliance/fleet - Fleet compliance overview
router.get('/compliance/fleet',
  authenticateToken,
  authorize(['admin', 'operator']),
  async (req, res) => {
    try {
      const drivers = ['driver1', 'driver2', 'driver3', 'driver4'];
      const fleetCompliance = [];
      
      for (const driverId of drivers) {
        const history = workingHoursData.get(driverId) || [];
        const lastMonth = history.slice(-30);
        const compliance = calculateCompliance(lastMonth);
        
        fleetCompliance.push({
          driverId,
          name: `Conductor ${driverId.slice(-1)}`,
          complianceRate: compliance.complianceRate,
          violations: compliance.violationDays,
          totalDriving: compliance.totalDrivingHours.toFixed(1),
          status: compliance.complianceRate > 95 ? 'excellent' 
                : compliance.complianceRate > 85 ? 'good' 
                : compliance.complianceRate > 75 ? 'warning' 
                : 'critical'
        });
      }
      
      // Sort by compliance rate
      fleetCompliance.sort((a, b) => b.complianceRate - a.complianceRate);
      
      const summary = {
        totalDrivers: fleetCompliance.length,
        avgComplianceRate: (fleetCompliance.reduce((sum, d) => sum + parseFloat(d.complianceRate), 0) / 
                           fleetCompliance.length).toFixed(1),
        criticalDrivers: fleetCompliance.filter(d => d.status === 'critical').length,
        topPerformers: fleetCompliance.slice(0, 3),
        needsAttention: fleetCompliance.filter(d => d.status === 'warning' || d.status === 'critical')
      };
      
      res.json({
        drivers: fleetCompliance,
        summary,
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error fetching fleet compliance:', error);
      res.status(500).json({ error: 'Failed to fetch fleet compliance' });
    }
  }
);

// GET /api/working-hours/recommendations/:driverId - Get personalized recommendations
router.get('/recommendations/:driverId',
  authenticateToken,
  async (req, res) => {
    try {
      const driverId = req.params.driverId === 'current' ? req.user.id : req.params.driverId;
      const history = workingHoursData.get(driverId) || [];
      const lastMonth = history.slice(-30);
      const compliance = calculateCompliance(lastMonth);
      
      const recommendations = generateRecommendations(compliance);
      
      res.json({
        driverId,
        recommendations,
        complianceScore: compliance.complianceRate,
        basedOn: {
          period: '30 days',
          violations: compliance.violationDays,
          avgDriving: compliance.averageDailyDriving
        }
      });
    } catch (error) {
      logger.error('Error generating recommendations:', error);
      res.status(500).json({ error: 'Failed to generate recommendations' });
    }
  }
);

// Helper functions
const calculateContinuousDriving = (activities) => {
  let continuous = 0;
  let lastBreak = null;
  
  for (const activity of activities) {
    if (activity.type === 'driving' && activity.endTime) {
      continuous += activity.duration;
    } else if (activity.type === 'break' || activity.type === 'daily_rest') {
      continuous = 0;
      lastBreak = activity;
    }
  }
  
  return continuous;
};

const checkDailyCompliance = (dayData) => {
  const violations = [];
  
  if (dayData.totalDriving > REGULATIONS.MAX_DAILY_DRIVING) {
    violations.push({
      type: 'EXCEEDED_DAILY_DRIVING',
      severity: 'high',
      message: `Conducción diaria excedida: ${dayData.totalDriving.toFixed(1)}h`
    });
  }
  
  if (dayData.totalWork > REGULATIONS.MAX_DAILY_WORK) {
    violations.push({
      type: 'EXCEEDED_DAILY_WORK',
      severity: 'medium',
      message: `Trabajo diario excedido: ${dayData.totalWork.toFixed(1)}h`
    });
  }
  
  return {
    status: violations.length === 0 ? 'compliant' : 'violation',
    violations
  };
};

const generateRecommendations = (compliance) => {
  const recommendations = [];
  
  if (parseFloat(compliance.complianceRate) < 90) {
    recommendations.push({
      priority: 'high',
      type: 'compliance',
      title: 'Mejorar cumplimiento normativo',
      description: 'Su tasa de cumplimiento está por debajo del objetivo. Revise las violaciones frecuentes.',
      action: 'Programar capacitación sobre normativa de tiempos de conducción'
    });
  }
  
  if (compliance.violations.drivingTime > 2) {
    recommendations.push({
      priority: 'high',
      type: 'driving_time',
      title: 'Reducir tiempo de conducción',
      description: 'Ha excedido los límites de conducción varias veces este mes.',
      action: 'Planificar rutas más cortas o dividir viajes largos'
    });
  }
  
  if (compliance.violations.restTime > 1) {
    recommendations.push({
      priority: 'high',
      type: 'rest_time',
      title: 'Respetar tiempos de descanso',
      description: 'Los períodos de descanso son esenciales para la seguridad.',
      action: 'Programar paradas de descanso obligatorias'
    });
  }
  
  if (parseFloat(compliance.averageDailyDriving) > 8) {
    recommendations.push({
      priority: 'medium',
      type: 'workload',
      title: 'Optimizar carga de trabajo',
      description: 'Su promedio de conducción diaria es alto.',
      action: 'Considerar redistribuir rutas con otros conductores'
    });
  }
  
  return recommendations;
};

const calculateTrends = (history) => {
  const weeks = [];
  const weekSize = 7;
  
  for (let i = 0; i < history.length; i += weekSize) {
    const week = history.slice(i, i + weekSize);
    const compliance = calculateCompliance(week);
    
    weeks.push({
      weekNumber: Math.floor(i / weekSize) + 1,
      complianceRate: parseFloat(compliance.complianceRate),
      violations: compliance.violationDays,
      avgDriving: parseFloat(compliance.averageDailyDriving)
    });
  }
  
  return {
    weekly: weeks,
    trend: weeks.length > 1 
      ? weeks[weeks.length - 1].complianceRate > weeks[0].complianceRate 
        ? 'improving' 
        : 'declining'
      : 'stable'
  };
};

// Initialize mock data on startup
setTimeout(() => {
  initializeMockData();
}, 1000);

module.exports = router;