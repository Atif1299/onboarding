# Stripe Integration - Quick Start Guide

Get Stripe payments working in 5 minutes!

---

## Prerequisites

- Stripe account (sign up at https://stripe.com)
- Project running locally
- Database set up and seeded

---

## Step 1: Get Your Stripe API Keys (2 minutes)

1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy these two keys:
   - **Secret key** (starts with `sk_test_`)
   - **Publishable key** (starts with `pk_test_`)

---

## Step 2: Add Keys to Environment File (1 minute)

Edit your `.env.local` file and add:

```env
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Step 3: Sync Products to Stripe (30 seconds)

Run this command to create Stripe products:

```bash
node scripts/sync-stripe-products.js
```

You should see:
```
✅ Stripe products sync completed!
```

---

## Step 4: Test a Payment (1 minute)

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Visit http://localhost:3000

3. Select a state and county

4. Click "Get Started" on any plan

5. Use test card: **4242 4242 4242 4242**
   - Expiry: Any future date (e.g., 12/34)
   - CVC: Any 3 digits (e.g., 123)
   - ZIP: Any code (e.g., 12345)

6. Complete payment

7. You should see the success page!

---

## Step 5: Set Up Webhooks (Optional - for local testing)

### Install Stripe CLI

**macOS:**
```bash
brew install stripe/stripe-cli/stripe
```

**Windows:**
```bash
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

### Forward Webhooks

1. Login to Stripe:
   ```bash
   stripe login
   ```

2. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3002/api/stripe/webhook
   ```

3. Copy the webhook secret (starts with `whsec_`) and add to `.env.local`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
   ```

---

## Verification Checklist

- [ ] Stripe keys added to `.env.local`
- [ ] Product sync script ran successfully
- [ ] Can click "Get Started" button
- [ ] Redirected to Stripe Checkout
- [ ] Test payment completes successfully
- [ ] Redirected to success page
- [ ] Subscription appears in Stripe Dashboard

---

## Where to Find Things

### Stripe Dashboard
- Test payments: https://dashboard.stripe.com/test/payments
- Products: https://dashboard.stripe.com/test/products
- Subscriptions: https://dashboard.stripe.com/test/subscriptions
- Webhooks: https://dashboard.stripe.com/test/webhooks

### Your App
- Checkout API: `app/api/stripe/checkout/route.js`
- Webhook handler: `app/api/stripe/webhook/route.js`
- Success page: `app/checkout/success/page.jsx`

---

## Test Cards

| Card Number | Result |
|-------------|--------|
| `4242 4242 4242 4242` | ✅ Success |
| `4000 0000 0000 9995` | ❌ Declined |
| `4000 0025 0000 3155` | 🔒 Requires 3D Secure |

---

## Common Issues

### "No API key provided"
➡️ Add `STRIPE_SECRET_KEY` to `.env.local`

### "Stripe price not configured"
➡️ Run `node scripts/sync-stripe-products.js`

### "Unauthorized" error
➡️ Make sure you're logged in (NextAuth)

### Webhook not working
➡️ Run `stripe listen --forward-to localhost:3000/api/stripe/webhook`

---

## Next Steps

✅ **You're all set!** Stripe payments are now working.

**For production:**
1. Read [STRIPE_INTEGRATION.md](STRIPE_INTEGRATION.md) for full documentation
2. Replace test keys with live keys
3. Set up production webhooks
4. Test in live mode

---

## Need Help?

- 📖 Full Documentation: [STRIPE_INTEGRATION.md](STRIPE_INTEGRATION.md)
- 🔧 Stripe Docs: https://stripe.com/docs
- 💬 Stripe Support: https://support.stripe.com

---

**Happy coding! 🚀**
