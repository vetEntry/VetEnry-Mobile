const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Middleware to authenticate JWT token
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required',
        code: 'TOKEN_MISSING'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        isVerified: true,
        lastLogin: true,
        farms: {
          select: {
            id: true,
            name: true,
            isActive: true
          }
        },
        workers: {
          select: {
            id: true,
            farmId: true,
            role: true,
            permissions: true,
            isActive: true
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated',
        code: 'USER_DEACTIVATED'
      });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'User account is not verified',
        code: 'USER_NOT_VERIFIED'
      });
    }

    // Add user info to request
    req.user = user;
    req.token = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Middleware to check if user has required role
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const userRole = req.user.role;
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: roles,
        userRole: userRole
      });
    }

    next();
  };
};

/**
 * Middleware to check if user owns the resource (farm)
 */
const requireFarmOwnership = async (req, res, next) => {
  try {
    const farmId = req.params.farmId || req.body.farmId;
    
    if (!farmId) {
      return res.status(400).json({
        success: false,
        message: 'Farm ID is required',
        code: 'FARM_ID_REQUIRED'
      });
    }

    const farm = await prisma.farm.findFirst({
      where: {
        id: farmId,
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

    req.farm = farm;
    next();
  } catch (error) {
    console.error('Farm ownership check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking farm ownership',
      code: 'FARM_OWNERSHIP_ERROR'
    });
  }
};

/**
 * Middleware to check if user is a worker on the farm
 */
const requireFarmWorker = async (req, res, next) => {
  try {
    const farmId = req.params.farmId || req.body.farmId;
    
    if (!farmId) {
      return res.status(400).json({
        success: false,
        message: 'Farm ID is required',
        code: 'FARM_ID_REQUIRED'
      });
    }

    // Check if user is the farm owner
    const farm = await prisma.farm.findFirst({
      where: {
        id: farmId,
        userId: req.user.id
      }
    });

    if (farm) {
      req.farm = farm;
      return next();
    }

    // Check if user is a worker on the farm
    const worker = await prisma.worker.findFirst({
      where: {
        userId: req.user.id,
        farmId: farmId,
        isActive: true
      }
    });

    if (!worker) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this farm',
        code: 'FARM_ACCESS_DENIED'
      });
    }

    req.worker = worker;
    req.farm = { id: farmId };
    next();
  } catch (error) {
    console.error('Farm worker check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking farm access',
      code: 'FARM_ACCESS_ERROR'
    });
  }
};

/**
 * Middleware to check if user has required permissions
 */
const requirePermission = (permissions) => {
  return async (req, res, next) => {
    try {
      // Farm owners have all permissions
      if (req.farm && req.farm.userId === req.user.id) {
        return next();
      }

      // Check worker permissions
      if (req.worker) {
        const workerPermissions = req.worker.permissions || [];
        const hasPermission = permissions.some(permission => 
          workerPermissions.includes(permission)
        );

        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            message: 'Insufficient permissions for this operation',
            code: 'INSUFFICIENT_PERMISSIONS',
            requiredPermissions: permissions,
            workerPermissions: workerPermissions
          });
        }
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking permissions',
        code: 'PERMISSION_CHECK_ERROR'
      });
    }
  };
};

/**
 * Middleware to check if user can access flock
 */
const requireFlockAccess = async (req, res, next) => {
  try {
    const flockId = req.params.flockId || req.body.flockId;
    
    if (!flockId) {
      return res.status(400).json({
        success: false,
        message: 'Flock ID is required',
        code: 'FLOCK_ID_REQUIRED'
      });
    }

    const flock = await prisma.flock.findUnique({
      where: { id: flockId },
      include: {
        farm: true
      }
    });

    if (!flock) {
      return res.status(404).json({
        success: false,
        message: 'Flock not found',
        code: 'FLOCK_NOT_FOUND'
      });
    }

    // Check if user owns the farm
    if (flock.farm.userId === req.user.id) {
      req.flock = flock;
      return next();
    }

    // Check if user is a worker on the farm
    const worker = await prisma.worker.findFirst({
      where: {
        userId: req.user.id,
        farmId: flock.farmId,
        isActive: true
      }
    });

    if (!worker) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this flock',
        code: 'FLOCK_ACCESS_DENIED'
      });
    }

    req.flock = flock;
    req.worker = worker;
    next();
  } catch (error) {
    console.error('Flock access check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking flock access',
      code: 'FLOCK_ACCESS_ERROR'
    });
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  requireFarmOwnership,
  requireFarmWorker,
  requirePermission,
  requireFlockAccess
};
