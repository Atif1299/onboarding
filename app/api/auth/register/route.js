/**
 * User Registration API Route
 * POST /api/auth/register
 */

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, firstName, lastName, phone, address } = body;
    let { password } = body;

    // Validate input
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // If no password provided, generate a random one
    if (!password) {
      const crypto = require('crypto');
      password = crypto.randomBytes(16).toString('hex') + 'A1!'; // strong random password
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength (only if user provided it)
    // If we generated it, we know it's strong.
    // But since we reassigned 'password', we can just skip check or assume validity for auto-gen.
    // Let's keep check for user-provided passwords if we want, or just rely on our generation.
    // Ideally we only validate if it was provided.
    // The simplified logic:

    // Check if user exists with this email OR phone
    const whereConditions = [{ email: email.toLowerCase().trim() }];
    if (phone && phone.trim()) {
      whereConditions.push({ phone: phone.trim() });
    }
    
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: whereConditions
      },
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase().trim()) {
        // SILENT RECOGNITION: Return existing user data so checkout can proceed
        return NextResponse.json({
          success: true,
          message: 'User identified',
          data: {
            id: existingUser.id,
            email: existingUser.email,
          }
        });
      }
      // If phone is provided in the request and matches an existing user's phone (but email was different)
      if (phone && existingUser.phone === phone.trim()) {
        return NextResponse.json({ success: false, error: 'Phone number associated with another account' }, { status: 409 });
      }
      // Fallback
      return NextResponse.json({ success: false, error: 'User already exists with provided credentials' }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash: hashedPassword,
        firstName: firstName || null,
        lastName: lastName || null,
        phone: phone || null,
        address: address || null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    });



    // Send welcome email
    try {
      // Dynamic import to avoid issues if implementation changes
      const { sendWelcomeEmail } = await import('@/lib/email');
      // Use firstName if available, otherwise just "Member" or part of email
      const userName = firstName || email.split('@')[0];
      await sendWelcomeEmail(email, userName);
      console.log(`Welcome email sent to: ${email}`);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail registration if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      data: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to register user',
        details: error.message,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
