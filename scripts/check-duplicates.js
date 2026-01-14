import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const total = await prisma.county.count();
  console.log(`Total counties: ${total}`);

  // Check for duplicates
  const duplicates = await prisma.$queryRaw`
    SELECT name, state_id, COUNT(*) as count
    FROM counties
    GROUP BY name, state_id
    HAVING COUNT(*) > 1
    LIMIT 10
  `;

  console.log(`\nDuplicate counties found: ${duplicates.length}`);
  if (duplicates.length > 0) {
    console.log('\nSample duplicates:');
    duplicates.forEach(d => console.log(`  ${d.name} (state_id: ${d.state_id}): ${d.count} times`));
  }

  await prisma.$disconnect();
}

check();
