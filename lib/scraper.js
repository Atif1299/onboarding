import * as cheerio from 'cheerio';

/**
 * Scrapes the HiBid auction page for details.
 * Handles both catalog pages (old format) and lot pages (new format).
 * @param {string} url
 * @returns {Promise<{itemCount: number | null, zipCode: string | null, location: string | null, title: string | null, auctioneer: string | null, auctionName: string | null}>}
 */
export async function scrapeAuctionData(url) {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch page: ${response.status} ${response.statusText}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Detect if this is a lot page or catalog page
        const isLotPage = url.includes('/lot/');

        let itemCount = null;
        let zipCode = null;
        let location = null;
        let title = null;
        let auctioneer = null;
        let auctionName = null;

        if (isLotPage) {
            // ========== LOT PAGE SCRAPING ==========

            // 1. Extract Title from <title> tag or h1
            const pageTitle = $('title').text();
            // Title format: "1893 & S Ends $10 Morgan... | Live and Online Auctions on HiBid.com"
            if (pageTitle) {
                title = pageTitle.split('|')[0].trim();
            }
            if (!title) {
                title = $('h1').first().text().trim() || null;
            }

            // 2. Extract Location from city-state-zip link
            // Structure: <app-city-state-zip-link> contains <a> with address
            const locationLink = $('app-city-state-zip-link a').first().text().trim();
            if (locationLink) {
                location = locationLink.replace(/\s+/g, ' ').trim();
            }

            // Extract zip code from location
            if (location) {
                const zipMatch = location.match(/\b\d{5}\b/);
                if (zipMatch) {
                    zipCode = zipMatch[0];
                }
            }

            // 3. Extract Auctioneer name
            const auctioneerLink = $('app-company-page-link a').first().text().trim();
            if (auctioneerLink) {
                auctioneer = auctioneerLink;
            }

            // 4. Extract Auction Name from "Auction Information" section
            // Look for the Name row in auction info
            $('app-auction-info-panel tr').each((i, row) => {
                const th = $(row).find('th').text().trim();
                const td = $(row).find('td').text().trim();
                if (th === 'Name') {
                    auctionName = td;
                }
            });

            // Item count is NOT available on lot pages - set to null
            // The UI should handle this gracefully
            itemCount = null;

        } else {
            // ========== CATALOG PAGE SCRAPING (original logic) ==========

            // 1. Extract Item Count
            // Strategy A: Check paging info (e.g., "Showing 1 to 100 of 4,879 lots")
            const pagingText = $('.paging-item-count').text();
            const pagingMatch = pagingText.match(/of\s+([\d,]+)\s+lots/i);

            if (pagingMatch && pagingMatch[1]) {
                // Remove commas and parse
                itemCount = parseInt(pagingMatch[1].replace(/,/g, ''), 10);
            } else {
                // Strategy B: Fallback to "View Catalog (3001 Lots)" button
                const catalogBtnText = $('.auction-btn').text();
                const lotsMatch = catalogBtnText.match(/(\d+)\s+Lots/i);

                if (lotsMatch && lotsMatch[1]) {
                    itemCount = parseInt(lotsMatch[1], 10);
                }
            }

            // 2. Extract Location / Zip Code
            const addressBlock = $('.company-address').text();
            const zipMatch = addressBlock.match(/\b\d{5}\b/);
            if (zipMatch) {
                zipCode = zipMatch[0];
            }

            const addressLines = $('.company-address strong div').map((i, el) => $(el).text().trim()).get();
            if (addressLines.length > 0) {
                location = addressLines.join(', ');
            }

            // 3. Extract Title
            title = $('h1').first().text().trim() || $('.auction-header').text().trim() || null;
        }

        return {
            itemCount,
            zipCode,
            location,
            title,
            auctioneer,
            auctionName
        };

    } catch (error) {
        console.error('Scraping error:', error);
        throw error;
    }
}
