const { PrismaClient } = require('@prisma/client');

const p = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_s2kWPxp9qLCF@ep-icy-rice-ahwhugd6.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require'
    }
  }
});

(async () => {
  try {
    const tables = await p.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname='public'`;
    console.log(`Tables found: ${tables.length}`);
    
    if (tables.length === 0) {
      console.log('\n✅ DB is COMPLETELY EMPTY — no tables at all. Safe to use!');
    } else {
      let totalRows = 0;
      for (const t of tables) {
        const count = await p.$queryRawUnsafe(`SELECT COUNT(*) as c FROM "${t.tablename}"`);
        const rows = Number(count[0].c);
        totalRows += rows;
        console.log(`  ${t.tablename}: ${rows} rows`);
      }
      if (totalRows === 0) {
        console.log(`\n✅ DB has ${tables.length} tables but ALL ARE EMPTY (0 rows). Safe to use!`);
      } else {
        console.log(`\n⚠️  DB has ${totalRows} total rows across ${tables.length} tables.`);
      }
    }
    
    await p.$disconnect();
  } catch (e) {
    console.error('Error:', e.message);
    await p.$disconnect();
  }
})();
