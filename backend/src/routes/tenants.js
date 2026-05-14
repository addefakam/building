const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

const multer = require('multer');
const cloudinary = require('cloudinary').v2;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const uploadToCloudinary = (buffer, filename) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'shop-management/agreements', public_id: filename },
      (err, result) => { if (err) reject(err); else resolve(result); }
    );
    stream.end(buffer);
  });

// GET /api/tenants
router.get('/', authenticate, authorize('MANAGER', 'BOARD'), async (req, res) => {
  const tenants = await prisma.tenant.findMany({
    include: { user: { select: { email: true, role: true } }, shop: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(tenants);
});

// GET /api/tenants/:id
router.get('/:id', authenticate, async (req, res) => {
  // Tenants can only view their own info
  if (req.user.role === 'TENANT') {
    const myTenant = await prisma.tenant.findUnique({ where: { userId: req.user.id } });
    if (!myTenant || myTenant.id !== req.params.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  }
  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: req.params.id },
    include: { user: { select: { email: true } }, shop: true },
  });
  res.json(tenant);
});

// POST /api/tenants — Create tenant and their user account with agreement
router.post('/', authenticate, authorize('MANAGER'), upload.single('agreement'), async (req, res) => {
  const { fullName, phone, email, shopId, leaseStart, leaseEnd, password } = req.body;

  const passwordHash = await bcrypt.hash(password || 'Tenant@123', 10);

  let agreementUrl = null;
  let agreementPublicId = null;

  if (req.file) {
    try {
      const uploadResult = await uploadToCloudinary(req.file.buffer, `agreement-${email}-${Date.now()}`);
      agreementUrl = uploadResult.secure_url;
      agreementPublicId = uploadResult.public_id;
    } catch (err) {
      console.warn('Agreement upload failed:', err.message);
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    // Create user account
    const user = await tx.user.create({
      data: { email, passwordHash, role: 'TENANT' },
    });
    // Create tenant record
    const tenant = await tx.tenant.create({
      data: {
        userId: user.id,
        shopId,
        fullName,
        phone,
        email,
        leaseStart: new Date(leaseStart),
        leaseEnd: leaseEnd ? new Date(leaseEnd) : null,
        agreementUrl,
        agreementPublicId,
      },
    });
    // Update shop status
    await tx.shop.update({ where: { id: shopId }, data: { status: 'OCCUPIED' } });
    return { user, tenant };
  });

  res.status(201).json(result);
});

// PATCH /api/tenants/:id
router.patch('/:id', authenticate, authorize('MANAGER'), async (req, res) => {
  const { fullName, phone, leaseEnd, isActive } = req.body;
  const tenant = await prisma.tenant.update({
    where: { id: req.params.id },
    data: {
      ...(fullName && { fullName }),
      ...(phone && { phone }),
      ...(leaseEnd && { leaseEnd: new Date(leaseEnd) }),
      ...(isActive !== undefined && { isActive }),
    },
    include: { shop: true }
  });

  // Sync shop status if tenant activity changed
  if (isActive !== undefined && tenant.shop) {
    await prisma.shop.update({
      where: { id: tenant.shopId },
      data: { status: isActive ? 'OCCUPIED' : 'VACANT' }
    });
  }
  res.json(tenant);
});

// GET /api/tenants/:id/invoices
router.get('/:id/invoices', authenticate, async (req, res) => {
  if (req.user.role === 'TENANT') {
    const myTenant = await prisma.tenant.findUnique({ where: { userId: req.user.id } });
    if (!myTenant || myTenant.id !== req.params.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  }
  const invoices = await prisma.invoice.findMany({
    where: { tenantId: req.params.id },
    include: { payments: true, utilityReading: true },
    orderBy: [{ billingYear: 'desc' }, { billingMonth: 'desc' }],
  });
  res.json(invoices);
});

module.exports = router;
