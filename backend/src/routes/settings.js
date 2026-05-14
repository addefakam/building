const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/settings
router.get('/', async (req, res) => {
  const settings = await prisma.systemSetting.findMany();
  const settingsMap = settings.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {});
  res.json(settingsMap);
});

// POST /api/settings
router.post('/', authenticate, authorize('MANAGER'), async (req, res) => {
  const { settings } = req.body; // { key: value }
  
  const updates = Object.entries(settings).map(([key, value]) => 
    prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { id: key, key, value }
    })
  );

  await Promise.all(updates);
  res.json({ message: 'Settings updated / ቅንብሮች ተሻሽለዋል' });
});

module.exports = router;
