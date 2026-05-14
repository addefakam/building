const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// POST /api/invoices/generate — Generate invoice from utility reading
router.post('/generate', authenticate, authorize('MANAGER'), async (req, res) => {
  const { utilityReadingId, tenantId, shopId, billingMonth, billingYear } = req.body;

  // Get the utility reading
  const reading = await prisma.utilityReading.findUniqueOrThrow({
    where: { id: utilityReadingId },
  });

  // Get tenant's shop rent and lease details
  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });
  const shop = await prisma.shop.findUniqueOrThrow({ where: { id: shopId } });

  // 1. Utility calculations
  const electricCharge = (reading.electricCurr - reading.electricPrev) * reading.electricRate;
  const waterCharge = (reading.waterCurr - reading.waterPrev) * reading.waterRate;

  // 2. Rent calculation based on agreement duration
  let rentAmount = 0;
  const currentBillingDate = new Date(billingYear, billingMonth - 1, 1);
  const leaseStart = new Date(tenant.leaseStart);
  let leaseEnd = tenant.leaseEnd ? new Date(tenant.leaseEnd) : new Date(8640000000000000); // Max date if no end
  
  if (currentBillingDate >= new Date(leaseStart.getFullYear(), leaseStart.getMonth(), 1) && 
      currentBillingDate <= new Date(leaseEnd.getFullYear(), leaseEnd.getMonth(), 1)) {
    rentAmount = parseFloat(shop.rentAmount);
  }

  // 3. Backlog payments calculation
  const unpaidInvoices = await prisma.invoice.findMany({
    where: {
      tenantId,
      status: 'UNPAID',
    }
  });

  let previousBalance = 0;
  for (const inv of unpaidInvoices) {
    const invLateFee = calculateLateFee(inv);
    previousBalance += parseFloat(inv.totalAmount) + invLateFee;
    
    // Mark previous invoice as rolled over to prevent double counting
    await prisma.invoice.update({
      where: { id: inv.id },
      data: { status: 'ROLLED_OVER' }
    });
  }

  const totalAmount = rentAmount + electricCharge + waterCharge + previousBalance;

  // Due date: 5th of that month
  const dueDate = new Date(billingYear, billingMonth - 1, 5); 

  const invoice = await prisma.invoice.create({
    data: {
      tenantId,
      shopId,
      utilityReadingId,
      billingMonth: parseInt(billingMonth),
      billingYear: parseInt(billingYear),
      rentAmount: rentAmount,
      electricCharge,
      waterCharge,
      serviceCharge: 0.00,
      previousBalance,
      totalAmount,
      status: 'UNPAID',
      dueDate,
    },
    include: { tenant: true, shop: true, utilityReading: true },
  });

  // Create initial notification
  await prisma.notification.create({
    data: {
      userId: tenant.userId,
      title: 'New Invoice / አዲስ መጠየቂያ',
      message: `Invoice for ${billingMonth}/${billingYear} is ready. Due by the 5th. / ክፍያ እስከ 5ኛው ቀን ድረስ ይፈጸሙ።`,
      type: 'PAYMENT_DUE'
    }
  });

  res.status(201).json(invoice);
});

// Helper: Calculate late fee dynamically
function calculateLateFee(invoice) {
  if (invoice.status === 'PAID') return 0;
  const today = new Date();
  const due = new Date(invoice.dueDate);
  if (today <= due) return 0;

  const diffTime = Math.abs(today - due);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  
  // Late Service Charge (20 ETB) + 5% per day penalty
  const dailyPenalty = parseFloat(invoice.totalAmount) * 0.05 * diffDays;
  const lateServiceCharge = 20.00;

  return dailyPenalty + lateServiceCharge;
}

// GET /api/invoices — list with filters
router.get('/', authenticate, async (req, res) => {
  const { status, month, year, tenantId } = req.query;
  const where = {};

  // Tenants can only see their own invoices
  if (req.user.role === 'TENANT') {
    const myTenant = await prisma.tenant.findUnique({ where: { userId: req.user.id } });
    if (!myTenant) return res.status(404).json({ error: 'Tenant not found' });
    where.tenantId = myTenant.id;
  } else {
    if (tenantId) where.tenantId = tenantId;
  }

  if (status) where.status = status;
  if (month) where.billingMonth = parseInt(month);
  if (year) where.billingYear = parseInt(year);

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      tenant: { select: { fullName: true, email: true } },
      shop: { select: { shopNumber: true, floor: true } },
      payments: { orderBy: { submittedAt: 'desc' }, take: 1 },
    },
    orderBy: [{ billingYear: 'desc' }, { billingMonth: 'desc' }],
  });

  // Inject dynamic penalty
  const enrichedInvoices = invoices.map(inv => ({
    ...inv,
    currentLateFee: calculateLateFee(inv)
  }));

  res.json(enrichedInvoices);
});

// GET /api/invoices/:id
router.get('/:id', authenticate, async (req, res) => {
  const invoice = await prisma.invoice.findUniqueOrThrow({
    where: { id: req.params.id },
    include: {
      tenant: true,
      shop: true,
      utilityReading: true,
      payments: { orderBy: { submittedAt: 'desc' } },
    },
  });

  // Tenants can only see their own
  if (req.user.role === 'TENANT') {
    const myTenant = await prisma.tenant.findUnique({ where: { userId: req.user.id } });
    if (!myTenant || invoice.tenantId !== myTenant.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  }

  res.json(invoice);
});

module.exports = router;
