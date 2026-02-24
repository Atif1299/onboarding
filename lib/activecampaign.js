/**
 * Active Campaign Integration
 * 
 * Creates/updates contacts and applies tags via the AC v3 API.
 * Docs: https://developers.activecampaign.com/reference
 */

const AC_API_URL = process.env.ACTIVECAMPAIGN_API_URL;
const AC_API_KEY = process.env.ACTIVECAMPAIGN_API_KEY;

/**
 * Make an authenticated request to the Active Campaign API
 */
async function acFetch(endpoint, method = 'GET', body = null) {
  if (!AC_API_URL || !AC_API_KEY) {
    console.warn('[ActiveCampaign] Missing API credentials — skipping');
    return null;
  }

  const url = `${AC_API_URL}/api/3/${endpoint}`;
  const options = {
    method,
    headers: {
      'Api-Token': AC_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AC API ${method} ${endpoint} failed (${res.status}): ${text}`);
  }

  return res.json();
}

/**
 * Create or update a contact in Active Campaign
 * Uses /contact/sync which creates if new, updates if exists (by email)
 * 
 * @param {Object} contact - { email, firstName, lastName }
 * @returns {Object} - The AC contact object with id
 */
export async function syncContact({ email, firstName, lastName }) {
  const data = await acFetch('contact/sync', 'POST', {
    contact: {
      email,
      firstName: firstName || '',
      lastName: lastName || '',
    },
  });

  if (!data || !data.contact) {
    throw new Error('Failed to sync contact with Active Campaign');
  }

  console.log(`[ActiveCampaign] Contact synced: ${email} (AC ID: ${data.contact.id})`);
  return data.contact;
}

/**
 * Find a tag by name in Active Campaign
 * 
 * @param {string} tagName - Tag name to search for
 * @returns {string|null} - Tag ID or null if not found
 */
export async function findTagByName(tagName) {
  const data = await acFetch(`tags?search=${encodeURIComponent(tagName)}`);

  if (!data || !data.tags || data.tags.length === 0) {
    return null;
  }

  // Find exact match
  const tag = data.tags.find(t => t.tag.toLowerCase() === tagName.toLowerCase());
  return tag ? tag.id : data.tags[0].id;
}

/**
 * Apply a tag to a contact
 * 
 * @param {string} contactId - AC contact ID
 * @param {string} tagId - AC tag ID
 */
export async function addTagToContact(contactId, tagId) {
  await acFetch('contactTags', 'POST', {
    contactTag: {
      contact: contactId,
      tag: tagId,
    },
  });

  console.log(`[ActiveCampaign] Tag ${tagId} applied to contact ${contactId}`);
}

/**
 * Main function: Add a signup to Active Campaign with the "Free Trial" tag
 * 
 * @param {Object} params - { email, firstName, lastName }
 */
export async function addSignupToActiveCampaign({ email, firstName, lastName }) {
  if (!AC_API_URL || !AC_API_KEY) {
    console.warn('[ActiveCampaign] Not configured — skipping');
    return;
  }

  try {
    // 1. Create or update contact
    const contact = await syncContact({ email, firstName, lastName });

    // 2. Find the "Free Trial" tag
    const tagId = await findTagByName('Free Trial');

    if (!tagId) {
      console.error('[ActiveCampaign] "Free Trial" tag not found — contact was created but tag was not applied');
      return;
    }

    // 3. Apply the tag
    await addTagToContact(contact.id, tagId);

    console.log(`[ActiveCampaign] ✅ ${email} added with "Free Trial" tag`);
  } catch (error) {
    console.error('[ActiveCampaign] Error:', error.message);
    // Don't throw — AC integration should never block signup
  }
}
