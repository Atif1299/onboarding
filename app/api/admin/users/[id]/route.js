import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(request, { params }) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const userId = parseInt(id);

        if (isNaN(userId)) {
            return NextResponse.json({ success: false, error: 'Invalid user ID' }, { status: 400 });
        }

        // Perform deletion and resource release in a transaction
        await prisma.$transaction(async (tx) => {
            // 1. Find user's active subscriptions to identify counties to release
            const subscriptions = await tx.subscription.findMany({
                where: { userId: userId, status: 'active' },
                select: { countyId: true }
            });

            const countyIdsToRelease = subscriptions.map(s => s.countyId);

            // 2. Release Counties (Set to available)
            if (countyIdsToRelease.length > 0) {
                await tx.county.updateMany({
                    where: { id: { in: countyIdsToRelease } },
                    data: { status: 'available' }
                });
                console.log(`Released ${countyIdsToRelease.length} counties for user ${userId}`);
            }

            // 3. Find claimed auctions to release (if we want to make them claimable again)
            // Note: If we just delete the claim, the auction might still be marked isFreeClaim=true on Auction table if it was a free claim.
            // We should check if we need to revert Auction.isFreeClaim.
            const claims = await tx.claimedAuction.findMany({
                where: { userId: userId },
                include: { auction: true }
            });

            const auctionIdsToReset = claims
                .filter(c => c.auction.isFreeClaim) // Only reset if it was marked as free claim
                .map(c => c.auctionId);

            if (auctionIdsToReset.length > 0) {
                await tx.auction.updateMany({
                    where: { id: { in: auctionIdsToReset } },
                    data: { isFreeClaim: false }
                });
            }

            // 4. Delete the User
            // Cascading delete in schema handles Subscriptions, Claims, CreditTransactions
            await tx.user.delete({
                where: { id: userId }
            });
        });

        return NextResponse.json({
            success: true,
            message: 'User deleted and resources released successfully'
        });

    } catch (error) {
        console.error('Delete user error:', error);
        return NextResponse.json(
            { success: false, error: `Failed to delete user: ${error.message}` },
            { status: 500 }
        );
    }
}
