import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const user = await requireAuth();

    // Get all OPEN line items assigned to this technician
    const myWork = await prisma.lineItem.findMany({
      where: {
        status: 'OPEN',
        assignments: {
          some: {
            userId: user.id,
          },
        },
      },
      include: {
        workOrder: {
          include: {
            customer: true,
          },
        },
        timeEntries: {
          where: {
            userId: user.id,
          },
          orderBy: {
            startTs: 'desc',
          },
          take: 1,
        },
      },
      orderBy: [
        {
          workOrder: {
            priority: 'asc',
          },
        },
        {
          sortOrder: 'asc',
        },
      ],
    });

    return NextResponse.json({ lineItems: myWork });
  } catch (error: any) {
    console.error('Get my work error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
