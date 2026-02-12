import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Helper to check if user can view reports
function canViewReports(role: string) {
  return ['ADMIN', 'MANAGER', 'SERVICE_WRITER'].includes(role);
}

// GET /api/reports/actual-vs-estimated - Get actual vs estimated time report
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
    const status = searchParams.get('status');

    // Build where clause
    const where: any = {
      deletedAt: null,
    };

    if (startDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    }

    if (endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
    }

    if (status) {
      where.status = status;
    }

    // Fetch work orders with time data
    const workOrders = await prisma.workOrder.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        lineItems: {
          where: { deletedAt: null },
          select: {
            id: true,
            description: true,
            estimateMinutes: true,
            timeEntries: {
              where: { deletedAt: null },
              select: {
                durationSeconds: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate metrics for each work order
    const report = workOrders.map((wo) => {
      const totalEstimateMinutes = wo.lineItems.reduce(
        (sum, li) => sum + (li.estimateMinutes || 0),
        0
      );

      const totalActualMinutes = wo.lineItems.reduce((sum, li) => {
        const lineItemSeconds = li.timeEntries.reduce(
          (s, te) => s + (te.durationSeconds || 0),
          0
        );
        return sum + Math.floor(lineItemSeconds / 60);
      }, 0);

      const varianceMinutes = totalActualMinutes - totalEstimateMinutes;
      const variancePercent =
        totalEstimateMinutes > 0
          ? ((varianceMinutes / totalEstimateMinutes) * 100).toFixed(1)
          : '0.0';

      // Estimate efficiency: actual/estimated ratio (lower is better)
      const efficiency =
        totalEstimateMinutes > 0
          ? ((totalActualMinutes / totalEstimateMinutes) * 100).toFixed(1)
          : '0.0';

      return {
        id: wo.id,
        woNumber: wo.woNumber,
        customerName: wo.customer.name,
        status: wo.status,
        priority: wo.priority,
        createdAt: wo.createdAt,
        estimateMinutes: totalEstimateMinutes,
        actualMinutes: totalActualMinutes,
        varianceMinutes,
        variancePercent: parseFloat(variancePercent),
        efficiency: parseFloat(efficiency),
        lineItemsCount: wo.lineItems.length,
      };
    });

    // Calculate summary statistics
    const summary = {
      totalWorkOrders: report.length,
      totalEstimateMinutes: report.reduce((sum, r) => sum + r.estimateMinutes, 0),
      totalActualMinutes: report.reduce((sum, r) => sum + r.actualMinutes, 0),
      totalVarianceMinutes: report.reduce((sum, r) => sum + r.varianceMinutes, 0),
      overestimatedCount: report.filter((r) => r.varianceMinutes < 0).length,
      underestimatedCount: report.filter((r) => r.varianceMinutes > 0).length,
      onTargetCount: report.filter((r) => r.varianceMinutes === 0).length,
      averageEfficiency:
        report.length > 0
          ? (report.reduce((sum, r) => sum + r.efficiency, 0) / report.length).toFixed(1)
          : '0.0',
    };

    return NextResponse.json({ report, summary });
  } catch (error: any) {
    console.error('Actual vs estimated report error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
