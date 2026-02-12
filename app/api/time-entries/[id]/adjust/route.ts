import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

// POST /api/time-entries/[id]/adjust - Adjust time entry duration (Manager/Admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Require MANAGER or ADMIN role
    if (!['MANAGER', 'ADMIN'].includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { newDurationSeconds, reason } = body;

    // Validate input
    if (!newDurationSeconds || newDurationSeconds <= 0) {
      return NextResponse.json(
        { error: 'Duration must be greater than 0' },
        { status: 400 }
      );
    }

    if (!reason || reason.trim().length < 10) {
      return NextResponse.json(
        { error: 'Reason must be at least 10 characters' },
        { status: 400 }
      );
    }

    // Get the time entry
    const timeEntry = await prisma.timeEntry.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        lineItem: {
          select: {
            id: true,
            description: true,
            workOrderId: true,
          },
        },
      },
    });

    if (!timeEntry) {
      return NextResponse.json({ error: 'Time entry not found' }, { status: 404 });
    }

    // Prevent adjustment of LOCKED entries
    if (timeEntry.approvalState === 'LOCKED') {
      return NextResponse.json(
        { error: 'Cannot adjust locked time entries' },
        { status: 400 }
      );
    }

    // Store original duration for audit
    const originalDurationSeconds = timeEntry.durationSeconds || 0;
    const originalMinutes = Math.floor(originalDurationSeconds / 60);
    const newMinutes = Math.floor(newDurationSeconds / 60);

    // Update time entry
    const updatedEntry = await prisma.$transaction(async (tx) => {
      const updated = await tx.timeEntry.update({
        where: { id },
        data: {
          durationSeconds: newDurationSeconds,
          editedReason: reason.trim(),
          editedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          lineItem: {
            select: {
              id: true,
              description: true,
              workOrderId: true,
            },
          },
        },
      });

      // Create audit comment
      await tx.comment.create({
        data: {
          workOrderId: updated.lineItem.workOrderId,
          userId: session.id,
          content: `Adjusted time entry for ${updated.user.name} on "${updated.lineItem.description}" from ${originalMinutes} minutes to ${newMinutes} minutes. Reason: ${reason.trim()}`,
        },
      });

      return updated;
    });

    return NextResponse.json({ timeEntry: updatedEntry });
  } catch (error: any) {
    if (error.message?.includes('Forbidden') || error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error adjusting time entry:', error);
    return NextResponse.json({ error: 'Failed to adjust time entry' }, { status: 500 });
  }
}
