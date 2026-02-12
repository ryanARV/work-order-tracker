import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

// POST /api/work-orders/[id]/parts/[partItemId]/issue - Issue parts from inventory
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; partItemId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Require PARTS, ADMIN, or MANAGER role to issue parts
    if (!['PARTS', 'ADMIN', 'MANAGER'].includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id, partItemId } = await params;
    const body = await request.json();
    const { quantityToIssue } = body;

    // Validate input
    if (!quantityToIssue || quantityToIssue <= 0) {
      return NextResponse.json(
        { error: 'Quantity to issue must be greater than 0' },
        { status: 400 }
      );
    }

    // Get the part item
    const partItem = await prisma.workOrderPartItem.findUnique({
      where: { id: partItemId },
      include: {
        part: true,
      },
    });

    if (!partItem) {
      return NextResponse.json({ error: 'Part item not found' }, { status: 404 });
    }

    if (partItem.workOrderId !== id) {
      return NextResponse.json(
        { error: 'Part item does not belong to this work order' },
        { status: 400 }
      );
    }

    // Validate quantity
    const remainingToIssue = partItem.quantity - partItem.quantityIssued;
    if (quantityToIssue > remainingToIssue) {
      return NextResponse.json(
        { error: `Cannot issue ${quantityToIssue}. Only ${remainingToIssue} remaining to issue.` },
        { status: 400 }
      );
    }

    // For catalog parts, validate inventory availability
    if (partItem.partId && partItem.part) {
      const available = partItem.part.quantityOnHand;
      if (available < quantityToIssue) {
        return NextResponse.json(
          {
            error: `Insufficient inventory. Available: ${available}, Requested: ${quantityToIssue}`,
          },
          { status: 400 }
        );
      }
    }

    // Issue parts in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update part item
      const updatedPartItem = await tx.workOrderPartItem.update({
        where: { id: partItemId },
        data: {
          quantityIssued: {
            increment: quantityToIssue,
          },
          issuedById: session.id,
          issuedAt: new Date(),
        },
        include: {
          part: true,
          issuedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Update inventory for catalog parts
      if (partItem.partId) {
        await tx.part.update({
          where: { id: partItem.partId },
          data: {
            quantityOnHand: {
              decrement: quantityToIssue,
            },
            quantityReserved: {
              decrement: quantityToIssue,
            },
          },
        });

        // Create transaction record
        await tx.partTransaction.create({
          data: {
            partId: partItem.partId,
            type: 'ISSUE',
            quantity: -quantityToIssue, // Negative for issues
            unitCost: partItem.unitCost,
            workOrderId: id,
            userId: session.id,
          },
        });
      }

      // Create comment for audit trail
      await tx.comment.create({
        data: {
          workOrderId: id,
          userId: session.id,
          content: `Issued ${quantityToIssue} of ${updatedPartItem.description}`,
        },
      });

      return updatedPartItem;
    });

    return NextResponse.json({ part: result });
  } catch (error: any) {
    if (error.message?.includes('Forbidden') || error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error issuing parts:', error);
    return NextResponse.json({ error: 'Failed to issue parts' }, { status: 500 });
  }
}
