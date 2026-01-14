import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch all offers
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const offers = await prisma.offer.findMany({
      include: {
        _count: {
          select: { subscriptions: true },
        },
      },
      orderBy: {
        tierLevel: 'asc',
      },
    });

    const offersData = offers.map(offer => ({
      id: offer.id,
      name: offer.name,
      description: offer.description,
      price: parseFloat(offer.price),
      tierLevel: offer.tierLevel,
      subscriptionCount: offer._count.subscriptions,
    }));

    return NextResponse.json({
      success: true,
      data: offersData,
    });
  } catch (error) {
    console.error('Offers API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch offers' },
      { status: 500 }
    );
  }
}

// POST - Create new offer
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, price, tierLevel } = body;

    if (!name || price === undefined || tierLevel === undefined) {
      return NextResponse.json(
        { success: false, error: 'Name, price, and tier level are required' },
        { status: 400 }
      );
    }

    const offer = await prisma.offer.create({
      data: {
        name,
        description: description || null,
        price,
        tierLevel,
      },
    });

    return NextResponse.json({
      success: true,
      data: offer,
    });
  } catch (error) {
    console.error('Create offer error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create offer' },
      { status: 500 }
    );
  }
}
