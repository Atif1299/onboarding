import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyPopulations() {
    console.log('🔍 Verifying County Populations...\n');

    // List of counties to check (mix of large and small)
    const checks = [
        { name: 'Los Angeles', stateAbbr: 'CA' },
        { name: 'Cook', stateAbbr: 'IL' },
        { name: 'Harris', stateAbbr: 'TX' },
        { name: 'Autauga', stateAbbr: 'AL' },
        { name: 'Loving', stateAbbr: 'TX' } // Very small county
    ];

    for (const check of checks) {
        const state = await prisma.state.findUnique({
            where: { abbreviation: check.stateAbbr }
        });

        if (!state) {
            console.log(`❌ State ${check.stateAbbr} not found`);
            continue;
        }

        const county = await prisma.county.findFirst({
            where: {
                name: check.name,
                stateId: state.id
            }
        });

        if (county) {
            console.log(`📍 ${county.name} County, ${check.stateAbbr}:`);
            console.log(`   Population: ${county.population?.toLocaleString()}`);
            console.log(`   Status: ${county.status}`);
            console.log('-----------------------------------');
        } else {
            console.log(`❌ County ${check.name}, ${check.stateAbbr} not found`);
        }
    }
}

verifyPopulations()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
