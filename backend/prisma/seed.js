const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seeding...');

  // Hash passwords
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('Admin@123', salt);
  const userPassword = await bcrypt.hash('User@123', salt);
  const ownerPassword = await bcrypt.hash('Owner@123', salt);

  // 1. Create Admins
  console.log('Seeding Users (Admins)...');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@storerating.com' },
    update: {},
    create: {
      name: 'System Administrator Account',
      email: 'admin@storerating.com',
      password: adminPassword,
      address: '100 Admin Headquarters Tower, Tech City',
      role: 'ADMIN'
    }
  });

  // 2. Create Store Owners
  console.log('Seeding Users (Store Owners)...');
  const owner1 = await prisma.user.upsert({
    where: { email: 'john.owner@storerating.com' },
    update: {},
    create: {
      name: 'Johnathan Store Owner Corp',
      email: 'john.owner@storerating.com',
      password: ownerPassword,
      address: '254 Commercial Street, Retail Valley',
      role: 'STORE_OWNER'
    }
  });

  const owner2 = await prisma.user.upsert({
    where: { email: 'sarah.owner@storerating.com' },
    update: {},
    create: {
      name: 'Sarah Elizabeth Proprietor',
      email: 'sarah.owner@storerating.com',
      password: ownerPassword,
      address: '89 Business Avenue, Enterprise City',
      role: 'STORE_OWNER'
    }
  });

  // 3. Create Normal Users
  console.log('Seeding Users (Normal Users)...');
  const user1 = await prisma.user.upsert({
    where: { email: 'alice.user@storerating.com' },
    update: {},
    create: {
      name: 'Alice Victoria Robinson Smith',
      email: 'alice.user@storerating.com',
      password: userPassword,
      address: '12 Residential Parkway, Hometown suburbia',
      role: 'USER'
    }
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'bob.user@storerating.com' },
    update: {},
    create: {
      name: 'Robert Michael Jenkins Cooper',
      email: 'bob.user@storerating.com',
      password: userPassword,
      address: '45 Lakeview Lane, Green Gardens City',
      role: 'USER'
    }
  });

  // 4. Create Stores
  console.log('Seeding Stores...');
  const store1 = await prisma.store.upsert({
    where: { email: 'contact@techmart.com' },
    update: {},
    create: {
      name: 'TechMart Electronics Store',
      email: 'contact@techmart.com',
      address: 'Suite 101, Silicon Galleria Mall, Tech District',
      ownerId: owner1.id
    }
  });

  const store2 = await prisma.store.upsert({
    where: { email: 'info@organicbites.com' },
    update: {},
    create: {
      name: 'Organic Bites Fresh Market',
      email: 'info@organicbites.com',
      address: '400 Eco Plaza, Green Boulevard, Valley View',
      ownerId: owner1.id
    }
  });

  const store3 = await prisma.store.upsert({
    where: { email: 'support@fashionhub.com' },
    update: {},
    create: {
      name: 'Fashion Hub Clothing Outlet',
      email: 'support@fashionhub.com',
      address: 'Floor 1, Grand Retail Plaza, Fashion Hub District',
      ownerId: owner2.id
    }
  });

  // 5. Create Ratings
  console.log('Seeding Ratings...');
  
  // Alice rates TechMart (5 stars)
  await prisma.rating.upsert({
    where: {
      userId_storeId: {
        userId: user1.id,
        storeId: store1.id
      }
    },
    update: {},
    create: {
      userId: user1.id,
      storeId: store1.id,
      rating: 5
    }
  });

  // Alice rates Organic Bites (3 stars)
  await prisma.rating.upsert({
    where: {
      userId_storeId: {
        userId: user1.id,
        storeId: store2.id
      }
    },
    update: {},
    create: {
      userId: user1.id,
      storeId: store2.id,
      rating: 3
    }
  });

  // Bob rates TechMart (4 stars)
  await prisma.rating.upsert({
    where: {
      userId_storeId: {
        userId: user2.id,
        storeId: store1.id
      }
    },
    update: {},
    create: {
      userId: user2.id,
      storeId: store1.id,
      rating: 4
    }
  });

  // Bob rates Fashion Hub (2 stars)
  await prisma.rating.upsert({
    where: {
      userId_storeId: {
        userId: user2.id,
        storeId: store3.id
      }
    },
    update: {},
    create: {
      userId: user2.id,
      storeId: store3.id,
      rating: 2
    }
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
