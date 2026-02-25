/**
 * Database Dump Script
 * Exports all data from the current Neon DB so it can be restored to a new one.
 * Run: node dump-db.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function dumpAll() {
  console.log('🔄 Connecting to Neon DB and dumping all data...\n');

  const data = {};

  // Dump all tables in dependency order
  data.states = await prisma.state.findMany();
  console.log(`  States: ${data.states.length}`);

  data.counties = await prisma.county.findMany();
  console.log(`  Counties: ${data.counties.length}`);

  data.zipCodes = await prisma.zipCode.findMany();
  console.log(`  ZipCodes: ${data.zipCodes.length}`);

  data.users = await prisma.user.findMany();
  console.log(`  Users: ${data.users.length}`);

  data.userPasswordResetTokens = await prisma.userPasswordResetToken.findMany();
  console.log(`  UserPasswordResetTokens: ${data.userPasswordResetTokens.length}`);

  data.adminUsers = await prisma.adminUser.findMany();
  console.log(`  AdminUsers: ${data.adminUsers.length}`);

  data.adminActivityLogs = await prisma.adminActivityLog.findMany();
  console.log(`  AdminActivityLogs: ${data.adminActivityLogs.length}`);

  data.passwordResetTokens = await prisma.passwordResetToken.findMany();
  console.log(`  PasswordResetTokens: ${data.passwordResetTokens.length}`);

  data.offers = await prisma.offer.findMany();
  console.log(`  Offers: ${data.offers.length}`);

  data.subscriptions = await prisma.subscription.findMany();
  console.log(`  Subscriptions: ${data.subscriptions.length}`);

  data.trialRegistrations = await prisma.trialRegistration.findMany();
  console.log(`  TrialRegistrations: ${data.trialRegistrations.length}`);

  data.auctions = await prisma.auction.findMany();
  console.log(`  Auctions: ${data.auctions.length}`);

  data.claimedAuctions = await prisma.claimedAuction.findMany();
  console.log(`  ClaimedAuctions: ${data.claimedAuctions.length}`);

  data.creditTransactions = await prisma.creditTransaction.findMany();
  console.log(`  CreditTransactions: ${data.creditTransactions.length}`);

  // Also try NextAuth tables
  try {
    data.accounts = await prisma.account.findMany();
    console.log(`  Accounts (NextAuth): ${data.accounts.length}`);
  } catch (e) { data.accounts = []; }

  try {
    data.sessions = await prisma.session.findMany();
    console.log(`  Sessions (NextAuth): ${data.sessions.length}`);
  } catch (e) { data.sessions = []; }

  // Write to file
  const filename = 'db-backup.json';
  fs.writeFileSync(filename, JSON.stringify(data, null, 2));

  const totalRecords = Object.values(data).reduce((sum, arr) => sum + arr.length, 0);
  console.log(`\n✅ Dump complete! ${totalRecords} total records saved to ${filename}`);
  console.log(`   File size: ${(fs.statSync(filename).size / 1024).toFixed(1)} KB`);

  await prisma.$disconnect();
}

dumpAll().catch((e) => {
  console.error('❌ Error:', e);
  prisma.$disconnect();
  process.exit(1);
});
