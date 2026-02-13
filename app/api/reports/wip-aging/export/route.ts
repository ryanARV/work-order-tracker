import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { jsonToCSV } from '@/lib/csv';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      return NextResponse.json(
        { error: 'Forbidden - Admin or Manager access required' },
        { status: 403 }
      );
    }

    // Fetch all WIP work orders
    const workOrders = await prisma.workOrder.findMany({
      where: {
        deletedAt: null,
        status: {
          in: ['OPEN', 'IN_PROGRESS', 'ON_HOLD_PARTS', 'ON_HOLD_DELAY', 'QC'],
        },
      },
      include: {
        customer: { select: { name: true } },
        lineItems: {
          where: { deletedAt: null },
          select: { status: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Calculate aging categories
    const getAgeCategory = (ageInDays: number): string => {
      if (ageInDays <= 2) return 'NEW (0-2 days)';
      if (ageInDays <= 7) return 'RECENT (3-7 days)';
      if (ageInDays <= 14) return 'AGING (8-14 days)';
      if (ageInDays <= 30) return 'STALE (15-30 days)';
      return 'CRITICAL (30+ days)';
    };

    // Transform data for CSV
    const csvData = workOrders.map((wo) => {
      const now = new Date();
      const created = new Date(wo.createdAt);
      const ageInDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));

      const lineItemsDone = wo.lineItems.filter((li) => li.status === 'DONE').length;
      const lineItemsTotal = wo.lineItems.length;
      const progressPercent = lineItemsTotal > 0
        ? Math.round((lineItemsDone / lineItemsTotal) * 100)
        : 0;

      return {
        'WO Number': wo.woNumber,
        'Customer': wo.customer.name,
        'Status': wo.status,
        'Priority': wo.priority || 'N/A',
        'Created Date': created.toLocaleDateString(),
        'Age (Days)': ageInDays,
        'Age Category': getAgeCategory(ageInDays),
        'Progress': `${progressPercent}%`,
        'Line Items Done': lineItemsDone,
        'Total Line Items': lineItemsTotal,
      };
    });

    const csv = jsonToCSV(csvData);
    const filename = `wip-aging-${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('Export CSV error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
