import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const user = await requireAuth();

    // Calculate start of current week (Sunday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    // Get all time entries for this week
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        userId: user.id,
        startTs: {
          gte: startOfWeek,
          lt: endOfWeek,
        },
        deletedAt: null,
      },
      include: {
        workOrder: {
          select: {
            id: true,
            woNumber: true,
            customer: {
              select: {
                name: true,
              },
            },
          },
        },
        lineItem: {
          select: {
            description: true,
          },
        },
      },
      orderBy: {
        startTs: 'desc',
      },
    });

    // Calculate total seconds this week
    const totalSeconds = timeEntries.reduce((sum, entry) => {
      return sum + (entry.durationSeconds || 0);
    }, 0);

    // Group by work order
    const byWorkOrder = timeEntries.reduce((acc, entry) => {
      const woId = entry.workOrder.id;
      if (!acc[woId]) {
        acc[woId] = {
          workOrder: entry.workOrder,
          totalSeconds: 0,
          entryCount: 0,
        };
      }
      acc[woId].totalSeconds += entry.durationSeconds || 0;
      acc[woId].entryCount += 1;
      return acc;
    }, {} as Record<string, any>);

    const workOrderSummaries = Object.values(byWorkOrder).sort(
      (a: any, b: any) => b.totalSeconds - a.totalSeconds
    );

    return NextResponse.json({
      totalSeconds,
      startOfWeek: startOfWeek.toISOString(),
      endOfWeek: endOfWeek.toISOString(),
      workOrderSummaries,
      entryCount: timeEntries.length,
    });
  } catch (error: any) {
    console.error('Get weekly summary error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
