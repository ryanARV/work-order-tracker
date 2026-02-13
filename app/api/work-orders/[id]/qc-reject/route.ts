import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createAuditLogData, WorkOrderActions } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    // Only ADMIN or MANAGER can reject QC
    if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { reason } = await request.json();

    if (!reason || reason.trim().length < 10) {
      return NextResponse.json(
        { error: 'Rejection reason must be at least 10 characters' },
        { status: 400 }
      );
    }

    const workOrder = await prisma.workOrder.findUnique({
      where: { id: params.id },
    });

    if (!workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }

    if (workOrder.status !== 'QC') {
      return NextResponse.json({ error: 'Work order must be in QC status' }, { status: 400 });
    }

    // Reject and send back to IN_PROGRESS
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.workOrder.update({
        where: { id: params.id },
        data: {
          status: 'IN_PROGRESS',
          kanbanColumn: 'IN_PROGRESS',
          qcRejectedReason: reason,
          qcApprovedById: null,
          qcApprovedAt: null,
        },
        include: {
          customer: true,
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: createAuditLogData({
          entityType: 'WorkOrder',
          entityId: params.id,
          action: WorkOrderActions.QC_REJECT,
          actorId: user.id,
          after: {
            status: 'IN_PROGRESS',
            qcRejectedReason: reason,
          },
        }),
      });

      return updated;
    });

    return NextResponse.json({ workOrder: result });
  } catch (error: any) {
    console.error('QC reject error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
