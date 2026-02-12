import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // Verify line item exists and user is assigned to it
    const lineItem = await prisma.lineItem.findFirst({
      where: {
        id,
        assignments: {
          some: {
            userId: user.id,
          },
        },
      },
    });

    if (!lineItem) {
      return NextResponse.json(
        { error: 'Line item not found or not assigned to you' },
        { status: 404 }
      );
    }

    // Stop any active timer on this line item
    const activeTimer = await prisma.timeEntry.findFirst({
      where: {
        userId: user.id,
        lineItemId: id,
        endTs: null,
      },
    });

    if (activeTimer) {
      const now = new Date();
      const durationMs = now.getTime() - activeTimer.startTs.getTime();
      const durationSeconds = Math.floor(durationMs / 1000);

      await prisma.timeEntry.update({
        where: { id: activeTimer.id },
        data: {
          endTs: now,
          durationSeconds,
        },
      });
    }

    // Mark line item as DONE
    const updatedLineItem = await prisma.lineItem.update({
      where: { id },
      data: { status: 'DONE' },
    });

    return NextResponse.json({ lineItem: updatedLineItem });
  } catch (error: any) {
    console.error('Mark line item done error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
