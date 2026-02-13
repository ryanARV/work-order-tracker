import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

    // Only ADMIN or SERVICE_WRITER can toggle OoS
    if (user.role !== 'ADMIN' && user.role !== 'SERVICE_WRITER' && user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { isOutOfService } = await request.json();

    const workOrder = await prisma.workOrder.update({
      where: { id: params.id },
      data: { isOutOfService },
      include: {
        customer: true,
      },
    });

    return NextResponse.json({ workOrder });
  } catch (error: any) {
    console.error('Toggle OoS error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
