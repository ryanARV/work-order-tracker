import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireServiceWriter } from '@/lib/auth';

// GET /api/estimates/[id] - Get a specific estimate
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireServiceWriter();
    const { id } = await params;

    const estimate = await prisma.estimate.findUnique({
      where: { id },
      include: {
        customer: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        lineItems: {
          orderBy: { sortOrder: 'asc' },
        },
        partItems: {
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
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        convertedToWorkOrder: {
          select: {
            id: true,
            woNumber: true,
            status: true,
          },
        },
      },
    });

    if (!estimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
    }

    return NextResponse.json({ estimate });
  } catch (error: any) {
    if (error.message?.includes('Forbidden') || error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching estimate:', error);
    return NextResponse.json({ error: 'Failed to fetch estimate' }, { status: 500 });
  }
}

// PUT /api/estimates/[id] - Update an estimate
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireServiceWriter();
    const { id } = await params;
    const body = await request.json();

    const { status, priority, warrantyAuthorizationNumber, validUntil } = body;

    // Check if estimate exists and can be edited
    const existing = await prisma.estimate.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
    }

    if (existing.status === 'CONVERTED') {
      return NextResponse.json(
        { error: 'Cannot edit an estimate that has been converted to a work order' },
        { status: 400 }
      );
    }

    const estimate = await prisma.estimate.update({
      where: { id },
      data: {
        status: status || existing.status,
        priority: priority !== undefined ? priority : existing.priority,
        warrantyAuthorizationNumber:
          warrantyAuthorizationNumber !== undefined
            ? warrantyAuthorizationNumber
            : existing.warrantyAuthorizationNumber,
        validUntil: validUntil !== undefined ? (validUntil ? new Date(validUntil) : null) : existing.validUntil,
      },
    });

    return NextResponse.json({ estimate });
  } catch (error: any) {
    if (error.message?.includes('Forbidden') || error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error updating estimate:', error);
    return NextResponse.json({ error: 'Failed to update estimate' }, { status: 500 });
  }
}

// DELETE /api/estimates/[id] - Delete an estimate
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireServiceWriter();
    const { id } = await params;

    const estimate = await prisma.estimate.findUnique({
      where: { id },
    });

    if (!estimate) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
    }

    if (estimate.status === 'CONVERTED') {
      return NextResponse.json(
        { error: 'Cannot delete an estimate that has been converted to a work order' },
        { status: 400 }
      );
    }

    // Delete in transaction (cascade deletes line items, part items, comments)
    await prisma.$transaction(async (tx) => {
      await tx.estimateLineItem.deleteMany({ where: { estimateId: id } });
      await tx.estimatePartItem.deleteMany({ where: { estimateId: id } });
      await tx.comment.deleteMany({ where: { estimateId: id } });
      await tx.estimate.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message?.includes('Forbidden') || error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error deleting estimate:', error);
    return NextResponse.json({ error: 'Failed to delete estimate' }, { status: 500 });
  }
}
