# Product-Led Growth (PLG) Implementation

## Overview

This implementation adds a county-specific auction claiming system that creates restricted free accounts with 500 credits.

## Plan Credit Limits (Monthly)
- **Small (Rural)**: 250 credits
- **Mid (Suburban)**: 500 credits
- **Large (Urban)**: 1000 credits

## What Was Built

### Database Schema
New models added to `prisma/schema.prisma`:
- `Auction` - Tracks HiBid auction URLs by county
- `ClaimedAuction` - Links users to their claimed auctions (one per auction)
- `CreditTransaction` - Audit trail for credit operations

User model extended with:
- `credits` (Int) - User's credit balance
- `userType` (String) - "standard" or "free_claim"

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auctions/check` | POST | Check if auction URL is available |
| `/api/auctions/claim` | POST | Claim auction + create user + add 500 credits |
| `/api/auctions/[countyId]` | GET | List auctions for a county |
| `/api/auctions/[countyId]` | POST | Add auctions (for scraping automation) |
| `/api/credits/balance` | GET | Get user's credit balance and claimed auctions |
| `/api/credits/use` | POST | Use credits (validates auction ownership for free_claim users) |

### Pages & Components

- `/county/[state]/[slug]` - County landing page with auction claiming
- `components/UpsellModal.jsx` - Upgrade prompt for restricted users

---

## Required Manual Change: lib/auth.js

Update the authentication to include `credits` and `userType` in the session.

### Change 1: Update SQL Query (around line 39-41)

**Find:**
```javascript
const result = await client.query(
  'SELECT user_id, email, password_hash, first_name, last_name, phone, address, stripe_customer_id FROM users WHERE email = $1',
  [credentials.email.toLowerCase()]
);
```

**Replace with:**
```javascript
const result = await client.query(
  'SELECT user_id, email, password_hash, first_name, last_name, phone, address, stripe_customer_id, credits, user_type FROM users WHERE email = $1',
  [credentials.email.toLowerCase()]
);
```

### Change 2: Update Return Object (around line 60-70)

**Find:**
```javascript
return {
  id: user.user_id.toString(),
  email: user.email,
  name: user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.email.split('@')[0],
  firstName: user.first_name,
  lastName: user.last_name,
  phone: user.phone,
  address: user.address,
  role: 'user',
  stripeCustomerId: user.stripe_customer_id,
};
```

**Replace with:**
```javascript
return {
  id: user.user_id.toString(),
  email: user.email,
  name: user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.email.split('@')[0],
  firstName: user.first_name,
  lastName: user.last_name,
  phone: user.phone,
  address: user.address,
  role: 'user',
  stripeCustomerId: user.stripe_customer_id,
  credits: user.credits,
  userType: user.user_type,
};
```

### Change 3: Update JWT Callback (around line 156-167)

**Find:**
```javascript
async jwt({ token, user }) {
  if (user) {
    token.id = user.id;
    token.role = user.role;
    token.username = user.username;
    token.adminId = user.id;
    token.firstName = user.firstName;
    token.lastName = user.lastName;
    token.phone = user.phone;
    token.address = user.address;
    token.stripeCustomerId = user.stripeCustomerId;
  }
  return token;
},
```

**Replace with:**
```javascript
async jwt({ token, user }) {
  if (user) {
    token.id = user.id;
    token.role = user.role;
    token.username = user.username;
    token.adminId = user.id;
    token.firstName = user.firstName;
    token.lastName = user.lastName;
    token.phone = user.phone;
    token.address = user.address;
    token.stripeCustomerId = user.stripeCustomerId;
    token.credits = user.credits;
    token.userType = user.userType;
  }
  return token;
},
```

### Change 4: Update Session Callback (around line 170-180)

**Find:**
```javascript
async session({ session, token }) {
  session.user.id = token.id;
  session.user.role = token.role;
  session.user.username = token.username;
  session.user.adminId = token.adminId;
  session.user.firstName = token.firstName;
  session.user.lastName = token.lastName;
  session.user.phone = token.phone;
  session.user.address = token.address;
  session.user.stripeCustomerId = token.stripeCustomerId;
  return session;
},
```

**Replace with:**
```javascript
async session({ session, token }) {
  session.user.id = token.id;
  session.user.role = token.role;
  session.user.username = token.username;
  session.user.adminId = token.adminId;
  session.user.firstName = token.firstName;
  session.user.lastName = token.lastName;
  session.user.phone = token.phone;
  session.user.address = token.address;
  session.user.stripeCustomerId = token.stripeCustomerId;
  session.user.credits = token.credits;
  session.user.userType = token.userType;
  return session;
},
```

---

## Usage

### County Landing Pages

Visit: `/county/{state}/{county-slug}`

Examples:
- `/county/il/cook` - Cook County, Illinois
- `/county/tx/harris` - Harris County, Texas
- `/county/ca/los-angeles` - Los Angeles County, California

### Adding Auctions via API (for automation)

```bash
POST /api/auctions/{countyId}
Content-Type: application/json

{
  "auctions": [
    {
      "url": "https://hibid.com/auction/12345",
      "title": "Estate Sale - Downtown",
      "auctionDate": "2025-12-01T10:00:00Z"
    },
    {
      "url": "https://hibid.com/auction/67890",
      "title": "Business Liquidation",
      "auctionDate": "2025-12-15T09:00:00Z"
    }
  ]
}
```

### User Flow

1. User visits county landing page
2. Pastes HiBid auction URL or clicks "Lock" on listed auction
3. Enters email/phone in modal
4. Account created with:
   - 500 free credits
   - `userType: "free_claim"`
   - Exclusive lock on that auction
5. User can only analyze items from their claimed auction
6. Attempting to analyze other auctions shows upsell modal

---

## n8n Integration

### Webhook for New Signups

Create an n8n workflow triggered by webhook when a user claims an auction.

Call this from the claim endpoint or set up a database trigger.

Payload structure:
```json
{
  "userId": 1,
  "email": "user@example.com",
  "phone": "+1234567890",
  "firstName": "John",
  "lastName": "Doe",
  "credits": 500,
  "auctionId": 1,
  "auctionUrl": "https://hibid.com/auction/12345",
  "countyId": 1,
  "countyName": "Cook",
  "state": "IL"
}
```

### n8n Actions
1. Add contact to ActiveCampaign
2. Apply tags: `Status: Free_Claim`, `County: Cook`, `State: IL`
3. Send welcome email with magic link
4. Track in analytics

---

## Testing

Run tests:
```bash
npm run test
```

The auction claiming tests are in `tests/api/auction-claim.test.js` (20 tests).

---

## Next Steps

1. [ ] Apply the auth.js changes above
2. [ ] Set up n8n webhook workflow
3. [ ] Connect auction scraping automation to POST endpoint
4. [ ] Configure ActiveCampaign email sequences
5. [ ] Add magic link authentication (optional)
6. [ ] Set up SMS verification for phone numbers (optional)

---

## Files Created/Modified

### New Files
- `app/api/auctions/check/route.js`
- `app/api/auctions/claim/route.js`
- `app/api/auctions/[countyId]/route.js`
- `app/api/credits/balance/route.js`
- `app/api/credits/use/route.js`
- `app/county/[state]/[slug]/page.jsx`
- `components/UpsellModal.jsx`
- `tests/api/auction-claim.test.js`

### Modified Files
- `prisma/schema.prisma` - Added new models and User fields
- `lib/auth.js` - Needs manual update (see above)
