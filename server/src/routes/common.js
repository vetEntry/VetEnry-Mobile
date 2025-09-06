const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { 
  requireRole, 
  requireFarmWorker 
} = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @route   GET /api/common/profile
 * @desc    Get user profile
 * @access  Private (Authenticated users)
 */
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        profileImage: true,
        role: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Get additional role-specific data
    let additionalData = {};

    if (user.role === 'FARMER') {
      const farms = await prisma.farm.findMany({
        where: { ownerId: userId },
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          _count: {
            select: {
              flocks: true,
              workers: true
            }
          }
        }
      });
      additionalData = { farms };
    } else if (user.role === 'WORKER') {
      const worker = await prisma.worker.findFirst({
        where: { userId },
        include: {
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
      additionalData = { worker };
    } else if (user.role === 'VET') {
      const consultations = await prisma.consultation.count({
        where: { vetId: userId }
      });
      additionalData = { totalConsultations: consultations };
    }

    res.json({
      success: true,
      data: {
        ...user,
        ...additionalData
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      code: 'GET_PROFILE_ERROR'
    });
  }
});

/**
 * @route   PUT /api/common/profile
 * @desc    Update user profile
 * @access  Private (Authenticated users)
 */
router.put('/profile', [
  body('firstName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
  body('lastName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  body('profileImage').optional().isURL().withMessage('Valid image URL is required')
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
    const updateData = req.body;

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        profileImage: true,
        role: true,
        isVerified: true,
        isActive: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      code: 'UPDATE_PROFILE_ERROR'
    });
  }
});

/**
 * @route   POST /api/common/profile/change-password
 * @desc    Change user password
 * @access  Private (Authenticated users)
 */
router.post('/profile/change-password', [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters long'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Password confirmation does not match password');
    }
    return true;
  })
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
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Verify current password
    const bcrypt = require('bcryptjs');
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
        code: 'INVALID_CURRENT_PASSWORD'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      code: 'CHANGE_PASSWORD_ERROR'
    });
  }
});

/**
 * @route   GET /api/common/notifications
 * @desc    Get user notifications
 * @access  Private (Authenticated users)
 */
router.get('/notifications', async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, type, isRead } = req.query;

    const skip = (page - 1) * limit;
    const where = {
      userId,
      ...(type && type !== 'all' && { type: type.toUpperCase() }),
      ...(isRead !== undefined && { isRead: isRead === 'true' })
    };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.notification.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      code: 'GET_NOTIFICATIONS_ERROR'
    });
  }
});

/**
 * @route   PUT /api/common/notifications/:notificationId/read
 * @desc    Mark notification as read
 * @access  Private (Authenticated users)
 */
router.put('/notifications/:notificationId/read', async (req, res) => {
  try {
    const notificationId = req.params.notificationId;
    const userId = req.user.id;

    // Check if notification exists and belongs to user
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
        code: 'NOTIFICATION_NOT_FOUND'
      });
    }

    // Mark as read
    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: updatedNotification
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read',
      code: 'MARK_NOTIFICATION_READ_ERROR'
    });
  }
});

/**
 * @route   PUT /api/common/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private (Authenticated users)
 */
router.put('/notifications/read-all', async (req, res) => {
  try {
    const userId = req.user.id;

    // Mark all unread notifications as read
    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false
      },
      data: { isRead: true }
    });

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notifications as read',
      code: 'MARK_ALL_NOTIFICATIONS_READ_ERROR'
    });
  }
});

/**
 * @route   GET /api/common/breeds
 * @desc    Get all breeds
 * @access  Public
 */
router.get('/breeds', async (req, res) => {
  try {
    const { category, search } = req.query;

    const where = {
      ...(category && category !== 'all' && { category: category.toUpperCase() }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const breeds = await prisma.breed.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: breeds
    });
  } catch (error) {
    console.error('Get breeds error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching breeds',
      code: 'GET_BREEDS_ERROR'
    });
  }
});

/**
 * @route   GET /api/common/breeds/:breedId
 * @desc    Get breed details
 * @access  Public
 */
router.get('/breeds/:breedId', async (req, res) => {
  try {
    const breedId = req.params.breedId;

    const breed = await prisma.breed.findUnique({
      where: { id: breedId }
    });

    if (!breed) {
      return res.status(404).json({
        success: false,
        message: 'Breed not found',
        code: 'BREED_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: breed
    });
  } catch (error) {
    console.error('Get breed details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching breed details',
      code: 'GET_BREED_DETAILS_ERROR'
    });
  }
});

/**
 * @route   GET /api/common/farms
 * @desc    Get public farm information
 * @access  Public
 */
router.get('/farms', async (req, res) => {
  try {
    const { page = 1, limit = 10, city, search } = req.query;

    const skip = (page - 1) * limit;
    const where = {
      isPublic: true,
      ...(city && { city: { contains: city, mode: 'insensitive' } }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [farms, total] = await Promise.all([
      prisma.farm.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          address: true,
          city: true,
          phone: true,
          email: true,
          _count: {
            select: {
              flocks: true,
              workers: true
            }
          }
        },
        orderBy: { name: 'asc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.farm.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        farms,
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
 * @route   GET /api/common/farms/:farmId
 * @desc    Get public farm details
 * @access  Public
 */
router.get('/farms/:farmId', async (req, res) => {
  try {
    const farmId = req.params.farmId;

    const farm = await prisma.farm.findFirst({
      where: {
        id: farmId,
        isPublic: true
      },
      select: {
        id: true,
        name: true,
        description: true,
        address: true,
        city: true,
        phone: true,
        email: true,
        _count: {
          select: {
            flocks: true,
            workers: true
          }
        }
      }
    });

    if (!farm) {
      return res.status(404).json({
        success: false,
        message: 'Farm not found or not public',
        code: 'FARM_NOT_FOUND'
      });
    }

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
 * @route   GET /api/common/stats
 * @desc    Get public system statistics
 * @access  Public
 */
router.get('/stats', async (req, res) => {
  try {
    const [
      totalFarms,
      totalFlocks,
      totalUsers,
      activeProducts
    ] = await Promise.all([
      prisma.farm.count({ where: { isPublic: true } }),
      prisma.flock.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.marketplaceProduct.count({ where: { status: 'ACTIVE' } })
    ]);

    const stats = {
      totalFarms,
      totalFlocks,
      totalUsers,
      activeProducts
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      code: 'GET_STATS_ERROR'
    });
  }
});

/**
 * @route   POST /api/common/contact
 * @desc    Submit contact form
 * @access  Public
 */
router.post('/contact', [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('subject').trim().isLength({ min: 5, max: 200 }).withMessage('Subject must be between 5 and 200 characters'),
  body('message').trim().isLength({ min: 10, max: 1000 }).withMessage('Message must be between 10 and 1000 characters')
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

    const { name, email, subject, message } = req.body;

    // Create contact message
    const contact = await prisma.contact.create({
      data: {
        name,
        email,
        subject,
        message,
        status: 'PENDING'
      }
    });

    // TODO: Send email notification to admin
    // await sendContactNotification(contact);

    res.status(201).json({
      success: true,
      message: 'Contact message sent successfully',
      data: contact
    });
  } catch (error) {
    console.error('Submit contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending contact message',
      code: 'SUBMIT_CONTACT_ERROR'
    });
  }
});

/**
 * @route   GET /api/common/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      uptime: process.uptime()
    };

    res.json({
      success: true,
      data: healthStatus
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      success: false,
      message: 'Service unhealthy',
      data: {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error.message
      }
    });
  }
});

/**
 * @route   GET /api/common/search
 * @desc    Global search across multiple entities
 * @access  Public
 */
router.get('/search', async (req, res) => {
  try {
    const { q: query, type, limit = 10 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long',
        code: 'INVALID_SEARCH_QUERY'
      });
    }

    const searchQuery = query.trim();
    const results = {};

    // Search farms
    if (!type || type === 'farms') {
      const farms = await prisma.farm.findMany({
        where: {
          isPublic: true,
          OR: [
            { name: { contains: searchQuery, mode: 'insensitive' } },
            { description: { contains: searchQuery, mode: 'insensitive' } },
            { city: { contains: searchQuery, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          name: true,
          city: true,
          _count: {
            select: {
              flocks: true
            }
          }
        },
        take: parseInt(limit)
      });
      results.farms = farms;
    }

    // Search products
    if (!type || type === 'products') {
      const products = await prisma.marketplaceProduct.findMany({
        where: {
          status: 'ACTIVE',
          OR: [
            { title: { contains: searchQuery, mode: 'insensitive' } },
            { description: { contains: searchQuery, mode: 'insensitive' } },
            { category: { contains: searchQuery, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          title: true,
          category: true,
          price: true,
          images: true
        },
        take: parseInt(limit)
      });
      results.products = products;
    }

    // Search breeds
    if (!type || type === 'breeds') {
      const breeds = await prisma.breed.findMany({
        where: {
          OR: [
            { name: { contains: searchQuery, mode: 'insensitive' } },
            { description: { contains: searchQuery, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          name: true,
          category: true
        },
        take: parseInt(limit)
      });
      results.breeds = breeds;
    }

    res.json({
      success: true,
      data: {
        query: searchQuery,
        results,
        totalResults: Object.values(results).reduce((sum, items) => sum + items.length, 0)
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing search',
      code: 'SEARCH_ERROR'
    });
  }
});

module.exports = router;
