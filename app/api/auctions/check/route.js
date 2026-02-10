import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractAuctionId, isValidHiBidUrl } from '@/lib/auction-parser';
import { scrapeAuctionData } from '@/lib/scraper';

export async function POST(request) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url || !isValidHiBidUrl(url)) {
      return NextResponse.json(
        { success: false, message: 'Invalid HiBid URL provided' },
        { status: 400 }
      );
    }

    const externalAuctionId = extractAuctionId(url);
    if (!externalAuctionId) {
      return NextResponse.json(
        { success: false, message: 'Could not extract Auction ID from URL' },
        { status: 400 }
      );
    }

    // 1. Check if this auction is already claimed
    let existingClaim = null;

    // Safety check for Prisma model availability (debugging production issue)
    if (!prisma.claimedAuction) {
      console.error('CRITICAL: prisma.claimedAuction is undefined. Available models:', Object.keys(prisma).filter(k => !k.startsWith('_')));
      return NextResponse.json({
        success: false,
        message: 'System configuration error: Database model missing. Please contact support.'
      }, { status: 500 });
    }

    existingClaim = await prisma.claimedAuction.findFirst({
      where: {
        auction: {
          externalAuctionId: externalAuctionId
        }
      },
      include: {
        auction: true
      }
    });

    if (existingClaim) {
      return NextResponse.json({
        success: true,
        status: 'LOCKED',
        message: 'This auction has already been claimed.',
        data: {
          auctionId: externalAuctionId,
          title: existingClaim.auction.title,
          claimedAt: existingClaim.claimedAt
        }
      });
    }

    // 2. Scrape Real Data
    let scrapedData;
    try {
      scrapedData = await scrapeAuctionData(url);
    } catch (scrapeError) {
      return NextResponse.json(
        { success: false, message: 'Failed to retrieve auction details. Please check the URL.' },
        { status: 400 }
      );
    }

    // 3. Calculate Price
    // Logic: $29.95 base (covers 100 items) + $0.10 per item over 100
    // For lot pages where item count is unknown, use base price only
    const itemCount = scrapedData.itemCount;
    const price = calculatePrice(itemCount);

    // Trial Eligibility Logic:
    // Limit free trials to auctions with 10000 items or fewer.
    // If item count is unknown (lot page), allow trial.
    const MAX_TRIAL_ITEMS = 10000;
    const isTrialEligible = itemCount === null || itemCount <= MAX_TRIAL_ITEMS;

    return NextResponse.json({
      success: true,
      status: 'AVAILABLE',
      message: 'Auction is available for claiming.',
      data: {
        auctionId: externalAuctionId,
        title: scrapedData.title,
        itemCount: scrapedData.itemCount,
        zipCode: scrapedData.zipCode,
        location: scrapedData.location,
        auctioneer: scrapedData.auctioneer,
        auctionName: scrapedData.auctionName,
        price: price,
        isTrialEligible: isTrialEligible,
        breakdown: itemCount !== null ? {
          basePrice: 29.95,
          includedItems: 100,
          extraItems: Math.max(0, itemCount - 100),
          extraCost: Math.max(0, (itemCount - 100) * 0.10)
        } : null
      }
    });

  } catch (error) {
    console.error('Error checking auction:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculatePrice(itemCount) {
  const basePrice = 29.95;
  const includedItems = 100;
  const pricePerExtraItem = 0.10;

  // If item count is unknown (lot page), return base price
  if (itemCount === null || itemCount <= includedItems) {
    return basePrice;
  }

  const extraItems = itemCount - includedItems;
  const total = basePrice + (extraItems * pricePerExtraItem);

  // Return rounded to 2 decimal places
  return Math.round(total * 100) / 100;
}
