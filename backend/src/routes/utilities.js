const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// POST /api/utilities/readings — Manager enters meter readings
router.post('/readings', authenticate, authorize('MANAGER'), async (req, res) => {
  const {
    shopId, billingMonth, billingYear,
    electricPrev, electricCurr, electricRate,
    waterPrev, waterCurr, waterRate,
  } = req.body;

  const reading = await prisma.utilityReading.create({
    data: {
      shopId,
      recordedById: req.user.id,
      billingMonth: parseInt(billingMonth),
      billingYear: parseInt(billingYear),
      electricPrev: parseFloat(electricPrev),
      electricCurr: parseFloat(electricCurr),
      electricRate: parseFloat(electricRate),
      waterPrev: parseFloat(waterPrev),
      waterCurr: parseFloat(waterCurr),
      waterRate: parseFloat(waterRate),
    },
  });

  res.status(201).json(reading);
});

// PATCH /api/utilities/readings/:id
router.patch('/readings/:id', authenticate, authorize('MANAGER'), async (req, res) => {
  const fields = ['electricPrev','electricCurr','electricRate','waterPrev','waterCurr','waterRate'];
  const data = {};
  fields.forEach(f => { if (req.body[f] !== undefined) data[f] = parseFloat(req.body[f]); });

  const reading = await prisma.utilityReading.update({ where: { id: req.params.id }, data });
  res.json(reading);
});

// GET /api/utilities/readings — list by month/year or shopId
router.get('/readings', authenticate, authorize('MANAGER', 'BOARD'), async (req, res) => {
  const { shopId, month, year } = req.query;
  const where = {};
  if (shopId) where.shopId = shopId;
  if (month) where.billingMonth = parseInt(month);
  if (year) where.billingYear = parseInt(year);

  const readings = await prisma.utilityReading.findMany({
    where,
    include: { shop: true },
    orderBy: [{ billingYear: 'desc' }, { billingMonth: 'desc' }],
  });
  res.json(readings);
});

// GET /api/utilities/readings/:shopId — history for one shop
router.get('/readings/:shopId', authenticate, async (req, res) => {
  const readings = await prisma.utilityReading.findMany({
    where: { shopId: req.params.shopId },
    orderBy: [{ billingYear: 'desc' }, { billingMonth: 'desc' }],
  });
  res.json(readings);
});

module.exports = router;
