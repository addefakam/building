const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/notifications
router.get('/', authenticate, async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    take: 20
  });
  res.json(notifications);
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', authenticate, async (req, res) => {
  await prisma.notification.updateMany({
    where: { id: req.params.id, userId: req.user.id },
    data: { isRead: true }
  });
  res.json({ success: true });
});

// PATCH /api/notifications/read-all
router.patch('/read-all', authenticate, async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, isRead: false },
    data: { isRead: true }
  });
  res.json({ success: true });
});

module.exports = router;
