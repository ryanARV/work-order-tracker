import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can update customers' },
        { status: 403 }
      );
    }

    const { id } = await params;
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

    const customer = await prisma.customer.update({
      where: { id },
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

    return NextResponse.json({ customer });
  } catch (error: any) {
    console.error('Update customer error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can delete customers' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Soft delete
    await prisma.customer.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete customer error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
