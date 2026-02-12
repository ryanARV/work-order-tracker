import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const user = await requireAuth();

    const [openCount, doneCount, totalCount] = await Promise.all([
      prisma.lineItem.count({
        where: {
          assignments: {
            some: {
              userId: user.id,
            },
          },
          status: 'OPEN',
          deletedAt: null,
        },
      }),
      prisma.lineItem.count({
        where: {
          assignments: {
            some: {
              userId: user.id,
            },
          },
          status: 'DONE',
          deletedAt: null,
        },
      }),
      prisma.lineItem.count({
        where: {
          assignments: {
            some: {
              userId: user.id,
            },
          },
          deletedAt: null,
        },
      }),
    ]);

    return NextResponse.json({
      openCount,
      doneCount,
      totalCount,
    });
  } catch (error: any) {
    console.error('Get counts error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
