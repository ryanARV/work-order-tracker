import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Helper to check if user can view reports
function canViewReports(role: string) {
  return ['ADMIN', 'MANAGER'].includes(role);
}

// GET /api/reports/tech-performance - Get technician performance metrics
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    if (!canViewReports(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Reports access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause for time entries
    const timeEntryWhere: any = {
      deletedAt: null,
      endTs: { not: null }, // Only completed time entries
    };

    if (startDate) {
      timeEntryWhere.startTs = { ...timeEntryWhere.startTs, gte: new Date(startDate) };
    }

    if (endDate) {
      timeEntryWhere.startTs = { ...timeEntryWhere.startTs, lte: new Date(endDate) };
    }

    // Fetch all techs with role TECH
    const techs = await prisma.user.findMany({
      where: {
        role: 'TECH',
        active: true,
        deletedAt: null,
      },
      include: {
        timeEntries: {
          where: timeEntryWhere,
          include: {
            lineItem: {
              select: {
                id: true,
                estimateMinutes: true,
                workOrder: {
                  select: {
                    id: true,
                    woNumber: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Calculate metrics for each tech
    const report = techs.map((tech) => {
      const totalTimeSeconds = tech.timeEntries.reduce(
        (sum, te) => sum + (te.durationSeconds || 0),
        0
      );
      const totalTimeMinutes = Math.floor(totalTimeSeconds / 60);
      const totalTimeHours = (totalTimeSeconds / 3600).toFixed(2);

      // Calculate estimated time for line items worked on
      const uniqueLineItems = new Map<
        string,
        { estimateMinutes: number; actualSeconds: number }
      >();

      tech.timeEntries.forEach((te) => {
        const lineItemId = te.lineItem.id;
        if (!uniqueLineItems.has(lineItemId)) {
          uniqueLineItems.set(lineItemId, {
            estimateMinutes: te.lineItem.estimateMinutes || 0,
            actualSeconds: 0,
          });
        }
        const lineItem = uniqueLineItems.get(lineItemId)!;
        lineItem.actualSeconds += te.durationSeconds || 0;
      });

      // Calculate efficiency metrics
      let totalEstimateMinutes = 0;
      let totalActualMinutes = 0;

      uniqueLineItems.forEach((lineItem) => {
        totalEstimateMinutes += lineItem.estimateMinutes;
        totalActualMinutes += Math.floor(lineItem.actualSeconds / 60);
      });

      const efficiency =
        totalEstimateMinutes > 0
          ? ((totalActualMinutes / totalEstimateMinutes) * 100).toFixed(1)
          : '0.0';

      // Count unique work orders
      const uniqueWorkOrders = new Set(
        tech.timeEntries.map((te) => te.lineItem.workOrder.id)
      );

      // Calculate time entry stats
      const approvedEntries = tech.timeEntries.filter(
        (te) => te.approvalState === 'APPROVED' || te.approvalState === 'LOCKED'
      );
      const pendingEntries = tech.timeEntries.filter(
        (te) => te.approvalState === 'DRAFT' || te.approvalState === 'SUBMITTED'
      );

      return {
        id: tech.id,
        name: tech.name,
        email: tech.email,
        totalTimeHours: parseFloat(totalTimeHours),
        totalTimeMinutes,
        totalTimeEntries: tech.timeEntries.length,
        approvedTimeEntries: approvedEntries.length,
        pendingTimeEntries: pendingEntries.length,
        uniqueWorkOrders: uniqueWorkOrders.size,
        uniqueLineItems: uniqueLineItems.size,
        totalEstimateMinutes,
        totalActualMinutes,
        efficiency: parseFloat(efficiency),
        varianceMinutes: totalActualMinutes - totalEstimateMinutes,
      };
    });

    // Sort by total time worked (descending)
    report.sort((a, b) => b.totalTimeMinutes - a.totalTimeMinutes);

    // Calculate summary statistics
    const summary = {
      totalTechs: report.length,
      totalTimeHours: report.reduce((sum, r) => sum + r.totalTimeHours, 0).toFixed(2),
      totalTimeEntries: report.reduce((sum, r) => sum + r.totalTimeEntries, 0),
      averageEfficiency:
        report.length > 0
          ? (report.reduce((sum, r) => sum + r.efficiency, 0) / report.length).toFixed(1)
          : '0.0',
      mostEfficient:
        report.length > 0
          ? {
              name: report.reduce((min, r) => (r.efficiency < min.efficiency ? r : min)).name,
              efficiency: Math.min(...report.map((r) => r.efficiency)).toFixed(1),
            }
          : null,
      mostProductive:
        report.length > 0
          ? {
              name: report[0].name,
              hours: report[0].totalTimeHours,
            }
          : null,
    };

    return NextResponse.json({ report, summary });
  } catch (error: any) {
    console.error('Tech performance report error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
