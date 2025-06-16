const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const WorkingHours = require('../models/WorkingHours');
const logger = require('../utils/logger');

// GET /api/working-hours/summary/:driverId - Obtener resumen de horas de trabajo
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

      // Verificar permisos
      const requestingDriverId = req.params.driverId === 'current' ? req.user.id : req.params.driverId;
      
      if (req.user.role === 'driver' && req.user.id !== requestingDriverId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
      const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 días por defecto

      const summary = await WorkingHours.calculateWorkingSummary(
        requestingDriverId,
        startDate,
        endDate
      );

      res.json(summary);
    } catch (error) {
      logger.error('Error calculating working hours summary:', error);
      res.status(500).json({ error: 'Failed to calculate working hours summary' });
    }
  }
);

// GET /api/working-hours/report/:driverId - Generar informe de cumplimiento
router.get('/report/:driverId',
  authenticateToken,
  authorize(['admin', 'operator', 'authority']),
  [
    param('driverId').notEmpty(),
    query('period').optional().isIn(['weekly', 'monthly', 'quarterly', 'yearly'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const period = req.query.period || 'monthly';
      const report = await WorkingHours.generateComplianceReport(
        req.params.driverId,
        period
      );

      res.json(report);
    } catch (error) {
      logger.error('Error generating compliance report:', error);
      res.status(500).json({ error: 'Failed to generate compliance report' });
    }
  }
);

// GET /api/working-hours/alerts/:driverId - Obtener alertas activas
router.get('/alerts/:driverId',
  authenticateToken,
  [
    param('driverId').notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Verificar permisos
      const requestingDriverId = req.params.driverId === 'current' ? req.user.id : req.params.driverId;
      
      if (req.user.role === 'driver' && req.user.id !== requestingDriverId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const alerts = await WorkingHours.getActiveAlerts(requestingDriverId);

      res.json({
        driverId: requestingDriverId,
        timestamp: new Date().toISOString(),
        activeAlerts: alerts.length,
        alerts
      });
    } catch (error) {
      logger.error('Error fetching active alerts:', error);
      res.status(500).json({ error: 'Failed to fetch active alerts' });
    }
  }
);

// GET /api/working-hours/compliance/fleet - Resumen de cumplimiento de flota
router.get('/compliance/fleet',
  authenticateToken,
  authorize(['admin', 'operator', 'transporter']),
  [
    query('companyId').optional(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // En producción, filtrar por companyId
      const companyId = req.query.companyId || req.user.companyId;
      
      // Simulación de datos de flota
      const fleetCompliance = {
        companyId,
        period: {
          start: req.query.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: req.query.endDate || new Date().toISOString()
        },
        summary: {
          totalDrivers: 25,
          compliantDrivers: 20,
          warningDrivers: 3,
          violationDrivers: 2,
          averageComplianceScore: 85.5,
          totalViolations: 15,
          criticalViolations: 2
        },
        driverBreakdown: [
          {
            driverId: 'DRV001',
            name: 'Juan Pérez',
            complianceScore: 95,
            violations: 0,
            status: 'compliant'
          },
          {
            driverId: 'DRV002',
            name: 'María González',
            complianceScore: 78,
            violations: 3,
            status: 'warning'
          },
          {
            driverId: 'DRV003',
            name: 'Carlos Rodríguez',
            complianceScore: 45,
            violations: 8,
            status: 'violation'
          }
        ],
        trends: {
          complianceImprovement: '+5.2%',
          violationReduction: '-15%',
          averageDrivingHours: 7.8,
          averageRestCompliance: 92
        },
        recommendations: [
          {
            priority: 'high',
            category: 'training',
            affectedDrivers: 5,
            message: 'Conductores con violaciones recurrentes requieren capacitación'
          },
          {
            priority: 'medium',
            category: 'scheduling',
            affectedDrivers: 8,
            message: 'Optimizar turnos para mejorar períodos de descanso'
          }
        ]
      };

      res.json(fleetCompliance);
    } catch (error) {
      logger.error('Error fetching fleet compliance:', error);
      res.status(500).json({ error: 'Failed to fetch fleet compliance data' });
    }
  }
);

// POST /api/working-hours/schedule - Crear/actualizar programación de trabajo
router.post('/schedule',
  authenticateToken,
  authorize(['admin', 'operator', 'transporter']),
  [
    body('driverId').notEmpty().withMessage('Driver ID is required'),
    body('weekStart').isISO8601().withMessage('Valid week start date required'),
    body('schedule').isArray().withMessage('Schedule must be an array'),
    body('schedule.*.date').isISO8601().withMessage('Valid date required'),
    body('schedule.*.shifts').isArray().withMessage('Shifts must be an array')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { driverId, weekStart, schedule } = req.body;

      // Validar que la programación cumple con regulaciones
      const validationResult = WorkingHours.validateSchedule(schedule);
      
      if (!validationResult.isValid) {
        return res.status(400).json({
          error: 'Schedule violates regulations',
          violations: validationResult.violations
        });
      }

      // Guardar programación (en producción, guardar en DB)
      const savedSchedule = {
        id: `SCH-${Date.now()}`,
        driverId,
        weekStart,
        schedule,
        createdBy: req.user.id,
        createdAt: new Date().toISOString(),
        status: 'active'
      };

      res.status(201).json({
        message: 'Schedule created successfully',
        schedule: savedSchedule
      });
    } catch (error) {
      logger.error('Error creating schedule:', error);
      res.status(500).json({ error: 'Failed to create schedule' });
    }
  }
);

// GET /api/working-hours/recommendations/:driverId - Obtener recomendaciones personalizadas
router.get('/recommendations/:driverId',
  authenticateToken,
  [
    param('driverId').notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const driverId = req.params.driverId === 'current' ? req.user.id : req.params.driverId;
      
      // Obtener resumen reciente
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // Última semana
      
      const summary = await WorkingHours.calculateWorkingSummary(driverId, startDate, endDate);
      
      // Generar recomendaciones adicionales basadas en IA
      const aiRecommendations = {
        immediate: [],
        shortTerm: [],
        longTerm: []
      };

      // Recomendaciones inmediatas
      if (summary.totals.driving > 40) {
        aiRecommendations.immediate.push({
          type: 'rest_urgent',
          message: 'Considerar día de descanso completo en las próximas 24 horas',
          benefit: 'Reducir fatiga acumulada y mejorar seguridad'
        });
      }

      // Recomendaciones a corto plazo
      if (summary.complianceScore < 80) {
        aiRecommendations.shortTerm.push({
          type: 'schedule_adjustment',
          message: 'Ajustar horarios para distribuir mejor las horas de conducción',
          benefit: 'Mejorar cumplimiento normativo en un 20%'
        });
      }

      // Recomendaciones a largo plazo
      if (summary.violations.length > 5) {
        aiRecommendations.longTerm.push({
          type: 'training_program',
          message: 'Participar en programa de gestión de fatiga y tiempos',
          benefit: 'Reducir violaciones en un 80% en 3 meses'
        });
      }

      res.json({
        driverId,
        currentStatus: {
          complianceScore: summary.complianceScore,
          recentViolations: summary.violations.length,
          weeklyDriving: summary.totals.driving
        },
        recommendations: {
          system: summary.recommendations,
          ai: aiRecommendations
        },
        projections: {
          nextWeekRisk: summary.complianceScore < 70 ? 'high' : 'low',
          estimatedImprovement: '+15%',
          timeToOptimal: '2 weeks'
        }
      });
    } catch (error) {
      logger.error('Error generating recommendations:', error);
      res.status(500).json({ error: 'Failed to generate recommendations' });
    }
  }
);

// POST /api/working-hours/simulate - Simular impacto de cambios en programación
router.post('/simulate',
  authenticateToken,
  authorize(['admin', 'operator', 'transporter']),
  [
    body('driverId').notEmpty().withMessage('Driver ID is required'),
    body('proposedSchedule').isArray().withMessage('Proposed schedule required'),
    body('simulationPeriod').isInt({ min: 1, max: 30 }).withMessage('Simulation period must be 1-30 days')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { driverId, proposedSchedule, simulationPeriod } = req.body;

      // Simular impacto
      const simulation = {
        driverId,
        period: simulationPeriod,
        current: {
          complianceScore: 75,
          weeklyDrivingAvg: 48,
          violationRisk: 'medium'
        },
        projected: {
          complianceScore: 88,
          weeklyDrivingAvg: 42,
          violationRisk: 'low',
          improvements: [
            'Reducción del 25% en riesgo de violaciones',
            'Mejora del 15% en distribución de descansos',
            'Optimización del 12% en eficiencia de rutas'
          ]
        },
        potentialIssues: [
          {
            type: 'coverage',
            impact: 'low',
            description: 'Requiere 2 horas adicionales de cobertura los martes'
          }
        ],
        recommendation: 'APPROVED',
        confidence: 0.92
      };

      res.json(simulation);
    } catch (error) {
      logger.error('Error running simulation:', error);
      res.status(500).json({ error: 'Failed to run simulation' });
    }
  }
);

module.exports = router;