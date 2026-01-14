/**
 * Sync Stripe Products and Prices with Database
 *
 * This script creates Stripe products and prices for all offers in the database
 * and updates the database with the Stripe IDs
 *
 * Usage: node scripts/sync-stripe-products.js
 */

import { PrismaClient } from '@prisma/client';
import { createProduct, createPrice } from '../lib/stripe.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient();

async function syncStripeProducts() {
  try {
    console.log('🔄 Starting Stripe products sync...\n');

    // Fetch all offers from database
    const offers = await prisma.offer.findMany({
      orderBy: { tierLevel: 'asc' },
    });

    console.log(`Found ${offers.length} offers in database\n`);

    for (const offer of offers) {
      console.log(`Processing: ${offer.name} (Tier ${offer.tierLevel})`);

      // Skip if already has Stripe IDs
      if (offer.stripeProductId && offer.stripePriceId) {
        console.log(`  ✓ Already synced - Product ID: ${offer.stripeProductId}`);
        console.log(`  ✓ Price ID: ${offer.stripePriceId}\n`);
        continue;
      }

      try {
        // Create Stripe product
        const product = await createProduct({
          name: offer.name,
          description: offer.description || `${offer.name} subscription plan`,
        });

        console.log(`  ✓ Created Stripe product: ${product.id}`);

        // Create Stripe price
        const price = await createPrice({
          productId: product.id,
          amount: parseFloat(offer.price),
          currency: 'usd',
          interval: 'month',
        });

        console.log(`  ✓ Created Stripe price: ${price.id}`);
        console.log(`  ✓ Price: $${offer.price}/month\n`);

        // Update database with Stripe IDs
        await prisma.offer.update({
          where: { id: offer.id },
          data: {
            stripeProductId: product.id,
            stripePriceId: price.id,
          },
        });

        console.log(`  ✓ Updated database for offer ID: ${offer.id}\n`);
      } catch (error) {
        console.error(`  ✗ Error syncing ${offer.name}:`, error.message);
        console.log('');
      }
    }

    console.log('✅ Stripe products sync completed!\n');
    console.log('Summary:');
    console.log('────────────────────────────────────────');

    // Display summary
    const updatedOffers = await prisma.offer.findMany({
      orderBy: { tierLevel: 'asc' },
    });

    updatedOffers.forEach(offer => {
      console.log(`${offer.name}:`);
      console.log(`  Product ID: ${offer.stripeProductId || 'Not set'}`);
      console.log(`  Price ID: ${offer.stripePriceId || 'Not set'}`);
      console.log(`  Price: $${offer.price}/month\n`);
    });

  } catch (error) {
    console.error('❌ Error during sync:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the sync
syncStripeProducts()
  .then(() => {
    console.log('🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Sync failed:', error);
    process.exit(1);
  });
