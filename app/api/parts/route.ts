import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireParts } from '@/lib/auth';

// GET /api/parts - List all parts with optional filters
export async function GET(request: NextRequest) {
  try {
    const session = await requireParts();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const lowStock = searchParams.get('lowStock') === 'true';

    const where: any = {};

    if (search) {
      where.OR = [
        { partNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { manufacturer: { contains: search, mode: 'insensitive' } },
      ];
    }

    const parts = await prisma.part.findMany({
      where,
      orderBy: { partNumber: 'asc' },
    });

    // Calculate available quantity for each part and convert Decimals to numbers
    let partsWithAvailable = parts.map((part) => ({
      ...part,
      unitCost: Number(part.unitCost),
      unitPrice: Number(part.unitPrice),
      quantityAvailable: part.quantityOnHand - part.quantityReserved,
      isLowStock: part.quantityOnHand - part.quantityReserved <= part.reorderLevel,
    }));

    // Filter low stock on the server side after calculation
    if (lowStock) {
      partsWithAvailable = partsWithAvailable.filter((part) => part.isLowStock);
    }

    return NextResponse.json({ parts: partsWithAvailable });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error fetching parts:', error);
    return NextResponse.json({ error: 'Failed to fetch parts' }, { status: 500 });
  }
}

// POST /api/parts - Create a new part
export async function POST(request: NextRequest) {
  try {
    const session = await requireParts();

    const body = await request.json();
    const {
      partNumber,
      description,
      manufacturer,
      unitCost,
      unitPrice,
      quantityOnHand,
      reorderLevel,
      location,
    } = body;

    // Validate required fields
    if (!partNumber || !description) {
      return NextResponse.json(
        { error: 'Part number and description are required' },
        { status: 400 }
      );
    }

    // Check for duplicate part number
    const existing = await prisma.part.findUnique({
      where: { partNumber },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Part number already exists' },
        { status: 400 }
      );
    }

    const part = await prisma.part.create({
      data: {
        partNumber,
        description,
        manufacturer: manufacturer || null,
        unitCost: unitCost || 0,
        unitPrice: unitPrice || 0,
        quantityOnHand: quantityOnHand || 0,
        quantityReserved: 0,
        reorderLevel: reorderLevel || 0,
        location: location || null,
      },
    });

    // Create initial transaction if quantity > 0
    if (quantityOnHand > 0) {
      await prisma.partTransaction.create({
        data: {
          partId: part.id,
          type: 'PURCHASE',
          quantity: quantityOnHand,
          unitCost: unitCost || 0,
          userId: session.id,
        },
      });
    }

    // Convert Decimals to numbers for JSON response
    const partResponse = {
      ...part,
      unitCost: Number(part.unitCost),
      unitPrice: Number(part.unitPrice),
    };

    return NextResponse.json({ part: partResponse }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Error creating part:', error);
    return NextResponse.json({ error: 'Failed to create part' }, { status: 500 });
  }
}
