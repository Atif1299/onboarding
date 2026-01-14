import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const email = 'picwellwisher12pk@gmail.com';
    console.log(`Checking for user: ${email}`);

    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            subscriptions: true,
            claimedAuctions: true
        }
    });

    if (!user) {
        console.log('User not found!');
    } else {
        console.log('User found:', user.id);
        console.log('Stripe Customer ID:', user.stripeCustomerId);
        console.log('Subscriptions:', user.subscriptions);
        console.log('Claims:', user.claimedAuctions);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
