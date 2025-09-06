const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

/**
 * Database seeding script for VetEntry AI
 * This script populates the database with initial data for development and testing
 */

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await prisma.notification.deleteMany();
    await prisma.review.deleteMany();
    await prisma.order.deleteMany();
    await prisma.productImage.deleteMany();
    await prisma.marketplaceProduct.deleteMany();
    await prisma.consultation.deleteMany();
    await prisma.healthAlert.deleteMany();
    await prisma.dailyRecord.deleteMany();
    await prisma.task.deleteMany();
    await prisma.worker.deleteMany();
    await prisma.flock.deleteMany();
    await prisma.farm.deleteMany();
    await prisma.breed.deleteMany();
    await prisma.user.deleteMany();

    console.log('✅ Existing data cleared');

    // Create breeds
    console.log('🐔 Creating breeds...');
    const breeds = await Promise.all([
      prisma.breed.create({
        data: {
          name: 'Broiler',
          category: 'BROILER',
          description: 'Fast-growing meat chicken breed',
          characteristics: 'High growth rate, good feed conversion',
          averageWeight: 2.5,
          weightUnit: 'kg',
          maturityAge: 42,
          maturityUnit: 'days'
        }
      }),
      prisma.breed.create({
        data: {
          name: 'Kienyeji',
          category: 'INDIGENOUS',
          description: 'Traditional Kenyan free-range chicken',
          characteristics: 'Disease resistant, good for free-range',
          averageWeight: 1.8,
          weightUnit: 'kg',
          maturityAge: 180,
          maturityUnit: 'days'
        }
      }),
      prisma.breed.create({
        data: {
          name: 'Improved Kienyeji',
          category: 'IMPROVED',
          description: 'Improved version of traditional Kienyeji',
          characteristics: 'Better egg production, disease resistant',
          averageWeight: 2.0,
          weightUnit: 'kg',
          maturityAge: 150,
          maturityUnit: 'days'
        }
      }),
      prisma.breed.create({
        data: {
          name: 'Layers',
          category: 'LAYER',
          description: 'Egg-laying chicken breed',
          characteristics: 'High egg production, good feed efficiency',
          averageWeight: 1.5,
          weightUnit: 'kg',
          maturityAge: 140,
          maturityUnit: 'days'
        }
      })
    ]);

    console.log(`✅ Created ${breeds.length} breeds`);

    // Create users
    console.log('👥 Creating users...');
    const hashedPassword = await bcrypt.hash('password123', 12);

    const users = await Promise.all([
      prisma.user.create({
        data: {
          firstName: 'John',
          lastName: 'Farmer',
          email: 'john.farmer@example.com',
          phone: '+254700000001',
          password: hashedPassword,
          role: 'FARMER',
          isVerified: true,
          isActive: true
        }
      }),
      prisma.user.create({
        data: {
          firstName: 'Jane',
          lastName: 'Worker',
          email: 'jane.worker@example.com',
          phone: '+254700000002',
          password: hashedPassword,
          role: 'WORKER',
          isVerified: true,
          isActive: true
        }
      }),
      prisma.user.create({
        data: {
          firstName: 'Dr. Smith',
          lastName: 'Vet',
          email: 'dr.smith@example.com',
          phone: '+254700000003',
          password: hashedPassword,
          role: 'VET',
          isVerified: true,
          isActive: true
        }
      }),
      prisma.user.create({
        data: {
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@vetentry.com',
          phone: '+254700000000',
          password: hashedPassword,
          role: 'ADMIN',
          isVerified: true,
          isActive: true
        }
      })
    ]);

    console.log(`✅ Created ${users.length} users`);

    // Create farms
    console.log('🏡 Creating farms...');
    const farms = await Promise.all([
      prisma.farm.create({
        data: {
          name: 'Green Valley Farm',
          description: 'A modern poultry farm specializing in broiler production',
          address: '123 Farm Road',
          city: 'Nairobi',
          phone: '+254700000001',
          email: 'info@greenvalleyfarm.com',
          ownerId: users[0].id, // John Farmer
          isPublic: true,
          farmType: 'POULTRY',
          size: 50,
          sizeUnit: 'acres'
        }
      }),
      prisma.farm.create({
        data: {
          name: 'Sunrise Poultry',
          description: 'Family-owned farm focusing on egg production',
          address: '456 Sunrise Lane',
          city: 'Mombasa',
          phone: '+254700000002',
          email: 'contact@sunrisepoultry.com',
          ownerId: users[0].id, // John Farmer
          isPublic: true,
          farmType: 'POULTRY',
          size: 25,
          sizeUnit: 'acres'
        }
      })
    ]);

    console.log(`✅ Created ${farms.length} farms`);

    // Create workers
    console.log('👷 Creating workers...');
    const workers = await Promise.all([
      prisma.worker.create({
        data: {
          userId: users[1].id, // Jane Worker
          farmId: farms[0].id,
          role: 'FARM_MANAGER',
          permissions: ['feeding', 'health', 'weight', 'eggs', 'general'],
          salary: 45000,
          startDate: new Date('2023-01-01'),
          isActive: true
        }
      })
    ]);

    console.log(`✅ Created ${workers.length} workers`);

    // Create flocks
    console.log('🐓 Creating flocks...');
    const flocks = await Promise.all([
      prisma.flock.create({
        data: {
          name: 'Broiler Batch 001',
          farmId: farms[0].id,
          breedId: breeds[0].id, // Broiler
          quantity: 1000,
          startDate: new Date('2024-01-01'),
          status: 'ACTIVE',
          health: 'EXCELLENT',
          notes: 'First batch of the year'
        }
      }),
      prisma.flock.create({
        data: {
          name: 'Layer Flock A',
          farmId: farms[1].id,
          breedId: breeds[3].id, // Layers
          quantity: 500,
          startDate: new Date('2023-06-01'),
          status: 'ACTIVE',
          health: 'GOOD',
          notes: 'Main egg production flock'
        }
      }),
      prisma.flock.create({
        data: {
          name: 'Kienyeji Free Range',
          farmId: farms[0].id,
          breedId: breeds[1].id, // Kienyeji
          quantity: 200,
          startDate: new Date('2023-12-01'),
          status: 'ACTIVE',
          health: 'EXCELLENT',
          notes: 'Free-range traditional chickens'
        }
      })
    ]);

    console.log(`✅ Created ${flocks.length} flocks`);

    // Create tasks
    console.log('📋 Creating tasks...');
    const tasks = await Promise.all([
      prisma.task.create({
        data: {
          farmId: farms[0].id,
          title: 'Daily Feeding',
          description: 'Feed broiler flock with starter feed',
          category: 'FEEDING',
          priority: 'HIGH',
          status: 'PENDING',
          dueDate: new Date(),
          assignedTo: workers[0].id,
          flockId: flocks[0].id
        }
      }),
      prisma.task.create({
        data: {
          farmId: farms[0].id,
          title: 'Health Check',
          description: 'Monitor flock health and check for any signs of illness',
          category: 'HEALTH',
          priority: 'MEDIUM',
          status: 'PENDING',
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          assignedTo: workers[0].id,
          flockId: flocks[0].id
        }
      }),
      prisma.task.create({
        data: {
          farmId: farms[1].id,
          title: 'Egg Collection',
          description: 'Collect eggs from layer flock',
          category: 'EGGS',
          priority: 'HIGH',
          status: 'PENDING',
          dueDate: new Date(),
          assignedTo: null, // Unassigned
          flockId: flocks[1].id
        }
      })
    ]);

    console.log(`✅ Created ${tasks.length} tasks`);

    // Create daily records
    console.log('📊 Creating daily records...');
    const dailyRecords = await Promise.all([
      prisma.dailyRecord.create({
        data: {
          flockId: flocks[0].id,
          workerId: workers[0].id,
          type: 'FEED',
          quantity: 50,
          unit: 'kg',
          date: new Date(),
          notes: 'Starter feed for broilers'
        }
      }),
      prisma.dailyRecord.create({
        data: {
          flockId: flocks[1].id,
          workerId: null,
          type: 'EGGS',
          quantity: 450,
          unit: 'pieces',
          date: new Date(),
          notes: 'Daily egg collection'
        }
      }),
      prisma.dailyRecord.create({
        data: {
          flockId: flocks[0].id,
          workerId: workers[0].id,
          type: 'WEIGHT',
          quantity: 0.8,
          unit: 'kg',
          date: new Date(),
          notes: 'Sample weight check - 10 birds'
        }
      })
    ]);

    console.log(`✅ Created ${dailyRecords.length} daily records`);

    // Create marketplace products
    console.log('🛒 Creating marketplace products...');
    const products = await Promise.all([
      prisma.marketplaceProduct.create({
        data: {
          title: 'Fresh Farm Eggs',
          description: 'Fresh eggs from our free-range chickens, collected daily',
          category: 'EGGS',
          condition: 'NEW',
          price: 300,
          quantity: 100,
          location: 'Nairobi, Kenya',
          sellerId: users[0].id,
          status: 'ACTIVE'
        }
      }),
      prisma.marketplaceProduct.create({
        data: {
          title: 'Broiler Feed',
          description: 'High-quality broiler feed for optimal growth',
          category: 'FEED',
          condition: 'NEW',
          price: 2500,
          quantity: 50,
          location: 'Nairobi, Kenya',
          sellerId: users[0].id,
          status: 'ACTIVE'
        }
      }),
      prisma.marketplaceProduct.create({
        data: {
          title: 'Chicken Coop',
          description: 'Well-maintained chicken coop, suitable for 100 birds',
          category: 'EQUIPMENT',
          condition: 'GOOD',
          price: 15000,
          quantity: 1,
          location: 'Mombasa, Kenya',
          sellerId: users[0].id,
          status: 'ACTIVE'
        }
      })
    ]);

    console.log(`✅ Created ${products.length} marketplace products`);

    // Create health alerts
    console.log('🚨 Creating health alerts...');
    const healthAlerts = await Promise.all([
      prisma.healthAlert.create({
        data: {
          flockId: flocks[0].id,
          issue: 'Minor respiratory symptoms',
          description: 'A few birds showing mild respiratory symptoms',
          severity: 'LOW',
          status: 'ACTIVE',
          detectedBy: workers[0].id
        }
      })
    ]);

    console.log(`✅ Created ${healthAlerts.length} health alerts`);

    // Create consultations
    console.log('🏥 Creating consultations...');
    const consultations = await Promise.all([
      prisma.consultation.create({
        data: {
          farmId: farms[0].id,
          flockId: flocks[0].id,
          vetId: users[2].id, // Dr. Smith
          issue: 'Respiratory symptoms in broiler flock',
          severity: 'MEDIUM',
          status: 'PENDING',
          description: 'Several birds showing respiratory symptoms, need veterinary assessment'
        }
      })
    ]);

    console.log(`✅ Created ${consultations.length} consultations`);

    // Create notifications
    console.log('🔔 Creating notifications...');
    const notifications = await Promise.all([
      prisma.notification.create({
        data: {
          userId: users[0].id,
          type: 'TASK_ASSIGNED',
          title: 'New Task Assigned',
          message: 'You have been assigned a new task: Daily Feeding',
          isRead: false
        }
      }),
      prisma.notification.create({
        data: {
          userId: users[1].id,
          type: 'HEALTH_ALERT',
          title: 'Health Alert',
          message: 'Health alert detected in flock: Broiler Batch 001',
          isRead: false
        }
      })
    ]);

    console.log(`✅ Created ${notifications.length} notifications`);

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Users: ${users.length}`);
    console.log(`   Farms: ${farms.length}`);
    console.log(`   Workers: ${workers.length}`);
    console.log(`   Flocks: ${flocks.length}`);
    console.log(`   Tasks: ${tasks.length}`);
    console.log(`   Daily Records: ${dailyRecords.length}`);
    console.log(`   Products: ${products.length}`);
    console.log(`   Health Alerts: ${healthAlerts.length}`);
    console.log(`   Consultations: ${consultations.length}`);
    console.log(`   Notifications: ${notifications.length}`);

    console.log('\n🔑 Default login credentials:');
    console.log('   Email: john.farmer@example.com');
    console.log('   Password: password123');
    console.log('   Role: FARMER');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  main()
    .then(() => {
      console.log('✅ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { main };
