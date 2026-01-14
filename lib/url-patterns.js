/**
 * List of allowed URL patterns for auction validation.
 * Users can add more regex patterns here to allow different URL formats.
 */
export const ALLOWED_URL_PATTERNS = [
    // Matches HiBid URLs that contain '/lot/' followed by digits (the lot ID).
    // Supports:
    // - https://hibid.com/lot/12345/...
    // - https://subdomain.hibid.com/catalog/12345/lot/67890
    // - https://hibid.com/some/path/lot/12345
    new RegExp('https?:\\/\\/(?:[\\w-]+\\.)?hibid\\.com\\/(?:.*\\/)?lot\\/\\d+', 'i')
];
