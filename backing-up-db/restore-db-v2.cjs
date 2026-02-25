/**
 * Database Restore Script v2 — Faster with raw SQL batches
 * Restores data from db-backup.json to the NEW Neon DB.
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function restoreAll() {
  const data = JSON.parse(fs.readFileSync('db-backup.json', 'utf-8'));
  console.log('🔄 Restoring data to NEW database...\n');

  // Helper: bulk insert using createMany (skips duplicates)
  async function bulkInsert(modelName, records, label) {
    if (!records || records.length === 0) {
      console.log(`  ⏭ ${label}: 0 records, skipping`);
      return;
    }
    try {
      const result = await prisma[modelName].createMany({
        data: records,
        skipDuplicates: true,
      });
      console.log(`  ✅ ${label}: ${result.count} inserted`);
    } catch (e) {
      console.error(`  ❌ ${label} error:`, e.message);
    }
  }

  // Convert date strings back to Date objects for Prisma
  function fixDates(records, dateFields) {
    return records.map(r => {
      const fixed = { ...r };
      for (const field of dateFields) {
        if (fixed[field]) fixed[field] = new Date(fixed[field]);
      }
      return fixed;
    });
  }

  // 1. States
  await bulkInsert('state', data.states, 'States');

  // 2. Counties
  await bulkInsert('county', data.counties, 'Counties');

  // 3. ZipCodes
  await bulkInsert('zipCode', data.zipCodes, 'ZipCodes');

  // 4. Users
  const users = fixDates(data.users, ['createdAt']);
  await bulkInsert('user', users, 'Users');

  // 5. UserPasswordResetTokens
  const uprts = fixDates(data.userPasswordResetTokens, ['expiresAt', 'usedAt', 'createdAt']);
  await bulkInsert('userPasswordResetToken', uprts, 'UserPasswordResetTokens');

  // 6. AdminUsers
  const admins = fixDates(data.adminUsers, ['createdAt', 'updatedAt', 'lastLogin']);
  await bulkInsert('adminUser', admins, 'AdminUsers');

  // 7. AdminActivityLogs
  const logs = fixDates(data.adminActivityLogs, ['createdAt']);
  await bulkInsert('adminActivityLog', logs, 'AdminActivityLogs');

  // 8. PasswordResetTokens
  const prts = fixDates(data.passwordResetTokens, ['expiresAt', 'usedAt', 'createdAt']);
  await bulkInsert('passwordResetToken', prts, 'PasswordResetTokens');

  // 9. Offers
  await bulkInsert('offer', data.offers, 'Offers');

  // 10. Subscriptions
  const subs = fixDates(data.subscriptions, ['startDate', 'endDate', 'stripeCurrentPeriodEnd']);
  await bulkInsert('subscription', subs, 'Subscriptions');

  // 11. TrialRegistrations
  const trials = fixDates(data.trialRegistrations, ['registrationDate']);
  await bulkInsert('trialRegistration', trials, 'TrialRegistrations');

  // 12. Auctions
  const auctions = fixDates(data.auctions, ['auctionDate', 'createdAt']);
  await bulkInsert('auction', auctions, 'Auctions');

  // 13. ClaimedAuctions
  const claims = fixDates(data.claimedAuctions, ['claimedAt']);
  await bulkInsert('claimedAuction', claims, 'ClaimedAuctions');

  // 14. CreditTransactions
  const txns = fixDates(data.creditTransactions, ['createdAt']);
  await bulkInsert('creditTransaction', txns, 'CreditTransactions');

  // 15. NextAuth tables
  if (data.accounts && data.accounts.length > 0) {
    const accts = fixDates(data.accounts, ['createdAt', 'updatedAt']);
    await bulkInsert('account', accts, 'Accounts (NextAuth)');
  }
  if (data.sessions && data.sessions.length > 0) {
    const sess = fixDates(data.sessions, ['expires', 'createdAt', 'updatedAt']);
    await bulkInsert('session', sess, 'Sessions (NextAuth)');
  }

  // 16. Reset auto-increment sequences
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
    } catch (e) { /* ignore */ }
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
