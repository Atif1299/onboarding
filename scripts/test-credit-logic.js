
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('🧪 Simulating Credit Awarding Logic...');

    // 1. Get a test user
    const user = await prisma.user.findFirst();
    if (!user) {
        console.error('No users found to test with.');
        return;
    }
    console.log(`Using user: ${user.email} (Current Credits: ${user.credits})`);
    const initialCredits = user.credits;

    // 2. Simulate logic for Tier 2 (Suburban) -> 500 credits
    const tierLevel = 2;
    const creditsToAdd = getCreditsForTier(tierLevel);

    console.log(`Simulating subscription to Tier ${tierLevel} (Should add ${creditsToAdd} credits)`);

    if (creditsToAdd > 0) {
        await prisma.user.update({
            where: { id: user.id },
            data: {
                credits: { increment: creditsToAdd },
            },
        });

        await prisma.creditTransaction.create({
            data: {
                userId: user.id,
                amount: creditsToAdd,
                reason: 'simulation_test',
                auctionId: null,
            },
        });
    }

    // 3. Verify
    const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
    console.log(`Updated User Credits: ${updatedUser.credits}`);

    if (updatedUser.credits === initialCredits + creditsToAdd) {
        console.log('✅ SUCCESS: Credits correctly awarded.');
    } else {
        console.error('❌ FAILURE: Credit mismatch.');
    }
}

function getCreditsForTier(tierLevel) {
    switch (tierLevel) {
        case 1: return 250;
        case 2: return 500;
        case 3: return 1000;
        default: return 0;
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
