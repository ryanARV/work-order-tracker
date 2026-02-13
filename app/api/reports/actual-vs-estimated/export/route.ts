import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { jsonToCSV, formatMinutesForCSV } from '@/lib/csv';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      return NextResponse.json(
        { error: 'Forbidden - Admin or Manager access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');

    // Build filters
    const where: any = { deletedAt: null };

    if (startDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt = { ...where.createdAt, lte: end };
    }
    if (status) {
      where.status = status;
    }

    // Fetch work orders
    const workOrders = await prisma.workOrder.findMany({
      where,
      include: {
        customer: { select: { name: true } },
        lineItems: {
          where: { deletedAt: null },
          select: {
            estimateMinutes: true,
            timeEntries: {
              where: { deletedAt: null, isGoodwill: false },
              select: { durationSeconds: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform data for CSV
    const csvData = workOrders.map((wo) => {
      const estimateMinutes = wo.lineItems.reduce(
        (sum, item) => sum + (item.estimateMinutes || 0),
        0
      );

      const actualMinutes = wo.lineItems.reduce(
        (sum, item) =>
          sum +
          item.timeEntries.reduce(
            (entrySum, entry) => entrySum + Math.floor((entry.durationSeconds || 0) / 60),
            0
          ),
        0
      );

      const varianceMinutes = actualMinutes - estimateMinutes;
      const variancePercent = estimateMinutes > 0 ? ((varianceMinutes / estimateMinutes) * 100) : 0;
      const efficiency = estimateMinutes > 0 ? ((actualMinutes / estimateMinutes) * 100) : 0;

      return {
        'WO Number': wo.woNumber,
        'Customer': wo.customer.name,
        'Status': wo.status,
        'Priority': wo.priority || 'N/A',
        'Created At': new Date(wo.createdAt).toLocaleDateString(),
        'Estimated Time': formatMinutesForCSV(estimateMinutes),
        'Actual Time': formatMinutesForCSV(actualMinutes),
        'Variance': formatMinutesForCSV(varianceMinutes),
        'Variance %': `${variancePercent.toFixed(1)}%`,
        'Efficiency %': `${efficiency.toFixed(1)}%`,
        'Line Items': wo.lineItems.length,
      };
    });

    const csv = jsonToCSV(csvData);
    const filename = `actual-vs-estimated-${new Date().toISOString().split('T')[0]}.csv`;

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
