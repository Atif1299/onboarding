
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const county = await prisma.county.findFirst({
        include: { state: true }
    });
    console.log(JSON.stringify(county, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
