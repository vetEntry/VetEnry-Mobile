const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { 
  requireRole, 
  requireFarmOwnership, 
  requireFarmWorker,
  requirePermission 
} = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Apply role middleware to all farmer routes
router.use(requireRole(['FARMER']));

/**
 * @route   GET /api/farmer/dashboard
 * @desc    Get farmer dashboard data
 * @access  Private (Farmer)
 */
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get farms count
    const farmsCount = await prisma.farm.count({
      where: { userId, isActive: true }
    });

    // Get total flocks
    const flocksCount = await prisma.flock.count({
      where: {
        farm: { userId, isActive: true }
      }
    });

    // Get active flocks
    const activeFlocks = await prisma.flock.count({
      where: {
        farm: { userId, isActive: true },
        status: 'ACTIVE'
      }
    });

    // Get total birds
    const totalBirds = await prisma.flock.aggregate({
      where: {
        farm: { userId, isActive: true },
        status: 'ACTIVE'
      },
      _sum: { quantity: true }
    });

    // Get recent activities
    const recentActivities = await prisma.dailyRecord.findMany({
      where: {
        flock: {
          farm: { userId, isActive: true }
        }
      },
      include: {
        flock: {
          select: { name: true }
        },
        worker: {
          select: { 
            user: { select: { firstName: true, lastName: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Get financial summary
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const monthlyExpenses = await prisma.expense.aggregate({
      where: {
        farm: { userId, isActive: true },
        date: { gte: currentMonth }
      },
      _sum: { amount: true }
    });

    const monthlyIncome = await prisma.income.aggregate({
      where: {
        farm: { userId, isActive: true },
        date: { gte: currentMonth }
      },
      _sum: { amount: true }
    });

    // Get pending tasks
    const pendingTasks = await prisma.task.count({
      where: {
        farm: { userId, isActive: true },
        status: 'PENDING'
      }
    });

    const dashboardData = {
      farmsCount,
      flocksCount,
      activeFlocks,
      totalBirds: totalBirds._sum.quantity || 0,
      recentActivities: recentActivities.map(activity => ({
        id: activity.id,
        type: activity.type,
        quantity: activity.quantity,
        unit: activity.unit,
        date: activity.date,
        flockName: activity.flock.name,
        workerName: activity.worker ? 
          `${activity.worker.user.firstName} ${activity.worker.user.lastName}` : 
          'System'
      })),
      financial: {
        monthlyExpenses: monthlyExpenses._sum.amount || 0,
        monthlyIncome: monthlyIncome._sum.amount || 0,
        monthlyProfit: (monthlyIncome._sum.amount || 0) - (monthlyExpenses._sum.amount || 0)
      },
      tasks: {
        pending: pendingTasks
      }
    };

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      code: 'DASHBOARD_ERROR'
    });
  }
});

/**
 * @route   GET /api/farmer/farms
 * @desc    Get all farms for the authenticated farmer
 * @access  Private (Farmer)
 */
router.get('/farms', async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, search } = req.query;

    const skip = (page - 1) * limit;
    const where = {
      userId,
      isActive: true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { farmType: { hasSome: [search] } },
          { city: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [farms, total] = await Promise.all([
      prisma.farm.findMany({
        where,
        include: {
          _count: {
            select: {
              flocks: true,
              workers: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.farm.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        farms: farms.map(farm => ({
          ...farm,
          flockCount: farm._count.flocks,
          workerCount: farm._count.workers
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
    console.error('Get farms error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching farms',
      code: 'GET_FARMS_ERROR'
    });
  }
});

/**
 * @route   POST /api/farmer/farms
 * @desc    Create a new farm
 * @access  Private (Farmer)
 */
router.post('/farms', [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Farm name must be between 2 and 100 characters'),
  body('farmType').isArray({ min: 1 }).withMessage('At least one farm type is required'),
  body('farmSize').optional().isFloat({ min: 0 }).withMessage('Farm size must be a positive number'),
  body('address').optional().trim().isLength({ max: 200 }).withMessage('Address too long'),
  body('city').optional().trim().isLength({ max: 100 }).withMessage('City name too long'),
  body('state').optional().trim().isLength({ max: 100 }).withMessage('State name too long')
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

    const userId = req.user.id;
    const farmData = {
      ...req.body,
      userId,
      coordinates: req.body.coordinates ? JSON.parse(req.body.coordinates) : null
    };

    const farm = await prisma.farm.create({
      data: farmData,
      include: {
        _count: {
          select: {
            flocks: true,
            workers: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Farm created successfully',
      data: {
        ...farm,
        flockCount: farm._count.flocks,
        workerCount: farm._count.workers
      }
    });
  } catch (error) {
    console.error('Create farm error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating farm',
      code: 'CREATE_FARM_ERROR'
    });
  }
});

/**
 * @route   GET /api/farmer/farms/:farmId
 * @desc    Get farm details
 * @access  Private (Farmer)
 */
router.get('/farms/:farmId', requireFarmOwnership, async (req, res) => {
  try {
    const farmId = req.params.farmId;

    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
      include: {
        flocks: {
          include: {
            breed: true,
            _count: {
              select: {
                dailyRecords: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        workers: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            flocks: true,
            workers: true,
            expenses: true,
            incomes: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: farm
    });
  } catch (error) {
    console.error('Get farm details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching farm details',
      code: 'GET_FARM_DETAILS_ERROR'
    });
  }
});

/**
 * @route   PUT /api/farmer/farms/:farmId
 * @desc    Update farm
 * @access  Private (Farmer)
 */
router.put('/farms/:farmId', requireFarmOwnership, [
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Farm name must be between 2 and 100 characters'),
  body('farmType').optional().isArray({ min: 1 }).withMessage('At least one farm type is required'),
  body('farmSize').optional().isFloat({ min: 0 }).withMessage('Farm size must be a positive number')
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

    const farmId = req.params.farmId;
    const updateData = { ...req.body };
    
    if (req.body.coordinates) {
      updateData.coordinates = JSON.parse(req.body.coordinates);
    }

    const farm = await prisma.farm.update({
      where: { id: farmId },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Farm updated successfully',
      data: farm
    });
  } catch (error) {
    console.error('Update farm error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating farm',
      code: 'UPDATE_FARM_ERROR'
    });
  }
});

/**
 * @route   DELETE /api/farmer/farms/:farmId
 * @desc    Delete farm
 * @access  Private (Farmer)
 */
router.delete('/farms/:farmId', requireFarmOwnership, async (req, res) => {
  try {
    const farmId = req.params.farmId;

    // Check if farm has active flocks
    const activeFlocks = await prisma.flock.count({
      where: {
        farmId,
        status: 'ACTIVE'
      }
    });

    if (activeFlocks > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete farm with active flocks',
        code: 'FARM_HAS_ACTIVE_FLOCKS'
      });
    }

    // Soft delete - mark as inactive
    await prisma.farm.update({
      where: { id: farmId },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'Farm deleted successfully'
    });
  } catch (error) {
    console.error('Delete farm error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting farm',
      code: 'DELETE_FARM_ERROR'
    });
  }
});

/**
 * @route   GET /api/farmer/farms/:farmId/flocks
 * @desc    Get flocks for a specific farm
 * @access  Private (Farmer)
 */
router.get('/farms/:farmId/flocks', requireFarmOwnership, async (req, res) => {
  try {
    const farmId = req.params.farmId;
    const { page = 1, limit = 10, status, search } = req.query;

    const skip = (page - 1) * limit;
    const where = {
      farmId,
      ...(status && { status }),
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
    console.error('Get flocks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching flocks',
      code: 'GET_FLOCKS_ERROR'
    });
  }
});

/**
 * @route   POST /api/farmer/flocks
 * @desc    Create a new flock
 * @access  Private (Farmer)
 */
router.post('/flocks', [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Flock name must be between 2 and 100 characters'),
  body('breedId').isUUID().withMessage('Valid breed ID is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('farmId').isUUID().withMessage('Valid farm ID is required')
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

    // Verify farm ownership
    const farm = await prisma.farm.findFirst({
      where: {
        id: req.body.farmId,
        userId: req.user.id
      }
    });

    if (!farm) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this farm',
        code: 'FARM_ACCESS_DENIED'
      });
    }

    const flockData = {
      ...req.body,
      startDate: new Date(req.body.startDate),
      expectedEndDate: req.body.expectedEndDate ? new Date(req.body.expectedEndDate) : null
    };

    const flock = await prisma.flock.create({
      data: flockData,
      include: {
        breed: true,
        farm: {
          select: { name: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Flock created successfully',
      data: flock
    });
  } catch (error) {
    console.error('Create flock error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating flock',
      code: 'CREATE_FLOCK_ERROR'
    });
  }
});

/**
 * @route   GET /api/farmer/flocks/:flockId
 * @desc    Get flock details
 * @access  Private (Farmer)
 */
router.get('/flocks/:flockId', async (req, res) => {
  try {
    const flockId = req.params.flockId;

    const flock = await prisma.flock.findUnique({
      where: { id: flockId },
      include: {
        breed: true,
        farm: {
          select: { name: true, userId: true }
        },
        dailyRecords: {
          include: {
            worker: {
              select: {
                user: { select: { firstName: true, lastName: true } }
              }
            }
          },
          orderBy: { date: 'desc' },
          take: 50
        },
        tasks: {
          include: {
            assignedWorker: {
              select: {
                user: { select: { firstName: true, lastName: true } }
              }
            }
          },
          orderBy: { dueDate: 'asc' }
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

    // Check access
    if (flock.farm.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this flock',
        code: 'FLOCK_ACCESS_DENIED'
      });
    }

    res.json({
      success: true,
      data: flock
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
 * @route   PUT /api/farmer/flocks/:flockId
 * @desc    Update flock
 * @access  Private (Farmer)
 */
router.put('/flocks/:flockId', async (req, res) => {
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

    // Check access
    const flock = await prisma.flock.findUnique({
      where: { id: flockId },
      include: {
        farm: { select: { userId: true } }
      }
    });

    if (!flock) {
      return res.status(404).json({
        success: false,
        message: 'Flock not found',
        code: 'FLOCK_NOT_FOUND'
      });
    }

    if (flock.farm.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this flock',
        code: 'FLOCK_ACCESS_DENIED'
      });
    }

    const updateData = { ...req.body };
    
    if (req.body.startDate) {
      updateData.startDate = new Date(req.body.startDate);
    }
    if (req.body.expectedEndDate) {
      updateData.expectedEndDate = new Date(req.body.expectedEndDate);
    }

    const updatedFlock = await prisma.flock.update({
      where: { id: flockId },
      data: updateData,
      include: {
        breed: true,
        farm: { select: { name: true } }
      }
    });

    res.json({
      success: true,
      message: 'Flock updated successfully',
      data: updatedFlock
    });
  } catch (error) {
    console.error('Update flock error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating flock',
      code: 'UPDATE_FLOCK_ERROR'
    });
  }
});

/**
 * @route   DELETE /api/farmer/flocks/:flockId
 * @desc    Delete flock
 * @access  Private (Farmer)
 */
router.delete('/flocks/:flockId', async (req, res) => {
  try {
    const flockId = req.params.flockId;

    // Check access
    const flock = await prisma.flock.findUnique({
      where: { id: flockId },
      include: {
        farm: { select: { userId: true } }
      }
    });

    if (!flock) {
      return res.status(404).json({
        success: false,
        message: 'Flock not found',
        code: 'FLOCK_NOT_FOUND'
      });
    }

    if (flock.farm.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this flock',
        code: 'FLOCK_ACCESS_DENIED'
      });
    }

    // Check if flock has active tasks
    const activeTasks = await prisma.task.count({
      where: {
        flockId,
        status: { in: ['PENDING', 'IN_PROGRESS'] }
      }
    });

    if (activeTasks > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete flock with active tasks',
        code: 'FLOCK_HAS_ACTIVE_TASKS'
      });
    }

    await prisma.flock.delete({
      where: { id: flockId }
    });

    res.json({
      success: true,
      message: 'Flock deleted successfully'
    });
  } catch (error) {
    console.error('Delete flock error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting flock',
      code: 'DELETE_FLOCK_ERROR'
    });
  }
});

// Export router
module.exports = router;
