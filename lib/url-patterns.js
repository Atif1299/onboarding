/**
 * List of allowed URL patterns for auction validation.
 * Users can add more regex patterns here to allow different URL formats.
 */
export const ALLOWED_URL_PATTERNS = [
    // Matches HiBid URLs that contain '/catalog/', '/auction/', or '/lot/' followed by digits
    // Supports:
    // - https://hibid.com/catalog/697243/auction-name
    // - https://hibid.com/auction/12345/auction-name
    // - https://hibid.com/lot/12345/item-name
    // - https://subdomain.hibid.com/catalog/12345/auction-name
    // - https://hibid.com/florida/catalog/12345/auction-name
    new RegExp('https?:\\/\\/(?:[\\w-]+\\.)?hibid\\.com\\/(?:.*\\/)?(catalog|auction|lot)\\/\\d+', 'i')
];
