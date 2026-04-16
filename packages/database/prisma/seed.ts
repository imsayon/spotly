import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config({ path: './.env' }) // Point to the local .env in packages/database

const prisma = new PrismaClient({ log: ['info'] })

async function main() {
  console.log('🌱 Seeding database...')

  // 1. CLEAR EXISTING DATA
  await prisma.queueEntry.deleteMany({})
  await prisma.review.deleteMany({})
  await prisma.outlet.deleteMany({})
  await prisma.merchant.deleteMany({})
  await prisma.user.deleteMany({})

  // 2. CREATE USERS
  const merchantUser = await prisma.user.create({
    data: {
      id: 'demo-merchant-id',
      name: 'Owner At Spotly',
      role: 'MERCHANT',
    }
  })

  // 3. CREATE MERCHANTS
  const coffeeLab = await prisma.merchant.create({
    data: {
      ownerId: 'demo-merchant-id',
      name: 'The Coffee Lab',
      category: 'Coffee',
      description: 'Artisanal roasters serving the finest beans in Bengaluru.',
      verified: true,
      outlets: {
        create: [
          { name: 'Indiranagar Branch', address: '12th Main, Indiranagar', isActive: true },
          { name: 'Koramangala Branch', address: '80ft Road, Koramangala', isActive: true }
        ]
      }
    }
  })

  const greenClinic = await prisma.merchant.create({
    data: {
      ownerId: 'clinic-owner-id',
      name: 'Green Valley Pharmacy',
      category: 'Health',
      description: 'Prescription pickup and clinical consultations.',
      verified: true,
      outlets: {
        create: [
          { name: 'HSR Layout', address: 'Sector 2, HSR', isActive: true }
        ]
      }
    }
  })

  const artisanBake = await prisma.merchant.create({
    data: {
      ownerId: 'bakery-owner-id',
      name: 'Artisan Bakehouse',
      category: 'Bakery',
      description: 'Freshly baked sourdough and French pastries.',
      verified: true,
      outlets: {
        create: [
          { name: 'Whitefield', address: 'ITPL Main Road', isActive: true },
          { name: 'Jayanagar', address: '4th Block, Jayanagar', isActive: true }
        ]
      }
    }
  })

  const freshMarket = await prisma.merchant.create({
    data: {
      ownerId: 'grocery-owner-id',
      name: 'FreshMart Groceries',
      category: 'Grocery',
      description: 'Organic produce and daily essentials.',
      verified: true,
      outlets: {
        create: [
          { name: 'Electronic City', address: 'Phase 1, E-City', isActive: true }
        ]
      }
    }
  })

  console.log('✅ Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
