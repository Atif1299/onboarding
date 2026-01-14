import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CENSUS_API_URL = 'https://api.census.gov/data/2020/dec/pl?get=P1_001N,NAME&for=county:*';
const OUTPUT_FILE = path.join(__dirname, '../src/data/county-populations.json');

async function fetchCensusData() {
    console.log('Fetching county population data from US Census Bureau...');

    try {
        const response = await fetch(CENSUS_API_URL);
        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        // Data format is array of arrays:
        // [ ["P1_001N", "NAME", "state", "county"], ["58805", "Autauga County, Alabama", "01", "001"], ... ]

        const headers = data[0];
        const rows = data.slice(1);

        const populationMap = {};

        rows.forEach(row => {
            const population = parseInt(row[0], 10);
            const fullName = row[1]; // "Autauga County, Alabama"

            // Parse "County, State"
            const parts = fullName.split(', ');
            if (parts.length === 2) {
                const countyName = parts[0];
                const stateName = parts[1];

                if (!populationMap[stateName]) {
                    populationMap[stateName] = {};
                }

                // Normalize county name (remove " County" or " Parish" suffix if needed,
                // but my seed script might expect full names. Let's keep it raw for now
                // and handle matching in the seed script).
                // Actually, looking at standard lists, they usually include "County".
                // Let's store it by the full county name key.
                populationMap[stateName][countyName] = population;
            }
        });

        // Ensure directory exists
        const dir = path.dirname(OUTPUT_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(populationMap, null, 2));
        console.log(`✅ Successfully saved population data to ${OUTPUT_FILE}`);
        console.log(`   Processed ${rows.length} counties.`);

    } catch (error) {
        console.error('❌ Error fetching census data:', error);
        process.exit(1);
    }
}

fetchCensusData();
