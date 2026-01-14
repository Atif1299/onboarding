import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  console.log('📊 Current Database Data Coverage:\n');

  const users = await prisma.user.count();
  console.log(`Users: ${users} records`);

  const states = await prisma.state.count();
  console.log(`States: ${states} records`);

  const counties = await prisma.county.count();
  console.log(`Counties: ${counties} records`);

  const offers = await prisma.offer.count();
  console.log(`Offers: ${offers} records`);

  const subscriptions = await prisma.subscription.count();
  console.log(`Subscriptions: ${subscriptions} records`);

  const trials = await prisma.trialRegistration.count();
  console.log(`Trial Registrations: ${trials} records`);

  const admins = await prisma.adminUser.count();
  console.log(`Admin Users: ${admins} records`);

  const adminLogs = await prisma.adminActivityLog.count();
  console.log(`Admin Activity Logs: ${adminLogs} records`);

  const accounts = await prisma.account.count();
  console.log(`Accounts (NextAuth): ${accounts} records`);

  const sessions = await prisma.session.count();
  console.log(`Sessions (NextAuth): ${sessions} records`);

  await prisma.$disconnect();
}

checkData();
