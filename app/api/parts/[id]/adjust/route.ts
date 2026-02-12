import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireParts } from '@/lib/auth';

// POST /api/parts/[id]/adjust - Adjust inventory (PURCHASE, RETURN, ADJUSTMENT)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireParts();
    const { id } = await params;
    const body = await request.json();

    const { type, quantity, unitCost, reason } = body;

    // Validate inputs
    if (!type || !['PURCHASE', 'RETURN', 'ADJUSTMENT'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid transaction type' },
        { status: 400 }
      );
    }

    if (!quantity || quantity === 0) {
      return NextResponse.json(
        { error: 'Quantity must be non-zero' },
        { status: 400 }
      );
    }

    // Get current part
    const part = await prisma.part.findUnique({
      where: { id },
    });

    if (!part) {
      return NextResponse.json({ error: 'Part not found' }, { status: 404 });
    }

    // Calculate new quantity
    const newQuantity = part.quantityOnHand + quantity;

    // Prevent negative inventory
    if (newQuantity < 0) {
      return NextResponse.json(
        { error: 'Adjustment would result in negative inventory' },
        { status: 400 }
      );
    }

    // Perform adjustment in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update part quantity
      const updatedPart = await tx.part.update({
        where: { id },
        data: {
          quantityOnHand: newQuantity,
        },
      });

      // Create transaction record
      const transaction = await tx.partTransaction.create({
        data: {
          partId: id,
          type,
          quantity,
          unitCost: unitCost || part.unitCost,
          userId: session.id,
          notes: reason || null,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return { part: updatedPart, transaction };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error adjusting inventory:', error);
    return NextResponse.json({ error: 'Failed to adjust inventory' }, { status: 500 });
  }
}
