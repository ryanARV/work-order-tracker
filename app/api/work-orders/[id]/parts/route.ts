import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireServiceWriter } from '@/lib/auth';

// GET /api/work-orders/[id]/parts - Get all parts for a work order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireServiceWriter();
    const { id } = await params;

    const parts = await prisma.workOrderPartItem.findMany({
      where: { workOrderId: id },
      include: {
        part: {
          select: {
            id: true,
            partNumber: true,
            description: true,
            quantityOnHand: true,
            quantityReserved: true,
          },
        },
        issuedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ parts });
  } catch (error: any) {
    if (error.message?.includes('Forbidden') || error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching work order parts:', error);
    return NextResponse.json({ error: 'Failed to fetch parts' }, { status: 500 });
  }
}

// POST /api/work-orders/[id]/parts - Add a part to work order
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireServiceWriter();
    const { id } = await params;
    const body = await request.json();
    const { partId, description, quantity, unitCost, unitPrice, billType } = body;

    // Validate required fields
    if (!description || !quantity) {
      return NextResponse.json(
        { error: 'Description and quantity are required' },
        { status: 400 }
      );
    }

    // Check part availability if it's a catalog part
    if (partId) {
      const part = await prisma.part.findUnique({
        where: { id: partId },
      });

      if (!part) {
        return NextResponse.json({ error: 'Part not found' }, { status: 404 });
      }

      const available = part.quantityOnHand - part.quantityReserved;
      if (available < quantity) {
        return NextResponse.json(
          {
            error: `Insufficient quantity for ${part.partNumber}. Available: ${available}, Required: ${quantity}`,
          },
          { status: 400 }
        );
      }
    }

    // Add part and reserve inventory in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create work order part item
      const partItem = await tx.workOrderPartItem.create({
        data: {
          workOrderId: id,
          partId: partId || null,
          description,
          quantity,
          quantityIssued: 0,
          unitCost: unitCost || 0,
          unitPrice: unitPrice || 0,
          billType: billType || 'CUSTOMER',
        },
        include: {
          part: {
            select: {
              id: true,
              partNumber: true,
              description: true,
            },
          },
        },
      });

      // Reserve inventory for catalog parts
      if (partId) {
        await tx.part.update({
          where: { id: partId },
          data: {
            quantityReserved: {
              increment: quantity,
            },
          },
        });

        // Create transaction record
        await tx.partTransaction.create({
          data: {
            partId,
            type: 'RESERVE',
            quantity,
            unitCost: unitCost || 0,
            workOrderId: id,
            userId: session.id,
          },
        });
      }

      return partItem;
    });

    return NextResponse.json({ part: result }, { status: 201 });
  } catch (error: any) {
    if (error.message?.includes('Forbidden') || error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error adding part to work order:', error);
    return NextResponse.json({ error: 'Failed to add part' }, { status: 500 });
  }
}
