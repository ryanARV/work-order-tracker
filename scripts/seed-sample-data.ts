import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding sample data...');

  // Create sample customers
  console.log('Creating customers...');
  let customer1 = await prisma.customer.findFirst({
    where: { name: 'Acme Manufacturing' },
  });

  if (!customer1) {
    customer1 = await prisma.customer.create({
      data: {
        name: 'Acme Manufacturing',
        contactName: 'John Smith',
        contactEmail: 'john@acmemanufacturing.com',
        contactPhone: '555-0101',
        billingStreet: '123 Main St',
        billingCity: 'Industrial Park',
        billingState: 'NY',
        billingZip: '10001',
        billingCountry: 'USA',
      },
    });
  }

  let customer2 = await prisma.customer.findFirst({
    where: { name: 'Tech Solutions Inc' },
  });

  if (!customer2) {
    customer2 = await prisma.customer.create({
      data: {
        name: 'Tech Solutions Inc',
        contactName: 'Sarah Johnson',
        contactEmail: 'sarah@techsolutions.com',
        contactPhone: '555-0102',
        billingStreet: '456 Tech Blvd',
        billingCity: 'Silicon Valley',
        billingState: 'CA',
        billingZip: '94025',
        billingCountry: 'USA',
      },
    });
  }

  let customer3 = await prisma.customer.findFirst({
    where: { name: 'Smith & Co' },
  });

  if (!customer3) {
    customer3 = await prisma.customer.create({
      data: {
        name: 'Smith & Co',
        contactName: 'Mike Davis',
        contactEmail: 'mike@smithco.com',
        contactPhone: '555-0103',
        billingStreet: '789 Commerce Dr',
        billingCity: 'Austin',
        billingState: 'TX',
        billingZip: '78701',
        billingCountry: 'USA',
      },
    });
  }

  // Create sample users (techs, service writer, parts manager)
  console.log('Creating users...');
  const techMike = await prisma.user.upsert({
    where: { email: 'mike.tech@shop.com' },
    update: {},
    create: {
      name: 'Mike Johnson',
      email: 'mike.tech@shop.com',
      passwordHash: await bcrypt.hash('password123', 10),
      role: 'TECH',
    },
  });

  const techSarah = await prisma.user.upsert({
    where: { email: 'sarah.tech@shop.com' },
    update: {},
    create: {
      name: 'Sarah Williams',
      email: 'sarah.tech@shop.com',
      passwordHash: await bcrypt.hash('password123', 10),
      role: 'TECH',
    },
  });

  const serviceWriter = await prisma.user.upsert({
    where: { email: 'david.writer@shop.com' },
    update: {},
    create: {
      name: 'David Martinez',
      email: 'david.writer@shop.com',
      passwordHash: await bcrypt.hash('password123', 10),
      role: 'SERVICE_WRITER',
    },
  });

  const partsManager = await prisma.user.upsert({
    where: { email: 'lisa.parts@shop.com' },
    update: {},
    create: {
      name: 'Lisa Anderson',
      email: 'lisa.parts@shop.com',
      passwordHash: await bcrypt.hash('password123', 10),
      role: 'PARTS',
    },
  });

  // Create sample parts
  console.log('Creating parts...');
  const part1 = await prisma.part.upsert({
    where: { partNumber: 'HYD-001' },
    update: {},
    create: {
      partNumber: 'HYD-001',
      description: 'Hydraulic Pump Assembly',
      manufacturer: 'Parker Hannifin',
      unitCost: 245.50,
      unitPrice: 389.99,
      quantityOnHand: 12,
      quantityReserved: 3,
      reorderLevel: 5,
      location: 'Rack A-3',
    },
  });

  const part2 = await prisma.part.upsert({
    where: { partNumber: 'FLT-205' },
    update: {},
    create: {
      partNumber: 'FLT-205',
      description: 'Oil Filter - Heavy Duty',
      manufacturer: 'Donaldson',
      unitCost: 18.75,
      unitPrice: 32.50,
      quantityOnHand: 45,
      quantityReserved: 5,
      reorderLevel: 15,
      location: 'Rack B-1',
    },
  });

  const part3 = await prisma.part.upsert({
    where: { partNumber: 'BRG-308' },
    update: {},
    create: {
      partNumber: 'BRG-308',
      description: 'Ball Bearing - Large',
      manufacturer: 'SKF',
      unitCost: 67.25,
      unitPrice: 105.00,
      quantityOnHand: 8,
      quantityReserved: 2,
      reorderLevel: 10,
      location: 'Rack C-5',
    },
  });

  // Create sample work orders
  console.log('Creating work orders...');

  // Check if WO-2026-001 exists
  let wo1 = await prisma.workOrder.findFirst({
    where: { woNumber: 'WO-2026-001' },
  });

  if (!wo1) {
    wo1 = await prisma.workOrder.create({
      data: {
        woNumber: 'WO-2026-001',
        customerId: customer1.id,
        status: 'IN_PROGRESS',
        kanbanColumn: 'IN_PROGRESS',
        priority: 'HIGH',
        kanbanPosition: 1,
        
        lineItems: {
          create: [
            {
              description: 'Replace hydraulic pump',
              complaint: 'Pump making loud noise and losing pressure',
              correction: 'Diagnosed worn pump assembly, replacing with new Parker unit',
              billType: 'CUSTOMER_PAY',
              billable: true,
              estimateMinutes: 180,
              sortOrder: 1,
              status: 'OPEN',
              assignments: {
                create: [
                  { userId: techMike.id },
                ],
              },
            },
            {
              description: 'Inspect and replace hydraulic lines',
              complaint: null,
              correction: null,
              billType: 'CUSTOMER_PAY',
              billable: true,
              estimateMinutes: 90,
              sortOrder: 2,
              status: 'OPEN',
              assignments: {
                create: [
                  { userId: techMike.id },
                ],
              },
            },
          ],
        },
        partItems: {
          create: [
            {
              partId: part1.id,
              description: part1.description,
              quantity: 1,
              quantityIssued: 0,
              unitCost: part1.unitCost,
              unitPrice: part1.unitPrice,
              billType: 'CUSTOMER_PAY',
            },
          ],
        },
      },
    });
  }

  // Check if WO-2026-002 exists
  let wo2 = await prisma.workOrder.findFirst({
    where: { woNumber: 'WO-2026-002' },
  });

  if (!wo2) {
    wo2 = await prisma.workOrder.create({
      data: {
        woNumber: 'WO-2026-002',
        customerId: customer2.id,
        status: 'ON_HOLD_DELAY',
        kanbanColumn: 'ON_HOLD_DELAY',
        priority: 'MEDIUM',
        kanbanPosition: 1,
        
        lineItems: {
          create: [
            {
              description: 'Replace oil filters and perform fluid analysis',
              complaint: 'Routine maintenance due',
              correction: null,
              billType: 'CUSTOMER_PAY',
              billable: true,
              estimateMinutes: 120,
              sortOrder: 1,
              status: 'DONE',
              assignments: {
                create: [
                  { userId: techSarah.id },
                ],
              },
            },
          ],
        },
        partItems: {
          create: [
            {
              partId: part2.id,
              description: part2.description,
              quantity: 3,
              quantityIssued: 3,
              unitCost: part2.unitCost,
              unitPrice: part2.unitPrice,
              billType: 'CUSTOMER_PAY',
              issuedById: partsManager.id,
              issuedAt: new Date(Date.now() - 7200000),
            },
          ],
        },
      },
    });

    // Add time entry for WO2
    const wo2LineItem = await prisma.lineItem.findFirst({
      where: { workOrderId: wo2.id },
    });

    if (wo2LineItem) {
      await prisma.timeEntry.create({
        data: {
          userId: techSarah.id,
          workOrderId: wo2.id,
          lineItemId: wo2LineItem.id,
          startTs: new Date(Date.now() - 7200000), // 2 hours ago
          endTs: new Date(Date.now() - 3600000), // 1 hour ago
          durationSeconds: 3600, // 1 hour
          notes: 'Completed oil filter replacement, fluid looks good',
          pauseReason: null,
          approvalState: 'APPROVED',
          isGoodwill: false,
        },
      });
    }
  }

  // Check if WO-2026-003 exists
  let wo3 = await prisma.workOrder.findFirst({
    where: { woNumber: 'WO-2026-003' },
  });

  if (!wo3) {
    wo3 = await prisma.workOrder.create({
      data: {
        woNumber: 'WO-2026-003',
        customerId: customer3.id,
        status: 'QC',
        kanbanColumn: 'QC',
        priority: 'LOW',
        kanbanPosition: 1,
        
        lineItems: {
          create: [
            {
              description: 'Replace bearings',
              complaint: 'Unusual vibration during operation',
              correction: 'Replaced worn ball bearings',
              billType: 'WARRANTY',
              billable: true,
              estimateMinutes: 150,
              sortOrder: 1,
              status: 'DONE',
              assignments: {
                create: [
                  { userId: techMike.id },
                  { userId: techSarah.id },
                ],
              },
            },
          ],
        },
        partItems: {
          create: [
            {
              partId: part3.id,
              description: part3.description,
              quantity: 2,
              quantityIssued: 2,
              unitCost: part3.unitCost,
              unitPrice: part3.unitPrice,
              billType: 'WARRANTY',
              issuedById: partsManager.id,
              issuedAt: new Date(Date.now() - 7200000),
            },
          ],
        },
      },
    });

    // Add time entries for WO3
    const wo3LineItem = await prisma.lineItem.findFirst({
      where: { workOrderId: wo3.id },
    });

    if (wo3LineItem) {
      await prisma.timeEntry.createMany({
        data: [
          {
            userId: techMike.id,
            workOrderId: wo3.id,
            lineItemId: wo3LineItem.id,
            startTs: new Date(Date.now() - 10800000), // 3 hours ago
            endTs: new Date(Date.now() - 6300000), // 1.75 hours ago
            durationSeconds: 4500, // 1.25 hours (75 minutes)
            notes: 'Removed old bearings',
            pauseReason: 'Waiting for parts',
            approvalState: 'APPROVED',
            isGoodwill: false,
          },
          {
            userId: techSarah.id,
            workOrderId: wo3.id,
            lineItemId: wo3LineItem.id,
            startTs: new Date(Date.now() - 5400000), // 1.5 hours ago
            endTs: new Date(Date.now() - 1800000), // 0.5 hours ago
            durationSeconds: 3600, // 1 hour
            notes: 'Installed new bearings and tested',
            pauseReason: null,
            approvalState: 'APPROVED',
            isGoodwill: false,
          },
        ],
      });
    }
  }

  // Create sample estimates
  console.log('Creating estimates...');

  let estimate1 = await prisma.estimate.findFirst({
    where: { estimateNumber: 'EST-2026-001' },
  });

  if (!estimate1) {
    estimate1 = await prisma.estimate.create({
      data: {
        estimateNumber: 'EST-2026-001',
        customerId: customer1.id,
        status: 'PENDING_APPROVAL',
        priority: 'HIGH',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        createdById: serviceWriter.id,
        lineItems: {
          create: [
            {
              description: 'Overhaul gearbox assembly',
              complaint: 'Grinding noise in gearbox',
              correction: null,
              billType: 'CUSTOMER_PAY',
              estimateMinutes: 240,
              laborRate: 95.00,
              sortOrder: 1,
            },
          ],
        },
        partItems: {
          create: [
            {
              partId: part1.id,
              description: 'Hydraulic Pump (for comparison)',
              quantity: 1,
              unitCost: part1.unitCost,
              unitPrice: part1.unitPrice,
              billType: 'CUSTOMER_PAY',
            },
          ],
        },
      },
    });
  }

  let estimate2 = await prisma.estimate.findFirst({
    where: { estimateNumber: 'EST-2026-002' },
  });

  if (!estimate2) {
    estimate2 = await prisma.estimate.create({
      data: {
        estimateNumber: 'EST-2026-002',
        customerId: customer2.id,
        status: 'APPROVED',
        priority: 'MEDIUM',
        validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        createdById: serviceWriter.id,
        lineItems: {
          create: [
            {
              description: 'Electrical system diagnostics',
              complaint: 'Intermittent power issues',
              correction: null,
              billType: 'CUSTOMER_PAY',
              estimateMinutes: 180,
              laborRate: 95.00,
              sortOrder: 1,
            },
          ],
        },
      },
    });
  }

  // Update part reservations
  await prisma.part.update({
    where: { id: part1.id },
    data: { quantityReserved: 4 }, // 3 from WO + 1 from estimate
  });

  await prisma.part.update({
    where: { id: part2.id },
    data: { quantityReserved: 2 }, // 5 original - 3 issued
  });

  console.log('✅ Sample data seeded successfully!');
  console.log('\nSample accounts:');
  console.log('- Tech 1: mike.tech@shop.com / password123');
  console.log('- Tech 2: sarah.tech@shop.com / password123');
  console.log('- Service Writer: david.writer@shop.com / password123');
  console.log('- Parts Manager: lisa.parts@shop.com / password123');
  console.log('\nSample data:');
  console.log(`- 3 Customers`);
  console.log(`- 3 Work Orders (HIGH priority IN_PROGRESS, MEDIUM priority ON_HOLD_DELAY, LOW priority QC)`);
  console.log(`- 2 Estimates (PENDING_APPROVAL and APPROVED)`);
  console.log(`- 3 Parts (Hydraulic Pump, Oil Filter, Ball Bearing)`);
  console.log(`- 3 Time Entries`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
