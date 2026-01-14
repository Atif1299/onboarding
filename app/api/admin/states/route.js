import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch all states with county counts
    const states = await prisma.state.findMany({
      include: {
        _count: {
          select: { counties: true },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Transform the data
    const statesData = states.map(state => ({
      id: state.id,
      name: state.name,
      abbreviation: state.abbreviation,
      countiesCount: state._count.counties,
    }));

    return NextResponse.json({
      success: true,
      data: statesData,
    });
  } catch (error) {
    console.error('States API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch states' },
      { status: 500 }
    );
  }
}
