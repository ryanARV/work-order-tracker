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

    // Only ADMIN or MANAGER can approve QC
    if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
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

    // Approve and move to READY_TO_BILL
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.workOrder.update({
        where: { id: params.id },
        data: {
          status: 'READY_TO_BILL',
          kanbanColumn: 'READY_TO_BILL',
          qcApprovedById: user.id,
          qcApprovedAt: new Date(),
          qcRejectedReason: null,
        },
        include: {
          customer: true,
          qcApprovedBy: true,
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: createAuditLogData({
          entityType: 'WorkOrder',
          entityId: params.id,
          action: WorkOrderActions.QC_APPROVE,
          actorId: user.id,
          after: {
            status: 'READY_TO_BILL',
            qcApprovedById: user.id,
            qcApprovedAt: updated.qcApprovedAt,
          },
        }),
      });

      return updated;
    });

    return NextResponse.json({ workOrder: result });
  } catch (error: any) {
    console.error('QC approve error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
