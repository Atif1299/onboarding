import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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

    // Scrape data again to ensure accuracy and get price
    let scrapedData;
    try {
      scrapedData = await scrapeAuctionData(url);
    } catch (error) {
      console.error('Scraping failed during claim:', error);
      // Fallback or fail? Fail for now to ensure data integrity
      return NextResponse.json(
        { success: false, message: 'Failed to verify auction details.' },
        { status: 400 }
      );
    }

    const price = calculatePrice(scrapedData.itemCount);

    // Start Transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Find or Create User
      let user = await tx.user.findUnique({ where: { email } });

      if (!user) {
        // Create new user with temp password
        const hashedPassword = await bcrypt.hash('TempPass123!', 10);
        user = await tx.user.create({
          data: {
            email,
            phone,
            firstName,
            lastName,
            passwordHash: hashedPassword,
            userType: 'standard', // Changed from free_claim
            credits: 500, // Initial bonus still applies
            hasUsedFreeTrial: false
          }
        });
      }

      // 2. Find or Create Auction
      let auction = await tx.auction.findUnique({
        where: { externalAuctionId }
      });

      if (!auction) {
        // Find a valid county ID to use as default
        // TODO: Implement proper Zip Code to County mapping
        const defaultCounty = await tx.county.findFirst();
        if (!defaultCounty) {
          throw new Error('No counties found in database to assign to auction.');
        }

        // Create new auction record with REAL scraped data
        auction = await tx.auction.create({
          data: {
            externalAuctionId,
            url,
            title: scrapedData.title || 'Untitled Auction',
            countyId: defaultCounty.id, // Use a valid existing county ID
            zipCode: scrapedData.zipCode,
            itemCount: scrapedData.itemCount,
            isFreeClaim: false
          }
        });
      }

      // 3. Check if already claimed (Double check for race conditions)
      const existingClaim = await tx.claimedAuction.findUnique({
        where: { auctionId: auction.id }
      });

      if (existingClaim) {
        throw new Error('Auction already claimed by another user');
      }

      // 4. Create Claim
      const claim = await tx.claimedAuction.create({
        data: {
          userId: user.id,
          auctionId: auction.id,
          pricePaid: price // Record the calculated price
        }
      });

      // 5. Log Credit Transaction (Bonus)
      await tx.creditTransaction.create({
        data: {
          userId: user.id,
          amount: 500,
          reason: 'signup_bonus',
          auctionId: auction.id
        }
      });

      return { user, claim, auction };
    });

    return NextResponse.json({
      success: true,
      message: 'Auction successfully claimed!',
      data: {
        auctionId: result.auction.externalAuctionId,
        userEmail: result.user.email,
        pricePaid: result.claim.pricePaid
      }
    });

  } catch (error) {
    console.error('Error claiming auction:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 400 }
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
