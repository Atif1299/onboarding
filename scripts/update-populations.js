
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting population update...\n');

    // Paths
    const countiesDataPath = path.join(__dirname, '../src/data/us-states-counties.json');
    const populationDataPath = path.join(__dirname, '../src/data/county-populations.json');

    if (!fs.existsSync(populationDataPath)) {
        console.error('❌ Population data file not found!');
        process.exit(1);
    }

    const countiesData = JSON.parse(fs.readFileSync(countiesDataPath, 'utf8'));
    const populationData = JSON.parse(fs.readFileSync(populationDataPath, 'utf8'));

    console.log('   Loaded population data.');

    // Get States to map IDs
    const states = await prisma.state.findMany();
    const stateMap = {}; // Abbr -> ID
    const stateNameMap = {}; // Abbr -> Full Name

    states.forEach(state => {
        stateMap[state.abbreviation] = state.id;
        stateNameMap[state.abbreviation] = state.name;
    });

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const [abbreviation, counties] of Object.entries(countiesData)) {
        const stateId = stateMap[abbreviation];
        const stateName = stateNameMap[abbreviation];

        if (!stateId) {
            console.warn(`⚠️  State ID not found for abbreviation: ${abbreviation}`);
            continue;
        }

        console.log(`Processing ${abbreviation}...`);

        for (const countyName of counties) {
            // Logic from seed.js to find population
            let population = 0;
            const statePopData = populationData[stateName] || {};

            // Strategy 1: Direct match
            if (statePopData[countyName]) {
                population = statePopData[countyName];
            }
            // Strategy 2: Append " County"
            else if (statePopData[`${countyName} County`]) {
                population = statePopData[`${countyName} County`];
            }
            // Strategy 3: Handle Virginia Independent Cities
            else if (stateName === 'Virginia' && countyName.includes('(Independent City)')) {
                const cityName = countyName.replace(' (Independent City)', ' city');
                if (statePopData[cityName]) {
                    population = statePopData[cityName];
                }
            }
            // Strategy 4: Handle Louisiana Parishes
            else if (stateName === 'Louisiana' && !countyName.includes('Parish')) {
                if (statePopData[`${countyName} Parish`]) {
                    population = statePopData[`${countyName} Parish`];
                }
            }
            // Strategy 5: Alaska Boroughs/Census Areas
            else if (stateName === 'Alaska') {
                const suffixes = [' Borough', ' Census Area', ' Municipality', ' City and Borough'];
                for (const suffix of suffixes) {
                    if (statePopData[`${countyName}${suffix}`]) {
                        population = statePopData[`${countyName}${suffix}`];
                        break;
                    }
                }
            }

            // If we found a real population, update the DB
            if (population > 0) {
                try {
                    // Find the county first to ensure it exists
                    const county = await prisma.county.findFirst({
                        where: {
                            name: countyName,
                            stateId: stateId
                        }
                    });

                    if (county) {
                        // Only update if changed
                        if (county.population !== population) {
                            await prisma.county.update({
                                where: { id: county.id },
                                data: { population: population }
                            });
                            updatedCount++;
                        } else {
                            skippedCount++;
                        }
                    } else {
                        // console.warn(`   ⚠️ County not found in DB: ${countyName}, ${stateName}`);
                        errorCount++;
                    }
                } catch (e) {
                    console.error(`   ❌ Error updating ${countyName}, ${stateName}: ${e.message}`);
                    errorCount++;
                }
            }
        }
    }

    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║     POPULATION UPDATE COMPLETE! ✅         ║');
    console.log('╚════════════════════════════════════════════╝\n');
    console.log(`  Updated: ${updatedCount}`);
    console.log(`  Skipped (No Change): ${skippedCount}`);
    console.log(`  Errors/Missing: ${errorCount}`);
}

main()
    .catch((e) => {
        console.error('❌ Error updating populations:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
