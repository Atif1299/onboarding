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

    // Fetch all counties with state information and trial status
    const counties = await prisma.county.findMany({
      include: {
        state: {
          select: {
            name: true,
            abbreviation: true,
          },
        },
        trialRegistration: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: [
        { state: { name: 'asc' } },
        { name: 'asc' },
      ],
    });

    // Transform the data
    const countiesData = counties.map(county => ({
      id: county.id,
      name: county.name,
      stateName: county.state.name,
      stateAbbreviation: county.state.abbreviation,
      status: county.status,
      hasActiveTrial: county.trialRegistration && county.trialRegistration.status === 'active',
    }));

    return NextResponse.json({
      success: true,
      data: countiesData,
    });
  } catch (error) {
    console.error('Counties API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch counties' },
      { status: 500 }
    );
  }
}
