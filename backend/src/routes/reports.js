const express = require('express');
const prisma = require('../lib/prisma');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/reports/unpaid — Get all unpaid invoices with time-based categorization
router.get('/unpaid', authenticate, authorize('MANAGER', 'BOARD'), async (req, res) => {
  const invoices = await prisma.invoice.findMany({
    where: {
      status: 'UNPAID',
    },
    include: {
      tenant: {
        select: { fullName: true, phone: true }
      },
      shop: {
        select: { shopNumber: true }
      }
    },
    orderBy: {
      dueDate: 'asc'
    }
  });

  const now = new Date();
  const reports = invoices.map(inv => {
    const dueDate = new Date(inv.dueDate);
    const diffTime = now.getTime() - dueDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    let category = 'Current';
    if (diffDays > 0 && diffDays <= 30) category = '1-30 Days Late';
    else if (diffDays > 30 && diffDays <= 60) category = '31-60 Days Late';
    else if (diffDays > 60) category = '60+ Days Late';

    // Calculate current late fee
    let currentLateFee = 0;
    if (diffDays > 0) {
      currentLateFee = (parseFloat(inv.totalAmount) * 0.05 * diffDays) + 20.00;
    }

    return {
      ...inv,
      daysLate: diffDays > 0 ? diffDays : 0,
      agingCategory: category,
      currentLateFee
    };
  });

  res.json(reports);
});

// GET /api/reports/outdated-agreements — Get tenants whose lease is expired or expiring soon
router.get('/outdated-agreements', authenticate, authorize('MANAGER', 'BOARD'), async (req, res) => {
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(now.getDate() + 30);

  const tenants = await prisma.tenant.findMany({
    where: {
      isActive: true,
      leaseEnd: {
        lte: thirtyDaysFromNow
      }
    },
    include: {
      shop: {
        select: { shopNumber: true }
      }
    },
    orderBy: {
      leaseEnd: 'asc'
    }
  });

  const reports = tenants.map(t => {
    const leaseEnd = new Date(t.leaseEnd);
    const isExpired = leaseEnd < now;
    
    return {
      ...t,
      status: isExpired ? 'Expired' : 'Expiring Soon'
    };
  });

  res.json(reports);
});

module.exports = router;
