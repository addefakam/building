const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkInvoices() {
  const invoices = await prisma.invoice.findMany({
    include: { shop: true }
  });
  console.log('Invoices Data:', invoices.map(i => ({
    id: i.id,
    rent: i.rentAmount,
    elec: i.electricCharge,
    water: i.waterCharge,
    service: i.serviceCharge,
    total: i.totalAmount,
    calculated: (Number(i.rentAmount) + Number(i.electricCharge) + Number(i.waterCharge) + Number(i.serviceCharge)).toFixed(2)
  })));
  await prisma.$disconnect();
}

checkInvoices();
