/**
 * Simple Signup API Route
 * POST /api/auth/signup
 * 
 * Minimal friction signup: only requires firstName, lastName, email.
 * - Creates user in Onboarding DB (auto-generates password)
 * - Generates activation token with 500 trial credits
 * - Sends activation email to set password on app.bidsquire.com
 */

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { generateActivationToken } from '@/lib/token';
import { sendActivationEmail } from '@/lib/email';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const body = await request.json();
    const { firstName, lastName, email } = body;

    // Validate required fields
    if (!email || !firstName || !lastName) {
      return NextResponse.json(
        { success: false, error: 'First name, last name, and email are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      // User already exists — generate a new activation token and resend email
      // This is intentionally silent to avoid leaking whether the email is registered
      const token = generateActivationToken(existingUser, 500);
      const mainAppUrl = process.env.MAIN_APP_URL || 'http://localhost:3001';
      const activationUrl = `${mainAppUrl}/auth/activate?token=${token}`;

      console.log(`[Signup] Existing user ${normalizedEmail} — resending activation email`);
      console.log('[Signup] Activation URL:', activationUrl);

      try {
        await sendActivationEmail(normalizedEmail, existingUser.firstName || firstName, activationUrl);
      } catch (emailError) {
        console.error('[Signup] Failed to resend activation email:', emailError);
      }

      return NextResponse.json({
        success: true,
        message: 'Check your email to activate your account!',
      });
    }

    // Generate a random password (user will set their real password via activation link)
    const randomPassword = crypto.randomBytes(16).toString('hex') + 'A1!';
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    // Create user in Onboarding DB
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash: hashedPassword,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    console.log(`[Signup] New user created: ${user.email} (ID: ${user.id})`);

    // Generate activation token with 500 trial credits
    const trialCredits = 500;
    const token = generateActivationToken(user, trialCredits);
    const mainAppUrl = process.env.MAIN_APP_URL || 'http://localhost:3001';
    const activationUrl = `${mainAppUrl}/auth/activate?token=${token}`;

    console.log('[Signup] Activation URL:', activationUrl);

    // Send activation email
    try {
      await sendActivationEmail(user.email, user.firstName, activationUrl);
      console.log(`[Signup] Activation email sent to ${user.email}`);
    } catch (emailError) {
      console.error('[Signup] Failed to send activation email:', emailError);
      // Don't fail signup if email fails — user can request resend
    }

    // Send welcome email
    try {
      const { sendWelcomeEmail } = await import('@/lib/email');
      await sendWelcomeEmail(user.email, user.firstName);
      console.log(`[Signup] Welcome email sent to ${user.email}`);
    } catch (emailError) {
      console.error('[Signup] Failed to send welcome email:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Account created! Check your email to activate your account.',
    });

  } catch (error) {
    console.error('[Signup] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
