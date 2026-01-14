import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mimic the path logic in seed.js (which is in prisma/ folder, so one level deeper than scripts/)
// scripts/ is at root level. prisma/ is at root level.
// So from scripts/, we go ../src/data
// From prisma/, we go ../src/data
// Let's verify the path relative to THIS script first.
const dataPath = path.join(__dirname, '../src/data/county-populations.json');

console.log(`Checking for data file at: ${dataPath}`);

if (fs.existsSync(dataPath)) {
    console.log('✅ File exists.');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    console.log(`Loaded data for ${Object.keys(data).length} states.`);

    // Check Alabama
    if (data['Alabama']) {
        console.log('✅ Found Alabama data.');
        console.log('Keys for Alabama:', Object.keys(data['Alabama']).slice(0, 5));

        const testCounty = 'Autauga';
        const testKey = `${testCounty} County`;
        console.log(`Checking '${testKey}':`, data['Alabama'][testKey]);
    } else {
        console.error('❌ Alabama data missing!');
    }

    // Check California
    if (data['California']) {
        const laKey = 'Los Angeles County';
        console.log(`Checking '${laKey}':`, data['California'][laKey]);
    }

} else {
    console.error('❌ File NOT found.');
}
