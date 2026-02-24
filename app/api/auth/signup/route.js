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
import { addSignupToActiveCampaign } from '@/lib/activecampaign';

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
      console.log(`[Signup] User already exists: ${normalizedEmail}`);
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists. Please sign in instead.' },
        { status: 409 }
      );
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

    // Welcome email is sent AFTER the user activates their account (in activate.ts on the main app)
    // Not here — sending it before activation is premature

    // Add to Active Campaign with "Free Trial" tag
    try {
      await addSignupToActiveCampaign({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      });
    } catch (acError) {
      console.error('[Signup] Active Campaign error:', acError);
      // Never block signup for AC failure
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
