# Stripe Payment Integration Guide

Complete guide for Stripe payment integration in the County Subscription Availability Checker.

---

## Table of Contents

1. [Overview](#overview)
2. [Setup Instructions](#setup-instructions)
3. [Environment Variables](#environment-variables)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Webhook Configuration](#webhook-configuration)
7. [Testing](#testing)
8. [Deployment](#deployment)

---

## Overview

This project integrates Stripe for handling subscription payments with the following features:

- **Stripe Checkout** - Hosted payment page for subscriptions
- **Webhook Handlers** - Automatic subscription lifecycle management
- **Customer Portal** - Self-service subscription management
- **Database Sync** - Stripe data synchronized with PostgreSQL

### Payment Flow

```
User clicks "Get Started" → Authentication Check → Stripe Checkout → Payment → Webhook → Database Update → Success Page
```

---

## Setup Instructions

### 1. Install Dependencies

Stripe package is already installed:

```bash
bun add stripe
```

### 2. Configure Environment Variables

Copy `.env.local.example` to `.env.local` and add your Stripe keys:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Get your Stripe keys:**
1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy the **Secret key** (starts with `sk_test_`)
3. Copy the **Publishable key** (starts with `pk_test_`)

### 3. Update Database Schema

The database schema has been updated with Stripe-related fields:

```bash
npx prisma db push
```

**New fields added:**
- `users.stripe_customer_id` - Stripe customer ID
- `offers.stripe_product_id` - Stripe product ID
- `offers.stripe_price_id` - Stripe price ID
- `subscriptions.stripe_subscription_id` - Stripe subscription ID
- `subscriptions.stripe_current_period_end` - Subscription period end date

### 4. Sync Products to Stripe

Run the sync script to create Stripe products and prices:

```bash
node scripts/sync-stripe-products.js
```

This will:
- Create Stripe products for each offer (Basic, Plus, Pro)
- Create monthly recurring prices
- Update the database with Stripe IDs

**Expected Output:**
```
🔄 Starting Stripe products sync...

Found 3 offers in database

Processing: Basic (Tier 1)
  ✓ Created Stripe product: prod_ABC123
  ✓ Created Stripe price: price_XYZ789
  ✓ Price: $49/month
  ✓ Updated database for offer ID: 1

...

✅ Stripe products sync completed!
```

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `STRIPE_SECRET_KEY` | Stripe secret API key | `sk_test_...` |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | `pk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | `whsec_...` |
| `NEXT_PUBLIC_APP_URL` | Your app URL | `http://localhost:3000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |
| `NEXTAUTH_SECRET` | NextAuth secret | Generate with `openssl rand -base64 32` |

---

## Database Schema

### Updated Models

#### User Model
```prisma
model User {
  id                Int      @id @default(autoincrement())
  email             String   @unique
  stripeCustomerId  String?  @unique @map("stripe_customer_id")
  // ... other fields
}
```

#### Offer Model
```prisma
model Offer {
  id              Int     @id @default(autoincrement())
  name            String
  price           Decimal
  tierLevel       Int
  stripePriceId   String? @unique @map("stripe_price_id")
  stripeProductId String? @unique @map("stripe_product_id")
  // ... other fields
}
```

#### Subscription Model
```prisma
model Subscription {
  id                     Int       @id @default(autoincrement())
  userId                 Int
  countyId               Int
  offerId                Int
  status                 String    @default("active")
  stripeSubscriptionId   String?   @unique @map("stripe_subscription_id")
  stripeCurrentPeriodEnd DateTime? @map("stripe_current_period_end")
  // ... other fields
}
```

---

## API Endpoints

### 1. Create Checkout Session

**Endpoint:** `POST /api/stripe/checkout`

**Authentication:** Required (NextAuth)

**Request Body:**
```json
{
  "offerId": 1,
  "countyId": 123
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "cs_test_abc123",
    "url": "https://checkout.stripe.com/..."
  }
}
```

**Usage in Component:**
```javascript
const response = await fetch('/api/stripe/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ offerId, countyId }),
});

const data = await response.json();
if (data.success) {
  window.location.href = data.data.url;
}
```

---

### 2. Customer Portal

**Endpoint:** `POST /api/stripe/portal`

**Authentication:** Required (NextAuth)

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://billing.stripe.com/..."
  }
}
```

**Usage:**
```javascript
const response = await fetch('/api/stripe/portal', {
  method: 'POST',
});

const data = await response.json();
if (data.success) {
  window.location.href = data.data.url;
}
```

---

### 3. Webhook Handler

**Endpoint:** `POST /api/stripe/webhook`

**Authentication:** Stripe signature verification

**Events Handled:**
- `checkout.session.completed` - Creates subscription in database
- `customer.subscription.created` - Updates subscription details
- `customer.subscription.updated` - Updates subscription status
- `customer.subscription.deleted` - Marks subscription as cancelled
- `invoice.payment_succeeded` - Renews subscription period
- `invoice.payment_failed` - Marks subscription as past_due

---

## Webhook Configuration

### 1. Install Stripe CLI (for local testing)

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe

# Or download from: https://github.com/stripe/stripe-cli/releases
```

### 2. Login to Stripe CLI

```bash
stripe login
```

### 3. Forward Webhooks to Local Server

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

**Output will show your webhook secret:**
```
> Ready! Your webhook signing secret is whsec_abc123...
```

Copy this secret to your `.env.local` file as `STRIPE_WEBHOOK_SECRET`.

### 4. Test Webhook Events

In another terminal, trigger test events:

```bash
# Test successful checkout
stripe trigger checkout.session.completed

# Test subscription creation
stripe trigger customer.subscription.created

# Test payment success
stripe trigger invoice.payment_succeeded
```

### 5. Production Webhook Setup

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter your webhook URL: `https://yourdomain.com/api/stripe/webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the signing secret and add to production environment variables

---

## Testing

### Manual Testing Checklist

#### 1. Product Sync
- [ ] Run `node scripts/sync-stripe-products.js`
- [ ] Verify products created in Stripe Dashboard
- [ ] Verify database updated with Stripe IDs

#### 2. Checkout Flow
- [ ] Click "Get Started" on a pricing card
- [ ] Redirected to login if not authenticated
- [ ] Redirected to Stripe Checkout
- [ ] Complete payment with test card: `4242 4242 4242 4242`
- [ ] Redirected to success page
- [ ] Subscription created in database
- [ ] County status updated

#### 3. Webhook Handling
- [ ] Start webhook forwarding with Stripe CLI
- [ ] Complete a checkout
- [ ] Verify webhook events received
- [ ] Verify database updated correctly

#### 4. Customer Portal
- [ ] Access customer portal
- [ ] View subscription details
- [ ] Update payment method
- [ ] Cancel subscription
- [ ] Verify database updated

### Test Cards

Use these test card numbers in Stripe Checkout:

| Card Number | Description |
|-------------|-------------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 9995` | Declined payment |
| `4000 0025 0000 3155` | Requires authentication (3D Secure) |
| `4000 0000 0000 0341` | Attaches and charges successfully |

**Use any:**
- Future expiry date (e.g., 12/34)
- Any 3-digit CVC
- Any postal code

---

## County Status Logic

The system automatically updates county status based on subscription tier:

```javascript
// Free trial only
if (hasActiveTrial && !hasSubscriptions) {
  status = "partially_locked"
}

// Pro plan active (Tier 3)
if (hasProSubscription) {
  status = "fully_locked"
}

// Basic or Plus plan active (Tier 1 or 2)
if (hasBasicOrPlusSubscription) {
  status = "partially_locked"
}

// No subscriptions or trial
if (!hasAnything) {
  status = "available"
}
```

---

## Pricing Components

### AvailableComponent

Shown when county status is `"available"`:
- Displays free trial option (if not already claimed)
- Shows all 3 paid tiers (Basic, Plus, Pro)
- Payment buttons integrated

### PartiallyLockedComponent

Shown when county status is `"partially_locked"`:
- Shows info banner about unavailable trial
- Shows all 3 paid tiers
- Payment buttons integrated

### FullyLockedComponent

Shown when county status is `"fully_locked"`:
- Shows "County Not Available" message
- No payment options
- "Search Another County" button

---

## Error Handling

### Common Errors

#### 1. Missing Stripe Keys
**Error:** `Stripe: No API key provided`
**Solution:** Add `STRIPE_SECRET_KEY` to `.env.local`

#### 2. Invalid Webhook Signature
**Error:** `Webhook Error: No signatures found`
**Solution:** Add correct `STRIPE_WEBHOOK_SECRET` from Stripe CLI or Dashboard

#### 3. Customer Already Has Subscription
**Error:** `You already have an active subscription for this county`
**Solution:** Check existing subscriptions before allowing new purchases

#### 4. County Fully Locked
**Error:** `County is fully locked and unavailable`
**Solution:** User should select a different county

---

## Deployment

### Production Checklist

- [ ] Replace test API keys with live keys
- [ ] Set up production webhook endpoint
- [ ] Configure webhook signing secret
- [ ] Test in production with live mode
- [ ] Enable Stripe Radar for fraud protection
- [ ] Set up email receipts in Stripe Dashboard
- [ ] Configure billing portal settings

### Environment Variables (Production)

```env
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_PRODUCTION_SECRET
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

---

## File Structure

```
offer-page/
├── app/
│   ├── api/
│   │   └── stripe/
│   │       ├── checkout/
│   │       │   └── route.js          # Checkout session creation
│   │       ├── portal/
│   │       │   └── route.js          # Customer portal
│   │       └── webhook/
│   │           └── route.js          # Webhook event handler
│   ├── checkout/
│   │   ├── success/
│   │   │   └── page.jsx              # Success page
│   │   └── cancel/
│   │       └── page.jsx              # Cancel page
│   └── components/
│       ├── AvailableComponent.jsx     # With payment buttons
│       └── PartiallyLockedComponent.jsx # With payment buttons
├── lib/
│   └── stripe.js                     # Stripe utility functions
├── scripts/
│   └── sync-stripe-products.js       # Product sync script
├── prisma/
│   └── schema.prisma                 # Updated with Stripe fields
└── .env.local.example                # Environment template
```

---

## Support Resources

- **Stripe Documentation:** https://stripe.com/docs
- **Stripe Dashboard:** https://dashboard.stripe.com
- **Stripe CLI:** https://stripe.com/docs/stripe-cli
- **Test Cards:** https://stripe.com/docs/testing
- **Webhooks Guide:** https://stripe.com/docs/webhooks

---

## Next Steps

After completing the integration:

1. **Test thoroughly** in test mode
2. **Set up monitoring** for failed payments
3. **Configure email notifications** for customers
4. **Enable Stripe Radar** for fraud protection
5. **Set up revenue analytics** in Stripe Dashboard
6. **Create customer support workflow** for billing issues

---

## Troubleshooting

### Webhook Not Firing

1. Check Stripe CLI is running: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
2. Verify webhook endpoint is accessible
3. Check webhook logs in Stripe Dashboard

### Payment Not Creating Subscription

1. Check webhook event in Stripe Dashboard
2. Verify `checkout.session.completed` event is being sent
3. Check server logs for errors
4. Verify database connection

### County Status Not Updating

1. Check subscription was created successfully
2. Verify tier level in offer record
3. Check webhook handler logic
4. Review database transaction logs

---

**Last Updated:** 2025-11-14
**Integration Version:** 1.0.0
**Stripe API Version:** 2024-12-18.acacia
