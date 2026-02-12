import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET /api/parts/search?q=... - Fast autocomplete search for part picker
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    if (query.length < 2) {
      return NextResponse.json({ parts: [] });
    }

    const parts = await prisma.part.findMany({
      where: {
        OR: [
          { partNumber: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { manufacturer: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        partNumber: true,
        description: true,
        manufacturer: true,
        unitCost: true,
        unitPrice: true,
        quantityOnHand: true,
        quantityReserved: true,
      },
      take: 20, // Limit to 20 results for autocomplete
      orderBy: { partNumber: 'asc' },
    });

    // Add available quantity
    const partsWithAvailable = parts.map((part) => ({
      ...part,
      quantityAvailable: part.quantityOnHand - part.quantityReserved,
    }));

    return NextResponse.json({ parts: partsWithAvailable });
  } catch (error: any) {
    console.error('Error searching parts:', error);
    return NextResponse.json({ error: 'Failed to search parts' }, { status: 500 });
  }
}
