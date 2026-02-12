import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, canViewKanban } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createAuditLogData } from '@/lib/audit';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    if (!canViewKanban(user)) {
      return NextResponse.json(
        { error: 'Forbidden - Kanban board access required' },
        { status: 403 }
      );
    }

    const { kanbanColumn, kanbanPosition } = await request.json();

    if (!kanbanColumn) {
      return NextResponse.json(
        { error: 'Kanban column is required' },
        { status: 400 }
      );
    }

    // Get current work order state for audit
    const currentWo = await prisma.workOrder.findUnique({
      where: { id },
      select: {
        kanbanColumn: true,
        kanbanPosition: true,
        status: true,
      },
    });

    if (!currentWo) {
      return NextResponse.json(
        { error: 'Work order not found' },
        { status: 404 }
      );
    }

    // Map kanban column to work order status
    const statusMap: Record<string, any> = {
      OPEN: 'OPEN',
      IN_PROGRESS: 'IN_PROGRESS',
      ON_HOLD_PARTS: 'ON_HOLD_PARTS',
      ON_HOLD_DELAY: 'ON_HOLD_DELAY',
      QC: 'QC',
      READY_TO_BILL: 'READY_TO_BILL',
    };

    const newStatus: any = statusMap[kanbanColumn] || currentWo.status;

    const result = await prisma.$transaction(async (tx) => {
      // Update work order
      const updatedWo = await tx.workOrder.update({
        where: { id },
        data: {
          kanbanColumn,
          kanbanPosition: kanbanPosition || 999,
          status: newStatus,
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: createAuditLogData({
          entityType: 'WorkOrder',
          entityId: id,
          action: 'KANBAN_MOVE',
          actorId: user.id,
          before: {
            kanbanColumn: currentWo.kanbanColumn,
            kanbanPosition: currentWo.kanbanPosition,
            status: currentWo.status,
          },
          after: {
            kanbanColumn,
            kanbanPosition: kanbanPosition || 999,
            status: newStatus,
          },
        }),
      });

      return updatedWo;
    });

    return NextResponse.json({ workOrder: result });
  } catch (error: any) {
    console.error('Update board status error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
