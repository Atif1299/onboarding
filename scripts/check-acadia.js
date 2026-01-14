import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAcadia() {
    const county = await prisma.county.findFirst({
        where: { name: 'Acadia Parish' },
        include: { state: true }
    });

    if (county) {
        console.log('Found Acadia Parish:');
        console.log(JSON.stringify(county, null, 2));
    } else {
        console.log('Acadia Parish not found in DB.');
    }
}

checkAcadia()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
