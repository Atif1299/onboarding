import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        credits: true,
        userType: true,
        claimedAuctions: {
          include: {
            auction: {
              select: {
                id: true,
                url: true,
                title: true,
                auctionDate: true,
              }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      credits: user.credits,
      userType: user.userType,
      claimedAuctions: user.claimedAuctions.map(ca => ({
        claimId: ca.id,
        auction: ca.auction,
        claimedAt: ca.claimedAt
      }))
    });

  } catch (error) {
    console.error('Error fetching credit balance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch credit balance' },
      { status: 500 }
    );
  }
}
