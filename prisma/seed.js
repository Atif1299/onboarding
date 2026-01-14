import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

// State name to abbreviation mapping
const STATE_ABBREVIATIONS = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
  'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'District of Columbia': 'DC',
  'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL',
  'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA',
  'Maine': 'ME', 'Maryland': 'MD', 'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN',
  'Mississippi': 'MS', 'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
  'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
  'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK', 'Oregon': 'OR',
  'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC', 'South Dakota': 'SD',
  'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT', 'Virginia': 'VA',
  'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY'
};

async function main() {
  console.log('🌱 Starting database seeding with Prisma...\n');

  // Cleanup existing data to ensure updates are applied
  console.log('🧹 Cleaning up existing data...');
  await prisma.subscription.deleteMany();
  await prisma.trialRegistration.deleteMany();
  await prisma.claimedAuction.deleteMany();
  await prisma.auction.deleteMany();
  await prisma.county.deleteMany();
  console.log('✅ Cleanup complete\n');

  // Seed Offers
  console.log('📦 Seeding Offers...');
  await prisma.offer.createMany({
    data: [
      { name: 'Rural', description: 'Exclusive access to rural counties with standard support', price: 99, tierLevel: 1 },
      { name: 'Suburban', description: 'Exclusive access to suburban counties with priority support', price: 199, tierLevel: 2 },
      { name: 'Urban', description: 'Exclusive access to urban counties with dedicated account manager', price: 399, tierLevel: 3 },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Offers seeded\n');

  // Seed States
  console.log('🗺️  Seeding States...');
  for (const [name, abbreviation] of Object.entries(STATE_ABBREVIATIONS)) {
    await prisma.state.upsert({
      where: { abbreviation },
      update: {},
      create: { name, abbreviation },
    });
  }
  console.log('✅ States seeded\n');

  // Seed Counties
  console.log('🏘️  Seeding Counties...');
  const countiesDataPath = path.join(__dirname, '../src/data/us-states-counties.json');
  const populationDataPath = path.join(__dirname, '../src/data/county-populations.json');

  const countiesData = JSON.parse(fs.readFileSync(countiesDataPath, 'utf8'));

  let populationData = {};
  if (fs.existsSync(populationDataPath)) {
    populationData = JSON.parse(fs.readFileSync(populationDataPath, 'utf8'));
    console.log('   Loaded real population data.');
  } else {
    console.warn('   ⚠️ Real population data not found. Using random fallbacks.');
  }

  const states = await prisma.state.findMany();
  const stateMap = {};
  const stateNameMap = {}; // Map abbreviation to full name for population lookup
  states.forEach(state => {
    stateMap[state.abbreviation] = state.id;
    stateNameMap[state.abbreviation] = state.name;
  });

  let countyCount = 0;
  let availableCount = 0;
  let partiallyLockedCount = 0;
  let fullyLockedCount = 0;

  for (const [abbreviation, counties] of Object.entries(countiesData)) {
    const stateId = stateMap[abbreviation];
    const stateName = stateNameMap[abbreviation];

    if (!stateId) {
      console.warn(`⚠️  State ID not found for abbreviation: ${abbreviation}`);
      continue;
    }

    console.log(`Processing ${abbreviation} (${counties.length} counties)...`);

    const countyData = counties.map(countyName => {
      // Randomly assign status for demo purposes
      // Set all counties to available for launch
      const status = 'available';
      availableCount++;

      // Try to get real population
      let population = 0;
      const statePopData = populationData[stateName] || {};

      // Strategy 1: Direct match
      if (statePopData[countyName]) {
        population = statePopData[countyName];
      }
      // Strategy 2: Append " County" (Common for most states)
      else if (statePopData[`${countyName} County`]) {
        population = statePopData[`${countyName} County`];
      }
      // Strategy 3: Handle Virginia Independent Cities
      // Source: "Alexandria (Independent City)" -> Target: "Alexandria city"
      else if (stateName === 'Virginia' && countyName.includes('(Independent City)')) {
        const cityName = countyName.replace(' (Independent City)', ' city');
        if (statePopData[cityName]) {
          population = statePopData[cityName];
        }
      }
      // Strategy 4: Handle Louisiana Parishes if missing suffix in source (though source seems to have it)
      else if (stateName === 'Louisiana' && !countyName.includes('Parish')) {
        if (statePopData[`${countyName} Parish`]) {
          population = statePopData[`${countyName} Parish`];
        }
      }
      // Strategy 5: Alaska Boroughs/Census Areas if missing
      else if (stateName === 'Alaska') {
        // Try appending common Alaska suffixes if not present
        const suffixes = [' Borough', ' Census Area', ' Municipality', ' City and Borough'];
        for (const suffix of suffixes) {
          if (statePopData[`${countyName}${suffix}`]) {
            population = statePopData[`${countyName}${suffix}`];
            break;
          }
        }
      }

      // Fallback if still 0
      if (population === 0) {
        // console.warn(`   ⚠️ Population not found for: ${countyName}, ${stateName}`);
        // Generate random population for tiering (Rural < 50k, Suburban < 500k, Urban > 500k)
        const popRand = Math.random();
        if (popRand < 0.6) {
          population = Math.floor(Math.random() * 49000) + 1000; // Rural
        } else if (popRand < 0.9) {
          population = Math.floor(Math.random() * 450000) + 50000; // Suburban
        } else {
          population = Math.floor(Math.random() * 2000000) + 500000; // Urban
        }
      }

      return {
        name: countyName,
        stateId,
        status,
        population,
        freeTrialCount: 0 // Reset for launch
      };
    });

    await prisma.county.createMany({
      data: countyData,
      skipDuplicates: true,
    });

    countyCount += counties.length;
    console.log(`✅ Completed ${abbreviation}`);
  }

  console.log('\n✅ Counties seeded\n');

  // Seed Sample Users
  console.log('👥 Seeding Sample Users...');
  const sampleUsers = await prisma.user.createMany({
    data: [
      { email: 'john.doe@example.com', passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456', userType: 'standard', phone: '555-001-0001' },
      { email: 'jane.smith@example.com', passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456', userType: 'standard', phone: '555-001-0002' },
      { email: 'bob.johnson@example.com', passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456', userType: 'free_claim', credits: 500, phone: '555-001-0003' },
    ],
    skipDuplicates: true,
  });
  console.log(`✅ Sample Users seeded (${sampleUsers.count} users)\n`);

  // Seed Admin Users
  console.log('👨‍💼 Seeding Admin Users...');
  const bcrypt = await import('bcryptjs');
  const hashedPassword = await bcrypt.hash('Admin123!', 10);

  const adminUsers = await prisma.adminUser.createMany({
    data: [
      {
        username: 'admin',
        email: 'admin@example.com',
        passwordHash: hashedPassword,
        fullName: 'System Administrator',
        role: 'super_admin',
        isActive: true,
      },
      {
        username: 'support',
        email: 'support@example.com',
        passwordHash: hashedPassword,
        fullName: 'Support Team',
        role: 'admin',
        isActive: true,
      },
    ],
    skipDuplicates: true,
  });
  console.log(`✅ Admin Users seeded (${adminUsers.count} admins)\n`);

  // Seed Sample Subscriptions
  console.log('📝 Seeding Sample Subscriptions...');
  const users = await prisma.user.findMany({ take: 3 });
  const sampleCounties = await prisma.county.findMany({
    where: { status: 'available' },
    take: 5,
  });
  const allOffers = await prisma.offer.findMany();

  if (users.length > 0 && sampleCounties.length > 0 && allOffers.length > 0) {
    const subscriptionsData = [];

    // Create a few sample subscriptions
    for (let i = 0; i < Math.min(3, users.length); i++) {
      const user = users[i];
      const county = sampleCounties[i % sampleCounties.length];
      const offer = allOffers[(i + 1) % allOffers.length]; // Skip free trial

      if (offer.tierLevel > 0) { // Only create paid subscriptions
        subscriptionsData.push({
          userId: user.id,
          countyId: county.id,
          offerId: offer.id,
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          status: 'active',
        });
      }
    }

    if (subscriptionsData.length > 0) {
      const subscriptions = await prisma.subscription.createMany({
        data: subscriptionsData,
        skipDuplicates: true,
      });
      console.log(`✅ Sample Subscriptions seeded (${subscriptions.count} subscriptions)\n`);
    } else {
      console.log(`✅ Sample Subscriptions skipped (no valid data)\n`);
    }
  }

  // Seed Sample Trial Registrations
  console.log('🆓 Seeding Sample Trial Registrations...');
  const trialCounties = await prisma.county.findMany({
    where: {
      status: 'available',
      trialRegistration: null,
    },
    take: 3,
  });

  if (trialCounties.length > 0) {
    const trialData = trialCounties.slice(0, 3).map((county, index) => ({
      countyId: county.id,
      email: `trial${index + 1}@example.com`,
      firstName: `Trial`,
      lastName: `User${index + 1}`,
      phone: `555-000-${1000 + index}`,
      address: `${index + 1} Trial St, Sample City, ST 12345`,
      bidsquireUserId: `bidsquire_trial_${index + 1}`,
      status: 'active',
    }));

    const trials = await prisma.trialRegistration.createMany({
      data: trialData,
      skipDuplicates: true,
    });
    console.log(`✅ Sample Trial Registrations seeded (${trials.count} trials)\n`);
  }

  // Get final counts
  const finalCounts = {
    users: await prisma.user.count(),
    states: await prisma.state.count(),
    counties: await prisma.county.count(),
    offers: await prisma.offer.count(),
    subscriptions: await prisma.subscription.count(),
    trials: await prisma.trialRegistration.count(),
    admins: await prisma.adminUser.count(),
  };

  console.log('╔════════════════════════════════════════════╗');
  console.log('║     DATABASE SEEDING COMPLETE! ✅          ║');
  console.log('╚════════════════════════════════════════════╝\n');

  console.log('📊 Final Statistics:');
  console.log(`  ✅ States: ${finalCounts.states} records`);
  console.log(`  ✅ Counties: ${finalCounts.counties} records`);
  console.log(`    • Available: ${availableCount}`);
  console.log(`    • Partially locked: ${partiallyLockedCount}`);
  console.log(`    • Fully locked: ${fullyLockedCount}`);
  console.log(`  ✅ Offers: ${finalCounts.offers} records`);
  console.log(`  ✅ Users: ${finalCounts.users} records`);
  console.log(`  ✅ Admin Users: ${finalCounts.admins} records`);
  console.log(`  ✅ Subscriptions: ${finalCounts.subscriptions} records`);
  console.log(`  ✅ Trial Registrations: ${finalCounts.trials} records\n`);

  console.log('💡 Sample Admin Login:');
  console.log('   Username: admin');
  console.log('   Password: Admin123!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
