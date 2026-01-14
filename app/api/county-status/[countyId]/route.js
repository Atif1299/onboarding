import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * GET /api/county-status/:countyId
 * Fetches the status for a specific county
 */
export async function GET(request, { params }) {
  try {
    const { countyId } = await params;

    // Validate countyId
    if (!countyId) {
      return NextResponse.json(
        {
          success: false,
          error: 'County ID is required',
        },
        { status: 400 }
      );
    }

    // Query county status
    const result = await query(
      `SELECT county_id, name, status, state_id, population
       FROM Counties
       WHERE county_id = $1`,
      [countyId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'County not found',
        },
        { status: 404 }
      );
    }

    // Check if county has an active trial registration
    const trialResult = await query(
      `SELECT trial_registration_id, email, registration_date, status
       FROM TrialRegistrations
       WHERE county_id = $1 AND status = $2`,
      [countyId, 'active']
    );

    const hasActiveTrial = trialResult.rows.length > 0;

    return NextResponse.json({
      success: true,
      data: {
        ...result.rows[0],
        has_active_trial: hasActiveTrial,
        trial_info: hasActiveTrial ? {
          registration_date: trialResult.rows[0].registration_date,
          // Don't expose email for privacy
        } : null,
      },
    });
  } catch (error) {
    console.error('Error fetching county status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch county status',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
