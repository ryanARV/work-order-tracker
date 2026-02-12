import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createAuditLogData, TimeEntryActions } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin();
    const { id } = await params;

    // Approve all DRAFT and SUBMITTED time entries for this work order
    const result = await prisma.$transaction(async (tx) => {
      // Get entries to approve for audit logging
      const entriesToApprove = await tx.timeEntry.findMany({
        where: {
          workOrderId: id,
          deletedAt: null,
          approvalState: {
            in: ['DRAFT', 'SUBMITTED'],
          },
        },
        select: {
          id: true,
          approvalState: true,
        },
      });

      // Approve the entries
      const updateResult = await tx.timeEntry.updateMany({
        where: {
          workOrderId: id,
          deletedAt: null,
          approvalState: {
            in: ['DRAFT', 'SUBMITTED'],
          },
        },
        data: {
          approvalState: 'APPROVED',
          approvedById: user.id,
          approvedAt: new Date(),
        },
      });

      // Audit each approval
      for (const entry of entriesToApprove) {
        await tx.auditLog.create({
          data: createAuditLogData({
            entityType: 'TimeEntry',
            entityId: entry.id,
            action: TimeEntryActions.APPROVE,
            actorId: user.id,
            before: { approvalState: entry.approvalState },
            after: { approvalState: 'APPROVED' },
          }),
        });
      }

      return updateResult;
    });

    return NextResponse.json({
      success: true,
      approvedCount: result.count,
    });
  } catch (error: any) {
    console.error('Approve time entries error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message?.includes('Forbidden') ? 403 : 500 }
    );
  }
}
