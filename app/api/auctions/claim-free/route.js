
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractAuctionId } from '@/lib/auction-parser';
import { scrapeAuctionData } from '@/lib/scraper';
import { generateActivationToken } from '@/lib/token';
import { sendActivationEmail } from '@/lib/email';
import bcrypt from 'bcryptjs';

export async function POST(request) {
    try {
        const body = await request.json();
        const { url, email, phone } = body;

        // Basic Validation
        if (!url || !email || !phone) {
            return NextResponse.json(
                { success: false, message: 'URL, email, and phone are required' },
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

        // 1. Scrape Data for Validation
        let scrapedData;
        try {
            scrapedData = await scrapeAuctionData(url);
        } catch (error) {
            return NextResponse.json(
                { success: false, message: 'Failed to verify auction details.' },
                { status: 400 }
            );
        }

        // 2. Eligibility Check - Allow any auction, but trial credits capped at 400
        // Large auctions (4000+ items) are rare but allowed - user just gets 400 free items
        const MAX_TRIAL_ITEMS = 10000; // Safety limit for extremely unusual cases
        if (scrapedData.itemCount > MAX_TRIAL_ITEMS) {
            return NextResponse.json(
                { success: false, message: 'This auction is unusually large. Please contact support.' },
                { status: 400 }
            );
        }

        // 3. Find or Create User
        // First, check if phone exists on another user
        const userWithPhone = await prisma.user.findFirst({
            where: {
                phone: phone.trim(),
                NOT: {
                    email: email.toLowerCase().trim()
                }
            }
        });

        if (userWithPhone) {
            return NextResponse.json(
                { success: false, message: 'This phone number is already in use by another account.' },
                { status: 400 }
            );
        }

        let user = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
        });

        if (!user) {
            // Create new user
            const hashedPassword = await bcrypt.hash('TempPass123!', 10);
            // Flat 500 credits for all trial users (as per Paul's request)
            const trialCredits = 500;
            user = await prisma.user.create({
                data: {
                    email: email.toLowerCase().trim(),
                    phone: phone.trim(),
                    firstName: 'Trial',
                    lastName: 'User',
                    passwordHash: hashedPassword,
                    userType: 'free_claim', // Mark as free claim user
                    credits: trialCredits,
                    hasUsedFreeTrial: true
                }
            });
        } else {
            // Update phone if missing
            if (!user.phone) {
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: { phone: phone.trim() }
                });
            }
        }
        // Optional: Update user to mark they check used free trial?
        // user = await prisma.user.update({ where: { id: user.id }, data: { hasUsedFreeTrial: true } });

        // 4. Find or Create Auction
        let auction = await prisma.auction.findUnique({
            where: { externalAuctionId }
        });

        if (!auction) {
            const defaultCounty = await prisma.county.findFirst({ where: { status: 'available' } });
            // Fallback if no available county, just pick any
            const fallbackCounty = defaultCounty || await prisma.county.findFirst();

            if (!fallbackCounty) {
                return NextResponse.json({ success: false, message: 'System error: No county configured.' }, { status: 500 });
            }

            const safeUrl = url.substring(0, 495);
            const safeTitle = (scrapedData.title || 'Untitled Auction').substring(0, 495);
            const safeZip = scrapedData.zipCode ? scrapedData.zipCode.substring(0, 20) : null;

            auction = await prisma.auction.create({
                data: {
                    externalAuctionId,
                    url: safeUrl,
                    title: safeTitle,
                    countyId: fallbackCounty.id,
                    zipCode: safeZip,
                    itemCount: scrapedData.itemCount,
                    isFreeClaim: true
                }
            });
        }

        // 5. Check if already claimed
        const existingClaim = await prisma.claimedAuction.findUnique({
            where: { auctionId: auction.id }
        });

        if (existingClaim) {
            return NextResponse.json(
                { success: false, message: 'Auction already claimed by another user' },
                { status: 400 }
            );
        }

        // 6. Create Claim directly
        const claim = await prisma.claimedAuction.create({
            data: {
                userId: user.id,
                auctionId: auction.id,
                pricePaid: 0,// Free
            }
        });

        // 7. Success
        // Generate Activation Token with Hibid URL
        // Flat 500 credits for all trial users (as per Paul's request)
        const trialCreditsForToken = 500;
        const token = generateActivationToken(user, trialCreditsForToken, {
            hibid_url: url,
            hibid_title: scrapedData.title,
            trial_auction_item_count: scrapedData.itemCount
        });
        const mainAppUrl = process.env.MAIN_APP_URL || 'http://localhost:3001';
        const activationUrl = `${mainAppUrl}/auth/activate?token=${token}`;

        console.log('\n================================================================================');
        console.log('ACCOUNT CREATION SUCCESS (FREE CLAIM)');
        console.log('--------------------------------------------------------------------------------');
        console.log('User:', user.email);
        console.log('ACTIVATION URL:', activationUrl);
        console.log('================================================================================\n');

        // --- CROSS-APP SYNC (Push to Main App) ---
        try {
            console.log('Syncing trial claim to Main App...');
            // Use the secret from env or fallback (must match provision-trial.ts)
            const secret = process.env.CROSS_APP_SECRET || 'temporary-dev-secret-change-me';

            const syncResponse = await fetch(`${mainAppUrl}/api/internal/provision-trial`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    secret,
                    email: user.email,
                    name: `${user.firstName} ${user.lastName}`,
                    auction: {
                        url: url,
                        title: scrapedData.title,
                        itemCount: scrapedData.itemCount,
                        zipCode: scrapedData.zipCode,
                        location: scrapedData.location,
                        auctioneer: scrapedData.auctioneer,
                        auctionName: scrapedData.auctionName
                    }
                })
            });

            if (syncResponse.ok) {
                console.log('✅ Successfully provisioned trial on Main App');
            } else {
                console.error('❌ Failed to provision on Main App:', await syncResponse.text());
                // Note: We do NOT fail the request here, as the onboarding claim itself was successful.
                // In a real system, we'd queue this for retry.
            }
        } catch (syncError) {
            console.error('❌ Error syncing to Main App:', syncError);
        }

        // Send Activation Email
        try {
            await sendActivationEmail(user.email, user.firstName, activationUrl);
            console.log('✅ Activation email sent');
        } catch (emailError) {
            console.error('Failed to send activation email:', emailError);
        }

        // Send Confirmation Email (same as paid claims for consistency)
        try {
            const { sendAuctionClaimEmail } = await import('@/lib/email');
            await sendAuctionClaimEmail(
                user.email,
                user.firstName || 'User',
                scrapedData.title || 'Auction',
                url,
                true // isFree = true
            );
            console.log('✅ Confirmation email sent');
        } catch (emailError) {
            console.error('Failed to send confirmation email:', emailError);
        }

        return NextResponse.json({
            success: true,
            // Redirect to success page (simulating what Stripe would do via callback)
            url: `/checkout/success?session_id=free_claim_${claim.id}&free=true`
        });

    } catch (error) {
        console.error('Free claim error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error processing claim.' },
            { status: 500 }
        );
    }
}
