const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log("Users:", users);
  const merchants = await prisma.merchant.findMany();
  console.log("Merchants:", merchants);
}
main().finally(() => prisma.$disconnect());
