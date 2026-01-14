import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const days = searchParams.get('days');

    // Calculate date range
    let dateFilter = {};
    if (days && days !== 'all') {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(days));
      dateFilter = {
        gte: daysAgo,
      };
    }

    // Fetch analytics data
    const [
      totalSubscriptions,
      activeSubscriptions,
      totalTrials,
      countiesByStatus,
      subscriptionsByOffer,
      recentTrials,
      stateSubscriptions,
    ] = await Promise.all([
      // Total subscriptions
      prisma.subscription.count(),

      // Active subscriptions
      prisma.subscription.count({
        where: { status: 'active' },
      }),

      // Total trials
      prisma.trialRegistration.count({
        where: { status: 'active' },
      }),

      // Counties by status
      prisma.county.groupBy({
        by: ['status'],
        _count: true,
      }),

      // Subscriptions by offer
      prisma.subscription.groupBy({
        by: ['offerId'],
        _count: true,
        where: { status: 'active' },
      }),

      // Recent trials
      prisma.trialRegistration.findMany({
        take: 10,
        orderBy: { registrationDate: 'desc' },
        include: {
          county: {
            include: {
              state: true,
            },
          },
        },
      }),

      // Subscriptions by state
      prisma.subscription.findMany({
        where: { status: 'active' },
        include: {
          county: {
            include: {
              state: true,
            },
          },
        },
      }),
    ]);

    // Process counties by status
    const countiesData = {
      total: await prisma.county.count(),
      available: 0,
      partiallyLocked: 0,
      fullyLocked: 0,
    };

    countiesByStatus.forEach(stat => {
      if (stat.status === 'available') countiesData.available = stat._count;
      if (stat.status === 'partially_locked') countiesData.partiallyLocked = stat._count;
      if (stat.status === 'fully_locked') countiesData.fullyLocked = stat._count;
    });

    // Get offer details for subscriptions
    const offers = await prisma.offer.findMany();
    const subscriptionsByOfferData = subscriptionsByOffer.map(sub => {
      const offer = offers.find(o => o.id === sub.offerId);
      return {
        name: offer?.name || 'Unknown',
        price: parseFloat(offer?.price || 0),
        count: sub._count,
      };
    });

    // Process recent trials
    const recentTrialsData = recentTrials.map(trial => ({
      id: trial.id,
      countyName: trial.county.name,
      stateName: trial.county.state.name,
      date: trial.registrationDate,
    }));

    // Process subscriptions by state
    const stateSubsMap = {};
    stateSubscriptions.forEach(sub => {
      const state = sub.county.state;
      if (!stateSubsMap[state.abbreviation]) {
        stateSubsMap[state.abbreviation] = {
          name: state.name,
          abbreviation: state.abbreviation,
          subscriptions: 0,
        };
      }
      stateSubsMap[state.abbreviation].subscriptions++;
    });

    const topStates = Object.values(stateSubsMap)
      .sort((a, b) => b.subscriptions - a.subscriptions);

    // Calculate estimated revenue
    const revenue = {
      estimated: subscriptionsByOfferData.reduce((sum, offer) => {
        return sum + (offer.price * offer.count);
      }, 0),
    };

    // Calculate subscription change (placeholder - would need historical data)
    const subscriptionChange = 0;

    return NextResponse.json({
      success: true,
      data: {
        subscriptions: {
          total: totalSubscriptions,
          active: activeSubscriptions,
          change: subscriptionChange,
        },
        trials: {
          total: totalTrials,
        },
        counties: countiesData,
        subscriptionsByOffer: subscriptionsByOfferData,
        recentTrials: recentTrialsData,
        topStates,
        revenue,
      },
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
