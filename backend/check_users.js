const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBoard() {
  const users = await prisma.user.findMany();
  console.log('Current Users Status:', users.map(u => ({ email: u.email, role: u.role, isActive: u.isActive })));
  await prisma.$disconnect();
}

checkBoard();
