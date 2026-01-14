import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * GET /api/states
 * Fetches all states from the database
 */
export async function GET() {
  try {
    const result = await query(
      'SELECT state_id, name, abbreviation FROM States ORDER BY name ASC',
      []
    );

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching states:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch states',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
