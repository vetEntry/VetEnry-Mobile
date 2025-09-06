const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { 
  requireRole, 
  requireFarmWorker 
} = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Apply role middleware to all vet routes
router.use(requireRole(['VET']));

/**
 * @route   GET /api/vet/dashboard
 * @desc    Get veterinarian dashboard data
 * @access  Private (Vet)
 */
router.get('/dashboard', async (req, res) => {
  try {
    const vetId = req.user.id;

    // Get pending consultations
    const pendingConsultations = await prisma.consultation.findMany({
      where: {
        vetId,
        status: 'PENDING'
      },
      include: {
        farm: {
          select: { name: true, address: true }
        },
        flock: {
          select: { name: true, breed: { select: { name: true } } }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Get active health alerts
    const activeAlerts = await prisma.healthAlert.findMany({
      where: {
        status: { in: ['ACTIVE', 'URGENT'] }
      },
      include: {
        flock: {
          select: { 
            name: true, 
            farm: { select: { name: true } }
          }
        }
      },
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 5
    });

    // Get recent consultations
    const recentConsultations = await prisma.consultation.findMany({
      where: {
        vetId
      },
      include: {
        farm: {
          select: { name: true }
        },
        flock: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Get quick stats
    const totalConsultations = await prisma.consultation.count({
      where: { vetId }
    });

    const pendingConsultationsCount = await prisma.consultation.count({
      where: {
        vetId,
        status: 'PENDING'
      }
    });

    const activeAlertsCount = await prisma.healthAlert.count({
      where: {
        status: { in: ['ACTIVE', 'URGENT'] }
      }
    });

    const dashboardData = {
      pendingConsultations: pendingConsultations.map(consultation => ({
        id: consultation.id,
        farmName: consultation.farm.name,
        flockName: consultation.flock.name,
        breed: consultation.flock.breed.name,
        issue: consultation.issue,
        severity: consultation.severity,
        createdAt: consultation.createdAt
      })),
      activeAlerts: activeAlerts.map(alert => ({
        id: alert.id,
        flockName: alert.flock.name,
        farmName: alert.flock.farm.name,
        issue: alert.issue,
        severity: alert.severity,
        status: alert.status,
        createdAt: alert.createdAt
      })),
      recentConsultations: recentConsultations.map(consultation => ({
        id: consultation.id,
        farmName: consultation.farm.name,
        flockName: consultation.flock.name,
        issue: consultation.issue,
        status: consultation.status,
        createdAt: consultation.createdAt
      })),
      stats: {
        totalConsultations,
        pendingConsultations: pendingConsultationsCount,
        activeAlerts: activeAlertsCount
      }
    };

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Vet dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      code: 'VET_DASHBOARD_ERROR'
    });
  }
});

/**
 * @route   GET /api/vet/consultations
 * @desc    Get veterinarian consultations
 * @access  Private (Vet)
 */
router.get('/consultations', async (req, res) => {
  try {
    const vetId = req.user.id;
    const { page = 1, limit = 10, status, severity, farmId, search } = req.query;

    const skip = (page - 1) * limit;
    const where = {
      vetId,
      ...(status && status !== 'all' && { status: status.toUpperCase() }),
      ...(severity && severity !== 'all' && { severity: severity.toUpperCase() }),
      ...(farmId && { farmId }),
      ...(search && {
        OR: [
          { issue: { contains: search, mode: 'insensitive' } },
          { diagnosis: { contains: search, mode: 'insensitive' } },
          { farm: { name: { contains: search, mode: 'insensitive' } } },
          { flock: { name: { contains: search, mode: 'insensitive' } } }
        ]
      })
    };

    const [consultations, total] = await Promise.all([
      prisma.consultation.findMany({
        where,
        include: {
          farm: {
            select: { name: true, address: true, city: true }
          },
          flock: {
            select: { 
              name: true, 
              breed: { select: { name: true } },
              quantity: true,
              startDate: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.consultation.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        consultations: consultations.map(consultation => ({
          ...consultation,
          flockAge: Math.floor((new Date() - new Date(consultation.flock.startDate)) / (1000 * 60 * 60 * 24))
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get vet consultations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching consultations',
      code: 'GET_VET_CONSULTATIONS_ERROR'
    });
  }
});

/**
 * @route   GET /api/vet/consultations/:consultationId
 * @desc    Get consultation details
 * @access  Private (Vet)
 */
router.get('/consultations/:consultationId', async (req, res) => {
  try {
    const consultationId = req.params.consultationId;
    const vetId = req.user.id;

    const consultation = await prisma.consultation.findFirst({
      where: {
        id: consultationId,
        vetId
      },
      include: {
        farm: {
          select: { 
            name: true, 
            address: true, 
            city: true,
            phone: true,
            email: true
          }
        },
        flock: {
          select: { 
            name: true, 
            breed: { select: { name: true } },
            quantity: true,
            startDate: true,
            status: true,
            health: true
          }
        },
        dailyRecords: {
          where: {
            type: { in: ['HEALTH', 'WEIGHT', 'MORTALITY'] }
          },
          orderBy: { date: 'desc' },
          take: 20
        }
      }
    });

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found',
        code: 'CONSULTATION_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: consultation
    });
  } catch (error) {
    console.error('Get consultation details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching consultation details',
      code: 'GET_CONSULTATION_DETAILS_ERROR'
    });
  }
});

/**
 * @route   POST /api/vet/consultations/:consultationId/diagnose
 * @desc    Provide diagnosis and treatment
 * @access  Private (Vet)
 */
router.post('/consultations/:consultationId/diagnose', [
  body('diagnosis').trim().isLength({ min: 10, max: 1000 }).withMessage('Diagnosis must be between 10 and 1000 characters'),
  body('treatment').trim().isLength({ min: 10, max: 1000 }).withMessage('Treatment must be between 10 and 1000 characters'),
  body('medication').optional().trim().isLength({ max: 500 }).withMessage('Medication too long'),
  body('followUpDate').optional().isISO8601().withMessage('Valid follow-up date is required'),
  body('status').isIn(['IN_PROGRESS', 'RESOLVED', 'REFERRED']).withMessage('Valid status is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }

    const consultationId = req.params.consultationId;
    const vetId = req.user.id;
    const { diagnosis, treatment, medication, followUpDate, status } = req.body;

    // Check if consultation exists and is assigned to this vet
    const consultation = await prisma.consultation.findFirst({
      where: {
        id: consultationId,
        vetId,
        status: { in: ['PENDING', 'IN_PROGRESS'] }
      }
    });

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found or not assigned to you',
        code: 'CONSULTATION_NOT_FOUND'
      });
    }

    // Update consultation
    const updatedConsultation = await prisma.consultation.update({
      where: { id: consultationId },
      data: {
        diagnosis,
        treatment,
        medication,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        status,
        diagnosedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Diagnosis provided successfully',
      data: updatedConsultation
    });
  } catch (error) {
    console.error('Provide diagnosis error:', error);
    res.status(500).json({
      success: false,
      message: 'Error providing diagnosis',
      code: 'PROVIDE_DIAGNOSIS_ERROR'
    });
  }
});

/**
 * @route   GET /api/vet/health-alerts
 * @desc    Get health alerts
 * @access  Private (Vet)
 */
router.get('/health-alerts', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, severity, farmId, search } = req.query;

    const skip = (page - 1) * limit;
    const where = {
      ...(status && status !== 'all' && { status: status.toUpperCase() }),
      ...(severity && severity !== 'all' && { severity: severity.toUpperCase() }),
      ...(farmId && { flock: { farmId } }),
      ...(search && {
        OR: [
          { issue: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { flock: { name: { contains: search, mode: 'insensitive' } } },
          { flock: { farm: { name: { contains: search, mode: 'insensitive' } } } }
        ]
      })
    };

    const [alerts, total] = await Promise.all([
      prisma.healthAlert.findMany({
        where,
        include: {
          flock: {
            select: { 
              name: true, 
              farm: { select: { name: true, address: true } }
            }
          }
        },
        orderBy: [
          { severity: 'desc' },
          { createdAt: 'desc' }
        ],
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.healthAlert.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        alerts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get health alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching health alerts',
      code: 'GET_HEALTH_ALERTS_ERROR'
    });
  }
});

/**
 * @route   POST /api/vet/health-alerts/:alertId/respond
 * @desc    Respond to health alert
 * @access  Private (Vet)
 */
router.post('/health-alerts/:alertId/respond', [
  body('response').trim().isLength({ min: 10, max: 1000 }).withMessage('Response must be between 10 and 1000 characters'),
  body('action').isIn(['MONITOR', 'TREAT', 'REFER', 'RESOLVED']).withMessage('Valid action is required'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes too long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }

    const alertId = req.params.alertId;
    const { response, action, notes } = req.body;

    // Check if alert exists
    const alert = await prisma.healthAlert.findUnique({
      where: { id: alertId }
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Health alert not found',
        code: 'ALERT_NOT_FOUND'
      });
    }

    // Update alert
    const updatedAlert = await prisma.healthAlert.update({
      where: { id: alertId },
      data: {
        status: action === 'RESOLVED' ? 'RESOLVED' : 'IN_PROGRESS',
        vetResponse: response,
        action,
        notes,
        respondedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Response submitted successfully',
      data: updatedAlert
    });
  } catch (error) {
    console.error('Respond to alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Error responding to alert',
      code: 'RESPOND_TO_ALERT_ERROR'
    });
  }
});

/**
 * @route   GET /api/vet/flocks
 * @desc    Get flocks for monitoring
 * @access  Private (Vet)
 */
router.get('/flocks', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, health, farmId, search } = req.query;

    const skip = (page - 1) * limit;
    const where = {
      ...(status && status !== 'all' && { status: status.toUpperCase() }),
      ...(health && health !== 'all' && { health: health.toUpperCase() }),
      ...(farmId && { farmId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { breed: { name: { contains: search, mode: 'insensitive' } } },
          { farm: { name: { contains: search, mode: 'insensitive' } } }
        ]
      })
    };

    const [flocks, total] = await Promise.all([
      prisma.flock.findMany({
        where,
        include: {
          breed: { select: { name: true } },
          farm: { select: { name: true, address: true } },
          _count: {
            select: {
              dailyRecords: true,
              healthAlerts: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.flock.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        flocks: flocks.map(flock => ({
          ...flock,
          age: Math.floor((new Date() - new Date(flock.startDate)) / (1000 * 60 * 60 * 24)),
          recordCount: flock._count.dailyRecords,
          alertCount: flock._count.healthAlerts
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get vet flocks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching flocks',
      code: 'GET_VET_FLOCKS_ERROR'
    });
  }
});

/**
 * @route   GET /api/vet/flocks/:flockId
 * @desc    Get flock details for veterinary monitoring
 * @access  Private (Vet)
 */
router.get('/flocks/:flockId', async (req, res) => {
  try {
    const flockId = req.params.flockId;

    const flock = await prisma.flock.findUnique({
      where: { id: flockId },
      include: {
        breed: { select: { name: true, category: true } },
        farm: { select: { name: true, address: true, phone: true } },
        dailyRecords: {
          where: {
            type: { in: ['HEALTH', 'WEIGHT', 'MORTALITY', 'FEED'] }
          },
          orderBy: { date: 'desc' },
          take: 30
        },
        healthAlerts: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        tasks: {
          where: {
            category: { in: ['HEALTH', 'VACCINATION', 'TREATMENT'] }
          },
          orderBy: { dueDate: 'desc' },
          take: 10
        }
      }
    });

    if (!flock) {
      return res.status(404).json({
        success: false,
        message: 'Flock not found',
        code: 'FLOCK_NOT_FOUND'
      });
    }

    // Calculate health metrics
    const healthMetrics = {
      age: Math.floor((new Date() - new Date(flock.startDate)) / (1000 * 60 * 60 * 24)),
      mortalityRate: flock.quantity > 0 ? ((flock.mortality || 0) / flock.quantity) * 100 : 0,
      healthScore: calculateHealthScore(flock)
    };

    res.json({
      success: true,
      data: {
        ...flock,
        healthMetrics
      }
    });
  } catch (error) {
    console.error('Get flock details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching flock details',
      code: 'GET_FLOCK_DETAILS_ERROR'
    });
  }
});

/**
 * @route   POST /api/vet/flocks/:flockId/health-check
 * @desc    Perform health check on flock
 * @access  Private (Vet)
 */
router.post('/flocks/:flockId/health-check', [
  body('overallHealth').isIn(['EXCELLENT', 'GOOD', 'FAIR', 'POOR']).withMessage('Valid health status is required'),
  body('observations').trim().isLength({ min: 10, max: 1000 }).withMessage('Observations must be between 10 and 1000 characters'),
  body('recommendations').optional().trim().isLength({ max: 500 }).withMessage('Recommendations too long'),
  body('nextCheckDate').optional().isISO8601().withMessage('Valid next check date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }

    const flockId = req.params.flockId;
    const { overallHealth, observations, recommendations, nextCheckDate } = req.body;

    // Check if flock exists
    const flock = await prisma.flock.findUnique({
      where: { id: flockId }
    });

    if (!flock) {
      return res.status(404).json({
        success: false,
        message: 'Flock not found',
        code: 'FLOCK_NOT_FOUND'
      });
    }

    // Update flock health status
    await prisma.flock.update({
      where: { id: flockId },
      data: { health: overallHealth }
    });

    // Create health check record
    const healthCheck = await prisma.dailyRecord.create({
      data: {
        flockId,
        workerId: null, // Vet performed the check
        type: 'HEALTH',
        quantity: 0,
        unit: 'check',
        notes: `Vet Health Check: ${observations}${recommendations ? ` | Recommendations: ${recommendations}` : ''}`,
        date: new Date()
      }
    });

    // Create task for next check if specified
    let nextCheckTask = null;
    if (nextCheckDate) {
      nextCheckTask = await prisma.task.create({
        data: {
          farmId: flock.farmId,
          title: 'Follow-up Health Check',
          description: `Follow-up health check for flock ${flock.name}`,
          category: 'HEALTH',
          priority: 'MEDIUM',
          status: 'PENDING',
          dueDate: new Date(nextCheckDate),
          assignedTo: null, // Will be assigned by farmer
          flockId
        }
      });
    }

    res.json({
      success: true,
      message: 'Health check completed successfully',
      data: {
        healthCheck,
        nextCheckTask
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing health check',
      code: 'HEALTH_CHECK_ERROR'
    });
  }
});

/**
 * @route   GET /api/vet/reports
 * @desc    Get veterinary reports and analytics
 * @access  Private (Vet)
 */
router.get('/reports', async (req, res) => {
  try {
    const { startDate, endDate, farmId } = req.query;

    // Parse date range
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const end = endDate ? new Date(endDate) : new Date();

    const where = {
      createdAt: {
        gte: start,
        lte: end
      },
      ...(farmId && { flock: { farmId } })
    };

    // Get consultations summary
    const consultations = await prisma.consultation.findMany({
      where,
      include: {
        flock: {
          select: { 
            name: true,
            farm: { select: { name: true } }
          }
        }
      }
    });

    // Get health alerts summary
    const healthAlerts = await prisma.healthAlert.findMany({
      where,
      include: {
        flock: {
          select: { 
            name: true,
            farm: { select: { name: true } }
          }
        }
      }
    });

    // Group by status and severity
    const consultationStats = consultations.reduce((acc, consultation) => {
      if (!acc[consultation.status]) {
        acc[consultation.status] = 0;
      }
      acc[consultation.status]++;
      return acc;
    }, {});

    const alertStats = healthAlerts.reduce((acc, alert) => {
      if (!acc[alert.severity]) {
        acc[alert.severity] = 0;
      }
      acc[alert.severity]++;
      return acc;
    }, {});

    // Get top health issues
    const topIssues = await prisma.consultation.groupBy({
      by: ['issue'],
      where,
      _count: true,
      orderBy: { _count: { issue: 'desc' } },
      take: 5
    });

    const reportData = {
      period: { start, end },
      consultations: {
        summary: consultationStats,
        total: consultations.length,
        topIssues: topIssues.map(issue => ({
          issue: issue.issue,
          count: issue._count
        }))
      },
      healthAlerts: {
        summary: alertStats,
        total: healthAlerts.length
      }
    };

    res.json({
      success: true,
      data: reportData
    });
  } catch (error) {
    console.error('Vet reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating reports',
      code: 'VET_REPORTS_ERROR'
    });
  }
});

/**
 * Helper function to calculate health score
 */
function calculateHealthScore(flock) {
  let score = 100;
  
  // Deduct points for mortality
  if (flock.mortality > 0) {
    const mortalityRate = (flock.mortality / flock.quantity) * 100;
    if (mortalityRate > 5) score -= 30;
    else if (mortalityRate > 2) score -= 20;
    else if (mortalityRate > 1) score -= 10;
  }
  
  // Deduct points for health status
  if (flock.health === 'POOR') score -= 40;
  else if (flock.health === 'FAIR') score -= 20;
  else if (flock.health === 'GOOD') score -= 5;
  
  // Deduct points for active alerts
  if (flock.healthAlerts) {
    const activeAlerts = flock.healthAlerts.filter(alert => 
      alert.status === 'ACTIVE' || alert.status === 'URGENT'
    );
    score -= activeAlerts.length * 10;
  }
  
  return Math.max(0, score);
}

module.exports = router;
