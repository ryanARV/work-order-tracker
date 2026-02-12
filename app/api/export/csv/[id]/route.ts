import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        lineItems: {
          include: {
            timeEntries: {
              where: {
                deletedAt: null,
                approvalState: {
                  in: ['APPROVED', 'LOCKED'],
                },
              },
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
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

    const csvRows: string[] = [];

    csvRows.push('WO Number,Customer,Line Item Description,Total Hours,Rate,Memo');

    for (const lineItem of workOrder.lineItems) {
      if (!lineItem.billable) continue;

      const totalSeconds = lineItem.timeEntries.reduce(
        (sum, entry) => sum + (entry.durationSeconds || 0),
        0
      );

      const hours = (totalSeconds / 3600).toFixed(2);

      const notes = lineItem.timeEntries
        .filter((e) => e.notes)
        .map((e) => e.notes)
        .join('; ');

      const techNames = [
        ...new Set(lineItem.timeEntries.map((e) => e.user.name)),
      ].join(', ');

      const memo = `${techNames ? 'Techs: ' + techNames : ''}${
        notes ? (techNames ? '. ' : '') + notes : ''
      }`;

      const escapeCsvValue = (value: string) => {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      };

      csvRows.push(
        [
          workOrder.woNumber,
          escapeCsvValue(workOrder.customer.name),
          escapeCsvValue(lineItem.description),
          hours,
          '',
          escapeCsvValue(memo),
        ].join(',')
      );
    }

    const csvContent = csvRows.join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${workOrder.woNumber}-billing.csv"`,
      },
    });
  } catch (error: any) {
    console.error('CSV export error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message?.includes('Forbidden') ? 403 : 500 }
    );
  }
}
