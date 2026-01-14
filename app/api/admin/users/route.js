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

        // Get search params for filtering
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';

        // Build filter
        const where = search ? {
            OR: [
                { email: { contains: search, mode: 'insensitive' } },
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
            ]
        } : {};

        // Fetch users with counts
        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                userType: true,
                credits: true,
                createdAt: true,
                _count: {
                    select: {
                        subscriptions: true,
                        claimedAuctions: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 100 // Limit for performance
        });

        // Transform data
        const usersData = users.map(user => ({
            id: user.id,
            email: user.email,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A',
            type: user.userType,
            credits: user.credits,
            joinedAt: user.createdAt,
            stats: {
                subscriptions: user._count.subscriptions,
                auctions: user._count.claimedAuctions
            }
        }));

        return NextResponse.json({
            success: true,
            data: usersData
        });

    } catch (error) {
        console.error('Fetch users error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch users' },
            { status: 500 }
        );
    }
}
