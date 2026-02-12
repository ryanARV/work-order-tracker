import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data (in correct order due to foreign keys)
  console.log('🧹 Cleaning existing data...');
  await prisma.partTransaction.deleteMany({});
  await prisma.workOrderPartItem.deleteMany({});
  await prisma.estimatePartItem.deleteMany({});
  await prisma.estimateLineItem.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.timeEntry.deleteMany({});
  await prisma.lineItemAssignment.deleteMany({});
  await prisma.lineItem.deleteMany({});
  await prisma.workOrder.deleteMany({});
  await prisma.estimate.deleteMany({});
  await prisma.part.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('✅ Database cleaned');

  // Create users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const techPassword = await bcrypt.hash('tech123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'John Admin',
      passwordHash: adminPassword,
      role: 'ADMIN',
      active: true,
    },
  });

  const tech1 = await prisma.user.upsert({
    where: { email: 'tech1@example.com' },
    update: {},
    create: {
      email: 'tech1@example.com',
      name: 'Mike Technician',
      passwordHash: techPassword,
      role: 'TECH',
      active: true,
    },
  });

  const tech2 = await prisma.user.upsert({
    where: { email: 'tech2@example.com' },
    update: {},
    create: {
      email: 'tech2@example.com',
      name: 'Sarah Tech',
      passwordHash: techPassword,
      role: 'TECH',
      active: true,
    },
  });

  const tech3 = await prisma.user.upsert({
    where: { email: 'tech3@example.com' },
    update: {},
    create: {
      email: 'tech3@example.com',
      name: 'David Engineer',
      passwordHash: techPassword,
      role: 'TECH',
      active: true,
    },
  });

  const serviceWriter = await prisma.user.upsert({
    where: { email: 'writer@example.com' },
    update: {},
    create: {
      email: 'writer@example.com',
      name: 'Lisa Service Writer',
      passwordHash: await bcrypt.hash('writer123', 10),
      role: 'SERVICE_WRITER',
      active: true,
    },
  });

  const partsManager = await prisma.user.upsert({
    where: { email: 'parts@example.com' },
    update: {},
    create: {
      email: 'parts@example.com',
      name: 'Tom Parts Manager',
      passwordHash: await bcrypt.hash('parts123', 10),
      role: 'PARTS',
      active: true,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@example.com' },
    update: {},
    create: {
      email: 'manager@example.com',
      name: 'Karen Manager',
      passwordHash: await bcrypt.hash('manager123', 10),
      role: 'MANAGER',
      active: true,
    },
  });

  console.log('✅ Created users:', { admin, tech1, tech2, tech3, serviceWriter, partsManager, manager });

  // Create customers
  const customer1 = await prisma.customer.create({
    data: {
      name: 'Acme Manufacturing',
      contactName: 'John Smith',
      contactEmail: 'john@acme.com',
      contactPhone: '(555) 123-4567',
      billingStreet: '123 Industrial Blvd, Suite 100',
      billingCity: 'Manufacturing City',
      billingState: 'ST',
      billingZip: '12345',
      billingCountry: 'USA',
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: 'Smith & Co',
      contactName: 'Jane Doe',
      contactEmail: 'jane@smithco.com',
      contactPhone: '(555) 234-5678',
      billingStreet: '456 Business Park Dr',
      billingCity: 'Commerce Town',
      billingState: 'ST',
      billingZip: '67890',
      billingCountry: 'USA',
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      name: 'Tech Solutions Inc',
      contactName: 'Bob Johnson',
      contactEmail: 'bob@techsolutions.com',
      contactPhone: '(555) 345-6789',
      billingStreet: '789 Tech Plaza',
      billingCity: 'Innovation City',
      billingState: 'ST',
      billingZip: '11223',
      billingCountry: 'USA',
    },
  });

  console.log('✅ Created customers:', { customer1, customer2, customer3 });

  // Create parts catalog
  const part1 = await prisma.part.create({
    data: {
      partNumber: 'HYD-PUMP-500',
      description: 'Hydraulic Pump 500 Series',
      manufacturer: 'HydraulicCo',
      unitCost: 450.00,
      unitPrice: 650.00,
      quantityOnHand: 5,
      quantityReserved: 0,
      reorderLevel: 2,
      location: 'Shelf A3',
    },
  });

  const part2 = await prisma.part.create({
    data: {
      partNumber: 'CONV-BELT-200',
      description: 'Conveyor Belt 200ft',
      manufacturer: 'BeltMasters',
      unitCost: 280.00,
      unitPrice: 420.00,
      quantityOnHand: 3,
      quantityReserved: 0,
      reorderLevel: 1,
      location: 'Shelf B12',
    },
  });

  const part3 = await prisma.part.create({
    data: {
      partNumber: 'TEMP-SENSOR-X1',
      description: 'Temperature Sensor X1 Model',
      manufacturer: 'SensorTech',
      unitCost: 45.00,
      unitPrice: 75.00,
      quantityOnHand: 12,
      quantityReserved: 0,
      reorderLevel: 5,
      location: 'Drawer C4',
    },
  });

  const part4 = await prisma.part.create({
    data: {
      partNumber: 'AIR-FILTER-STD',
      description: 'Standard Air Filter',
      manufacturer: 'FilterPro',
      unitCost: 15.00,
      unitPrice: 30.00,
      quantityOnHand: 25,
      quantityReserved: 0,
      reorderLevel: 10,
      location: 'Shelf D2',
    },
  });

  const part5 = await prisma.part.create({
    data: {
      partNumber: 'SAFETY-GUARD-M',
      description: 'Safety Guard Medium',
      manufacturer: 'SafetyFirst',
      unitCost: 85.00,
      unitPrice: 140.00,
      quantityOnHand: 8,
      quantityReserved: 0,
      reorderLevel: 3,
      location: 'Shelf E7',
    },
  });

  console.log('✅ Created parts:', { part1, part2, part3, part4, part5 });

  // Create work orders with line items
  const wo1 = await prisma.workOrder.create({
    data: {
      woNumber: 'WO-2024-001',
      customerId: customer1.id,
      status: 'OPEN',
      priority: 'HIGH',
      kanbanColumn: 'OPEN',
      kanbanPosition: 1,
      lineItems: {
        create: [
          {
            description: 'Replace hydraulic pump on Line 3',
            billable: true,
            estimateMinutes: 240,
            status: 'OPEN',
            sortOrder: 1,
          },
          {
            description: 'Inspect conveyor belt system',
            billable: true,
            estimateMinutes: 120,
            status: 'OPEN',
            sortOrder: 2,
          },
          {
            description: 'Calibrate temperature sensors',
            billable: true,
            estimateMinutes: 90,
            status: 'OPEN',
            sortOrder: 3,
          },
        ],
      },
    },
    include: { lineItems: true },
  });

  const wo2 = await prisma.workOrder.create({
    data: {
      woNumber: 'WO-2024-002',
      customerId: customer2.id,
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      kanbanColumn: 'IN_PROGRESS',
      kanbanPosition: 1,
      lineItems: {
        create: [
          {
            description: 'Emergency repair - broken motor mount',
            billable: true,
            estimateMinutes: 180,
            status: 'OPEN',
            sortOrder: 1,
          },
          {
            description: 'Install new safety guards',
            billable: true,
            estimateMinutes: 60,
            status: 'OPEN',
            sortOrder: 2,
          },
        ],
      },
    },
    include: { lineItems: true },
  });

  const wo3 = await prisma.workOrder.create({
    data: {
      woNumber: 'WO-2024-003',
      customerId: customer3.id,
      status: 'OPEN',
      priority: 'LOW',
      kanbanColumn: 'OPEN',
      kanbanPosition: 2,
      lineItems: {
        create: [
          {
            description: 'Quarterly maintenance - HVAC system',
            billable: true,
            estimateMinutes: 300,
            status: 'OPEN',
            sortOrder: 1,
          },
          {
            description: 'Replace air filters',
            billable: true,
            estimateMinutes: 30,
            status: 'OPEN',
            sortOrder: 2,
          },
          {
            description: 'Test emergency shutdown systems',
            billable: false,
            estimateMinutes: 45,
            status: 'OPEN',
            sortOrder: 3,
          },
        ],
      },
    },
    include: { lineItems: true },
  });

  console.log('✅ Created work orders:', { wo1, wo2, wo3 });

  // Assign technicians to line items
  await prisma.lineItemAssignment.createMany({
    data: [
      // WO1 assignments
      { lineItemId: wo1.lineItems[0].id, userId: tech1.id },
      { lineItemId: wo1.lineItems[1].id, userId: tech2.id },
      { lineItemId: wo1.lineItems[2].id, userId: tech3.id },

      // WO2 assignments
      { lineItemId: wo2.lineItems[0].id, userId: tech1.id },
      { lineItemId: wo2.lineItems[0].id, userId: tech2.id }, // Multiple techs on emergency
      { lineItemId: wo2.lineItems[1].id, userId: tech3.id },

      // WO3 assignments
      { lineItemId: wo3.lineItems[0].id, userId: tech1.id },
      { lineItemId: wo3.lineItems[1].id, userId: tech2.id },
      { lineItemId: wo3.lineItems[2].id, userId: tech3.id },
    ],
  });

  console.log('✅ Created line item assignments');

  // Create some sample time entries (completed)
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  await prisma.timeEntry.create({
    data: {
      userId: tech1.id,
      workOrderId: wo2.id,
      lineItemId: wo2.lineItems[0].id,
      startTs: new Date(yesterday.getTime() + 8 * 60 * 60 * 1000), // 8 AM yesterday
      endTs: new Date(yesterday.getTime() + 10 * 60 * 60 * 1000), // 10 AM yesterday
      durationSeconds: 7200, // 2 hours = 7200 seconds
      notes: 'Assessed damage, ordered replacement parts',
      approvalState: 'DRAFT',
    },
  });

  await prisma.timeEntry.create({
    data: {
      userId: tech2.id,
      workOrderId: wo2.id,
      lineItemId: wo2.lineItems[0].id,
      startTs: new Date(yesterday.getTime() + 8 * 60 * 60 * 1000),
      endTs: new Date(yesterday.getTime() + 9.5 * 60 * 60 * 1000),
      durationSeconds: 5400, // 1.5 hours = 5400 seconds
      notes: 'Assisted with assessment',
      approvalState: 'DRAFT',
    },
  });

  console.log('✅ Created sample time entries');

  // Create sample estimate
  const estimate1 = await prisma.estimate.create({
    data: {
      estimateNumber: 'EST-2024-001',
      customerId: customer1.id,
      status: 'PENDING_APPROVAL',
      priority: 'MEDIUM',
      createdById: serviceWriter.id,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Valid for 30 days
      lineItems: {
        create: [
          {
            description: 'Install new control panel',
            complaint: 'Old control panel failing intermittently',
            correction: 'Replace with updated model with digital controls',
            billType: 'CUSTOMER_PAY',
            estimateMinutes: 360,
            laborRate: 95.00,
            sortOrder: 1,
          },
          {
            description: 'Update PLC programming',
            billType: 'CUSTOMER_PAY',
            estimateMinutes: 240,
            laborRate: 125.00,
            sortOrder: 2,
          },
        ],
      },
      partItems: {
        create: [
          {
            partId: part3.id,
            description: 'Temperature Sensor X1 Model',
            quantity: 4,
            unitCost: 45.00,
            unitPrice: 75.00,
            billType: 'CUSTOMER_PAY',
            sortOrder: 1,
          },
        ],
      },
    },
  });

  console.log('✅ Created sample estimate:', estimate1);

  // Add parts to WO2 (emergency repair)
  await prisma.workOrderPartItem.create({
    data: {
      workOrderId: wo2.id,
      lineItemId: wo2.lineItems[0].id,
      partId: part5.id,
      description: 'Safety Guard Medium',
      quantity: 2,
      quantityIssued: 0,
      unitCost: 85.00,
      unitPrice: 140.00,
      billType: 'CUSTOMER_PAY',
      sortOrder: 1,
    },
  });

  // Reserve parts for the work order
  await prisma.part.update({
    where: { id: part5.id },
    data: { quantityReserved: 2 },
  });

  console.log('✅ Created work order parts');

  console.log('🎉 Seeding completed!');
  console.log('\n📝 Login credentials:');
  console.log('  Admin: admin@example.com / admin123');
  console.log('  Tech1: tech1@example.com / tech123');
  console.log('  Tech2: tech2@example.com / tech123');
  console.log('  Tech3: tech3@example.com / tech123');
  console.log('  Service Writer: writer@example.com / writer123');
  console.log('  Parts Manager: parts@example.com / parts123');
  console.log('  Manager: manager@example.com / manager123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
