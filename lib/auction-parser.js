/**
 * Utility to parse HiBid auction URLs and extract the unique Auction ID.
 *
 * Expected formats:
 * - https://hibid.com/catalog/123456/some-title
 * - https://subdomain.hibid.com/catalog/123456/some-title
 * - https://hibid.com/florida/catalog/123456/some-title
 */

export function extractAuctionId(url) {
    console.log(`[Parser] Extracting ID from URL: ${url}`);
    if (!url) return null;

    try {
        // 1. Try to find /catalog/{digits}/, /auction/{digits}/, or /lot/{digits}/ pattern
        // Matches: /catalog/123456, /auction/123456, /lot/123456
        const idMatch = url.match(/\/(?:catalog|auction|lot)\/(\d+)/i);

        if (idMatch && idMatch[1]) {
            console.log(`[Parser] Found ID via regex: ${idMatch[1]}`);
            return idMatch[1];
        }

        // 2. Fallback: Check for query parameters (rare but possible)
        const urlObj = new URL(url);
        const idParam = urlObj.searchParams.get('id') || urlObj.searchParams.get('auctionId');
        if (idParam) {
            console.log(`[Parser] Found ID via params: ${idParam}`);
            return idParam;
        }

        console.warn(`[Parser] Failed to extract ID from: ${url}`);
        return null;
    } catch (error) {
        console.error('[Parser] Error parsing auction URL:', error);
        return null;
    }
}

import { ALLOWED_URL_PATTERNS } from './url-patterns';

/**
 * Validates if a URL is a valid HiBid URL based on configured patterns
 */
export function isValidHiBidUrl(url) {
    if (!url) return false;
    try {
        // Check if the URL matches at least one of the allowed patterns
        return ALLOWED_URL_PATTERNS.some(pattern => pattern.test(url));
    } catch (error) {
        console.error('Error validating URL pattern:', error);
        return false;
    }
}
