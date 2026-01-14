/**
 * User Subscriptions API Route
 * GET /api/subscriptions - Get user's subscriptions
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user's subscriptions with related data
    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId: user.id,
      },
      include: {
        county: {
          include: {
            state: true,
          },
        },
        offer: true,
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: subscriptions,
    });
  } catch (error) {
    console.error('Subscriptions fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch subscriptions',
        details: error.message,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
