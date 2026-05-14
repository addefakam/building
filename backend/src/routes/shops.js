const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/shops
router.get('/', authenticate, async (req, res) => {
  const shops = await prisma.shop.findMany({
    include: { tenant: { select: { fullName: true, isActive: true } } },
    orderBy: [{ floor: 'asc' }, { shopNumber: 'asc' }],
  });
  res.json(shops);
});

// GET /api/shops/:id
router.get('/:id', authenticate, async (req, res) => {
  const shop = await prisma.shop.findUniqueOrThrow({
    where: { id: req.params.id },
    include: {
      tenant: true,
      utilityReadings: { orderBy: { createdAt: 'desc' }, take: 12 },
      invoices: { orderBy: { createdAt: 'desc' }, take: 6 },
    },
  });
  res.json(shop);
});

// POST /api/shops
router.post('/', authenticate, authorize('MANAGER', 'BOARD'), async (req, res) => {
  const { shopNumber, floor, rentAmount, status } = req.body;
  const shop = await prisma.shop.create({
    data: { shopNumber, floor: parseInt(floor), rentAmount: parseFloat(rentAmount), status: status || 'VACANT' },
  });
  res.status(201).json(shop);
});

// PATCH /api/shops/:id
router.patch('/:id', authenticate, authorize('MANAGER', 'BOARD'), async (req, res) => {
  const { floor, rentAmount, status } = req.body;
  const shop = await prisma.shop.update({
    where: { id: req.params.id },
    data: {
      ...(floor !== undefined && { floor: parseInt(floor) }),
      ...(rentAmount !== undefined && { rentAmount: parseFloat(rentAmount) }),
      ...(status !== undefined && { status }),
    },
    include: { tenant: true }
  });

  // Sync tenant isActive status if shop status changed
  if (status && shop.tenant) {
    await prisma.tenant.update({
      where: { id: shop.tenant.id },
      data: { isActive: (status === 'OCCUPIED') }
    });
  }
  res.json(shop);
});

module.exports = router;
