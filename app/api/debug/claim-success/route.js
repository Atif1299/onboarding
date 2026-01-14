import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import stripe from '@/lib/stripe';
import { generateActivationToken } from '@/lib/token';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('session_id');

        if (!sessionId) {
            return NextResponse.json({ success: false, message: 'Missing session_id' }, { status: 400 });
        }

        // 1. Fetch Session from Stripe
        let session;
        try {
            session = await stripe.checkout.sessions.retrieve(sessionId);
        } catch (err) {
            return NextResponse.json({ success: false, message: 'Invalid Session ID or Stripe Error: ' + err.message }, { status: 400 });
        }

        if (session.payment_status !== 'paid') {
            return NextResponse.json({ success: false, message: 'Payment not paid' }, { status: 400 });
        }

        // REUSE LOGIC FROM WEBHOOK (Copy-Paste for now as requested workaround)
        const userId = parseInt(session.metadata.userId);
        const auctionId = parseInt(session.metadata.auctionId);
        const pricePaid = parseFloat(session.metadata.pricePaid);

        // CHECK IF USER EXISTS, IF NOT RECREATE (Handle DB Resets during dev)
        const sessionUserEmail = session.customer_details?.email || session.customer_email;
        let dbUser = await prisma.user.findUnique({ where: { id: userId } });

        // If ID mismatch (e.g. user was deleted/reseeded), try to find by email
        if (!dbUser && sessionUserEmail) {
            console.log(`User ${userId} not found, searching by email ${sessionUserEmail}...`);
            dbUser = await prisma.user.findUnique({ where: { email: sessionUserEmail } });
        }

        // If still not found, RECREATE the user
        if (!dbUser && sessionUserEmail) {
            console.log(`User not found by ID or Email. Recreating user from session data...`);
            const hashedPassword = '$2a$10$abcdef...placeholder...'; // Dummy hash, they set password via link anyway
            dbUser = await prisma.user.create({
                data: {
                    email: sessionUserEmail,
                    firstName: session.customer_details?.name?.split(' ')[0] || 'Restored',
                    lastName: session.customer_details?.name?.split(' ')[1] || 'User',
                    phone: session.customer_details?.phone || '000-000-0000',
                    passwordHash: hashedPassword,
                    userType: 'standard',
                    credits: 500,
                    hasUsedFreeTrial: false,
                    stripeCustomerId: typeof session.customer === 'string' ? session.customer : undefined
                }
            });
            console.log(`✅ User recreated with new ID: ${dbUser.id}`);
        }

        if (!dbUser) {
            return NextResponse.json({ success: false, message: 'Critical Error: Could not find or restore user record.' }, { status: 500 });
        }

        // UPDATE userId to real one (in case it changed)
        const validUserId = dbUser.id;

        console.log(`MANUAL DEBUG: Processing auction claim: User ${validUserId} (Original: ${userId}), Auction ${auctionId}, Price $${pricePaid}`);

        // 1. Create Claim
        try {
            await prisma.claimedAuction.create({
                data: {
                    userId: validUserId,
                    auctionId: auctionId,
                    pricePaid: pricePaid
                }
            });
            console.log('✅ Auction claimed successfully in DB');
        } catch (error) {
            // Ignore unique constraint errors if webhook fires twice
            if (error.code !== 'P2002') {
                console.error('Error creating claimed auction:', error);
                throw error;
            }
            console.log('⚠️ Auction already claimed (duplicate)');
        }

        // 2. Log Credit Transaction
        await prisma.creditTransaction.create({
            data: {
                userId: validUserId,
                amount: 500,
                reason: 'signup_bonus',
                auctionId: auctionId
            }
        });

        // 3. Generate Activation Token
        const user = dbUser; // Already fetched above
        let token = '';

        if (user) {
            token = generateActivationToken(user, 500);
            const mainAppUrl = process.env.MAIN_APP_URL || 'http://localhost:3001';
            const activationUrl = `${mainAppUrl}/auth/activate?token=${token}`;

            console.log('ACTIVATION URL:', activationUrl);
        }

        // Fetch auction details for sync
        const auction = await prisma.auction.findUnique({ where: { id: auctionId } });

        // 4. Send Confirmation & Activation Email
        try {
            if (user && auction && token) {
                const { sendActivationEmail, sendAuctionClaimEmail } = await import('@/lib/email');

                // Send classic confirmation
                await sendAuctionClaimEmail(
                    user.email,
                    user.firstName || 'User',
                    auction.title,
                    auction.url,
                    false // Not free
                );

                // Send Activation "Magic Link"
                const mainAppUrl = process.env.MAIN_APP_URL || 'http://localhost:3001';
                const activationUrl = `${mainAppUrl}/auth/activate?token=${token}`;

                await sendActivationEmail(
                    user.email,
                    user.firstName || 'User',
                    activationUrl
                );

                console.log('✅ Activation & Confirmation emails sent via manual trigger');
            }
        } catch (emailError) {
            console.error('Failed to send confirmation emails:', emailError);
            return NextResponse.json({ success: false, message: 'DB Success but Email Failed: ' + emailError.message });
        }

        // 5. Direct sync to Main App
        try {
            const mainAppUrl = process.env.MAIN_APP_URL || 'http://localhost:3001';
            const secret = process.env.CROSS_APP_SECRET || 'temporary-dev-secret-change-me';

            console.log('Syncing paid auction claim to Main App...');
            const syncResponse = await fetch(`${mainAppUrl}/api/internal/provision-trial`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    secret,
                    email: user.email,
                    name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
                    credits: 500,
                    auction: auction ? {
                        url: auction.url,
                        title: auction.title,
                        itemCount: auction.itemCount
                    } : null
                })
            });

            if (syncResponse.ok) {
                console.log('✅ Successfully synced paid claim to Main App');
            } else {
                console.error('❌ Failed to sync to Main App:', await syncResponse.text());
            }
        } catch (syncError) {
            console.error('❌ Error syncing to Main App:', syncError);
        }

        return NextResponse.json({
            success: true,
            message: 'Manual provisioning complete. Check email or use the Magic Link below.',
            magicLink: activationUrl
        });

    } catch (error) {
        console.error('Manual trigger error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
