
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request) {
    try {
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json(
                { success: false, error: 'Email is required' },
                { status: 400 }
            );
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
        });

        // Always return success to prevent email enumeration
        if (!user) {
            console.log(`User password reset requested for non-existent email: ${email}`);
            return NextResponse.json({
                success: true,
                message: 'If an account exists with this email, a password reset link has been sent.',
            });
        }

        // Generate secure random token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        // Token expires in 1 hour
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        // Invalidate any existing unused tokens for this user
        await prisma.userPasswordResetToken.updateMany({
            where: {
                userId: user.id,
                used: false,
                expiresAt: {
                    gt: new Date(),
                },
            },
            data: {
                used: true,
                usedAt: new Date(),
            },
        });

        // Create new reset token
        await prisma.userPasswordResetToken.create({
            data: {
                userId: user.id,
                token: hashedToken,
                expiresAt,
            },
        });

        // Build reset URL for USER (not admin)
        // Points to the page existing at /reset-password (which uses the user-reset-password logic)
        // OR /auth/reset-password if we want to be explicit.
        // Based on previous findings, Onboarding Frontend has /reset-password/page.jsx which calls /api/auth/user-reset-password
        const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

        // Send password reset email
        try {
            const { sendPasswordResetEmail } = await import('@/lib/email');
            // Using first name if available, else 'there'
            await sendPasswordResetEmail(user.email, resetUrl, user.firstName);
            console.log(`User password reset email sent to: ${user.email}`);
        } catch (emailError) {
            console.error('Failed to send user password reset email:', emailError);
        }

        return NextResponse.json({
            success: true,
            message: 'If an account exists with this email, a password reset link has been sent.',
            // Includes dev mechanism
            ...(process.env.NODE_ENV === 'development' && {
                dev: {
                    token: resetToken,
                    resetUrl,
                    expiresAt,
                },
            }),
        });
    } catch (error) {
        console.error('User Forgot password error:', error);
        return NextResponse.json(
            { success: false, error: 'An error occurred while processing your request' },
            { status: 500 }
        );
    }
}
