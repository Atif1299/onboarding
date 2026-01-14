import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * GET /api/counties/:stateId
 * Fetches all counties for a specific state
 */
export async function GET(request, { params }) {
  try {
    const { stateId } = await params;

    // Validate stateId
    if (!stateId) {
      return NextResponse.json(
        {
          success: false,
          error: 'State ID is required',
        },
        { status: 400 }
      );
    }

    // Query counties for the given state
    const result = await query(
      `SELECT county_id, name, status
       FROM Counties
       WHERE state_id = $1
       ORDER BY name ASC`,
      [stateId]
    );

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching counties:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch counties',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
