const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { 
  requireRole, 
  requireFarmWorker,
  requirePermission 
} = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Apply role middleware to all worker routes
router.use(requireRole(['WORKER']));

/**
 * @route   GET /api/worker/dashboard
 * @desc    Get worker dashboard data
 * @access  Private (Worker)
 */
router.get('/dashboard', requireFarmWorker, async (req, res) => {
  try {
    const workerId = req.worker.id;
    const farmId = req.worker.farmId;

    // Get assigned flocks
    const assignedFlocks = await prisma.flock.findMany({
      where: {
        farmId,
        status: 'ACTIVE'
      },
      include: {
        breed: true,
        _count: {
          select: {
            dailyRecords: true,
            tasks: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get today's tasks
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysTasks = await prisma.task.findMany({
      where: {
        farmId,
        assignedTo: workerId,
        dueDate: {
          gte: today,
          lt: tomorrow
        },
        status: { in: ['PENDING', 'IN_PROGRESS'] }
      },
      include: {
        flock: {
          select: { name: true }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' }
      ]
    });

    // Get recent activities
    const recentActivities = await prisma.dailyRecord.findMany({
      where: {
        flock: { farmId },
        workerId
      },
      include: {
        flock: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Get quick stats
    const pendingTasks = await prisma.task.count({
      where: {
        farmId,
        assignedTo: workerId,
        status: 'PENDING'
      }
    });

    const completedTasks = await prisma.task.count({
      where: {
        farmId,
        assignedTo: workerId,
        status: 'COMPLETED'
      }
    });

    const totalFlocks = assignedFlocks.length;

    const dashboardData = {
      assignedFlocks: assignedFlocks.map(flock => ({
        id: flock.id,
        name: flock.name,
        breed: flock.breed.name,
        quantity: flock.quantity,
        age: Math.floor((new Date() - new Date(flock.startDate)) / (1000 * 60 * 60 * 24)),
        status: flock.status,
        recordCount: flock._count.dailyRecords,
        taskCount: flock._count.tasks
      })),
      todaysTasks: todaysTasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate,
        flockName: task.flock?.name
      })),
      recentActivities: recentActivities.map(activity => ({
        id: activity.id,
        type: activity.type,
        quantity: activity.quantity,
        unit: activity.unit,
        date: activity.date,
        flockName: activity.flock.name,
        notes: activity.notes
      })),
      stats: {
        pendingTasks,
        completedTasks,
        totalFlocks
      }
    };

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Worker dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      code: 'WORKER_DASHBOARD_ERROR'
    });
  }
});

/**
 * @route   GET /api/worker/flocks
 * @desc    Get flocks assigned to worker
 * @access  Private (Worker)
 */
router.get('/flocks', requireFarmWorker, async (req, res) => {
  try {
    const farmId = req.worker.farmId;
    const { page = 1, limit = 10, status, search } = req.query;

    const skip = (page - 1) * limit;
    const where = {
      farmId,
      ...(status && status !== 'all' && { status: status.toUpperCase() }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { breed: { name: { contains: search, mode: 'insensitive' } } }
        ]
      })
    };

    const [flocks, total] = await Promise.all([
      prisma.flock.findMany({
        where,
        include: {
          breed: true,
          _count: {
            select: {
              dailyRecords: true,
              tasks: true
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
          taskCount: flock._count.tasks
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
    console.error('Get worker flocks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching flocks',
      code: 'GET_WORKER_FLOCKS_ERROR'
    });
  }
});

/**
 * @route   GET /api/worker/tasks
 * @desc    Get tasks assigned to worker
 * @access  Private (Worker)
 */
router.get('/tasks', requireFarmWorker, async (req, res) => {
  try {
    const workerId = req.worker.id;
    const farmId = req.worker.farmId;
    const { page = 1, limit = 10, status, priority, category, date } = req.query;

    const skip = (page - 1) * limit;
    const where = {
      farmId,
      assignedTo: workerId,
      ...(status && status !== 'all' && { status: status.toUpperCase() }),
      ...(priority && priority !== 'all' && { priority: priority.toUpperCase() }),
      ...(category && category !== 'all' && { category: category.toUpperCase() }),
      ...(date && {
        dueDate: {
          gte: new Date(date),
          lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1))
        }
      })
    };

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          flock: {
            select: { name: true }
          }
        },
        orderBy: [
          { status: 'asc' },
          { priority: 'desc' },
          { dueDate: 'asc' }
        ],
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.task.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        tasks: tasks.map(task => ({
          ...task,
          isOverdue: new Date() > new Date(task.dueDate) && task.status !== 'COMPLETED'
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
    console.error('Get worker tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tasks',
      code: 'GET_WORKER_TASKS_ERROR'
    });
  }
});

/**
 * @route   POST /api/worker/tasks/:taskId/start
 * @desc    Start a task
 * @access  Private (Worker)
 */
router.post('/tasks/:taskId/start', requireFarmWorker, async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const workerId = req.worker.id;

    // Check if task is assigned to this worker
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        assignedTo: workerId,
        status: 'PENDING'
      }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or not assigned to you',
        code: 'TASK_NOT_FOUND'
      });
    }

    // Update task status
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { status: 'IN_PROGRESS' }
    });

    res.json({
      success: true,
      message: 'Task started successfully',
      data: updatedTask
    });
  } catch (error) {
    console.error('Start task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting task',
      code: 'START_TASK_ERROR'
    });
  }
});

/**
 * @route   POST /api/worker/tasks/:taskId/complete
 * @desc    Complete a task
 * @access  Private (Worker)
 */
router.post('/tasks/:taskId/complete', requireFarmWorker, async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const workerId = req.worker.id;
    const { notes } = req.body;

    // Check if task is assigned to this worker
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        assignedTo: workerId,
        status: { in: ['PENDING', 'IN_PROGRESS'] }
      }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or not assigned to you',
        code: 'TASK_NOT_FOUND'
      });
    }

    // Update task status
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        notes: notes || task.notes
      }
    });

    res.json({
      success: true,
      message: 'Task completed successfully',
      data: updatedTask
    });
  } catch (error) {
    console.error('Complete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing task',
      code: 'COMPLETE_TASK_ERROR'
    });
  }
});

/**
 * @route   POST /api/worker/records/feed
 * @desc    Submit feed data
 * @access  Private (Worker)
 */
router.post('/records/feed', [
  requireFarmWorker,
  requirePermission(['feeding']),
  body('flockId').isUUID().withMessage('Valid flock ID is required'),
  body('quantity').isFloat({ min: 0 }).withMessage('Quantity must be a positive number'),
  body('unit').isIn(['kg', 'g', 'lbs']).withMessage('Valid unit is required'),
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

    const { flockId, quantity, unit, notes } = req.body;
    const workerId = req.worker.id;

    // Verify flock access
    const flock = await prisma.flock.findFirst({
      where: {
        id: flockId,
        farmId: req.worker.farmId
      }
    });

    if (!flock) {
      return res.status(404).json({
        success: false,
        message: 'Flock not found',
        code: 'FLOCK_NOT_FOUND'
      });
    }

    // Create daily record
    const record = await prisma.dailyRecord.create({
      data: {
        flockId,
        workerId,
        type: 'FEED',
        quantity,
        unit,
        notes,
        date: new Date()
      }
    });

    res.status(201).json({
      success: true,
      message: 'Feed data recorded successfully',
      data: record
    });
  } catch (error) {
    console.error('Feed record error:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording feed data',
      code: 'FEED_RECORD_ERROR'
    });
  }
});

/**
 * @route   POST /api/worker/records/health
 * @desc    Submit health data
 * @access  Private (Worker)
 */
router.post('/records/health', [
  requireFarmWorker,
  requirePermission(['health']),
  body('flockId').isUUID().withMessage('Valid flock ID is required'),
  body('temperature').optional().isFloat().withMessage('Temperature must be a number'),
  body('mortality').optional().isInt({ min: 0 }).withMessage('Mortality must be a non-negative integer'),
  body('symptoms').optional().trim().isLength({ max: 500 }).withMessage('Symptoms too long'),
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

    const { flockId, temperature, mortality, symptoms, notes } = req.body;
    const workerId = req.worker.id;

    // Verify flock access
    const flock = await prisma.flock.findFirst({
      where: {
        id: flockId,
        farmId: req.worker.farmId
      }
    });

    if (!flock) {
      return res.status(404).json({
        success: false,
        message: 'Flock not found',
        code: 'FLOCK_NOT_FOUND'
      });
    }

    // Create daily record
    const record = await prisma.dailyRecord.create({
      data: {
        flockId,
        workerId,
        type: 'HEALTH',
        quantity: mortality || 0,
        unit: 'birds',
        notes: notes || symptoms,
        date: new Date()
      }
    });

    // Update flock mortality if provided
    if (mortality !== undefined) {
      await prisma.flock.update({
        where: { id: flockId },
        data: {
          mortality: (flock.mortality || 0) + mortality
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Health data recorded successfully',
      data: record
    });
  } catch (error) {
    console.error('Health record error:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording health data',
      code: 'HEALTH_RECORD_ERROR'
    });
  }
});

/**
 * @route   POST /api/worker/records/weight
 * @desc    Submit weight data
 * @access  Private (Worker)
 */
router.post('/records/weight', [
  requireFarmWorker,
  requirePermission(['weight']),
  body('flockId').isUUID().withMessage('Valid flock ID is required'),
  body('sampleSize').isInt({ min: 1 }).withMessage('Sample size must be at least 1'),
  body('averageWeight').isFloat({ min: 0 }).withMessage('Average weight must be positive'),
  body('unit').isIn(['g', 'kg', 'lbs']).withMessage('Valid unit is required'),
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

    const { flockId, sampleSize, averageWeight, unit, notes } = req.body;
    const workerId = req.worker.id;

    // Verify flock access
    const flock = await prisma.flock.findFirst({
      where: {
        id: flockId,
        farmId: req.worker.farmId
      }
    });

    if (!flock) {
      return res.status(404).json({
        success: false,
        message: 'Flock not found',
        code: 'FLOCK_NOT_FOUND'
      });
    }

    // Create daily record
    const record = await prisma.dailyRecord.create({
      data: {
        flockId,
        workerId,
        type: 'WEIGHT',
        quantity: averageWeight,
        unit,
        notes: `${sampleSize} birds sampled - ${notes || ''}`,
        date: new Date()
      }
    });

    res.status(201).json({
      success: true,
      message: 'Weight data recorded successfully',
      data: record
    });
  } catch (error) {
    console.error('Weight record error:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording weight data',
      code: 'WEIGHT_RECORD_ERROR'
    });
  }
});

/**
 * @route   POST /api/worker/records/eggs
 * @desc    Submit egg production data
 * @access  Private (Worker)
 */
router.post('/records/eggs', [
  requireFarmWorker,
  requirePermission(['eggs']),
  body('flockId').isUUID().withMessage('Valid flock ID is required'),
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be non-negative'),
  body('quality').isIn(['EXCELLENT', 'GOOD', 'FAIR', 'POOR']).withMessage('Valid quality is required'),
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

    const { flockId, quantity, quality, notes } = req.body;
    const workerId = req.worker.id;

    // Verify flock access
    const flock = await prisma.flock.findFirst({
      where: {
        id: flockId,
        farmId: req.worker.farmId
      }
    });

    if (!flock) {
      return res.status(404).json({
        success: false,
        message: 'Flock not found',
        code: 'FLOCK_NOT_FOUND'
      });
    }

    // Create daily record
    const record = await prisma.dailyRecord.create({
      data: {
        flockId,
        workerId,
        type: 'EGGS',
        quantity,
        unit: 'pieces',
        notes: `Quality: ${quality} - ${notes || ''}`,
        date: new Date()
      }
    });

    res.status(201).json({
      success: true,
      message: 'Egg production data recorded successfully',
      data: record
    });
  } catch (error) {
    console.error('Egg record error:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording egg production data',
      code: 'EGG_RECORD_ERROR'
    });
  }
});

/**
 * @route   GET /api/worker/reports
 * @desc    Get worker reports and analytics
 * @access  Private (Worker)
 */
router.get('/reports', requireFarmWorker, async (req, res) => {
  try {
    const workerId = req.worker.id;
    const farmId = req.worker.farmId;
    const { startDate, endDate, type } = req.query;

    // Parse date range
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const end = endDate ? new Date(endDate) : new Date();

    const where = {
      flock: { farmId },
      workerId,
      date: {
        gte: start,
        lte: end
      },
      ...(type && type !== 'all' && { type: type.toUpperCase() })
    };

    // Get records summary
    const records = await prisma.dailyRecord.findMany({
      where,
      include: {
        flock: {
          select: { name: true }
        }
      },
      orderBy: { date: 'desc' }
    });

    // Group by type
    const recordsByType = records.reduce((acc, record) => {
      if (!acc[record.type]) {
        acc[record.type] = [];
      }
      acc[record.type].push(record);
      return acc;
    }, {});

    // Calculate totals
    const totals = Object.keys(recordsByType).reduce((acc, type) => {
      acc[type] = recordsByType[type].reduce((sum, record) => sum + (record.quantity || 0), 0);
      return acc;
    }, {});

    // Get task completion rate
    const taskStats = await prisma.task.groupBy({
      by: ['status'],
      where: {
        farmId,
        assignedTo: workerId,
        dueDate: { gte: start, lte: end }
      },
      _count: true
    });

    const taskCompletionRate = taskStats.reduce((acc, stat) => {
      acc[stat.status] = stat._count;
      return acc;
    }, {});

    const reportData = {
      period: { start, end },
      records: {
        summary: totals,
        byType: recordsByType,
        totalRecords: records.length
      },
      tasks: {
        completionRate: taskCompletionRate,
        totalTasks: Object.values(taskCompletionRate).reduce((sum, count) => sum + count, 0)
      }
    };

    res.json({
      success: true,
      data: reportData
    });
  } catch (error) {
    console.error('Worker reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating reports',
      code: 'WORKER_REPORTS_ERROR'
    });
  }
});

/**
 * @route   GET /api/worker/profile
 * @desc    Get worker profile
 * @access  Private (Worker)
 */
router.get('/profile', requireFarmWorker, async (req, res) => {
  try {
    const workerId = req.worker.id;

    const worker = await prisma.worker.findUnique({
      where: { id: workerId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            profileImage: true,
            createdAt: true
          }
        },
        farm: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true
          }
        }
      }
    });

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker profile not found',
        code: 'WORKER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: worker
    });
  } catch (error) {
    console.error('Get worker profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching worker profile',
      code: 'GET_WORKER_PROFILE_ERROR'
    });
  }
});

/**
 * @route   PUT /api/worker/profile
 * @desc    Update worker profile
 * @access  Private (Worker)
 */
router.put('/profile', [
  requireFarmWorker,
  body('firstName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
  body('lastName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required')
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

    const workerId = req.worker.id;
    const updateData = req.body;

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: req.worker.userId },
      data: {
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        phone: updateData.phone
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        profileImage: true
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update worker profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      code: 'UPDATE_WORKER_PROFILE_ERROR'
    });
  }
});

module.exports = router;
