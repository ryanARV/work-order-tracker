import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, canManageWorkOrders } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createAuditLogData } from '@/lib/audit';

// POST - Assign tech to line item
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    if (!canManageWorkOrders(user)) {
      return NextResponse.json(
        { error: 'Forbidden - Work order management access required' },
        { status: 403 }
      );
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if line item exists
    const lineItem = await prisma.lineItem.findUnique({
      where: { id },
      select: { id: true, workOrderId: true },
    });

    if (!lineItem) {
      return NextResponse.json(
        { error: 'Line item not found' },
        { status: 404 }
      );
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.lineItemAssignment.findFirst({
      where: {
        lineItemId: id,
        userId,
      },
    });

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'Technician is already assigned to this line item' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create assignment
      const assignment = await tx.lineItemAssignment.create({
        data: {
          lineItemId: id,
          userId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: createAuditLogData({
          entityType: 'LineItemAssignment',
          entityId: assignment.id,
          action: 'CREATE',
          actorId: user.id,
          after: {
            lineItemId: id,
            userId,
          },
        }),
      });

      return assignment;
    });

    return NextResponse.json({ assignment: result }, { status: 201 });
  } catch (error: any) {
    console.error('Assign tech error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

// DELETE - Unassign tech from line item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    if (!canManageWorkOrders(user)) {
      return NextResponse.json(
        { error: 'Forbidden - Work order management access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Find the assignment
    const assignment = await prisma.lineItemAssignment.findFirst({
      where: {
        lineItemId: id,
        userId,
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // Delete assignment
      await tx.lineItemAssignment.delete({
        where: { id: assignment.id },
      });

      // Create audit log
      await tx.auditLog.create({
        data: createAuditLogData({
          entityType: 'LineItemAssignment',
          entityId: assignment.id,
          action: 'DELETE',
          actorId: user.id,
          before: {
            lineItemId: id,
            userId,
          },
        }),
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Unassign tech error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
