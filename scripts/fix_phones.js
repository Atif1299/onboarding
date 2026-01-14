const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Checking for users without phone numbers (Raw SQL)...');

    try {
        // Use raw query to bypass strict type validation of the generated client
        // The client thinks phone is required (String), but DB has NULLs.
        // So prisma.user.findMany({ where: { phone: null } }) throws validation error.
        const users = await prisma.$queryRaw`SELECT * FROM "users" WHERE "phone" IS NULL`;

        console.log(`Found ${users.length} users without phone numbers.`);

        for (const user of users) {
            // user_id is the column name in DB (mapped from id in schema)
            const userId = user.user_id;
            // Generate a unique dummy phone number
            const dummyPhone = `+1-555-000-${String(userId).padStart(4, '0')}`;

            console.log(`Updating user ${user.email} (ID: ${userId}) with phone ${dummyPhone}`);

            // Use executeRaw for update
            await prisma.$executeRaw`UPDATE "users" SET "phone" = ${dummyPhone} WHERE "user_id" = ${userId}`;
        }

        console.log('Update complete.');
    } catch (error) {
        console.error('Error executing raw query:', error);
        process.exit(1);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
