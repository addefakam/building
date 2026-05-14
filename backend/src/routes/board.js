const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/board/summary — Executive dashboard data
router.get('/summary', authenticate, authorize('BOARD', 'MANAGER'), async (req, res) => {
  const { month, year } = req.query;
  const now = new Date();
  const m = month ? parseInt(month) : now.getMonth() + 1;
  const y = year ? parseInt(year) : now.getFullYear();

  // Occupancy stats
  const [totalShops, occupiedShops, vacantShops, maintenanceShops] = await Promise.all([
    prisma.shop.count(),
    prisma.shop.count({ where: { status: 'OCCUPIED' } }),
    prisma.shop.count({ where: { status: 'VACANT' } }),
    prisma.shop.count({ where: { status: 'MAINTENANCE' } }),
  ]);

  // Monthly invoice stats
  const invoices = await prisma.invoice.findMany({
    where: { billingMonth: m, billingYear: y },
    include: {
      tenant: { select: { fullName: true } },
      shop: { select: { shopNumber: true } },
      payments: { take: 1, orderBy: { submittedAt: 'desc' } },
    },
  });

  const paidInvoices = invoices.filter(i => i.status === 'PAID');
  const unpaidInvoices = invoices.filter(i => i.status === 'UNPAID');
  const pendingInvoices = invoices.filter(i => i.status === 'PENDING_VERIFICATION');

  const totalRevenue = paidInvoices.reduce((sum, i) => sum + parseFloat(i.totalAmount), 0);
  const expectedRevenue = invoices.reduce((sum, i) => sum + parseFloat(i.totalAmount), 0);
  const totalRentRevenue = paidInvoices.reduce((sum, i) => sum + parseFloat(i.rentAmount), 0);
  const totalElectricRevenue = paidInvoices.reduce((sum, i) => sum + parseFloat(i.electricCharge), 0);
  const totalWaterRevenue = paidInvoices.reduce((sum, i) => sum + parseFloat(i.waterCharge), 0);

  // Last 6 months revenue trend
  const trend = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(y, m - 1 - i, 1);
    const tm = d.getMonth() + 1;
    const ty = d.getFullYear();
    const monthInvoices = await prisma.invoice.findMany({
      where: { billingMonth: tm, billingYear: ty, status: 'PAID' },
    });
    trend.push({
      month: tm,
      year: ty,
      label: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
      revenue: monthInvoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount), 0),
      count: monthInvoices.length,
    });
  }

  res.json({
    period: { month: m, year: y },
    occupancy: { total: totalShops, occupied: occupiedShops, vacant: vacantShops, maintenance: maintenanceShops },
    revenue: {
      collected: totalRevenue,
      expected: expectedRevenue,
      outstanding: expectedRevenue - totalRevenue,
      breakdown: { rent: totalRentRevenue, electric: totalElectricRevenue, water: totalWaterRevenue },
    },
    invoices: {
      total: invoices.length,
      paid: paidInvoices.length,
      unpaid: unpaidInvoices.length,
      pendingVerification: pendingInvoices.length,
      details: invoices,
    },
    trend,
  });
});

// GET /api/board/users — Board lists all users in the system
router.get('/users', authenticate, authorize('BOARD'), async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, fullName: true, role: true, profileImageUrl: true, isActive: true, createdAt: true }
  });
  res.json(users);
});

// PATCH /api/board/users/:id/toggle — Board toggles any user status
router.patch('/users/:id/toggle', authenticate, authorize('BOARD'), async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) {
    return res.status(404).json({ error: 'User not found / ተጠቃሚው አልተገኘም' });
  }

  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: { isActive: !user.isActive }
  });

  // If it's a tenant, sync the tenant record too
  if (user.role === 'TENANT') {
    await prisma.tenant.updateMany({
      where: { userId: user.id },
      data: { isActive: updated.isActive }
    });
  }

  res.json(updated);
});

module.exports = router;
