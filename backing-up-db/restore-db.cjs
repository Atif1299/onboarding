/**
 * Database Restore Script
 * Restores data from db-backup.json to the NEW Neon DB.
 * 
 * BEFORE running this:
 * 1. Update DATABASE_URL in .env to point to your NEW Neon DB
 * 2. Run: npx prisma db push   (to create the tables)
 * 3. Then run: node restore-db.cjs
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function restoreAll() {
  const data = JSON.parse(fs.readFileSync('db-backup.json', 'utf-8'));
  console.log('🔄 Restoring data to NEW database...\n');

  // Restore in dependency order (parents first, then children)

  // 1. States
  if (data.states.length > 0) {
    for (const s of data.states) {
      await prisma.state.upsert({
        where: { id: s.id },
        update: s,
        create: s,
      });
    }
    console.log(`  ✅ States: ${data.states.length}`);
  }

  // 2. Counties
  if (data.counties.length > 0) {
    // Batch insert for speed
    const batchSize = 100;
    for (let i = 0; i < data.counties.length; i += batchSize) {
      const batch = data.counties.slice(i, i + batchSize);
      for (const c of batch) {
        await prisma.county.upsert({
          where: { id: c.id },
          update: c,
          create: c,
        });
      }
    }
    console.log(`  ✅ Counties: ${data.counties.length}`);
  }

  // 3. ZipCodes
  if (data.zipCodes.length > 0) {
    for (const z of data.zipCodes) {
      await prisma.zipCode.upsert({
        where: { id: z.id },
        update: z,
        create: z,
      });
    }
    console.log(`  ✅ ZipCodes: ${data.zipCodes.length}`);
  }

  // 4. Users
  if (data.users.length > 0) {
    for (const u of data.users) {
      await prisma.user.upsert({
        where: { id: u.id },
        update: u,
        create: u,
      });
    }
    console.log(`  ✅ Users: ${data.users.length}`);
  }

  // 5. UserPasswordResetTokens
  if (data.userPasswordResetTokens.length > 0) {
    for (const t of data.userPasswordResetTokens) {
      await prisma.userPasswordResetToken.upsert({
        where: { id: t.id },
        update: t,
        create: t,
      });
    }
    console.log(`  ✅ UserPasswordResetTokens: ${data.userPasswordResetTokens.length}`);
  }

  // 6. AdminUsers
  if (data.adminUsers.length > 0) {
    for (const a of data.adminUsers) {
      await prisma.adminUser.upsert({
        where: { id: a.id },
        update: a,
        create: a,
      });
    }
    console.log(`  ✅ AdminUsers: ${data.adminUsers.length}`);
  }

  // 7. AdminActivityLogs
  if (data.adminActivityLogs.length > 0) {
    for (const log of data.adminActivityLogs) {
      await prisma.adminActivityLog.upsert({
        where: { id: log.id },
        update: log,
        create: log,
      });
    }
    console.log(`  ✅ AdminActivityLogs: ${data.adminActivityLogs.length}`);
  }

  // 8. PasswordResetTokens
  if (data.passwordResetTokens.length > 0) {
    for (const t of data.passwordResetTokens) {
      await prisma.passwordResetToken.upsert({
        where: { id: t.id },
        update: t,
        create: t,
      });
    }
    console.log(`  ✅ PasswordResetTokens: ${data.passwordResetTokens.length}`);
  }

  // 9. Offers
  if (data.offers.length > 0) {
    for (const o of data.offers) {
      await prisma.offer.upsert({
        where: { id: o.id },
        update: o,
        create: o,
      });
    }
    console.log(`  ✅ Offers: ${data.offers.length}`);
  }

  // 10. Subscriptions
  if (data.subscriptions.length > 0) {
    for (const s of data.subscriptions) {
      await prisma.subscription.upsert({
        where: { id: s.id },
        update: s,
        create: s,
      });
    }
    console.log(`  ✅ Subscriptions: ${data.subscriptions.length}`);
  }

  // 11. TrialRegistrations
  if (data.trialRegistrations.length > 0) {
    for (const t of data.trialRegistrations) {
      await prisma.trialRegistration.upsert({
        where: { id: t.id },
        update: t,
        create: t,
      });
    }
    console.log(`  ✅ TrialRegistrations: ${data.trialRegistrations.length}`);
  }

  // 12. Auctions
  if (data.auctions.length > 0) {
    for (const a of data.auctions) {
      await prisma.auction.upsert({
        where: { id: a.id },
        update: a,
        create: a,
      });
    }
    console.log(`  ✅ Auctions: ${data.auctions.length}`);
  }

  // 13. ClaimedAuctions
  if (data.claimedAuctions.length > 0) {
    for (const c of data.claimedAuctions) {
      await prisma.claimedAuction.upsert({
        where: { id: c.id },
        update: c,
        create: c,
      });
    }
    console.log(`  ✅ ClaimedAuctions: ${data.claimedAuctions.length}`);
  }

  // 14. CreditTransactions
  if (data.creditTransactions.length > 0) {
    for (const c of data.creditTransactions) {
      await prisma.creditTransaction.upsert({
        where: { id: c.id },
        update: c,
        create: c,
      });
    }
    console.log(`  ✅ CreditTransactions: ${data.creditTransactions.length}`);
  }

  // 15. Reset auto-increment sequences to max ID + 1
  console.log('\n  🔧 Resetting ID sequences...');
  const tables = [
    { name: 'users', col: 'user_id' },
    { name: 'user_password_reset_tokens', col: 'token_id' },
    { name: 'admin_users', col: 'admin_id' },
    { name: 'admin_activity_log', col: 'log_id' },
    { name: 'password_reset_tokens', col: 'token_id' },
    { name: 'states', col: 'state_id' },
    { name: 'counties', col: 'county_id' },
    { name: 'zip_codes', col: 'zip_id' },
    { name: 'offers', col: 'offer_id' },
    { name: 'subscriptions', col: 'subscription_id' },
    { name: 'auctions', col: 'auction_id' },
    { name: 'claimed_auctions', col: 'claimed_auction_id' },
    { name: 'credit_transactions', col: 'transaction_id' },
  ];

  for (const t of tables) {
    try {
      await prisma.$executeRawUnsafe(
        `SELECT setval(pg_get_serial_sequence('${t.name}', '${t.col}'), COALESCE((SELECT MAX(${t.col}) FROM ${t.name}), 1))`
      );
    } catch (e) {
      // Some tables may not have sequences — ignore
    }
  }

  const totalRecords = Object.values(data).reduce((sum, arr) => sum + arr.length, 0);
  console.log(`\n✅ Restore complete! ${totalRecords} total records restored.`);

  await prisma.$disconnect();
}

restoreAll().catch((e) => {
  console.error('❌ Error:', e);
  prisma.$disconnect();
  process.exit(1);
});
