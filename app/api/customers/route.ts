import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    await requireAuth();

    const customers = await prisma.customer.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        contactName: true,
        contactEmail: true,
        contactPhone: true,
        billingStreet: true,
        billingCity: true,
        billingState: true,
        billingZip: true,
        billingCountry: true,
        notes: true,
        createdAt: true,
        _count: {
          select: {
            workOrders: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ customers });
  } catch (error: any) {
    console.error('Get customers error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can create customers' },
        { status: 403 }
      );
    }

    const {
      name,
      contactName,
      contactEmail,
      contactPhone,
      billingStreet,
      billingCity,
      billingState,
      billingZip,
      billingCountry,
      notes,
    } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Customer name is required' },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        contactName: contactName || null,
        contactEmail: contactEmail || null,
        contactPhone: contactPhone || null,
        billingStreet: billingStreet || null,
        billingCity: billingCity || null,
        billingState: billingState || null,
        billingZip: billingZip || null,
        billingCountry: billingCountry || null,
        notes: notes || null,
      },
    });

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error: any) {
    console.error('Create customer error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
