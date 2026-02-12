import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Helper to check if user can view reports
function canViewReports(role: string) {
  return ['ADMIN', 'MANAGER', 'SERVICE_WRITER'].includes(role);
}

// GET /api/reports/wip-aging - Get work in progress aging report
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    if (!canViewReports(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Reports access required' },
        { status: 403 }
      );
    }

    // Fetch all non-closed work orders
    const workOrders = await prisma.workOrder.findMany({
      where: {
        deletedAt: null,
        status: {
          notIn: ['CLOSED', 'DRAFT'],
        },
      },
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
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const now = new Date();

    // Calculate aging for each work order
    const report = workOrders.map((wo) => {
      const createdAt = new Date(wo.createdAt);
      const ageInDays = Math.floor(
        (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Categorize by age
      let ageCategory: 'NEW' | 'RECENT' | 'AGING' | 'STALE' | 'CRITICAL';
      if (ageInDays <= 2) {
        ageCategory = 'NEW';
      } else if (ageInDays <= 7) {
        ageCategory = 'RECENT';
      } else if (ageInDays <= 14) {
        ageCategory = 'AGING';
      } else if (ageInDays <= 30) {
        ageCategory = 'STALE';
      } else {
        ageCategory = 'CRITICAL';
      }

      const doneCount = wo.lineItems.filter((li) => li.status === 'DONE').length;
      const totalCount = wo.lineItems.length;
      const progressPercent =
        totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

      return {
        id: wo.id,
        woNumber: wo.woNumber,
        customerName: wo.customer.name,
        status: wo.status,
        priority: wo.priority,
        createdAt: wo.createdAt,
        ageInDays,
        ageCategory,
        progressPercent,
        lineItemsDone: doneCount,
        lineItemsTotal: totalCount,
      };
    });

    // Group by status for summary
    const byStatus: Record<string, any[]> = {};
    report.forEach((wo) => {
      if (!byStatus[wo.status]) {
        byStatus[wo.status] = [];
      }
      byStatus[wo.status].push(wo);
    });

    // Calculate aging statistics by category
    const agingStats = {
      NEW: report.filter((r) => r.ageCategory === 'NEW').length,
      RECENT: report.filter((r) => r.ageCategory === 'RECENT').length,
      AGING: report.filter((r) => r.ageCategory === 'AGING').length,
      STALE: report.filter((r) => r.ageCategory === 'STALE').length,
      CRITICAL: report.filter((r) => r.ageCategory === 'CRITICAL').length,
    };

    const summary = {
      totalWIP: report.length,
      averageAge:
        report.length > 0
          ? (
              report.reduce((sum, r) => sum + r.ageInDays, 0) / report.length
            ).toFixed(1)
          : '0.0',
      oldestWO:
        report.length > 0
          ? {
              woNumber: report[0].woNumber,
              ageInDays: report[0].ageInDays,
            }
          : null,
      agingStats,
    };

    return NextResponse.json({ report, byStatus, summary });
  } catch (error: any) {
    console.error('WIP aging report error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
