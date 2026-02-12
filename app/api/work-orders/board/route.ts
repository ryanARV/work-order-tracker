import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, canViewKanban } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    if (!canViewKanban(user)) {
      return NextResponse.json(
        { error: 'Forbidden - Kanban board access required' },
        { status: 403 }
      );
    }

    // Fetch all work orders with kanban columns
    const workOrders = await prisma.workOrder.findMany({
      where: {
        deletedAt: null,
        kanbanColumn: { not: null },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        lineItems: {
          where: { deletedAt: null },
          select: {
            id: true,
            status: true,
            assignments: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        timeEntries: {
          where: { deletedAt: null },
          select: {
            durationSeconds: true,
          },
        },
      },
      orderBy: [
        { kanbanColumn: 'asc' },
        { kanbanPosition: 'asc' },
      ],
    });

    // Group by kanban column
    const columns: Record<string, any[]> = {
      OPEN: [],
      IN_PROGRESS: [],
      ON_HOLD_PARTS: [],
      ON_HOLD_DELAY: [],
      QC: [],
      READY_TO_BILL: [],
    };

    workOrders.forEach((wo) => {
      if (wo.kanbanColumn && columns[wo.kanbanColumn]) {
        const doneCount = wo.lineItems.filter((li) => li.status === 'DONE').length;
        const totalCount = wo.lineItems.length;
        const totalSeconds = wo.timeEntries.reduce(
          (sum, te) => sum + (te.durationSeconds || 0),
          0
        );

        // Get unique assigned techs
        const assignedTechs = new Set<string>();
        wo.lineItems.forEach((li) => {
          li.assignments.forEach((a) => {
            assignedTechs.add(JSON.stringify({
              id: a.user.id,
              name: a.user.name,
            }));
          });
        });

        columns[wo.kanbanColumn].push({
          id: wo.id,
          woNumber: wo.woNumber,
          customerId: wo.customerId,
          customerName: wo.customer.name,
          status: wo.status,
          priority: wo.priority,
          kanbanPosition: wo.kanbanPosition,
          progressDone: doneCount,
          progressTotal: totalCount,
          totalHours: totalSeconds / 3600,
          assignedTechs: Array.from(assignedTechs).map((t: string) => JSON.parse(t)),
        });
      }
    });

    return NextResponse.json({ columns });
  } catch (error: any) {
    console.error('Get board error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
