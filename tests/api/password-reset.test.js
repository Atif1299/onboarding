import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST as forgotPasswordPOST } from '@/app/api/auth/forgot-password/route';
import { POST as resetPasswordPOST, GET as resetPasswordGET } from '@/app/api/auth/reset-password/route';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// Mock the email module
vi.mock('@/lib/email', () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue({ success: true }),
}));

describe('Password Reset Flow', () => {
  let testAdmin;
  let resetToken;
  let hashedToken;

  beforeEach(async () => {
    // Clean up test data
    await prisma.passwordResetToken.deleteMany({});
    await prisma.adminUser.deleteMany({
      where: { email: { contains: 'test-reset' } },
    });

    // Create a test admin user
    testAdmin = await prisma.adminUser.create({
      data: {
        username: 'test-reset-user',
        email: 'test-reset@example.com',
        passwordHash: await bcrypt.hash('OldPassword123', 12),
        fullName: 'Test Reset User',
        role: 'admin',
        isActive: true,
      },
    });

    // Generate a test token
    resetToken = crypto.randomBytes(32).toString('hex');
    hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should accept forgot password request for existing user', async () => {
      const request = new Request('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testAdmin.email }),
      });

      const response = await forgotPasswordPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('password reset link');

      // Verify token was created in database
      const tokens = await prisma.passwordResetToken.findMany({
        where: { adminId: testAdmin.id },
      });
      expect(tokens.length).toBeGreaterThan(0);
    });

    it('should not reveal if user does not exist', async () => {
      const request = new Request('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'nonexistent@example.com' }),
      });

      const response = await forgotPasswordPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('password reset link');
    });

    it('should require email', async () => {
      const request = new Request('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await forgotPasswordPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('required');
    });

    it('should invalidate existing unused tokens when creating new one', async () => {
      // Create first token
      const firstToken = crypto.randomBytes(32).toString('hex');
      const firstHashedToken = crypto.createHash('sha256').update(firstToken).digest('hex');
      await prisma.passwordResetToken.create({
        data: {
          adminId: testAdmin.id,
          token: firstHashedToken,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      // Request new token
      const request = new Request('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testAdmin.email }),
      });

      await forgotPasswordPOST(request);

      // Check that first token is now marked as used
      const firstTokenRecord = await prisma.passwordResetToken.findUnique({
        where: { token: firstHashedToken },
      });
      expect(firstTokenRecord.used).toBe(true);
    });

    it('should not send reset email to inactive users', async () => {
      // Create inactive user
      const inactiveAdmin = await prisma.adminUser.create({
        data: {
          username: 'test-reset-inactive',
          email: 'test-reset-inactive@example.com',
          passwordHash: await bcrypt.hash('Password123', 12),
          fullName: 'Inactive User',
          role: 'admin',
          isActive: false,
        },
      });

      const request = new Request('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inactiveAdmin.email }),
      });

      const response = await forgotPasswordPOST(request);
      const data = await response.json();

      // Should still return success (don't reveal user status)
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // But no token should be created
      const tokens = await prisma.passwordResetToken.findMany({
        where: { adminId: inactiveAdmin.id },
      });
      expect(tokens.length).toBe(0);
    });
  });

  describe('GET /api/auth/reset-password (token verification)', () => {
    beforeEach(async () => {
      // Create a valid token for testing
      await prisma.passwordResetToken.create({
        data: {
          adminId: testAdmin.id,
          token: hashedToken,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        },
      });
    });

    it('should verify valid token', async () => {
      const url = new URL('http://localhost:3000/api/auth/reset-password');
      url.searchParams.set('token', resetToken);

      const request = new Request(url);
      const response = await resetPasswordGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.email).toBe(testAdmin.email);
      expect(data.data.fullName).toBe(testAdmin.fullName);
    });

    it('should reject invalid token', async () => {
      const url = new URL('http://localhost:3000/api/auth/reset-password');
      url.searchParams.set('token', 'invalid-token');

      const request = new Request(url);
      const response = await resetPasswordGET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid');
    });

    it('should reject expired token', async () => {
      // Create expired token
      const expiredToken = crypto.randomBytes(32).toString('hex');
      const expiredHashedToken = crypto.createHash('sha256').update(expiredToken).digest('hex');
      await prisma.passwordResetToken.create({
        data: {
          adminId: testAdmin.id,
          token: expiredHashedToken,
          expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
        },
      });

      const url = new URL('http://localhost:3000/api/auth/reset-password');
      url.searchParams.set('token', expiredToken);

      const request = new Request(url);
      const response = await resetPasswordGET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('expired');
    });

    it('should reject already used token', async () => {
      // Mark token as used
      await prisma.passwordResetToken.update({
        where: { token: hashedToken },
        data: { used: true, usedAt: new Date() },
      });

      const url = new URL('http://localhost:3000/api/auth/reset-password');
      url.searchParams.set('token', resetToken);

      const request = new Request(url);
      const response = await resetPasswordGET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('already been used');
    });
  });

  describe('POST /api/auth/reset-password', () => {
    beforeEach(async () => {
      // Create a valid token for testing
      await prisma.passwordResetToken.create({
        data: {
          adminId: testAdmin.id,
          token: hashedToken,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });
    });

    it('should reset password with valid token', async () => {
      const newPassword = 'NewSecurePassword123';

      const request = new Request('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetToken,
          password: newPassword,
        }),
      });

      const response = await resetPasswordPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('successfully');

      // Verify password was changed
      const updatedAdmin = await prisma.adminUser.findUnique({
        where: { id: testAdmin.id },
      });
      const passwordMatch = await bcrypt.compare(newPassword, updatedAdmin.passwordHash);
      expect(passwordMatch).toBe(true);

      // Verify token was marked as used
      const tokenRecord = await prisma.passwordResetToken.findUnique({
        where: { token: hashedToken },
      });
      expect(tokenRecord.used).toBe(true);
      expect(tokenRecord.usedAt).toBeTruthy();
    });

    it('should require token and password', async () => {
      const request = new Request('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await resetPasswordPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('required');
    });

    it('should enforce minimum password length', async () => {
      const request = new Request('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetToken,
          password: 'short',
        }),
      });

      const response = await resetPasswordPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('8 characters');
    });

    it('should reject invalid token', async () => {
      const request = new Request('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'invalid-token',
          password: 'NewPassword123',
        }),
      });

      const response = await resetPasswordPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid');
    });

    it('should reject expired token', async () => {
      // Update token to be expired
      await prisma.passwordResetToken.update({
        where: { token: hashedToken },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });

      const request = new Request('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetToken,
          password: 'NewPassword123',
        }),
      });

      const response = await resetPasswordPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('expired');
    });

    it('should reject already used token', async () => {
      // Mark token as used
      await prisma.passwordResetToken.update({
        where: { token: hashedToken },
        data: { used: true, usedAt: new Date() },
      });

      const request = new Request('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetToken,
          password: 'NewPassword123',
        }),
      });

      const response = await resetPasswordPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('already been used');
    });

    it('should invalidate other unused tokens after successful reset', async () => {
      // Create additional unused token
      const otherToken = crypto.randomBytes(32).toString('hex');
      const otherHashedToken = crypto.createHash('sha256').update(otherToken).digest('hex');
      await prisma.passwordResetToken.create({
        data: {
          adminId: testAdmin.id,
          token: otherHashedToken,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      // Reset password with first token
      const request = new Request('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetToken,
          password: 'NewPassword123',
        }),
      });

      await resetPasswordPOST(request);

      // Check that other token is now marked as used
      const otherTokenRecord = await prisma.passwordResetToken.findUnique({
        where: { token: otherHashedToken },
      });
      expect(otherTokenRecord.used).toBe(true);
    });
  });
});
