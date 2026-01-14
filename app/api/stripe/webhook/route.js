/**
 * Stripe Webhook Handler
 * Processes Stripe webhook events for subscription lifecycle management
 *
 * POST /api/stripe/webhook
 *
 * Events handled:
 * - checkout.session.completed
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.payment_succeeded
 * - invoice.payment_failed
 */

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { PrismaClient } from '@prisma/client';
import { constructWebhookEvent } from '@/lib/stripe';
import { generateActivationToken } from '@/lib/token';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Disable body parsing to get raw body for signature verification
export const runtime = 'nodejs';

export async function POST(request) {
  try {
    // Get raw body as text
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Verify webhook signature and construct event
    let event;
    try {
      event = constructWebhookEvent(body, signature);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Handle checkout.session.completed event
 * Creates subscription record when checkout is completed
 */
async function handleCheckoutSessionCompleted(session) {
  console.log('Processing checkout.session.completed:', session.id);

  // Handle Auction Claims (One-time payment)
  if (session.mode === 'payment' && session.metadata?.type === 'auction_claim') {
    await handleAuctionClaimSuccess(session);
    return;
  }

  // Handle Subscriptions (Existing logic)
  const customerId = session.customer;
  const subscriptionId = session.subscription;
  const countyId = parseInt(session.metadata.countyId);
  const offerId = parseInt(session.metadata.offerId);

  // Find user by Stripe customer ID
  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    console.error('User not found for customer:', customerId);
    return;
  }

  // Get offer details
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
  });

  if (!offer) {
    console.error('Offer not found:', offerId);
    return;
  }

  // Calculate dates
  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1);

  // Create subscription record
  await prisma.subscription.create({
    data: {
      userId: user.id,
      countyId: countyId,
      offerId: offerId,
      startDate: startDate,
      endDate: endDate,
      status: 'active',
      stripeSubscriptionId: subscriptionId,
    },
  });

  // Award Credits based on Tier
  const credits = getCreditsForTier(offer.tierLevel);
  if (credits > 0) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        credits: { increment: credits },
      },
    });

    // Log transaction
    await prisma.creditTransaction.create({
      data: {
        userId: user.id,
        amount: credits,
        reason: 'subscription_start',
        auctionId: null,
      },
    });
    console.log(`Awarded ${credits} credits to user ${user.id} (Tier ${offer.tierLevel})`);
  }

  // Update county status based on tier level
  if (offer.tierLevel === 3) {
    // Pro plan - fully lock the county
    await prisma.county.update({
      where: { id: countyId },
      data: { status: 'fully_locked' },
    });
  } else {
    // Basic or Plus - partially lock
    await prisma.county.update({
      where: { id: countyId },
      data: { status: 'partially_locked' },
    });
  }

  console.log(`Subscription created for user ${user.id}, county ${countyId}`);

  // --- CROSS-APP ACTIVATION (Added) ---
  // Generate Activation Token so subscriber can log in to Main App
  // Pass credits to the token so they are applied on Main App activation
  const creditAmount = getCreditsForTier(offer.tierLevel);
  // Default to 30 days expiration for monthly subscriptions which is standard for this app
  const expirationDays = 30;
  const token = generateActivationToken(user, creditAmount, { expiresInDays: expirationDays });

  const mainAppUrl = process.env.MAIN_APP_URL || 'http://localhost:3001';
  const activationUrl = `${mainAppUrl}/auth/activate?token=${token}`;

  console.log('\n================================================================================');
  console.log('SUBSCRIPTION ACTIVATION URL');
  console.log('--------------------------------------------------------------------------------');
  console.log('User:', user.email);
  console.log('ACTIVATION URL:', activationUrl);
  console.log('================================================================================\n');

  console.log('✅ Stateless activation token generated for subscription');

  // Fetch county for email
  const county = await prisma.county.findUnique({ where: { id: countyId } });

  // Send Activation Email
  try {
    const { sendActivationEmail, sendSubscriptionConfirmationEmail } = await import('@/lib/email');

    await sendActivationEmail(
      user.email,
      user.firstName || 'Subscriber',
      activationUrl
    );
    console.log('✅ Activation email sent to subscriber');

    // Also send subscription confirmation with details
    await sendSubscriptionConfirmationEmail(
      user.email,
      user.firstName || 'Subscriber',
      county?.name || 'your county',
      offer.name || `Tier ${offer.tierLevel}`,
      creditAmount
    );
    console.log('✅ Subscription confirmation email sent');
  } catch (emailError) {
    console.error('Failed to send activation email:', emailError);
  }
}

/**
 * Handle successful auction claim payment
 */
async function handleAuctionClaimSuccess(session) {
  const userId = parseInt(session.metadata.userId);
  const auctionId = parseInt(session.metadata.auctionId);
  const pricePaid = parseFloat(session.metadata.pricePaid);

  console.log(`Processing auction claim: User ${userId}, Auction ${auctionId}, Price $${pricePaid}`);

  // 1. Create Claim
  try {
    await prisma.claimedAuction.create({
      data: {
        userId: userId,
        auctionId: auctionId,
        pricePaid: pricePaid
      }
    });
    console.log('✅ Auction claimed successfully in DB');
  } catch (error) {
    // Ignore unique constraint errors if webhook fires twice
    if (error.code !== 'P2002') {
      console.error('Error creating claimed auction:', error);
      throw error;
    }
    console.log('⚠️ Auction already claimed (duplicate webhook)');
  }

  // 2. Log Credit Transaction (Bonus)
  // Check if user already got bonus? For now just give it.
  await prisma.creditTransaction.create({
    data: {
      userId: userId,
      amount: 500,
      reason: 'signup_bonus',
      auctionId: auctionId
    }
  });

  console.log('✅ Bonus credits awarded');

  // 3. Generate Activation Token (Cross-App Auth - Stateless)
  // We use a signed token so the Main App can verify it without DB access
  const secret = process.env.CROSS_APP_SECRET || 'temporary-dev-secret-change-me';
  const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

  // Need to fetch user first to get email for the token
  const user = await prisma.user.findUnique({ where: { id: userId } });

  let token = '';

  if (user) {
    // Pass 500 bonus credits to the token
    token = generateActivationToken(user, 500);

    const mainAppUrl = process.env.MAIN_APP_URL || 'http://localhost:3001';
    const activationUrl = `${mainAppUrl}/auth/activate?token=${token}`;

    console.log('\n================================================================================');
    console.log('AUCTION CLAIM ACTIVATION URL');
    console.log('--------------------------------------------------------------------------------');
    console.log('User:', user.email);
    console.log('ACTIVATION URL:', activationUrl);
    console.log('================================================================================\n');

    console.log('✅ Stateless activation token generated');
  }

  // Fetch auction details for sync
  const auction = await prisma.auction.findUnique({ where: { id: auctionId } });

  // 4. Send Confirmation & Activation Email
  try {
    if (user && auction && token) {
      const { sendActivationEmail, sendAuctionClaimEmail } = await import('@/lib/email');

      // Send classic confirmation
      await sendAuctionClaimEmail(
        user.email,
        user.firstName || 'User',
        auction.title,
        auction.url,
        false // Not free
      );

      // Send Activation "Magic Link"
      // Use MAIN_APP_URL to point to the other application
      const mainAppUrl = process.env.MAIN_APP_URL || 'http://localhost:3001';
      const activationUrl = `${mainAppUrl}/auth/activate?token=${token}`;

      await sendActivationEmail(
        user.email,
        user.firstName || 'User',
        activationUrl
      );

      console.log('✅ Activation & Confirmation emails sent');
    }
  } catch (emailError) {
    console.error('Failed to send confirmation emails:', emailError);
  }

  // 5. Direct sync to Main App (in addition to token)
  try {
    const mainAppUrl = process.env.MAIN_APP_URL || 'http://localhost:3001';
    const secret = process.env.CROSS_APP_SECRET || 'temporary-dev-secret-change-me';

    console.log('Syncing paid auction claim to Main App...');
    const syncResponse = await fetch(`${mainAppUrl}/api/internal/provision-trial`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret,
        email: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
        credits: 500,
        auction: auction ? {
          url: auction.url,
          title: auction.title,
          itemCount: auction.itemCount
        } : null
      })
    });

    if (syncResponse.ok) {
      console.log('✅ Successfully synced paid claim to Main App');
    } else {
      console.error('❌ Failed to sync to Main App:', await syncResponse.text());
    }
  } catch (syncError) {
    console.error('❌ Error syncing to Main App:', syncError);
  }
}

/**
 * Handle customer.subscription.created event
 */
async function handleSubscriptionCreated(subscription) {
  console.log('Processing customer.subscription.created:', subscription.id);

  // Update subscription with Stripe details
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: subscription.status === 'active' ? 'active' : 'inactive',
      stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });
}

/**
 * Handle customer.subscription.updated event
 */
async function handleSubscriptionUpdated(subscription) {
  console.log('Processing customer.subscription.updated:', subscription.id);

  const dbSubscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
    include: { county: true, offer: true },
  });

  if (!dbSubscription) {
    console.error('Subscription not found in database:', subscription.id);
    return;
  }

  // Update subscription status
  const newStatus = subscription.status === 'active' ? 'active' : 'inactive';

  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: newStatus,
      stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
      endDate: new Date(subscription.current_period_end * 1000),
    },
  });

  // If subscription became inactive, potentially update county status
  if (newStatus === 'inactive') {
    await updateCountyStatusOnCancellation(dbSubscription.countyId);
  }
}

/**
 * Handle customer.subscription.deleted event
 */
async function handleSubscriptionDeleted(subscription) {
  console.log('Processing customer.subscription.deleted:', subscription.id);

  const dbSubscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
    include: { user: true, county: true },
  });

  if (!dbSubscription) {
    console.error('Subscription not found in database:', subscription.id);
    return;
  }

  // Mark subscription as cancelled
  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: { status: 'cancelled' },
  });

  // Update county status
  await updateCountyStatusOnCancellation(dbSubscription.countyId);

  // Send cancellation confirmation email
  try {
    if (dbSubscription.user) {
      const { sendCancellationEmail } = await import('@/lib/email');
      const endDate = dbSubscription.endDate || new Date();
      const countyName = dbSubscription.county?.name || 'your county';

      await sendCancellationEmail(
        dbSubscription.user.email,
        dbSubscription.user.firstName || 'Subscriber',
        countyName,
        endDate
      );
      console.log('✅ Cancellation email sent to:', dbSubscription.user.email);
    }
  } catch (emailError) {
    console.error('Failed to send cancellation email:', emailError);
  }
}

/**
 * Handle invoice.payment_succeeded event
 */
async function handlePaymentSucceeded(invoice) {
  console.log('Processing invoice.payment_succeeded:', invoice.id);

  if (!invoice.subscription) {
    return;
  }

  // Update subscription end date based on the invoice period
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: invoice.subscription },
    data: {
      stripeCurrentPeriodEnd: new Date(invoice.period_end * 1000),
      endDate: new Date(invoice.period_end * 1000),
      status: 'active',
    },
  });

  // Award Credits on Renewal
  // Need to find the subscription first to get the Offer/Tier
  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: invoice.subscription },
    include: { offer: true, user: true, county: true },
  });

  if (subscription && subscription.offer) {
    const credits = getCreditsForTier(subscription.offer.tierLevel);
    if (credits > 0) {
      await prisma.user.update({
        where: { id: subscription.userId },
        data: {
          credits: { increment: credits },
        },
      });

      // Log transaction
      await prisma.creditTransaction.create({
        data: {
          userId: subscription.userId,
          amount: credits,
          reason: 'subscription_renewal',
          auctionId: null,
        },
      });
      console.log(`Awarded ${credits} renewal credits to user ${subscription.userId} (Tier ${subscription.offer.tierLevel})`);

      // Send Renewal Confirmation Email with balance
      try {
        const { sendRenewalConfirmationEmail } = await import('@/lib/email');
        const updatedUser = await prisma.user.findUnique({ where: { id: subscription.userId } });
        const currentBalance = updatedUser?.credits || credits;
        const countyName = subscription.county?.name || 'your county';

        await sendRenewalConfirmationEmail(
          subscription.user.email,
          subscription.user.firstName || 'Subscriber',
          countyName,
          credits,
          currentBalance
        );
        console.log('✅ Renewal confirmation email sent');
      } catch (emailError) {
        console.error('Failed to send renewal email:', emailError);
      }
    }
  }
}

/**
 * Handle invoice.payment_failed event
 */
async function handlePaymentFailed(invoice) {
  console.log('Processing invoice.payment_failed:', invoice.id);

  if (!invoice.subscription) {
    return;
  }

  // Mark subscription as payment failed (optional: add grace period)
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: invoice.subscription },
    data: { status: 'past_due' },
  });

  // Send immediate payment failed email
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: invoice.subscription },
      include: { user: true },
    });

    if (subscription && subscription.user) {
      const { sendPaymentFailedEmail } = await import('@/lib/email');

      // Create Stripe billing portal URL for retry
      const stripe = (await import('stripe')).default;
      const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY);
      const portalSession = await stripeClient.billingPortal.sessions.create({
        customer: subscription.user.stripeCustomerId,
        return_url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      });

      await sendPaymentFailedEmail(
        subscription.user.email,
        subscription.user.firstName || 'Subscriber',
        portalSession.url
      );
      console.log('✅ Payment failed email sent to:', subscription.user.email);
    }
  } catch (emailError) {
    console.error('Failed to send payment failed email:', emailError);
  }
}

/**
 * Update county status when a subscription is cancelled
 * Checks remaining active subscriptions to determine new status
 */
async function updateCountyStatusOnCancellation(countyId) {
  // Check if there are any other active subscriptions for this county
  const activeSubscriptions = await prisma.subscription.findMany({
    where: {
      countyId: countyId,
      status: 'active',
    },
    include: { offer: true },
  });

  if (activeSubscriptions.length === 0) {
    // No active subscriptions - check if there's a trial
    const trial = await prisma.trialRegistration.findUnique({
      where: { countyId: countyId },
    });

    if (trial && trial.status === 'active') {
      await prisma.county.update({
        where: { id: countyId },
        data: { status: 'partially_locked' },
      });
    } else {
      await prisma.county.update({
        where: { id: countyId },
        data: { status: 'available' },
      });
    }
  } else {
    // Check if any active subscription is Pro tier
    const hasProSubscription = activeSubscriptions.some(
      sub => sub.offer.tierLevel === 3
    );

    if (hasProSubscription) {
      await prisma.county.update({
        where: { id: countyId },
        data: { status: 'fully_locked' },
      });
    } else {
      await prisma.county.update({
        where: { id: countyId },
        data: { status: 'partially_locked' },
      });
    }
  }
}

/**
 * Get credit amount based on pricing model
 * All tiers now include 100 base items (credits)
 * Additional items are charged at $0.10/item via Main App top-up
 */
function getCreditsForTier(tierLevel) {
  // Return 100 credits for all valid tiers
  if (tierLevel >= 1 && tierLevel <= 3) {
    return 100;
  }
  return 0;
}
