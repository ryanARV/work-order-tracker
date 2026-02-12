import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isActiveTimerConstraintViolation } from '@/lib/guards';
import { createAuditLogData, TimeEntryActions } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { lineItemId } = await request.json();

    if (!lineItemId) {
      return NextResponse.json(
        { error: 'lineItemId is required' },
        { status: 400 }
      );
    }

    // Verify line item exists and user is assigned to it
    const lineItem = await prisma.lineItem.findFirst({
      where: {
        id: lineItemId,
        deletedAt: null,
        assignments: {
          some: {
            userId: user.id,
          },
        },
      },
      include: {
        workOrder: true,
      },
    });

    if (!lineItem) {
      return NextResponse.json(
        { error: 'Line item not found or not assigned to you' },
        { status: 404 }
      );
    }

    if (lineItem.status === 'DONE') {
      return NextResponse.json(
        { error: 'Cannot start timer on completed line item' },
        { status: 400 }
      );
    }

    // CRITICAL: One active timer per technician rule
    // Auto-stop any running timer and start the new one in a transaction
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Find and stop any active timer
        const activeTimer = await tx.timeEntry.findFirst({
          where: {
            userId: user.id,
            endTs: null,
            deletedAt: null,
          },
        });

        let stoppedTimerId: string | null = null;

        if (activeTimer) {
          const now = new Date();
          const durationMs = now.getTime() - activeTimer.startTs.getTime();
          const durationSeconds = Math.floor(durationMs / 1000);

          await tx.timeEntry.update({
            where: { id: activeTimer.id },
            data: {
              endTs: now,
              durationSeconds,
            },
          });

          stoppedTimerId = activeTimer.id;

          // Audit the auto-stop
          await tx.auditLog.create({
            data: createAuditLogData({
              entityType: 'TimeEntry',
              entityId: activeTimer.id,
              action: 'AUTO_STOP',
              actorId: user.id,
              after: { durationSeconds, reason: 'Timer switched to new task' },
            }),
          });
        }

        // Start new timer
        const newTimer = await tx.timeEntry.create({
          data: {
            userId: user.id,
            workOrderId: lineItem.workOrderId,
            lineItemId: lineItem.id,
            startTs: new Date(),
            approvalState: 'DRAFT',
          },
          include: {
            workOrder: {
              include: {
                customer: true,
              },
            },
            lineItem: true,
          },
        });

        // Audit the start
        await tx.auditLog.create({
          data: createAuditLogData({
            entityType: 'TimeEntry',
            entityId: newTimer.id,
            action: TimeEntryActions.START,
            actorId: user.id,
            after: {
              lineItemId,
              workOrderId: lineItem.workOrderId,
              stoppedTimer: stoppedTimerId,
            },
          }),
        });

        // Update work order status to IN_PROGRESS if it was OPEN
        if (lineItem.workOrder.status === 'OPEN') {
          await tx.workOrder.update({
            where: { id: lineItem.workOrderId },
            data: { status: 'IN_PROGRESS' },
          });
        }

        return newTimer;
      });

      return NextResponse.json({ timer: result });
    } catch (error: any) {
      // CRITICAL: Handle unique constraint violation gracefully
      // If another request already created an active timer, fetch and return it
      if (isActiveTimerConstraintViolation(error)) {
        const existingTimer = await prisma.timeEntry.findFirst({
          where: {
            userId: user.id,
            endTs: null,
            deletedAt: null,
          },
          include: {
            workOrder: {
              include: {
                customer: true,
              },
            },
            lineItem: true,
          },
        });

        if (existingTimer) {
          return NextResponse.json({
            timer: existingTimer,
            message: 'Active timer already running',
          });
        }
      }

      throw error;
    }
  } catch (error: any) {
    console.error('Start timer error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
