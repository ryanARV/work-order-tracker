import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    await requireAdmin();

    const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000);

    // 1. Active timers older than 8 hours
    const staleTimers = await prisma.timeEntry.findMany({
      where: {
        endTs: null,
        deletedAt: null,
        startTs: {
          lt: eightHoursAgo,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        workOrder: {
          select: {
            woNumber: true,
          },
        },
        lineItem: {
          select: {
            description: true,
          },
        },
      },
      orderBy: {
        startTs: 'asc',
      },
    });

    // 2. Work orders marked READY_TO_BILL with unapproved entries
    const readyToBillWithUnapproved = await prisma.workOrder.findMany({
      where: {
        status: 'READY_TO_BILL',
        deletedAt: null,
        timeEntries: {
          some: {
            deletedAt: null,
            approvalState: {
              in: ['DRAFT', 'SUBMITTED'],
            },
          },
        },
      },
      include: {
        customer: {
          select: {
            name: true,
          },
        },
        timeEntries: {
          where: {
            deletedAt: null,
            approvalState: {
              in: ['DRAFT', 'SUBMITTED'],
            },
          },
          select: {
            id: true,
            approvalState: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // 3. Time entries edited after approval
    const editedAfterApproval = await prisma.timeEntry.findMany({
      where: {
        deletedAt: null,
        editedAt: {
          not: null,
        },
        approvalState: {
          in: ['APPROVED', 'LOCKED'],
        },
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
        workOrder: {
          select: {
            woNumber: true,
          },
        },
        lineItem: {
          select: {
            description: true,
          },
        },
      },
      orderBy: {
        editedAt: 'desc',
      },
      take: 50,
    });

    // 4. Line items marked DONE with zero time tracked
    const doneWithNoTime = await prisma.lineItem.findMany({
      where: {
        status: 'DONE',
        deletedAt: null,
        timeEntries: {
          none: {
            deletedAt: null,
            durationSeconds: {
              gt: 0,
            },
          },
        },
      },
      include: {
        workOrder: {
          select: {
            woNumber: true,
            customer: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      take: 50,
    });

    // 5. Orphaned time entries (line item deleted or work order deleted)
    // Note: With CASCADE deletes, this shouldn't happen, but check anyway
    const orphanedEntries = await prisma.timeEntry.findMany({
      where: {
        deletedAt: null,
        OR: [
          {
            lineItem: {
              deletedAt: {
                not: null,
              },
            },
          },
          {
            workOrder: {
              deletedAt: {
                not: null,
              },
            },
          },
        ],
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
        workOrder: {
          select: {
            woNumber: true,
            deletedAt: true,
          },
        },
        lineItem: {
          select: {
            description: true,
            deletedAt: true,
          },
        },
      },
      take: 50,
    });

    return NextResponse.json({
      staleTimers: {
        count: staleTimers.length,
        entries: staleTimers,
      },
      readyToBillWithUnapproved: {
        count: readyToBillWithUnapproved.length,
        workOrders: readyToBillWithUnapproved,
      },
      editedAfterApproval: {
        count: editedAfterApproval.length,
        entries: editedAfterApproval,
      },
      doneWithNoTime: {
        count: doneWithNoTime.length,
        lineItems: doneWithNoTime,
      },
      orphanedEntries: {
        count: orphanedEntries.length,
        entries: orphanedEntries,
      },
    });
  } catch (error: any) {
    console.error('Get exceptions error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message?.includes('Forbidden') ? 403 : 500 }
    );
  }
}
