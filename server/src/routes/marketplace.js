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
 * @route   GET /api/marketplace/products
 * @desc    Get marketplace products
 * @access  Public
 */
router.get('/products', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      category, 
      condition, 
      search, 
      minPrice, 
      maxPrice,
      sellerId,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    const where = {
      status: 'ACTIVE',
      ...(category && category !== 'all' && { category: category.toUpperCase() }),
      ...(condition && condition !== 'all' && { condition: condition.toUpperCase() }),
      ...(sellerId && { sellerId }),
      ...(minPrice && { price: { gte: parseFloat(minPrice) } }),
      ...(maxPrice && { price: { lte: parseFloat(maxPrice) } }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { category: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    // Validate sort parameters
    const validSortFields = ['title', 'price', 'createdAt', 'rating'];
    const validSortOrders = ['asc', 'desc'];
    
    if (!validSortFields.includes(sortBy)) sortBy = 'createdAt';
    if (!validSortOrders.includes(sortOrder)) sortOrder = 'desc';

    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    const [products, total] = await Promise.all([
      prisma.marketplaceProduct.findMany({
        where,
        include: {
          seller: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
              rating: true
            }
          },
          images: true,
          _count: {
            select: {
              reviews: true
            }
          }
        },
        orderBy,
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.marketplaceProduct.count({ where })
    ]);

    // Calculate average rating for each product
    const productsWithRating = await Promise.all(
      products.map(async (product) => {
        const reviews = await prisma.review.findMany({
          where: { productId: product.id },
          select: { rating: true }
        });

        const averageRating = reviews.length > 0
          ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
          : 0;

        return {
          ...product,
          averageRating: Math.round(averageRating * 10) / 10,
          reviewCount: product._count.reviews
        };
      })
    );

    res.json({
      success: true,
      data: {
        products: productsWithRating,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get marketplace products error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      code: 'GET_MARKETPLACE_PRODUCTS_ERROR'
    });
  }
});

/**
 * @route   GET /api/marketplace/products/:productId
 * @desc    Get product details
 * @access  Public
 */
router.get('/products/:productId', async (req, res) => {
  try {
    const productId = req.params.productId;

    const product = await prisma.marketplaceProduct.findUnique({
      where: { id: productId },
      include: {
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            rating: true,
            phone: true,
            email: true
          }
        },
        images: true,
        reviews: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                profileImage: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: {
            reviews: true,
            orders: true
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        code: 'PRODUCT_NOT_FOUND'
      });
    }

    // Calculate average rating
    const averageRating = product.reviews.length > 0
      ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
      : 0;

    // Get related products
    const relatedProducts = await prisma.marketplaceProduct.findMany({
      where: {
        category: product.category,
        id: { not: productId },
        status: 'ACTIVE'
      },
      include: {
        seller: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        images: true
      },
      take: 4
    });

    res.json({
      success: true,
      data: {
        ...product,
        averageRating: Math.round(averageRating * 10) / 10,
        relatedProducts
      }
    });
  } catch (error) {
    console.error('Get product details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product details',
      code: 'GET_PRODUCT_DETAILS_ERROR'
    });
  }
});

/**
 * @route   POST /api/marketplace/products
 * @desc    Create a new product listing
 * @access  Private (Authenticated users)
 */
router.post('/products', [
  requireRole(['FARMER', 'WORKER']),
  body('title').trim().isLength({ min: 5, max: 100 }).withMessage('Title must be between 5 and 100 characters'),
  body('description').trim().isLength({ min: 20, max: 1000 }).withMessage('Description must be between 20 and 1000 characters'),
  body('category').isIn(['FEED', 'EQUIPMENT', 'LIVESTOCK', 'EGGS', 'MEAT', 'OTHER']).withMessage('Valid category is required'),
  body('condition').isIn(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR']).withMessage('Valid condition is required'),
  body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('location').trim().isLength({ min: 5, max: 200 }).withMessage('Location must be between 5 and 200 characters'),
  body('images').optional().isArray().withMessage('Images must be an array')
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

    const {
      title,
      description,
      category,
      condition,
      price,
      quantity,
      location,
      images
    } = req.body;

    const sellerId = req.user.id;

    // Create product
    const product = await prisma.marketplaceProduct.create({
      data: {
        title,
        description,
        category: category.toUpperCase(),
        condition: condition.toUpperCase(),
        price: parseFloat(price),
        quantity: parseInt(quantity),
        location,
        sellerId,
        status: 'ACTIVE'
      }
    });

    // Add images if provided
    if (images && images.length > 0) {
      await Promise.all(
        images.map(imageUrl =>
          prisma.productImage.create({
            data: {
              productId: product.id,
              url: imageUrl
            }
          })
        )
      );
    }

    // Get created product with images
    const createdProduct = await prisma.marketplaceProduct.findUnique({
      where: { id: product.id },
      include: {
        images: true,
        seller: {
          select: {
            firstName: true,
            lastName: true,
            profileImage: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: createdProduct
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating product',
      code: 'CREATE_PRODUCT_ERROR'
    });
  }
});

/**
 * @route   PUT /api/marketplace/products/:productId
 * @desc    Update product listing
 * @access  Private (Product owner)
 */
router.put('/products/:productId', [
  requireRole(['FARMER', 'WORKER']),
  body('title').optional().trim().isLength({ min: 5, max: 100 }).withMessage('Title must be between 5 and 100 characters'),
  body('description').optional().trim().isLength({ min: 20, max: 1000 }).withMessage('Description must be between 20 and 1000 characters'),
  body('category').optional().isIn(['FEED', 'EQUIPMENT', 'LIVESTOCK', 'EGGS', 'MEAT', 'OTHER']).withMessage('Valid category is required'),
  body('condition').optional().isIn(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR']).withMessage('Valid condition is required'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Valid price is required'),
  body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('location').optional().trim().isLength({ min: 5, max: 200 }).withMessage('Location must be between 5 and 200 characters'),
  body('status').optional().isIn(['ACTIVE', 'INACTIVE', 'SOLD']).withMessage('Valid status is required')
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

    const productId = req.params.productId;
    const sellerId = req.user.id;
    const updateData = req.body;

    // Check if product exists and belongs to user
    const existingProduct = await prisma.marketplaceProduct.findFirst({
      where: {
        id: productId,
        sellerId
      }
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or not owned by you',
        code: 'PRODUCT_NOT_FOUND'
      });
    }

    // Update product
    const updatedProduct = await prisma.marketplaceProduct.update({
      where: { id: productId },
      data: updateData,
      include: {
        images: true,
        seller: {
          select: {
            firstName: true,
            lastName: true,
            profileImage: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product',
      code: 'UPDATE_PRODUCT_ERROR'
    });
  }
});

/**
 * @route   DELETE /api/marketplace/products/:productId
 * @desc    Delete product listing
 * @access  Private (Product owner)
 */
router.delete('/products/:productId', requireRole(['FARMER', 'WORKER']), async (req, res) => {
  try {
    const productId = req.params.productId;
    const sellerId = req.user.id;

    // Check if product exists and belongs to user
    const product = await prisma.marketplaceProduct.findFirst({
      where: {
        id: productId,
        sellerId
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or not owned by you',
        code: 'PRODUCT_NOT_FOUND'
      });
    }

    // Check if product has active orders
    const activeOrders = await prisma.order.findFirst({
      where: {
        productId,
        status: { in: ['PENDING', 'CONFIRMED', 'SHIPPED'] }
      }
    });

    if (activeOrders) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete product with active orders',
        code: 'PRODUCT_HAS_ORDERS'
      });
    }

    // Soft delete product
    await prisma.marketplaceProduct.update({
      where: { id: productId },
      data: { status: 'DELETED' }
    });

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      code: 'DELETE_PRODUCT_ERROR'
    });
  }
});

/**
 * @route   POST /api/marketplace/products/:productId/reviews
 * @desc    Add product review
 * @access  Private (Authenticated users)
 */
router.post('/products/:productId/reviews', [
  requireRole(['FARMER', 'WORKER']),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').trim().isLength({ min: 10, max: 500 }).withMessage('Comment must be between 10 and 500 characters')
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

    const productId = req.params.productId;
    const userId = req.user.id;
    const { rating, comment } = req.body;

    // Check if product exists
    const product = await prisma.marketplaceProduct.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        code: 'PRODUCT_NOT_FOUND'
      });
    }

    // Check if user has already reviewed this product
    const existingReview = await prisma.review.findFirst({
      where: {
        productId,
        userId
      }
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product',
        code: 'REVIEW_ALREADY_EXISTS'
      });
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        productId,
        userId,
        rating: parseInt(rating),
        comment
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            profileImage: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: review
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding review',
      code: 'ADD_REVIEW_ERROR'
    });
  }
});

/**
 * @route   POST /api/marketplace/orders
 * @desc    Create a new order
 * @access  Private (Authenticated users)
 */
router.post('/orders', [
  requireRole(['FARMER', 'WORKER']),
  body('productId').isUUID().withMessage('Valid product ID is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('shippingAddress').trim().isLength({ min: 10, max: 500 }).withMessage('Shipping address must be between 10 and 500 characters'),
  body('contactPhone').isMobilePhone().withMessage('Valid phone number is required'),
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

    const {
      productId,
      quantity,
      shippingAddress,
      contactPhone,
      notes
    } = req.body;

    const buyerId = req.user.id;

    // Check if product exists and is available
    const product = await prisma.marketplaceProduct.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        code: 'PRODUCT_NOT_FOUND'
      });
    }

    if (product.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: 'Product is not available for purchase',
        code: 'PRODUCT_NOT_AVAILABLE'
      });
    }

    if (product.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Requested quantity exceeds available stock',
        code: 'INSUFFICIENT_STOCK'
      });
    }

    // Check if user is trying to buy their own product
    if (product.sellerId === buyerId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot buy your own product',
        code: 'CANNOT_BUY_OWN_PRODUCT'
      });
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        productId,
        buyerId,
        sellerId: product.sellerId,
        quantity: parseInt(quantity),
        totalAmount: product.price * quantity,
        shippingAddress,
        contactPhone,
        notes,
        status: 'PENDING'
      },
      include: {
        product: {
          select: {
            title: true,
            price: true,
            images: true
          }
        },
        buyer: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        seller: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Update product quantity
    await prisma.marketplaceProduct.update({
      where: { id: productId },
      data: {
        quantity: product.quantity - quantity
      }
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      code: 'CREATE_ORDER_ERROR'
    });
  }
});

/**
 * @route   GET /api/marketplace/orders
 * @desc    Get user orders
 * @access  Private (Authenticated users)
 */
router.get('/orders', requireRole(['FARMER', 'WORKER']), async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status, role = 'buyer' } = req.query;

    const skip = (page - 1) * limit;
    const where = role === 'seller' 
      ? { sellerId: userId }
      : { buyerId: userId };

    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          product: {
            select: {
              title: true,
              price: true,
              images: true
            }
          },
          buyer: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          seller: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.order.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      code: 'GET_ORDERS_ERROR'
    });
  }
});

/**
 * @route   PUT /api/marketplace/orders/:orderId/status
 * @desc    Update order status
 * @access  Private (Order participants)
 */
router.put('/orders/:orderId/status', [
  requireRole(['FARMER', 'WORKER']),
  body('status').isIn(['CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']).withMessage('Valid status is required'),
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

    const orderId = req.params.orderId;
    const userId = req.user.id;
    const { status, notes } = req.body;

    // Check if order exists and user is participant
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        OR: [
          { buyerId: userId },
          { sellerId: userId }
        ]
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or not accessible',
        code: 'ORDER_NOT_FOUND'
      });
    }

    // Validate status transitions
    const validTransitions = {
      'PENDING': ['CONFIRMED', 'CANCELLED'],
      'CONFIRMED': ['SHIPPED', 'CANCELLED'],
      'SHIPPED': ['DELIVERED'],
      'DELIVERED': [],
      'CANCELLED': []
    };

    if (!validTransitions[order.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${order.status} to ${status}`,
        code: 'INVALID_STATUS_TRANSITION'
      });
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        notes: notes || order.notes,
        ...(status === 'SHIPPED' && { shippedAt: new Date() }),
        ...(status === 'DELIVERED' && { deliveredAt: new Date() })
      },
      include: {
        product: {
          select: {
            title: true,
            price: true
          }
        },
        buyer: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        seller: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: updatedOrder
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order status',
      code: 'UPDATE_ORDER_STATUS_ERROR'
    });
  }
});

/**
 * @route   GET /api/marketplace/categories
 * @desc    Get product categories
 * @access  Public
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = [
      { id: 'FEED', name: 'Feed', description: 'Animal feed and supplements' },
      { id: 'EQUIPMENT', name: 'Equipment', description: 'Farming tools and machinery' },
      { id: 'LIVESTOCK', name: 'Livestock', description: 'Live animals for sale' },
      { id: 'EGGS', name: 'Eggs', description: 'Fresh farm eggs' },
      { id: 'MEAT', name: 'Meat', description: 'Processed meat products' },
      { id: 'OTHER', name: 'Other', description: 'Miscellaneous farm products' }
    ];

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      code: 'GET_CATEGORIES_ERROR'
    });
  }
});

module.exports = router;
