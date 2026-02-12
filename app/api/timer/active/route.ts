import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const user = await requireAuth();

    const activeTimer = await prisma.timeEntry.findFirst({
      where: {
        userId: user.id,
        endTs: null,
      },
      include: {
        workOrder: {
          include: {
            customer: true,
          },
        },
        lineItem: true,
      },
    });

    return NextResponse.json({ activeTimer });
  } catch (error: any) {
    console.error('Get active timer error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
