import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createAuditLogData, LineItemActions } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const { description, estimateMinutes, billable, assignedUserIds } = await request.json();

    if (!description) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    // Verify work order exists
    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        lineItems: {
          orderBy: { sortOrder: 'desc' },
          take: 1,
        },
      },
    });

    if (!workOrder) {
      return NextResponse.json(
        { error: 'Work order not found' },
        { status: 404 }
      );
    }

    // Calculate next sort order
    const nextSortOrder = (workOrder.lineItems[0]?.sortOrder || 0) + 1;

    const result = await prisma.$transaction(async (tx) => {
      // Create line item
      const lineItem = await tx.lineItem.create({
        data: {
          workOrderId: id,
          description,
          estimateMinutes: estimateMinutes || null,
          billable: billable !== false, // Default to true
          sortOrder: nextSortOrder,
          status: 'OPEN',
        },
      });

      // Assign techs if provided
      if (assignedUserIds && assignedUserIds.length > 0) {
        await tx.lineItemAssignment.createMany({
          data: assignedUserIds.map((userId: string) => ({
            lineItemId: lineItem.id,
            userId,
          })),
        });
      }

      // Audit the creation
      await tx.auditLog.create({
        data: createAuditLogData({
          entityType: 'LineItem',
          entityId: lineItem.id,
          action: LineItemActions.CREATE,
          actorId: user.id,
          after: {
            description,
            estimateMinutes,
            billable,
            assignedUserIds,
          },
        }),
      });

      return lineItem;
    });

    return NextResponse.json({ lineItem: result }, { status: 201 });
  } catch (error: any) {
    console.error('Create line item error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
