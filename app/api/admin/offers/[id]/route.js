import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PUT - Update offer
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, price, tierLevel } = body;

    const offer = await prisma.offer.update({
      where: { id: parseInt(id) },
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
    console.error('Update offer error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update offer' },
      { status: 500 }
    );
  }
}

// DELETE - Delete offer
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check if offer has active subscriptions
    const subscriptionsCount = await prisma.subscription.count({
      where: { offerId: parseInt(id) },
    });

    if (subscriptionsCount > 0) {
      return NextResponse.json(
        { success: false, error: `Cannot delete offer with ${subscriptionsCount} active subscriptions` },
        { status: 400 }
      );
    }

    await prisma.offer.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({
      success: true,
      message: 'Offer deleted successfully',
    });
  } catch (error) {
    console.error('Delete offer error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete offer' },
      { status: 500 }
    );
  }
}
