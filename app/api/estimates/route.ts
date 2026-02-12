import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireServiceWriter } from '@/lib/auth';

// GET /api/estimates - List all estimates
export async function GET(request: NextRequest) {
  try {
    const session = await requireServiceWriter();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');

    const where: any = {};

    if (search) {
      where.OR = [
        { estimateNumber: { contains: search, mode: 'insensitive' } },
        {
          customer: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    if (status) {
      where.status = status;
    }

    const estimates = await prisma.estimate.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            contactEmail: true,
            contactPhone: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        lineItems: {
          select: {
            id: true,
            estimateMinutes: true,
          },
        },
        partItems: {
          select: {
            id: true,
            quantity: true,
            unitPrice: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate totals for each estimate
    const estimatesWithTotals = estimates.map((est) => {
      const totalLaborMinutes = est.lineItems.reduce((sum, li) => sum + (li.estimateMinutes || 0), 0);
      const totalPartsCost = est.partItems.reduce((sum, pi) => sum + pi.quantity * Number(pi.unitPrice), 0);

      return {
        ...est,
        totalLaborMinutes,
        totalPartsCost,
      };
    });

    return NextResponse.json({ estimates: estimatesWithTotals });
  } catch (error: any) {
    if (error.message?.includes('Forbidden') || error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching estimates:', error);
    return NextResponse.json({ error: 'Failed to fetch estimates' }, { status: 500 });
  }
}

// POST /api/estimates - Create a new estimate
export async function POST(request: NextRequest) {
  try {
    const session = await requireServiceWriter();

    const body = await request.json();
    const {
      customerId,
      priority,
      warrantyAuthorizationNumber,
      validUntil,
      lineItems,
      partItems,
    } = body;

    // Validate required fields
    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer is required' },
        { status: 400 }
      );
    }

    // Generate estimate number
    const lastEstimate = await prisma.estimate.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { estimateNumber: true },
    });

    let nextNumber = 1;
    if (lastEstimate && lastEstimate.estimateNumber) {
      const match = lastEstimate.estimateNumber.match(/^EST-(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }
    const estimateNumber = `EST-${nextNumber.toString().padStart(6, '0')}`;

    // Create estimate with line items and parts in a transaction
    const estimate = await prisma.$transaction(async (tx) => {
      const newEstimate = await tx.estimate.create({
        data: {
          estimateNumber,
          customerId,
          priority: priority || null,
          warrantyAuthorizationNumber: warrantyAuthorizationNumber || null,
          validUntil: validUntil ? new Date(validUntil) : null,
          status: 'DRAFT',
          createdById: session.id,
        },
      });

      // Create line items if provided
      if (lineItems && lineItems.length > 0) {
        await tx.estimateLineItem.createMany({
          data: lineItems.map((item: any, index: number) => ({
            estimateId: newEstimate.id,
            description: item.description,
            complaint: item.complaint || null,
            correction: item.correction || null,
            billType: item.billType || 'CUSTOMER',
            estimateMinutes: item.estimateMinutes || 0,
            laborRate: item.laborRate || 0,
            sortOrder: index,
          })),
        });
      }

      // Create part items if provided
      if (partItems && partItems.length > 0) {
        await tx.estimatePartItem.createMany({
          data: partItems.map((item: any) => ({
            estimateId: newEstimate.id,
            partId: item.partId || null,
            description: item.description,
            quantity: item.quantity,
            unitCost: item.unitCost || 0,
            unitPrice: item.unitPrice || 0,
            billType: item.billType || 'CUSTOMER',
          })),
        });
      }

      return newEstimate;
    });

    return NextResponse.json({ estimate }, { status: 201 });
  } catch (error: any) {
    if (error.message?.includes('Forbidden') || error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error creating estimate:', error);
    return NextResponse.json({ error: 'Failed to create estimate' }, { status: 500 });
  }
}
