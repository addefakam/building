const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function seedBoard() {
  const passwordHash = await bcrypt.hash('Board@123', 10);
  
  await prisma.user.upsert({
    where: { email: 'board@plc.com' },
    update: { passwordHash, role: 'BOARD', fullName: 'Building Board / የቦርድ አባል', isActive: true },
    create: {
      email: 'board@plc.com',
      passwordHash,
      role: 'BOARD',
      fullName: 'Building Board / የቦርድ አባል',
      isActive: true
    }
  });

  console.log('Board user seeded: board@plc.com / Board@123');
  await prisma.$disconnect();
}

seedBoard();
