import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 30000,
  statement_timeout: 60000,
  query_timeout: 60000
});

export async function GET() {
  try {
    console.log('=== Dashboard Stats API Called ===');
    // Check authentication
    const session = await getServerSession(authOptions);
    console.log('Session:', session ? 'Found' : 'Not found');

    if (!session || !session.user) {
      console.log('❌ Unauthorized - No session');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('✅ Authorized user:', session.user.username);

    const client = await pool.connect();

    try {
      // Get states count
      const statesResult = await client.query('SELECT COUNT(*) as count FROM states');
      const statesCount = parseInt(statesResult.rows[0].count);

      // Get counties count by status
      const countiesResult = await client.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'available' THEN 1 END) as available,
          COUNT(CASE WHEN status = 'partially_locked' THEN 1 END) as partially_locked,
          COUNT(CASE WHEN status = 'fully_locked' THEN 1 END) as fully_locked
        FROM counties
      `);
      const countiesStats = countiesResult.rows[0];

      // Get offers count
      const offersResult = await client.query('SELECT COUNT(*) as count FROM offers');
      const offersCount = parseInt(offersResult.rows[0].count);

      const stats = {
        states: { total: statesCount },
        counties: {
          total: parseInt(countiesStats.total),
          available: parseInt(countiesStats.available),
          partially_locked: parseInt(countiesStats.partially_locked),
          fully_locked: parseInt(countiesStats.fully_locked)
        },
        offers: { total: offersCount }
      };

      console.log('✅ Stats computed:', JSON.stringify(stats, null, 2));

      return NextResponse.json({
        success: true,
        data: stats
      });

    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}