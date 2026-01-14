import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: 'Token and password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Hash the provided token to match stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find the reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: hashedToken },
      include: { admin: true },
    });

    if (!resetToken) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Check if token has been used
    if (resetToken.used) {
      return NextResponse.json(
        { success: false, error: 'This reset token has already been used' },
        { status: 400 }
      );
    }

    // Check if token has expired
    if (new Date() > resetToken.expiresAt) {
      return NextResponse.json(
        { success: false, error: 'This reset token has expired' },
        { status: 400 }
      );
    }

    // Check if admin user is active
    if (!resetToken.admin.isActive) {
      return NextResponse.json(
        { success: false, error: 'This account is not active' },
        { status: 400 }
      );
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(password, 12);

    // Update password and mark token as used in a transaction
    await prisma.$transaction([
      // Update admin password
      prisma.adminUser.update({
        where: { id: resetToken.adminId },
        data: {
          passwordHash,
          updatedAt: new Date(),
        },
      }),
      // Mark token as used
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: {
          used: true,
          usedAt: new Date(),
        },
      }),
      // Invalidate all other unused tokens for this admin
      prisma.passwordResetToken.updateMany({
        where: {
          adminId: resetToken.adminId,
          used: false,
          id: {
            not: resetToken.id,
          },
        },
        data: {
          used: true,
          usedAt: new Date(),
        },
      }),
    ]);

    console.log(`Password successfully reset for admin: ${resetToken.admin.email}`);

    return NextResponse.json({
      success: true,
      message: 'Your password has been reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred while resetting your password' },
      { status: 500 }
    );
  }
}

// GET endpoint to verify token validity
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    // Hash the provided token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find the reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: hashedToken },
      include: {
        admin: {
          select: {
            email: true,
            fullName: true,
            isActive: true,
          },
        },
      },
    });

    if (!resetToken) {
      return NextResponse.json(
        { success: false, error: 'Invalid reset token' },
        { status: 400 }
      );
    }

    if (resetToken.used) {
      return NextResponse.json(
        { success: false, error: 'This reset token has already been used' },
        { status: 400 }
      );
    }

    if (new Date() > resetToken.expiresAt) {
      return NextResponse.json(
        { success: false, error: 'This reset token has expired' },
        { status: 400 }
      );
    }

    if (!resetToken.admin.isActive) {
      return NextResponse.json(
        { success: false, error: 'This account is not active' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        email: resetToken.admin.email,
        fullName: resetToken.admin.fullName,
        expiresAt: resetToken.expiresAt,
      },
    });
  } catch (error) {
    console.error('Verify reset token error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred while verifying the token' },
      { status: 500 }
    );
  }
}
