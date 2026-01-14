/**
 * Stripe Checkout API Route
 * Creates a Stripe Checkout session for subscription payments
 *
 * POST /api/stripe/checkout
 * Body: { offerId, countyId, userId }
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { getOrCreateStripeCustomer, createCheckoutSession } from '@/lib/stripe';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    // Parse request body
    const { offerId, countyId, userId: requestUserId } = await request.json();

    // Validate input
    if (!offerId || !countyId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: offerId, countyId' },
        { status: 400 }
      );
    }

    let user;

    // Method 1: Explicit User ID (Registration Flow)
    if (requestUserId) {
      user = await prisma.user.findUnique({
        where: { id: requestUserId },
      });
    }

    // Method 2: Session (Standard Flow)
    else {
      // Get user session
      const session = await getServerSession(authOptions);
      if (session?.user?.email) {
        user = await prisma.user.findUnique({
          where: { email: session.user.email },
        });
      }
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in or register.' },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get offer details
    const offer = await prisma.offer.findUnique({
      where: { id: parseInt(offerId) },
    });

    if (!offer) {
      return NextResponse.json(
        { success: false, error: 'Offer not found' },
        { status: 404 }
      );
    }

    /*
    if (!offer.stripePriceId) {
      console.warn('Stripe price not configured. Proceeding with dynamic price creation.');
    }
    */

    // Get county details
    const county = await prisma.county.findUnique({
      where: { id: parseInt(countyId) },
      include: { state: true },
    });

    if (!county) {
      return NextResponse.json(
        { success: false, error: 'County not found' },
        { status: 404 }
      );
    }

    // Check if county is available for subscription
    if (county.status === 'fully_locked') {
      return NextResponse.json(
        {
          success: false,
          error: `${county.name}, ${county.state.abbreviation} is fully locked and unavailable for subscription.`,
        },
        { status: 400 }
      );
    }

    // Check if user already has an active subscription for this county
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        countyId: parseInt(countyId),
        status: 'active',
      },
    });

    if (existingSubscription) {
      return NextResponse.json(
        {
          success: false,
          error: 'You already have an active subscription for this county.',
        },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    let stripeCustomerId = user.stripeCustomerId;

    if (!stripeCustomerId) {
      stripeCustomerId = await getOrCreateStripeCustomer(user);

      // Update user with Stripe customer ID
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId },
      });
    }

    // Create Stripe Checkout session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const checkoutSession = await createCheckoutSession({
      priceId: offer.stripePriceId,
      customerId: stripeCustomerId,
      countyId: parseInt(countyId),
      offerId: parseInt(offerId),
      successUrl: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${appUrl}/checkout/cancel`,
      // Dynamic Data Override
      priceData: {
        unit_amount: Math.round(Number(offer.price) * 100),
        recurring: { interval: 'month' }
      },
      productData: {
        name: offer.name || 'Subscription',
        description: offer.description || 'Monthly Subscription'
      },
      params: { // passing raw params object to helper if needed, based on my previous edit to lib/stripe.js I used params.priceData
        priceData: {
          unit_amount: Math.round(Number(offer.price) * 100),
          recurring: { interval: 'month' }
        },
        productData: {
          name: offer.name || 'Subscription',
          description: offer.description || 'Monthly Subscription'
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionId: checkoutSession.id,
        url: checkoutSession.url,
      },
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create checkout session',
        details: error.message,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
