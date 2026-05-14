require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma = require('./lib/prisma');

async function main() {
  console.log('🌱 Seeding database...');

  // ── Users ──────────────────────────────────────────────
  const boardHash = await bcrypt.hash('Board@123', 10);
  const managerHash = await bcrypt.hash('Manager@123', 10);
  const tenantHash = await bcrypt.hash('Tenant@123', 10);

  const boardUser = await prisma.user.upsert({
    where: { email: 'board@plc.com' },
    update: {},
    create: { email: 'board@plc.com', passwordHash: boardHash, role: 'BOARD' },
  });

  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@plc.com' },
    update: {},
    create: { email: 'manager@plc.com', passwordHash: managerHash, role: 'MANAGER' },
  });

  const tenantUser1 = await prisma.user.upsert({
    where: { email: 'alice@tenant.com' },
    update: {},
    create: { email: 'alice@tenant.com', passwordHash: tenantHash, role: 'TENANT' },
  });

  const tenantUser2 = await prisma.user.upsert({
    where: { email: 'bob@tenant.com' },
    update: {},
    create: { email: 'bob@tenant.com', passwordHash: tenantHash, role: 'TENANT' },
  });

  const tenantUser3 = await prisma.user.upsert({
    where: { email: 'carol@tenant.com' },
    update: {},
    create: { email: 'carol@tenant.com', passwordHash: tenantHash, role: 'TENANT' },
  });

  // ── Shops ──────────────────────────────────────────────
  const shop1 = await prisma.shop.upsert({
    where: { shopNumber: 'G-01' },
    update: {},
    create: { shopNumber: 'G-01', floor: 0, rentAmount: 15000, status: 'OCCUPIED' },
  });

  const shop2 = await prisma.shop.upsert({
    where: { shopNumber: 'G-02' },
    update: {},
    create: { shopNumber: 'G-02', floor: 0, rentAmount: 15000, status: 'OCCUPIED' },
  });

  const shop3 = await prisma.shop.upsert({
    where: { shopNumber: '1F-01' },
    update: {},
    create: { shopNumber: '1F-01', floor: 1, rentAmount: 12000, status: 'OCCUPIED' },
  });

  const shop4 = await prisma.shop.upsert({
    where: { shopNumber: '1F-02' },
    update: {},
    create: { shopNumber: '1F-02', floor: 1, rentAmount: 12000, status: 'VACANT' },
  });

  const shop5 = await prisma.shop.upsert({
    where: { shopNumber: '2F-01' },
    update: {},
    create: { shopNumber: '2F-01', floor: 2, rentAmount: 10000, status: 'MAINTENANCE' },
  });

  // ── Tenants ──────────────────────────────────────────────
  let tenant1 = await prisma.tenant.findUnique({ where: { userId: tenantUser1.id } });
  if (!tenant1) {
    tenant1 = await prisma.tenant.create({
      data: {
        userId: tenantUser1.id, shopId: shop1.id,
        fullName: 'Alice Kebede', phone: '0911000001',
        email: 'alice@tenant.com', leaseStart: new Date('2024-01-01'),
      },
    });
  }

  let tenant2 = await prisma.tenant.findUnique({ where: { userId: tenantUser2.id } });
  if (!tenant2) {
    tenant2 = await prisma.tenant.create({
      data: {
        userId: tenantUser2.id, shopId: shop2.id,
        fullName: 'Bob Tesfaye', phone: '0911000002',
        email: 'bob@tenant.com', leaseStart: new Date('2024-03-01'),
      },
    });
  }

  let tenant3 = await prisma.tenant.findUnique({ where: { userId: tenantUser3.id } });
  if (!tenant3) {
    tenant3 = await prisma.tenant.create({
      data: {
        userId: tenantUser3.id, shopId: shop3.id,
        fullName: 'Carol Haile', phone: '0911000003',
        email: 'carol@tenant.com', leaseStart: new Date('2024-06-01'),
      },
    });
  }

  // ── Utility Readings ──────────────────────────────────────────────
  const now = new Date();
  const cm = now.getMonth() + 1;
  const cy = now.getFullYear();

  const reading1 = await prisma.utilityReading.upsert({
    where: { shopId_billingMonth_billingYear: { shopId: shop1.id, billingMonth: cm, billingYear: cy } },
    update: {},
    create: {
      shopId: shop1.id, recordedById: managerUser.id,
      billingMonth: cm, billingYear: cy,
      electricPrev: 1200, electricCurr: 1350, electricRate: 1.5,
      waterPrev: 300, waterCurr: 340, waterRate: 0.8,
    },
  });

  const reading2 = await prisma.utilityReading.upsert({
    where: { shopId_billingMonth_billingYear: { shopId: shop2.id, billingMonth: cm, billingYear: cy } },
    update: {},
    create: {
      shopId: shop2.id, recordedById: managerUser.id,
      billingMonth: cm, billingYear: cy,
      electricPrev: 800, electricCurr: 920, electricRate: 1.5,
      waterPrev: 200, waterCurr: 225, waterRate: 0.8,
    },
  });

  const reading3 = await prisma.utilityReading.upsert({
    where: { shopId_billingMonth_billingYear: { shopId: shop3.id, billingMonth: cm, billingYear: cy } },
    update: {},
    create: {
      shopId: shop3.id, recordedById: managerUser.id,
      billingMonth: cm, billingYear: cy,
      electricPrev: 600, electricCurr: 680, electricRate: 1.5,
      waterPrev: 150, waterCurr: 170, waterRate: 0.8,
    },
  });

  // ── Invoices ──────────────────────────────────────────────
  const calcInvoice = (shop, reading) => {
    const electricCharge = (Number(reading.electricCurr) - Number(reading.electricPrev)) * Number(reading.electricRate);
    const waterCharge = (Number(reading.waterCurr) - Number(reading.waterPrev)) * Number(reading.waterRate);
    const totalAmount = Number(shop.rentAmount) + electricCharge + waterCharge;
    return { electricCharge, waterCharge, totalAmount };
  };

  const dueDate = new Date(cy, cm, 15);

  let invoice1 = await prisma.invoice.findFirst({ where: { tenantId: tenant1.id, billingMonth: cm, billingYear: cy } });
  if (!invoice1) {
    const calc = calcInvoice(shop1, reading1);
    invoice1 = await prisma.invoice.create({
      data: {
        tenantId: tenant1.id, shopId: shop1.id, utilityReadingId: reading1.id,
        billingMonth: cm, billingYear: cy,
        rentAmount: Number(shop1.rentAmount),
        ...calc,
        status: 'UNPAID', dueDate,
      },
    });
  }

  let invoice2 = await prisma.invoice.findFirst({ where: { tenantId: tenant2.id, billingMonth: cm, billingYear: cy } });
  if (!invoice2) {
    const calc = calcInvoice(shop2, reading2);
    invoice2 = await prisma.invoice.create({
      data: {
        tenantId: tenant2.id, shopId: shop2.id, utilityReadingId: reading2.id,
        billingMonth: cm, billingYear: cy,
        rentAmount: Number(shop2.rentAmount),
        ...calc,
        status: 'PENDING_VERIFICATION', dueDate,
      },
    });
  }

  let invoice3 = await prisma.invoice.findFirst({ where: { tenantId: tenant3.id, billingMonth: cm, billingYear: cy } });
  if (!invoice3) {
    const calc = calcInvoice(shop3, reading3);
    invoice3 = await prisma.invoice.create({
      data: {
        tenantId: tenant3.id, shopId: shop3.id, utilityReadingId: reading3.id,
        billingMonth: cm, billingYear: cy,
        rentAmount: Number(shop3.rentAmount),
        ...calc,
        status: 'PAID', dueDate,
      },
    });
  }

  // ── Payments ──────────────────────────────────────────────
  // Bob has a pending payment
  const pendingPayment = await prisma.payment.findUnique({ where: { ftNumber: 'FT-2024-BOB-001' } });
  if (!pendingPayment) {
    await prisma.payment.create({
      data: {
        invoiceId: invoice2.id, tenantId: tenant2.id,
        ftNumber: 'FT-2024-BOB-001',
        slipImageUrl: null,
        status: 'PENDING',
      },
    });
  }

  // Carol has an approved payment
  const approvedPayment = await prisma.payment.findUnique({ where: { ftNumber: 'FT-2024-CAR-001' } });
  if (!approvedPayment) {
    await prisma.payment.create({
      data: {
        invoiceId: invoice3.id, tenantId: tenant3.id,
        ftNumber: 'FT-2024-CAR-001',
        slipImageUrl: null,
        status: 'APPROVED',
        reviewedById: managerUser.id,
        reviewedAt: new Date(),
      },
    });
  }

  // ── Mock Bank Ledger ──────────────────────────────────────────────
  const ledgerEntries = [
    { ftNumber: 'FT-2024-BOB-001', amount: 15450, description: 'Shop G-02 Rent+Utilities May 2025', transactionDate: new Date('2025-05-10') },
    { ftNumber: 'FT-2024-CAR-001', amount: 12256, description: 'Shop 1F-01 Rent+Utilities May 2025', transactionDate: new Date('2025-05-08') },
    { ftNumber: 'FT-2024-DEMO-001', amount: 5000, description: 'Partial deposit test', transactionDate: new Date('2025-05-01') },
    { ftNumber: 'FT-2024-DEMO-002', amount: 18000, description: 'Advance payment', transactionDate: new Date('2025-04-30') },
  ];

  for (const entry of ledgerEntries) {
    await prisma.mockBankLedger.upsert({
      where: { ftNumber: entry.ftNumber },
      update: {},
      create: entry,
    });
  }

  console.log('✅ Seed complete!');
  console.log('\n📋 Demo Credentials:');
  console.log('  Board   → board@plc.com   / Board@123');
  console.log('  Manager → manager@plc.com / Manager@123');
  console.log('  Tenant1 → alice@tenant.com  / Tenant@123  (Invoice: UNPAID)');
  console.log('  Tenant2 → bob@tenant.com    / Tenant@123  (Invoice: PENDING_VERIFICATION)');
  console.log('  Tenant3 → carol@tenant.com  / Tenant@123  (Invoice: PAID)');
}

main().catch(console.error).finally(() => prisma.$disconnect());
