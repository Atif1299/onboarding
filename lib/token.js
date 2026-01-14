import crypto from 'crypto';

/**
 * Generate a stateless activation token for a user
 * @param {Object} user - User object containing id, email, and firstName
 * @returns {string} - The generated activation token
 */
export function generateActivationToken(user, credits = 0, extraPayload = {}) {
    const secret = process.env.CROSS_APP_SECRET || 'temporary-dev-secret-change-me';
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

    const payload = JSON.stringify({
        uid: user.id,
        email: user.email,
        name: user.firstName || 'User',
        credits: credits,
        exp: expiresAt,
        ...extraPayload
    });

    const payloadBase64 = Buffer.from(payload).toString('base64');
    const signature = crypto
        .createHmac('sha256', secret)
        .update(payloadBase64)
        .digest('hex');

    return `${payloadBase64}.${signature}`;
}
