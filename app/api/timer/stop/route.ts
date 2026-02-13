import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createAuditLogData, TimeEntryActions } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { notes, pauseReason, isGoodwill } = await request.json();

    const activeTimer = await prisma.timeEntry.findFirst({
      where: {
        userId: user.id,
        endTs: null,
        deletedAt: null,
      },
    });

    if (!activeTimer) {
      return NextResponse.json(
        { error: 'No active timer found' },
        { status: 404 }
      );
    }

    const now = new Date();
    const durationMs = now.getTime() - activeTimer.startTs.getTime();
    const durationSeconds = Math.floor(durationMs / 1000);

    const result = await prisma.$transaction(async (tx) => {
      const stoppedTimer = await tx.timeEntry.update({
        where: { id: activeTimer.id },
        data: {
          endTs: now,
          durationSeconds,
          notes: notes || activeTimer.notes,
          pauseReason: pauseReason || null,
          isGoodwill: isGoodwill || false,
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

      // Audit the stop
      await tx.auditLog.create({
        data: createAuditLogData({
          entityType: 'TimeEntry',
          entityId: activeTimer.id,
          action: TimeEntryActions.STOP,
          actorId: user.id,
          after: {
            durationSeconds,
            notes: notes || null,
            pauseReason: pauseReason || null,
          },
        }),
      });

      return stoppedTimer;
    });

    return NextResponse.json({ timer: result });
  } catch (error: any) {
    console.error('Stop timer error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
