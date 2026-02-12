import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        timeEntries: {
          where: {
            approvalState: {
              in: ['DRAFT', 'SUBMITTED'],
            },
          },
        },
      },
    });

    if (!workOrder) {
      return NextResponse.json(
        { error: 'Work order not found' },
        { status: 404 }
      );
    }

    if (workOrder.timeEntries.length > 0) {
      return NextResponse.json(
        {
          error: `Cannot mark as ready to bill: ${workOrder.timeEntries.length} time entries are not approved`,
        },
        { status: 400 }
      );
    }

    const updated = await prisma.workOrder.update({
      where: { id },
      data: {
        status: 'READY_TO_BILL',
      },
    });

    return NextResponse.json({ workOrder: updated });
  } catch (error: any) {
    console.error('Mark ready to bill error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message?.includes('Forbidden') ? 403 : 500 }
    );
  }
}
