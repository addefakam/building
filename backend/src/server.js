require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const shopRoutes = require('./routes/shops');
const tenantRoutes = require('./routes/tenants');
const utilityRoutes = require('./routes/utilities');
const invoiceRoutes = require('./routes/invoices');
const paymentRoutes = require('./routes/payments');
const boardRoutes = require('./routes/board');
const expenseRoutes = require('./routes/expenses');
const resourceRoutes = require('./routes/resources');
const settingRoutes = require('./routes/settings');
const notificationRoutes = require('./routes/notifications');
const reportRoutes = require('./routes/reports');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/utilities', utilityRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/board', boardRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✅ Shop Management API running on http://localhost:${PORT}`);
});

module.exports = app;
