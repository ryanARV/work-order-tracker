import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireServiceWriter } from '@/lib/auth';

// POST /api/estimates/[id]/convert - Convert approved estimate to work order
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireServiceWriter();
    const { id } = await params;

    // Get estimate with all details
    const estimate = await prisma.estimate.findUnique({
      where: { id },
      include: {
        lineItems: {
          orderBy: { sortOrder: 'asc' },
        },
        partItems: {
          include: {
            part: true,
          },
        },
        convertedToWorkOrder: {
          select: {
            id: true,
            woNumber: true,
          },
        },
      },
    });

    if (!estimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
    }

    // Validate estimate status
    if (estimate.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Only approved estimates can be converted to work orders' },
        { status: 400 }
      );
    }

    if (estimate.convertedToWorkOrder) {
      return NextResponse.json(
        { error: 'This estimate has already been converted to a work order' },
        { status: 400 }
      );
    }

    // Check part availability for catalog parts
    for (const partItem of estimate.partItems) {
      if (partItem.partId && partItem.part) {
        const available = partItem.part.quantityOnHand - partItem.part.quantityReserved;
        if (available < partItem.quantity) {
          return NextResponse.json(
            {
              error: `Insufficient quantity for part ${partItem.part.partNumber}. Available: ${available}, Required: ${partItem.quantity}`,
            },
            { status: 400 }
          );
        }
      }
    }

    // Perform conversion in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Generate work order number
      const lastWo = await tx.workOrder.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { woNumber: true },
      });

      let nextNumber = 1;
      if (lastWo && lastWo.woNumber) {
        const match = lastWo.woNumber.match(/^WO-(\d+)$/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }
      const woNumber = `WO-${nextNumber.toString().padStart(6, '0')}`;

      // Create work order
      const workOrder = await tx.workOrder.create({
        data: {
          woNumber,
          customerId: estimate.customerId,
          status: 'OPEN',
          priority: estimate.priority,
          kanbanColumn: 'OPEN',
          kanbanPosition: 0,
          convertedFromEstimateId: estimate.id,
          warrantyAuthorizationNumber: estimate.warrantyAuthorizationNumber,
        },
      });

      // Copy line items
      for (const lineItem of estimate.lineItems) {
        await tx.lineItem.create({
          data: {
            workOrderId: workOrder.id,
            description: lineItem.description,
            complaint: lineItem.complaint,
            correction: lineItem.correction,
            billType: lineItem.billType,
            estimateMinutes: lineItem.estimateMinutes,
            sortOrder: lineItem.sortOrder,
            status: 'OPEN',
          },
        });
      }

      // Copy parts and reserve inventory
      for (const partItem of estimate.partItems) {
        // Create work order part item
        await tx.workOrderPartItem.create({
          data: {
            workOrderId: workOrder.id,
            partId: partItem.partId,
            description: partItem.description,
            quantity: partItem.quantity,
            quantityIssued: 0,
            unitCost: partItem.unitCost,
            unitPrice: partItem.unitPrice,
            billType: partItem.billType,
          },
        });

        // Reserve inventory for catalog parts
        if (partItem.partId) {
          await tx.part.update({
            where: { id: partItem.partId },
            data: {
              quantityReserved: {
                increment: partItem.quantity,
              },
            },
          });
        }
      }

      // Update estimate status (the relation is handled automatically via convertedFromEstimateId on WorkOrder)
      await tx.estimate.update({
        where: { id: estimate.id },
        data: {
          status: 'CONVERTED',
        },
      });

      // Create conversion audit comment
      await tx.comment.create({
        data: {
          workOrderId: workOrder.id,
          userId: session.id,
          content: `Work order created from estimate ${estimate.estimateNumber}`,
        },
      });

      return workOrder;
    });

    return NextResponse.json({ workOrder: result }, { status: 201 });
  } catch (error: any) {
    if (error.message?.includes('Forbidden') || error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error converting estimate:', error);
    return NextResponse.json(
      { error: 'Failed to convert estimate to work order' },
      { status: 500 }
    );
  }
}
