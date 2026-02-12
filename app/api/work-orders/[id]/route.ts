import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        lineItems: {
          include: {
            assignments: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
            timeEntries: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
              orderBy: {
                startTs: 'desc',
              },
            },
          },
          orderBy: {
            sortOrder: 'asc',
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

    // Calculate totals
    const totalEstimateMinutes = workOrder.lineItems.reduce(
      (sum, item) => sum + (item.estimateMinutes || 0),
      0
    );

    const totalTrackedMinutes = workOrder.lineItems.reduce(
      (sum, item) =>
        sum +
        item.timeEntries.reduce(
          (itemSum, entry) => itemSum + Math.floor((entry.durationSeconds || 0) / 60),
          0
        ),
      0
    );

    return NextResponse.json({
      workOrder,
      totals: {
        estimateMinutes: totalEstimateMinutes,
        trackedMinutes: totalTrackedMinutes,
        varianceMinutes: totalTrackedMinutes - totalEstimateMinutes,
      },
    });
  } catch (error: any) {
    console.error('Get work order error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
