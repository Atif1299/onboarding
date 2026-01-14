import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { amount, reason, auctionId } = body;

    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid credit amount is required' },
        { status: 400 }
      );
    }

    if (!reason) {
      return NextResponse.json(
        { success: false, error: 'Reason for credit usage is required' },
        { status: 400 }
      );
    }

    // Get user with their claims
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        claimedAuctions: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has enough credits
    if (user.credits < amount) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient credits',
          currentCredits: user.credits,
          required: amount
        },
        { status: 400 }
      );
    }

    // For free_claim users, verify they can only use credits for their claimed auction
    if (user.userType === 'free_claim' && auctionId) {
      const hasClaim = user.claimedAuctions.some(
        claim => claim.auctionId === parseInt(auctionId)
      );

      if (!hasClaim) {
        return NextResponse.json(
          {
            success: false,
            error: 'You can only analyze items from your claimed auction',
            upgradeRequired: true
          },
          { status: 403 }
        );
      }
    }

    // Deduct credits and log transaction
    const result = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          credits: { decrement: amount }
        }
      });

      const transaction = await tx.creditTransaction.create({
        data: {
          userId: user.id,
          amount: -amount,
          reason,
          auctionId: auctionId ? parseInt(auctionId) : null
        }
      });

      return { updatedUser, transaction };
    });

    return NextResponse.json({
      success: true,
      message: `${amount} credits used successfully`,
      remainingCredits: result.updatedUser.credits,
      transactionId: result.transaction.id
    });

  } catch (error) {
    console.error('Error using credits:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to use credits' },
      { status: 500 }
    );
  }
}
