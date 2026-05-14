const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function activateAll() {
  await prisma.user.updateMany({
    data: { isActive: true }
  });
  await prisma.tenant.updateMany({
    data: { isActive: true }
  });
  console.log('All users and tenants have been activated! / ሁሉም ተጠቃሚዎች ገቢር ሆነዋል።');
  await prisma.$disconnect();
}

activateAll();
