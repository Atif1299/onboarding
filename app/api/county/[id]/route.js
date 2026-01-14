/**
 * Get County by ID API Route
 * GET /api/county/[id]
 */

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'County ID is required' },
        { status: 400 }
      );
    }

    const county = await prisma.county.findUnique({
      where: {
        id: parseInt(id),
      },
      include: {
        state: true,
      },
    });

    if (!county) {
      return NextResponse.json(
        { error: 'County not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(county);
  } catch (error) {
    console.error('Error fetching county:', error);
    return NextResponse.json(
      { error: 'Failed to fetch county' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
