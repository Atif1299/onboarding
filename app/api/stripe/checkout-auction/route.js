import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import stripe, { getOrCreateStripeCustomer } from '@/lib/stripe';
import { extractAuctionId } from '@/lib/auction-parser';
import { scrapeAuctionData } from '@/lib/scraper';
import bcrypt from 'bcryptjs';

export async function POST(request) {
    try {
        const body = await request.json();
        const { url, email, phone, firstName, lastName } = body;

        if (!url || !email) {
            return NextResponse.json(
                { success: false, message: 'Missing required fields' },
                { status: 400 }
            );
        }

        const externalAuctionId = extractAuctionId(url);
        if (!externalAuctionId) {
            return NextResponse.json(
                { success: false, message: 'Invalid URL' },
                { status: 400 }
            );
        }

        // 1. Scrape Data & Calculate Price
        let scrapedData;
        try {
            scrapedData = await scrapeAuctionData(url);
        } catch (error) {
            console.error('Scraping failed:', error);
            return NextResponse.json(
                { success: false, message: 'Failed to verify auction details.' },
                { status: 400 }
            );
        }

        const price = calculatePrice(scrapedData.itemCount);
        const priceInCents = Math.round(price * 100);

        // 2. Find or Create User
        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            const hashedPassword = await bcrypt.hash('TempPass123!', 10);
            user = await prisma.user.create({
                data: {
                    email,
                    phone,
                    firstName,
                    lastName,
                    passwordHash: hashedPassword,
                    userType: 'standard',
                    credits: 500,
                    hasUsedFreeTrial: false
                }
            });
        }

        // 3. Find or Create Auction
        let auction = await prisma.auction.findUnique({
            where: { externalAuctionId }
        });

        if (!auction) {
            // Find a valid county ID to use as default
            const defaultCounty = await prisma.county.findFirst();
            if (!defaultCounty) {
                throw new Error('No counties found in database.');
            }

            // Truncate strings to fit DB columns
            const safeUrl = url.substring(0, 495);
            const safeTitle = (scrapedData.title || 'Untitled Auction').substring(0, 495);
            const safeZip = scrapedData.zipCode ? scrapedData.zipCode.substring(0, 20) : null;

            auction = await prisma.auction.create({
                data: {
                    externalAuctionId,
                    url: safeUrl,
                    title: safeTitle,
                    countyId: defaultCounty.id,
                    zipCode: safeZip,
                    itemCount: scrapedData.itemCount,
                    isFreeClaim: false
                }
            });
        }

        // 4. Check if already claimed
        const existingClaim = await prisma.claimedAuction.findUnique({
            where: { auctionId: auction.id }
        });

        if (existingClaim) {
            return NextResponse.json(
                { success: false, message: 'Auction already claimed by another user' },
                { status: 400 }
            );
        }

        // 5. Get Stripe Customer
        const stripeCustomerId = await getOrCreateStripeCustomer(user);

        // 6. Create Stripe Checkout Session
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        const session = await stripe.checkout.sessions.create({
            customer: stripeCustomerId,
            mode: 'payment',
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `Exclusive Auction License: ${auction.title}`,
                            description: `Lock exclusivity for ${scrapedData.itemCount} items. Auction ID: ${externalAuctionId}`,
                            metadata: {
                                auctionId: auction.id.toString()
                            }
                        },
                        unit_amount: priceInCents,
                    },
                    quantity: 1,
                },
            ],
            success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${appUrl}/claim?url=${encodeURIComponent(url)}`,
            metadata: {
                type: 'auction_claim',
                userId: user.id.toString(),
                auctionId: auction.id.toString(),
                pricePaid: price.toString()
            },
        });

        return NextResponse.json({
            success: true,
            url: session.url
        });

    } catch (error) {
        console.error('Checkout error:', error);
        return NextResponse.json(
            { success: false, message: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

function calculatePrice(itemCount) {
    const basePrice = 29.95;
    const includedItems = 100;
    const pricePerExtraItem = 0.10;

    if (itemCount <= includedItems) {
        return basePrice;
    }

    const extraItems = itemCount - includedItems;
    const total = basePrice + (extraItems * pricePerExtraItem);
    return Math.round(total * 100) / 100;
}
