import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireParts } from '@/lib/auth';

// GET /api/parts/[id] - Get a specific part with transaction history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireParts();
    const { id } = await params;

    const part = await prisma.part.findUnique({
      where: { id },
      include: {
        transactions: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 50, // Last 50 transactions
        },
      },
    });

    if (!part) {
      return NextResponse.json({ error: 'Part not found' }, { status: 404 });
    }

    const partWithAvailable = {
      ...part,
      quantityAvailable: part.quantityOnHand - part.quantityReserved,
      isLowStock: part.quantityOnHand - part.quantityReserved <= part.reorderLevel,
    };

    return NextResponse.json({ part: partWithAvailable });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching part:', error);
    return NextResponse.json({ error: 'Failed to fetch part' }, { status: 500 });
  }
}

// PUT /api/parts/[id] - Update a part
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireParts();
    const { id } = await params;
    const body = await request.json();

    const {
      partNumber,
      description,
      manufacturer,
      unitCost,
      unitPrice,
      reorderLevel,
      location,
    } = body;

    // Check if part exists
    const existing = await prisma.part.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Part not found' }, { status: 404 });
    }

    // Check for duplicate part number if changed
    if (partNumber && partNumber !== existing.partNumber) {
      const duplicate = await prisma.part.findUnique({
        where: { partNumber },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: 'Part number already exists' },
          { status: 400 }
        );
      }
    }

    const part = await prisma.part.update({
      where: { id },
      data: {
        partNumber: partNumber || existing.partNumber,
        description: description || existing.description,
        manufacturer: manufacturer !== undefined ? manufacturer : existing.manufacturer,
        unitCost: unitCost !== undefined ? unitCost : existing.unitCost,
        unitPrice: unitPrice !== undefined ? unitPrice : existing.unitPrice,
        reorderLevel: reorderLevel !== undefined ? reorderLevel : existing.reorderLevel,
        location: location !== undefined ? location : existing.location,
      },
    });

    return NextResponse.json({ part });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error updating part:', error);
    return NextResponse.json({ error: 'Failed to update part' }, { status: 500 });
  }
}

// DELETE /api/parts/[id] - Delete a part (only if no transactions exist)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireParts();
    const { id } = await params;

    // Check if part has any transactions
    const transactionCount = await prisma.partTransaction.count({
      where: { partId: id },
    });

    if (transactionCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete part with transaction history' },
        { status: 400 }
      );
    }

    // Check if part is used in any work orders or estimates
    const woPartCount = await prisma.workOrderPartItem.count({
      where: { partId: id },
    });

    const estPartCount = await prisma.estimatePartItem.count({
      where: { partId: id },
    });

    if (woPartCount > 0 || estPartCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete part that is referenced in work orders or estimates' },
        { status: 400 }
      );
    }

    await prisma.part.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error deleting part:', error);
    return NextResponse.json({ error: 'Failed to delete part' }, { status: 500 });
  }
}
