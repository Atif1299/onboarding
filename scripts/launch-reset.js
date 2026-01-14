
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting Launch Reset...');

    // 1. Reset all counties to 'available'
    console.log('🔓 Unlocking all counties...');
    const updatedCounties = await prisma.county.updateMany({
        data: {
            status: 'available',
            // Optional: reset free trial counts if desired, but user focused on "locks and subscriptions"
            // freeTrialCount: 0
        }
    });
    console.log(`✅ ${updatedCounties.count} counties marked as available.`);

    // 2. Remove all Subscriptions
    console.log('🗑️  Deleting all subscriptions...');
    const deletedSubs = await prisma.subscription.deleteMany();
    console.log(`✅ ${deletedSubs.count} subscriptions deleted.`);

    // 3. Remove all Claimed Auctions (These act as locks on auctions)
    console.log('🗑️  Deleting all claimed auctions (releasing auction locks)...');
    const deletedClaims = await prisma.claimedAuction.deleteMany();
    console.log(`✅ ${deletedClaims.count} claimed auctions deleted.`);

    // 4. Remove all Trial Registrations
    console.log('🗑️  Deleting all trial registrations...');
    const deletedTrials = await prisma.trialRegistration.deleteMany();
    console.log(`✅ ${deletedTrials.count} trial registrations deleted.`);

    console.log('\n✨ Launch Reset Complete! All systems go. ✨');
}

main()
    .catch((e) => {
        console.error('❌ Error during reset:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
