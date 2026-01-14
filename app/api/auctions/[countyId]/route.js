import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    const { countyId } = await params;

    if (!countyId) {
      return NextResponse.json(
        { success: false, error: 'County ID is required' },
        { status: 400 }
      );
    }

    const parsedCountyId = parseInt(countyId);

    // Verify county exists
    const county = await prisma.county.findUnique({
      where: { id: parsedCountyId },
      include: { state: true }
    });

    if (!county) {
      return NextResponse.json(
        { success: false, error: 'County not found' },
        { status: 404 }
      );
    }

    // Get auctions for this county
    // Filter to only upcoming auctions (or null date which means date not set yet)
    const now = new Date();

    const auctions = await prisma.auction.findMany({
      where: {
        countyId: parsedCountyId,
        OR: [
          { auctionDate: { gte: now } },
          { auctionDate: null }
        ]
      },
      include: {
        claims: {
          select: { id: true } // Only need to know if claimed, not who
        }
      },
      orderBy: [
        { auctionDate: 'asc' }
      ]
    });

    // Transform data to include availability status
    const auctionsWithStatus = auctions.map(auction => ({
      id: auction.id,
      url: auction.url,
      title: auction.title,
      auctionDate: auction.auctionDate,
      available: auction.claims.length === 0,
      createdAt: auction.createdAt
    }));

    return NextResponse.json({
      success: true,
      county: {
        id: county.id,
        name: county.name,
        state: county.state?.abbreviation,
        stateName: county.state?.name
      },
      auctions: auctionsWithStatus,
      total: auctionsWithStatus.length,
      available: auctionsWithStatus.filter(a => a.available).length
    });

  } catch (error) {
    console.error('Error fetching county auctions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch auctions' },
      { status: 500 }
    );
  }
}

// POST endpoint to add auctions to a county (for automation/scraping)
export async function POST(request, { params }) {
  try {
    const { countyId } = await params;
    const body = await request.json();
    const { auctions } = body;

    if (!countyId) {
      return NextResponse.json(
        { success: false, error: 'County ID is required' },
        { status: 400 }
      );
    }

    if (!auctions || !Array.isArray(auctions)) {
      return NextResponse.json(
        { success: false, error: 'Auctions array is required' },
        { status: 400 }
      );
    }

    const parsedCountyId = parseInt(countyId);

    // Verify county exists
    const county = await prisma.county.findUnique({
      where: { id: parsedCountyId }
    });

    if (!county) {
      return NextResponse.json(
        { success: false, error: 'County not found' },
        { status: 404 }
      );
    }

    // Create auctions (skip duplicates)
    const results = await Promise.all(
      auctions.map(async (auction) => {
        try {
          const normalizedUrl = auction.url.split('?')[0].replace(/\/+$/, '');

          const created = await prisma.auction.upsert({
            where: { url: normalizedUrl },
            update: {
              title: auction.title || undefined,
              auctionDate: auction.auctionDate ? new Date(auction.auctionDate) : undefined,
            },
            create: {
              url: normalizedUrl,
              title: auction.title || null,
              auctionDate: auction.auctionDate ? new Date(auction.auctionDate) : null,
              countyId: parsedCountyId,
            }
          });

          return { url: normalizedUrl, id: created.id, status: 'success' };
        } catch (err) {
          return { url: auction.url, status: 'error', error: err.message };
        }
      })
    );

    const successCount = results.filter(r => r.status === 'success').length;

    return NextResponse.json({
      success: true,
      message: `Added/updated ${successCount} of ${auctions.length} auctions`,
      results
    }, { status: 201 });

  } catch (error) {
    console.error('Error adding auctions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add auctions' },
      { status: 500 }
    );
  }
}
