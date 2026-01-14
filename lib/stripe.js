/**
 * Stripe Utility Library
 * Handles all Stripe-related operations including checkout, webhooks, and customer management
 */

import Stripe from 'stripe';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: false,
});

/**
 * Create or retrieve a Stripe customer for a user
 * @param {Object} user - User object with id and email
 * @returns {Promise<string>} Stripe customer ID
 */
export async function getOrCreateStripeCustomer(user) {
  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email: user.email,
    metadata: {
      userId: user.id.toString(),
    },
  });

  return customer.id;
}

/**
 * Create a Stripe Checkout Session for subscription
 * @param {Object} params - Checkout parameters
 * @param {string} params.priceId - Stripe price ID
 * @param {string} params.customerId - Stripe customer ID
 * @param {number} params.countyId - County ID for metadata
 * @param {number} params.offerId - Offer ID for metadata
 * @param {string} params.successUrl - Success redirect URL
 * @param {string} params.cancelUrl - Cancel redirect URL
 * @returns {Promise<Stripe.Checkout.Session>} Checkout session
 */
export async function createCheckoutSession({
  priceId,
  customerId,
  countyId,
  offerId,
  successUrl,
  cancelUrl,
  priceData,
  productData,
}) {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        ...(priceId ? { price: priceId } : {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Subscription',
              ...(productData || {})
            },
            unit_amount: 0,
            recurring: { interval: 'month' },
            ...(priceData || {})
          }
        }),
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      countyId: countyId.toString(),
      offerId: offerId.toString(),
    },
    subscription_data: {
      metadata: {
        countyId: countyId.toString(),
        offerId: offerId.toString(),
      },
    },
  });

  return session;
}

/**
 * Create a customer portal session for subscription management
 * @param {string} customerId - Stripe customer ID
 * @param {string} returnUrl - URL to return to after portal session
 * @returns {Promise<Stripe.BillingPortal.Session>} Portal session
 */
export async function createPortalSession(customerId, returnUrl) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

/**
 * Retrieve a Stripe subscription
 * @param {string} subscriptionId - Stripe subscription ID
 * @returns {Promise<Stripe.Subscription>} Subscription object
 */
export async function getSubscription(subscriptionId) {
  return await stripe.subscriptions.retrieve(subscriptionId);
}

/**
 * Cancel a Stripe subscription
 * @param {string} subscriptionId - Stripe subscription ID
 * @returns {Promise<Stripe.Subscription>} Cancelled subscription
 */
export async function cancelSubscription(subscriptionId) {
  return await stripe.subscriptions.cancel(subscriptionId);
}

/**
 * Construct Stripe webhook event from request
 * @param {string} payload - Raw request body
 * @param {string} signature - Stripe signature header
 * @returns {Stripe.Event} Verified webhook event
 */
export function constructWebhookEvent(payload, signature) {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
}

/**
 * Create a Stripe product
 * @param {Object} params - Product parameters
 * @param {string} params.name - Product name
 * @param {string} params.description - Product description
 * @returns {Promise<Stripe.Product>} Created product
 */
export async function createProduct({ name, description }) {
  return await stripe.products.create({
    name,
    description,
  });
}

/**
 * Create a Stripe price for a product
 * @param {Object} params - Price parameters
 * @param {string} params.productId - Stripe product ID
 * @param {number} params.amount - Amount in cents
 * @param {string} params.currency - Currency code (default: 'usd')
 * @param {string} params.interval - Billing interval ('month' or 'year')
 * @returns {Promise<Stripe.Price>} Created price
 */
export async function createPrice({
  productId,
  amount,
  currency = 'usd',
  interval = 'month',
}) {
  return await stripe.prices.create({
    product: productId,
    unit_amount: Math.round(amount * 100), // Convert to cents
    currency,
    recurring: {
      interval,
    },
  });
}

/**
 * Update a Stripe product
 * @param {string} productId - Stripe product ID
 * @param {Object} params - Update parameters
 * @returns {Promise<Stripe.Product>} Updated product
 */
export async function updateProduct(productId, params) {
  return await stripe.products.update(productId, params);
}

/**
 * Archive a Stripe price (cannot be deleted)
 * @param {string} priceId - Stripe price ID
 * @returns {Promise<Stripe.Price>} Archived price
 */
export async function archivePrice(priceId) {
  return await stripe.prices.update(priceId, { active: false });
}

export default stripe;
