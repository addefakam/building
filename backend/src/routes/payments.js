const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use memory storage — upload buffer to cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'));
  },
});

// Helper: upload buffer to cloudinary
const uploadToCloudinary = (buffer, filename) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'shop-management/bank-slips', public_id: filename },
      (err, result) => { if (err) reject(err); else resolve(result); }
    );
    stream.end(buffer);
  });

// POST /api/payments/submit — Tenant submits FT number + slip
router.post('/submit', authenticate, authorize('TENANT'), upload.single('slip'), async (req, res) => {
  const { invoiceId, ftNumber } = req.body;

  // Check duplicate FT number
  const existing = await prisma.payment.findUnique({ where: { ftNumber } });
  if (existing) {
    return res.status(409).json({ error: 'Duplicate FT Number — this transfer reference has already been submitted.' });
  }

  // Get tenant
  const tenant = await prisma.tenant.findUnique({ where: { userId: req.user.id } });
  if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

  // Get invoice and verify ownership
  const invoice = await prisma.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
  if (invoice.tenantId !== tenant.id) return res.status(403).json({ error: 'Forbidden' });
  if (invoice.status !== 'UNPAID') {
    return res.status(400).json({ error: `Invoice is already ${invoice.status}` });
  }

  // Upload slip image
  let slipImageUrl = null;
  let slipPublicId = null;

  if (req.file) {
    try {
      const uploadResult = await uploadToCloudinary(req.file.buffer, `slip-${ftNumber}`);
      slipImageUrl = uploadResult.secure_url;
      slipPublicId = uploadResult.public_id;
    } catch (uploadErr) {
      console.warn('Cloudinary upload failed, storing without image:', uploadErr.message);
      // Still allow submission even if image upload fails (store as null)
    }
  }

  // Create payment and update invoice status in transaction
  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        invoiceId,
        tenantId: tenant.id,
        ftNumber,
        slipImageUrl,
        slipPublicId,
        status: 'PENDING',
      },
    });
    // State machine: UNPAID → PENDING_VERIFICATION
    await tx.invoice.update({
      where: { id: invoiceId },
      data: { status: 'PENDING_VERIFICATION' },
    });
    return payment;
  });

  res.status(201).json(result);
});

// GET /api/payments — list with filters (Manager/Board)
router.get('/', authenticate, authorize('MANAGER', 'BOARD'), async (req, res) => {
  const { status, invoiceId } = req.query;
  const where = {};
  if (status) where.status = status;
  if (invoiceId) where.invoiceId = invoiceId;

  const payments = await prisma.payment.findMany({
    where,
    include: {
      tenant: { select: { fullName: true, email: true } },
      invoice: { include: { shop: { select: { shopNumber: true } } } },
    },
    orderBy: { submittedAt: 'desc' },
  });
  res.json(payments);
});

// POST /api/payments/:id/approve — Manager approves
router.post('/:id/approve', authenticate, authorize('MANAGER'), async (req, res) => {
  const payment = await prisma.payment.findUniqueOrThrow({ where: { id: req.params.id } });

  if (payment.status !== 'PENDING') {
    return res.status(400).json({ error: `Payment is already ${payment.status}` });
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.payment.update({
      where: { id: req.params.id },
      data: { status: 'APPROVED', reviewedById: req.user.id, reviewedAt: new Date() },
    });
    // State machine: PENDING_VERIFICATION → PAID
    await tx.invoice.update({
      where: { id: payment.invoiceId },
      data: { status: 'PAID' },
    });
    return updated;
  });

  res.json(result);
});

// POST /api/payments/:id/reject — Manager rejects
router.post('/:id/reject', authenticate, authorize('MANAGER'), async (req, res) => {
  const { reason } = req.body;
  const payment = await prisma.payment.findUniqueOrThrow({ where: { id: req.params.id } });

  if (payment.status !== 'PENDING') {
    return res.status(400).json({ error: `Payment is already ${payment.status}` });
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.payment.update({
      where: { id: req.params.id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason || 'Rejected by manager',
        reviewedById: req.user.id,
        reviewedAt: new Date(),
      },
    });
    // State machine: PENDING_VERIFICATION → UNPAID (tenant can resubmit)
    await tx.invoice.update({
      where: { id: payment.invoiceId },
      data: { status: 'UNPAID' },
    });
    return updated;
  });

  res.json(result);
});

// GET /api/payments/ledger — Mock bank ledger for reconciliation
router.get('/ledger', authenticate, authorize('MANAGER', 'BOARD'), async (req, res) => {
  const { ftNumber } = req.query;
  const where = ftNumber ? { ftNumber } : {};
  const entries = await prisma.mockBankLedger.findMany({
    where,
    orderBy: { transactionDate: 'desc' },
  });
  res.json(entries);
});

module.exports = router;
