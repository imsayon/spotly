const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const outlets = await prisma.outlet.findMany({
    where: { merchantId: '2388273d-0102-4906-b337-962fe124e1a9' },
    include: { menuCategories: { include: { items: true } } }
  });
  console.log(JSON.stringify(outlets, null, 2));
}
main().finally(() => prisma.$disconnect());
