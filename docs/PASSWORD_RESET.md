# Password Reset Mechanism

This document describes the password reset functionality implemented for admin users in the BidSquire application.

## Overview

The password reset system allows admin users to securely reset their passwords via email. It implements industry-standard security practices including:

- Secure token generation using cryptographic functions
- Token expiration (1 hour)
- Single-use tokens
- Protection against email enumeration
- Password strength requirements
- Comprehensive audit trail

## Architecture

### Database Schema

A new `password_reset_tokens` table was added to track reset requests:

```sql
CREATE TABLE password_reset_tokens (
  token_id SERIAL PRIMARY KEY,
  admin_id INT NOT NULL REFERENCES admin_users(admin_id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  INDEX (token),
  INDEX (admin_id),
  INDEX (expires_at)
);
```

### Flow Diagram

```
┌─────────────┐
│ Admin User  │
└──────┬──────┘
       │
       │ 1. Clicks "Forgot Password"
       ▼
┌──────────────────────┐
│ Forgot Password Page │
│ /admin/forgot-password│
└──────┬───────────────┘
       │
       │ 2. Enters email
       ▼
┌──────────────────────────┐
│ POST /api/auth/          │
│   forgot-password        │
└──────┬───────────────────┘
       │
       │ 3. Generates token
       │    Creates DB record
       │    Sends email
       ▼
┌──────────────────────────┐
│ Email with reset link    │
│ (expires in 1 hour)      │
└──────┬───────────────────┘
       │
       │ 4. Clicks link
       ▼
┌──────────────────────────┐
│ Reset Password Page      │
│ /admin/reset-password    │
│ ?token=...               │
└──────┬───────────────────┘
       │
       │ 5. Verifies token (GET)
       │    Enters new password
       ▼
┌──────────────────────────┐
│ POST /api/auth/          │
│   reset-password         │
└──────┬───────────────────┘
       │
       │ 6. Updates password
       │    Marks token as used
       │    Invalidates other tokens
       ▼
┌──────────────────────────┐
│ Success - Redirect to    │
│ Login                    │
└──────────────────────────┘
```

## Components

### 1. API Endpoints

#### POST /api/auth/forgot-password

Initiates a password reset request.

**Request:**
```json
{
  "email": "admin@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "If an account exists with this email, a password reset link has been sent."
}
```

**Security Features:**
- Always returns success message (prevents email enumeration)
- Only sends email if user exists and is active
- Invalidates previous unused tokens
- Generates cryptographically secure token (32 bytes)
- Token is hashed before storage (SHA-256)
- Logs attempts for security monitoring

#### GET /api/auth/reset-password?token={token}

Verifies if a reset token is valid.

**Response (valid token):**
```json
{
  "success": true,
  "data": {
    "email": "admin@example.com",
    "fullName": "Admin User",
    "expiresAt": "2025-10-23T19:35:00.000Z"
  }
}
```

**Response (invalid token):**
```json
{
  "success": false,
  "error": "Invalid or expired reset token"
}
```

#### POST /api/auth/reset-password

Resets the password using a valid token.

**Request:**
```json
{
  "token": "abc123...",
  "password": "NewSecurePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Your password has been reset successfully. You can now log in with your new password."
}
```

**Validation:**
- Token must be valid and not expired
- Token must not have been used
- Password must be at least 8 characters long
- Password is hashed with bcrypt (12 rounds)
- All other unused tokens for the user are invalidated

### 2. UI Pages

#### /admin/forgot-password

Form for entering email address to request password reset.

**Features:**
- Email validation
- Loading states
- Success confirmation screen
- Link back to login
- Development mode: Shows reset URL in console

#### /admin/reset-password?token={token}

Form for entering new password.

**Features:**
- Automatic token verification on page load
- Invalid/expired token error handling
- Password and confirm password fields
- Password visibility toggle
- Password strength requirements display
- Loading and success states
- Automatic redirect to login after success (3 seconds)

**Password Requirements:**
- At least 8 characters long
- Contains uppercase and lowercase letters
- Contains at least one number

#### /admin/login

Updated to include "Forgot your password?" link.

### 3. Email Service

Location: [lib/email.js](../lib/email.js)

**Features:**
- Modular design supporting multiple email providers
- Beautiful HTML email template with brand colors
- Plain text fallback
- Console mode for development
- Configurable via environment variables

**Supported Providers:**
- Console (development)
- SendGrid
- Mailgun
- AWS SES
- Resend
- SMTP (via Nodemailer)

**Configuration:**
```env
EMAIL_PROVIDER=console          # or sendgrid, mailgun, ses, resend, smtp
EMAIL_FROM=noreply@example.com
NEXTAUTH_URL=https://yourdomain.com

# Provider-specific (add as needed)
SENDGRID_API_KEY=...
MAILGUN_API_KEY=...
MAILGUN_DOMAIN=...
AWS_REGION=...
RESEND_API_KEY=...
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
```

## Security Considerations

### Token Security

1. **Cryptographic Randomness**: Tokens are generated using `crypto.randomBytes(32)` providing 256 bits of entropy
2. **Hashed Storage**: Tokens are hashed using SHA-256 before storage, preventing token theft from database
3. **Single Use**: Tokens can only be used once
4. **Time Limited**: Tokens expire after 1 hour
5. **Token Invalidation**: When a new token is requested, all previous unused tokens are invalidated

### Password Security

1. **Strength Requirements**: Enforced at both frontend and backend
2. **Bcrypt Hashing**: 12 rounds of bcrypt for secure password storage
3. **No Password in Logs**: Passwords are never logged or exposed in responses

### Anti-Enumeration

1. **Consistent Responses**: Always returns success message regardless of whether email exists
2. **Same Response Time**: Attempts to maintain similar response times for existing/non-existing emails
3. **No Status Disclosure**: Doesn't reveal if account is inactive

### Audit Trail

All password reset events are logged:
- Reset requests
- Token generation
- Token verification
- Password changes
- Failed attempts

## Testing

Test suite location: [tests/api/password-reset.test.js](../tests/api/password-reset.test.js)

**Test Coverage (16 tests):**

1. **Forgot Password**
   - ✓ Accept request for existing user
   - ✓ Don't reveal if user doesn't exist
   - ✓ Require email
   - ✓ Invalidate existing tokens on new request
   - ✓ Don't send email to inactive users

2. **Token Verification**
   - ✓ Verify valid token
   - ✓ Reject invalid token
   - ✓ Reject expired token
   - ✓ Reject already used token

3. **Password Reset**
   - ✓ Reset password with valid token
   - ✓ Require token and password
   - ✓ Enforce minimum password length
   - ✓ Reject invalid token
   - ✓ Reject expired token
   - ✓ Reject already used token
   - ✓ Invalidate other tokens after successful reset

**Run tests:**
```bash
# Run all password reset tests
npm test tests/api/password-reset.test.js

# Run all tests
npm test
```

## Usage

### For End Users

1. Navigate to `/admin/login`
2. Click "Forgot your password?"
3. Enter your email address
4. Check your email for reset link
5. Click the link (valid for 1 hour)
6. Enter your new password
7. Click "Reset Password"
8. You'll be redirected to login

### For Developers

#### Setting Up Email in Production

1. Choose an email provider (e.g., SendGrid, Mailgun, AWS SES)
2. Install required package:
   ```bash
   npm install @sendgrid/mail
   # or
   npm install mailgun.js form-data
   # or
   npm install @aws-sdk/client-ses
   # or
   npm install resend
   # or
   npm install nodemailer
   ```

3. Configure environment variables:
   ```env
   EMAIL_PROVIDER=sendgrid
   SENDGRID_API_KEY=your_api_key
   EMAIL_FROM=noreply@yourdomain.com
   NEXTAUTH_URL=https://yourdomain.com
   ```

4. Test in development:
   ```bash
   # Use console mode to see emails in terminal
   EMAIL_PROVIDER=console npm run dev
   ```

#### Customizing Email Template

Edit [lib/email.js](../lib/email.js):

- `getPasswordResetEmailTemplate()` - HTML email
- `getPasswordResetEmailText()` - Plain text email

Brand colors and styling can be customized in the HTML template.

#### Adding New Email Provider

1. Add provider case in `sendEmail()` function
2. Create `sendEmail{Provider}()` function
3. Document required environment variables
4. Update this documentation

## Migration Notes

### Database Migration

The password reset feature adds a new table. Migration is handled automatically by Prisma:

```bash
# Push schema changes
npx prisma db push

# Or create a migration
npx prisma migrate dev --name add_password_reset_tokens
```

### Existing Users

All existing admin users can immediately use the password reset feature. No data migration is required.

## Troubleshooting

### Email Not Sending

1. **Check environment variables**: Ensure `EMAIL_PROVIDER` and provider-specific variables are set
2. **Check logs**: Look for email sending errors in console
3. **Test with console provider**: Set `EMAIL_PROVIDER=console` to see emails in terminal
4. **Verify email service**: Check that your email service account is active and API keys are valid

### Token Expired

- Tokens expire after 1 hour for security
- User must request a new reset link
- This is intentional behavior

### Token Already Used

- Each token can only be used once
- After successful password reset, all tokens for that user are invalidated
- User must request a new reset link if they want to change password again

### Password Requirements Not Met

Frontend and backend both enforce:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

## Future Enhancements

Potential improvements for future versions:

1. **Rate Limiting**: Add rate limiting to prevent abuse
2. **2FA Integration**: Require 2FA verification before password reset
3. **Email Templates**: Support multiple templates and languages
4. **Password History**: Prevent reuse of recent passwords
5. **Admin Notifications**: Notify admins of password resets
6. **IP Tracking**: Log IP addresses for security monitoring
7. **Password Strength Meter**: Visual feedback on password strength
8. **Special Character Requirement**: Enforce special characters in passwords

## Related Files

- [prisma/schema.prisma](../prisma/schema.prisma) - Database schema
- [app/api/auth/forgot-password/route.js](../app/api/auth/forgot-password/route.js) - Forgot password API
- [app/api/auth/reset-password/route.js](../app/api/auth/reset-password/route.js) - Reset password API
- [app/admin/forgot-password/page.jsx](../app/admin/forgot-password/page.jsx) - Forgot password UI
- [app/admin/reset-password/page.jsx](../app/admin/reset-password/page.jsx) - Reset password UI
- [app/admin/login/page.jsx](../app/admin/login/page.jsx) - Login page with reset link
- [lib/email.js](../lib/email.js) - Email service
- [tests/api/password-reset.test.js](../tests/api/password-reset.test.js) - Test suite

## Support

For issues or questions about the password reset feature:
1. Check this documentation
2. Review test suite for usage examples
3. Check application logs for errors
4. Contact the development team
