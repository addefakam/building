const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/expenses
router.get('/', authenticate, authorize('MANAGER', 'BOARD'), async (req, res) => {
  const expenses = await prisma.expense.findMany({
    orderBy: { date: 'desc' },
    include: { user: { select: { email: true } } }
  });
  res.json(expenses);
});

// POST /api/expenses
router.post('/', authenticate, authorize('MANAGER'), async (req, res) => {
  const { description, amount, category, date } = req.body;
  const expense = await prisma.expense.create({
    data: {
      description,
      amount: parseFloat(amount),
      category,
      date: new Date(date),
      recordedBy: req.user.id
    }
  });
  res.status(201).json(expense);
});

module.exports = router;
