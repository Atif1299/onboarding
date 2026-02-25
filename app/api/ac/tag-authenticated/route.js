/**
 * Active Campaign — Tag Authenticated
 * POST /api/ac/tag-authenticated
 * 
 * Called by the main app (ebay_project) after a user activates their account.
 * Applies the "AUTHENTICATED" tag to the contact in Active Campaign,
 * which triggers Paul's AC automation to send the welcome email.
 */

import { NextResponse } from 'next/server';
import { syncContact, findTagByName, addTagToContact } from '@/lib/activecampaign';

export async function POST(request) {
  try {
    const { secret, email } = await request.json();

    // Validate cross-app secret
    const expectedSecret = process.env.CROSS_APP_SECRET || 'temporary-dev-secret-change-me';
    if (secret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // 1. Find / sync the contact (should already exist from signup)
    const contact = await syncContact({ email });

    // 2. Find the "AUTHENTICATED" tag
    const tagId = await findTagByName('AUTHENTICATED');

    if (!tagId) {
      console.error('[AC Tag-Authenticated] "AUTHENTICATED" tag not found in Active Campaign. Please create it in AC first.');
      return NextResponse.json(
        { error: '"AUTHENTICATED" tag not found in Active Campaign' },
        { status: 404 }
      );
    }

    // 3. Apply the tag
    await addTagToContact(contact.id, tagId);

    console.log(`[AC Tag-Authenticated] ✅ "AUTHENTICATED" tag applied to ${email} (AC contact ${contact.id})`);
    return NextResponse.json({ success: true, contactId: contact.id, tagId });
  } catch (error) {
    console.error('[AC Tag-Authenticated] Error:', error);
    return NextResponse.json({ error: 'Failed to tag contact' }, { status: 500 });
  }
}
