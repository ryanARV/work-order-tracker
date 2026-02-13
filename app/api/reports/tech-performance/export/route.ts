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

    // Build date filters
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    // Fetch all techs
    const techs = await prisma.user.findMany({
      where: { role: 'TECH' },
      select: { id: true, name: true, email: true },
    });

    const techReports = await Promise.all(
      techs.map(async (tech) => {
        // Get time entries
        const timeEntries = await prisma.timeEntry.findMany({
          where: {
            userId: tech.id,
            deletedAt: null,
            isGoodwill: false,
            ...(Object.keys(dateFilter).length > 0 && { startTs: dateFilter }),
          },
          include: {
            lineItem: {
              select: {
                id: true,
                estimateMinutes: true,
                workOrderId: true,
              },
            },
          },
        });

        const totalTimeMinutes = timeEntries.reduce(
          (sum, entry) => sum + Math.floor((entry.durationSeconds || 0) / 60),
          0
        );

        const approvedCount = timeEntries.filter(
          (e) => e.approvalState === 'APPROVED' || e.approvalState === 'LOCKED'
        ).length;

        const pendingCount = timeEntries.filter(
          (e) => e.approvalState === 'DRAFT' || e.approvalState === 'SUBMITTED'
        ).length;

        const uniqueWOs = new Set(timeEntries.map((e) => e.lineItem.workOrderId));
        const uniqueLIs = new Set(timeEntries.map((e) => e.lineItem.id));

        const totalEstimateMinutes = timeEntries.reduce(
          (sum, entry) => sum + (entry.lineItem.estimateMinutes || 0),
          0
        );

        const efficiency = totalEstimateMinutes > 0
          ? ((totalTimeMinutes / totalEstimateMinutes) * 100)
          : 0;

        const getEfficiencyLabel = (eff: number): string => {
          if (eff <= 90) return 'Excellent';
          if (eff <= 110) return 'Good';
          if (eff <= 130) return 'Fair';
          return 'Needs Improvement';
        };

        return {
          'Technician': tech.name,
          'Email': tech.email,
          'Total Hours': (totalTimeMinutes / 60).toFixed(1),
          'Total Entries': timeEntries.length,
          'Approved Entries': approvedCount,
          'Pending Entries': pendingCount,
          'Work Orders': uniqueWOs.size,
          'Line Items': uniqueLIs.size,
          'Estimated Time': formatMinutesForCSV(totalEstimateMinutes),
          'Actual Time': formatMinutesForCSV(totalTimeMinutes),
          'Efficiency %': `${efficiency.toFixed(1)}%`,
          'Efficiency Rating': getEfficiencyLabel(efficiency),
          'Variance': formatMinutesForCSV(totalTimeMinutes - totalEstimateMinutes),
        };
      })
    );

    const csv = jsonToCSV(techReports);
    const filename = `tech-performance-${new Date().toISOString().split('T')[0]}.csv`;

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
