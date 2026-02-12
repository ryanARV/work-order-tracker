import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    // Build where clause for filters
    const whereClause: any = {
      deletedAt: null,
    };

    if (status) {
      whereClause.status = status;
    }

    if (priority) {
      whereClause.priority = priority;
    }

    if (search) {
      whereClause.OR = [
        {
          woNumber: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          customer: {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
      ];
    }

    if (user.role === 'ADMIN') {
      // Admins see all work orders
      const workOrders = await prisma.workOrder.findMany({
        where: whereClause,
        include: {
          customer: true,
          lineItems: {
            include: {
              assignments: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
          _count: {
            select: {
              timeEntries: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return NextResponse.json({ workOrders });
    } else {
      // Technicians see only work orders they're assigned to
      whereClause.lineItems = {
        some: {
          assignments: {
            some: {
              userId: user.id,
            },
          },
        },
      };

      const workOrders = await prisma.workOrder.findMany({
        where: whereClause,
        include: {
          customer: true,
          lineItems: {
            where: {
              assignments: {
                some: {
                  userId: user.id,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return NextResponse.json({ workOrders });
    }
  } catch (error: any) {
    console.error('Get work orders error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const { woNumber, customerId, priority, lineItems } = await request.json();

    if (!woNumber || !customerId) {
      return NextResponse.json(
        { error: 'woNumber and customerId are required' },
        { status: 400 }
      );
    }

    const workOrder = await prisma.workOrder.create({
      data: {
        woNumber,
        customerId,
        priority,
        status: 'DRAFT',
        lineItems: lineItems
          ? {
              create: lineItems.map((item: any, index: number) => ({
                description: item.description,
                billable: item.billable ?? true,
                estimateMinutes: item.estimateMinutes,
                status: 'OPEN',
                sortOrder: index + 1,
              })),
            }
          : undefined,
      },
      include: {
        customer: true,
        lineItems: true,
      },
    });

    return NextResponse.json({ workOrder }, { status: 201 });
  } catch (error: any) {
    console.error('Create work order error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message?.includes('Forbidden') ? 403 : 500 }
    );
  }
}
