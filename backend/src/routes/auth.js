const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticator } = require('otplib');
const QRCode = require('qrcode');
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password || typeof email !== 'string') {
    return res.status(400).json({ error: 'Valid email and password required' });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials / የተሳሳተ መረጃ' });

  // Check if user is active (Manager/Board)
  if (user.isActive === false) {
    return res.status(403).json({ error: 'Account deactivated by Board / አካውንቱ በቦርዱ ታግዷል' });
  }

  // Check if tenant is active
  if (user.role === 'TENANT') {
    const tenant = await prisma.tenant.findUnique({ where: { userId: user.id } });
    if (tenant && tenant.isActive === false) {
      return res.status(403).json({ error: 'Account deactivated by Manager / አካውንቱ በስራ አስኪያጁ ታግዷል' });
    }
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Board and Manager require MFA
  if ((user.role === 'BOARD' || user.role === 'MANAGER') && user.mfaEnabled) {
    // Issue a short-lived pre-auth token for MFA step
    const preToken = jwt.sign(
      { userId: user.id, stage: 'pre-mfa' },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    );
    return res.json({
      requiresMfa: true,
      preToken,
      role: user.role,
    });
  }

  // For tenants or users without MFA enabled yet
  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      mfaEnabled: user.mfaEnabled,
    },
  });
});

// POST /api/auth/mfa/verify — Verify TOTP after login
router.post('/mfa/verify', async (req, res) => {
  const { preToken, totpCode } = req.body;

  if (!preToken || !totpCode) {
    return res.status(400).json({ error: 'preToken and totpCode required' });
  }

  let decoded;
  try {
    decoded = jwt.verify(preToken, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired pre-auth token' });
  }

  if (decoded.stage !== 'pre-mfa') {
    return res.status(401).json({ error: 'Invalid pre-auth token stage' });
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
  if (!user || !user.mfaSecret) {
    return res.status(401).json({ error: 'MFA not configured' });
  }

  const isValid = authenticator.verify({ token: totpCode, secret: user.mfaSecret });
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid TOTP code' });
  }

  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      mfaEnabled: user.mfaEnabled,
    },
  });
});

// POST /api/auth/mfa/setup — Generate MFA secret & QR code
router.post('/mfa/setup', authenticate, async (req, res) => {
  const user = req.user;

  if (user.role !== 'BOARD' && user.role !== 'MANAGER') {
    return res.status(403).json({ error: 'MFA only required for Board and Manager roles' });
  }

  const secret = authenticator.generateSecret();
  const otpAuthUrl = authenticator.keyuri(user.email, 'ShopMgmt', secret);
  const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl);

  // Save secret temporarily (user must verify to enable)
  await prisma.user.update({
    where: { id: user.id },
    data: { mfaSecret: secret },
  });

  res.json({ secret, qrCodeDataUrl, otpAuthUrl });
});

// POST /api/auth/mfa/enable — Confirm and enable MFA
router.post('/mfa/enable', authenticate, async (req, res) => {
  const { totpCode } = req.body;
  const user = req.user;

  if (!user.mfaSecret) {
    return res.status(400).json({ error: 'MFA setup not initiated' });
  }

  const isValid = authenticator.verify({ token: totpCode, secret: user.mfaSecret });
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid TOTP code' });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { mfaEnabled: true },
  });

  res.json({ message: 'MFA enabled successfully' });
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  const user = req.user;
  let tenantInfo = null;

  if (user.role === 'TENANT') {
    tenantInfo = await prisma.tenant.findUnique({
      where: { userId: user.id },
      include: { shop: true },
    });
  }

  res.json({
    id: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
    profileImageUrl: user.profileImageUrl,
    mfaEnabled: user.mfaEnabled,
    tenant: tenantInfo,
  });
});

// PATCH /api/auth/profile — Update current user profile
router.patch('/profile', authenticate, async (req, res) => {
  const { fullName, profileImageUrl, password } = req.body;
  const data = {
    ...(fullName && { fullName }),
    ...(profileImageUrl && { profileImageUrl }),
  };

  if (password) {
    data.passwordHash = await bcrypt.hash(password, 10);
  }

  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data,
  });

  res.json({
    id: updatedUser.id,
    email: updatedUser.email,
    role: updatedUser.role,
    fullName: updatedUser.fullName,
    profileImageUrl: updatedUser.profileImageUrl,
  });
});

// PATCH /api/auth/admin/reset-password — Manager can reset any user's password
router.patch('/admin/reset-password', authenticate, authorize('MANAGER'), async (req, res) => {
  const { userId, newPassword } = req.body;
  
  if (!userId || !newPassword) {
    return res.status(400).json({ error: 'userId and newPassword required' });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  res.json({ message: 'Password reset successfully / የይለፍ ቃል ተቀይሯል' });
});

// POST /api/auth/recover — Recover account (Password Reset)
router.post('/recover', async (req, res) => {
  const { email, newPassword } = req.body;
  
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ error: 'User not found / ተጠቃሚው አልተገኘም' });

  // Check deactivation status
  if (!user.isActive) {
    return res.status(403).json({ error: 'Recovery disabled: Account deactivated by Board / ማግኛ ተዘግቷል፡ አካውንቱ ታግዷል' });
  }

  if (user.role === 'TENANT') {
    const tenant = await prisma.tenant.findUnique({ where: { userId: user.id } });
    if (tenant && !tenant.isActive) {
      return res.status(403).json({ error: 'Recovery disabled: Account deactivated by Manager / ማግኛ ተዘግቷል፡ አካውንቱ ታግዷል' });
    }
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash }
  });

  res.json({ message: 'Account recovered! Use your new password. / አካውንቱ ተመልሷል! በአዲሱ የይለፍ ቃል ይግቡ።' });
});

module.exports = router;
