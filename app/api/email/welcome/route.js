/**
 * Welcome Email API Route
 * POST /api/email/welcome
 * 
 * Called by the main app after a user activates their account.
 * Sends the welcome email via the Onboarding app's email service.
 */

import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { secret, email, name } = await request.json();

    // Validate secret
    const expectedSecret = process.env.CROSS_APP_SECRET || 'temporary-dev-secret-change-me';
    if (secret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const { sendWelcomeEmail } = await import('@/lib/email');
    await sendWelcomeEmail(email, name || 'User');
    console.log(`[Welcome API] Welcome email sent to ${email}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Welcome API] Error:', error);
    return NextResponse.json({ error: 'Failed to send welcome email' }, { status: 500 });
  }
}
