const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const emailsToDelete = [
  'matif65995@gmail.com',
  'grapesareeverything@gmail.com',
  'grapeareeverything@gmail.com',
  'visionscraft.ai@gmail.com',
  'matif833494@gmail.com',
];

(async () => {
  console.log('Deleting test accounts...\n');

  for (const email of emailsToDelete) {
    const user = await p.user.findFirst({ where: { email } });
    if (user) {
      await p.user.delete({ where: { id: user.id } });
      console.log(`  ✅ Deleted: ${email} (ID: ${user.id})`);
    } else {
      console.log(`  ⏭ Not found: ${email}`);
    }
  }

  console.log('\nRemaining users:', await p.user.count());
  await p.$disconnect();
})();
