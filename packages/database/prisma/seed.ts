import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const prisma = new PrismaClient({ log: ['info'] });

async function createMerchant(owner: { id: string; name: string; email: string }, merchant: {
  name: string;
  category: string;
  description: string;
  address: string;
  lat: number;
  lng: number;
  outlets: Array<{ name: string; address: string; lat: number; lng: number }>;
}) {
  const user = await prisma.user.create({
    data: {
      id: owner.id,
      name: owner.name,
      email: owner.email,
      role: 'MERCHANT',
      location: merchant.address,
      lat: merchant.lat,
      lng: merchant.lng,
    },
  });

  return prisma.merchant.create({
    data: {
      ownerId: user.id,
      spotId: `SPOT-${owner.id.slice(0, 4).toUpperCase()}`,
      name: merchant.name,
      category: merchant.category,
      description: merchant.description,
      address: merchant.address,
      lat: merchant.lat,
      lng: merchant.lng,
      verified: true,
      outlets: {
        create: merchant.outlets.map((outlet) => ({
          ...outlet,
          isActive: true,
          openTime: '09:00',
          closeTime: '21:00',
        })),
      },
    },
  });
}

async function main() {
  console.log('Seeding Spotly database...');

  await prisma.queueEntry.deleteMany({});
  await prisma.menuItem.deleteMany({});
  await prisma.menuCategory.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.outlet.deleteMany({});
  await prisma.merchant.deleteMany({});
  await prisma.user.deleteMany({});

  await prisma.user.create({
    data: {
      id: 'demo-consumer-id',
      name: 'Demo Consumer',
      email: 'consumer@spotly.local',
      phone: '+919876543210',
      location: 'Indiranagar, Bengaluru',
      lat: 12.9784,
      lng: 77.6408,
      role: 'CONSUMER',
    },
  });

  await createMerchant(
    { id: 'merchant-coffee-lab', name: 'Coffee Lab Owner', email: 'coffee@spotly.local' },
    {
      name: 'The Coffee Lab',
      category: 'Coffee',
      description: 'Artisanal roasters serving the finest beans in Bengaluru.',
      address: 'Indiranagar, Bengaluru',
      lat: 12.9784,
      lng: 77.6408,
      outlets: [
        { name: 'Indiranagar Branch', address: '12th Main, Indiranagar', lat: 12.9784, lng: 77.6408 },
        { name: 'Koramangala Branch', address: '80 Feet Road, Koramangala', lat: 12.9352, lng: 77.6245 },
      ],
    },
  );

  await createMerchant(
    { id: 'merchant-green-valley', name: 'Green Valley Owner', email: 'clinic@spotly.local' },
    {
      name: 'Green Valley Clinic',
      category: 'Health',
      description: 'Fast consultations, prescription pickup, and family health services.',
      address: 'HSR Layout, Bengaluru',
      lat: 12.9121,
      lng: 77.6446,
      outlets: [
        { name: 'HSR Layout Clinic', address: 'Sector 2, HSR Layout', lat: 12.9121, lng: 77.6446 },
      ],
    },
  );

  await createMerchant(
    { id: 'merchant-artisan-bake', name: 'Artisan Bakehouse Owner', email: 'bakery@spotly.local' },
    {
      name: 'Artisan Bakehouse',
      category: 'Bakery',
      description: 'Fresh sourdough, pastries, and cakes baked throughout the day.',
      address: 'Jayanagar, Bengaluru',
      lat: 12.9250,
      lng: 77.5938,
      outlets: [
        { name: 'Jayanagar Bakery', address: '4th Block, Jayanagar', lat: 12.9250, lng: 77.5938 },
        { name: 'Whitefield Counter', address: 'ITPL Main Road, Whitefield', lat: 12.9698, lng: 77.7500 },
      ],
    },
  );

  console.log('Seeding complete.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
