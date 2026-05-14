const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/resources
router.get('/', authenticate, authorize('MANAGER', 'BOARD'), async (req, res) => {
  const resources = await prisma.resource.findMany({
    orderBy: { name: 'asc' }
  });
  res.json(resources);
});

// POST /api/resources
router.post('/', authenticate, authorize('MANAGER'), async (req, res) => {
  const { name, quantity, category, condition, location, purchaseDate } = req.body;
  const resource = await prisma.resource.create({
    data: {
      name,
      quantity: parseInt(quantity),
      category,
      condition,
      location,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null
    }
  });
  res.status(201).json(resource);
});

// PATCH /api/resources/:id
router.patch('/:id', authenticate, authorize('MANAGER'), async (req, res) => {
  const { quantity, condition, location, lastMaintained } = req.body;
  const resource = await prisma.resource.update({
    where: { id: req.params.id },
    data: {
      ...(quantity !== undefined && { quantity: parseInt(quantity) }),
      ...(condition && { condition }),
      ...(location && { location }),
      ...(lastMaintained && { lastMaintained: new Date(lastMaintained) })
    }
  });
  res.json(resource);
});

module.exports = router;
