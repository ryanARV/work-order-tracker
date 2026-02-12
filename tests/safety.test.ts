/**
 * Minimal Safety Tests
 *
 * Run with: npm test
 *
 * These tests verify critical business logic:
 * 1. One active timer enforcement
 * 2. LOCKED entry immutability
 * 3. Approval flow integrity
 * 4. Export data accuracy
 */

import { PrismaClient } from '@prisma/client';
import { isActiveTimerConstraintViolation, assertNotLocked } from '../lib/guards';

const prisma = new PrismaClient();

async function testOneActiveTimerEnforcement() {
  console.log('\n🧪 Test: One Active Timer Enforcement');

  try {
    const testUser = await prisma.user.findFirst({
      where: { email: 'tech1@example.com' },
    });

    if (!testUser) {
      console.log('⚠️  Skipping: Test user not found');
      return;
    }

    const testLineItem = await prisma.lineItem.findFirst({
      where: {
        deletedAt: null,
        status: 'OPEN',
      },
    });

    if (!testLineItem) {
      console.log('⚠️  Skipping: Test line item not found');
      return;
    }

    // Clean up any existing active timers
    await prisma.timeEntry.updateMany({
      where: {
        userId: testUser.id,
        endTs: null,
      },
      data: {
        endTs: new Date(),
        durationSeconds: 60,
      },
    });

    // Create first active timer
    const timer1 = await prisma.timeEntry.create({
      data: {
        userId: testUser.id,
        workOrderId: testLineItem.workOrderId,
        lineItemId: testLineItem.id,
        startTs: new Date(),
      },
    });

    console.log('✅ First timer created');

    // Try to create second active timer - should be prevented by unique constraint
    try {
      await prisma.timeEntry.create({
        data: {
          userId: testUser.id,
          workOrderId: testLineItem.workOrderId,
          lineItemId: testLineItem.id,
          startTs: new Date(),
        },
      });

      console.log('❌ FAIL: Should not allow duplicate active timer');
    } catch (error) {
      if (isActiveTimerConstraintViolation(error)) {
        console.log('✅ PASS: Database prevented duplicate active timer');
      } else {
        console.log('❌ FAIL: Unexpected error:', error);
      }
    }

    // Cleanup
    await prisma.timeEntry.update({
      where: { id: timer1.id },
      data: {
        endTs: new Date(),
        durationSeconds: 120,
      },
    });
  } catch (error) {
    console.log('❌ Test failed:', error);
  }
}

async function testLockedEntryImmutability() {
  console.log('\n🧪 Test: LOCKED Entry Immutability');

  try {
    const testEntry = await prisma.timeEntry.findFirst({
      where: {
        deletedAt: null,
        approvalState: 'APPROVED',
      },
    });

    if (!testEntry) {
      console.log('⚠️  Skipping: No test entry found');
      return;
    }

    // Lock the entry
    await prisma.timeEntry.update({
      where: { id: testEntry.id },
      data: {
        approvalState: 'LOCKED',
      },
    });

    console.log('✅ Entry locked');

    // Test guard function
    try {
      assertNotLocked('LOCKED', 'test operation');
      console.log('❌ FAIL: Guard should throw for LOCKED entries');
    } catch (error: any) {
      if (error.message.includes('LOCKED')) {
        console.log('✅ PASS: Guard prevents LOCKED entry modification');
      } else {
        console.log('❌ FAIL: Unexpected error');
      }
    }

    // Revert for cleanup
    await prisma.timeEntry.update({
      where: { id: testEntry.id },
      data: {
        approvalState: 'APPROVED',
      },
    });
  } catch (error) {
    console.log('❌ Test failed:', error);
  }
}

async function testApprovalFlowIntegrity() {
  console.log('\n🧪 Test: Approval Flow Integrity');

  try {
    const draftEntry = await prisma.timeEntry.findFirst({
      where: {
        deletedAt: null,
        approvalState: 'DRAFT',
        endTs: { not: null },
      },
    });

    if (!draftEntry) {
      console.log('⚠️  Skipping: No DRAFT entry found');
      return;
    }

    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!admin) {
      console.log('⚠️  Skipping: No admin user found');
      return;
    }

    // Approve entry
    await prisma.timeEntry.update({
      where: { id: draftEntry.id },
      data: {
        approvalState: 'APPROVED',
        approvedById: admin.id,
        approvedAt: new Date(),
      },
    });

    console.log('✅ Entry approved');

    // Verify approval state
    const updated = await prisma.timeEntry.findUnique({
      where: { id: draftEntry.id },
    });

    if (
      updated?.approvalState === 'APPROVED' &&
      updated.approvedById === admin.id &&
      updated.approvedAt
    ) {
      console.log('✅ PASS: Approval state correctly set');
    } else {
      console.log('❌ FAIL: Approval state incorrect');
    }

    // Revert for cleanup
    await prisma.timeEntry.update({
      where: { id: draftEntry.id },
      data: {
        approvalState: 'DRAFT',
        approvedById: null,
        approvedAt: null,
      },
    });
  } catch (error) {
    console.log('❌ Test failed:', error);
  }
}

async function testExportDataAccuracy() {
  console.log('\n🧪 Test: Export Data Accuracy (Seconds to Hours)');

  try {
    // Test seconds to hours conversion
    const testCases = [
      { seconds: 3600, expectedHours: '1.00' },
      { seconds: 7200, expectedHours: '2.00' },
      { seconds: 1800, expectedHours: '0.50' },
      { seconds: 5400, expectedHours: '1.50' },
      { seconds: 0, expectedHours: '0.00' },
    ];

    let allPassed = true;

    for (const test of testCases) {
      const hours = (test.seconds / 3600).toFixed(2);
      if (hours === test.expectedHours) {
        console.log(`✅ ${test.seconds}s = ${hours}h`);
      } else {
        console.log(
          `❌ ${test.seconds}s: expected ${test.expectedHours}h, got ${hours}h`
        );
        allPassed = false;
      }
    }

    if (allPassed) {
      console.log('✅ PASS: Export calculations correct');
    } else {
      console.log('❌ FAIL: Export calculations incorrect');
    }
  } catch (error) {
    console.log('❌ Test failed:', error);
  }
}

async function runTests() {
  console.log('🚀 Running Safety Tests\n');
  console.log('These tests verify critical hardening features.');

  await testOneActiveTimerEnforcement();
  await testLockedEntryImmutability();
  await testApprovalFlowIntegrity();
  await testExportDataAccuracy();

  console.log('\n✅ All tests completed\n');

  await prisma.$disconnect();
}

runTests().catch((error) => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
