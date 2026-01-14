
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json({ success: false, error: 'Token is required' }, { status: 400 });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const resetToken = await prisma.userPasswordResetToken.findFirst({
            where: {
                token: hashedToken,
                used: false,
                expiresAt: { gt: new Date() }
            },
            include: { user: true }
        });

        if (!resetToken) {
            return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            data: { email: resetToken.user.email }
        });

    } catch (error) {
        console.error('Verify token error:', error);
        return NextResponse.json({ success: false, error: 'Server error verifying token' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { token, password } = body;

        if (!token || !password) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const resetToken = await prisma.userPasswordResetToken.findFirst({
            where: {
                token: hashedToken,
                used: false,
                expiresAt: { gt: new Date() }
            },
            include: { user: true }
        });

        if (!resetToken) {
            return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 400 });
        }

        // Hash new password
        const passwordHash = await bcrypt.hash(password, 10);

        // Update user
        await prisma.user.update({
            where: { id: resetToken.userId },
            data: {
                passwordHash: passwordHash,
                // Optional: set a flag like 'isActivated: true' if we had one
            }
        });

        // Mark token as used
        await prisma.userPasswordResetToken.update({
            where: { id: resetToken.id },
            data: { used: true, usedAt: new Date() }
        });

        return NextResponse.json({ success: true, message: 'Password updated successfully' });

    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json({ success: false, error: 'Server error resetting password' }, { status: 500 });
    }
}
