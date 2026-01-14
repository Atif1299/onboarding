# BidSquire Registration Integration

This document describes the BidSquire registration integration for the free trial offer.

## Overview

When a county is available for a free trial, users can register for BidSquire by filling out a comprehensive registration form. The registration data is sent to a BidSquire webhook for account creation.

**Important:** Only one free trial is allowed per county. Once a trial registration is successful, the trial option is removed for that county and will no longer be available to other users.

## Components

### 1. RegistrationForm Component

Location: `components/RegistrationForm.jsx`

A React component that provides a complete registration form with the following fields:

- **First Name** - Required, minimum 2 characters
- **Last Name** - Required, minimum 2 characters
- **Email Address** - Required, valid email format
- **Phone Number** - Required, minimum 10 digits
- **Address** - Required, minimum 10 characters
- **Password** - Required, must meet strength requirements
- **Confirm Password** - Required, must match password

#### Password Requirements

The password must contain:
- At least 8 characters
- One uppercase letter
- One lowercase letter
- One number
- One special character (!@#$%^&*(),.?":{}|<>)

The form includes a real-time password strength indicator that shows:
- Strength level (Weak/Fair/Good/Strong)
- Progress bar
- Checklist of requirements

#### Features

- Real-time validation
- Password visibility toggle
- Password strength indicator
- Loading states during submission
- Success and error message display
- Form reset after successful submission
- Accessible form controls

### 2. API Route

Location: `app/api/bidsquire-registration/route.js`

Handles the registration process:

1. **Input Validation**
   - Validates all required fields
   - Checks email format
   - Validates password strength

2. **County Verification**
   - Checks if county exists
   - Verifies county is available for free trial
   - Checks if county already has an active trial registration

3. **Webhook Communication**
   - Sends registration data to BidSquire webhook
   - Includes proper error handling
   - Handles timeouts (10 second timeout)
   - Handles connection errors

4. **Trial Registration Tracking**
   - Records successful trial registrations in the local database
   - Prevents duplicate trial registrations for the same county
   - Stores user information for record-keeping

#### Request Format

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1 (555) 123-4567",
  "address": "123 Main St, City, State 12345",
  "password": "StrongPass123!",
  "countyId": 1,
  "countyName": "Test County"
}
```

#### Response Format

**Success:**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "email": "john.doe@example.com",
    "countyId": 1,
    "countyName": "Test County",
    "bidsquireUserId": "user-123"
  }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message here",
  "details": "Additional details if available"
}
```

### 3. Integration with AvailableComponent

Location: `app/components/AvailableComponent.jsx`

The RegistrationForm is integrated into the free trial offer card on the AvailableComponent, replacing the simple email input.

## Configuration

### Environment Variables

Add the following variables to your `.env.local` and `.env.prod` files:

```bash
# BidSquire Integration Configuration
BIDSQUIRE_WEBHOOK_URL="https://your-bidsquire-app.com/api/webhooks/register"
BIDSQUIRE_WEBHOOK_API_KEY="your-webhook-api-key-here"
```

**Required:**
- `BIDSQUIRE_WEBHOOK_URL` - The webhook endpoint URL for BidSquire registration

**Optional:**
- `BIDSQUIRE_WEBHOOK_API_KEY` - API key for webhook authentication (sent as X-API-Key header)

## Webhook Payload

The following data is sent to the BidSquire webhook:

```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phone": "string",
  "address": "string",
  "password": "string",
  "countyId": "number",
  "countyName": "string",
  "registrationDate": "ISO 8601 timestamp",
  "source": "offer-page"
}
```

## Expected Webhook Response

The BidSquire webhook should respond with:

**Success (200-299 status):**
```json
{
  "success": true,
  "userId": "user-id-here",
  // or
  "id": "user-id-here"
}
```

**Error (400+ status):**
```json
{
  "error": "Error message",
  "message": "Additional details"
}
```

## Error Handling

The API handles various error scenarios:

1. **Validation Errors (400)**
   - Missing required fields
   - Invalid email format
   - Weak password
   - County not available
   - Trial already claimed for this county

2. **Not Found (404)**
   - County doesn't exist

3. **Configuration Errors (500)**
   - Missing webhook URL

4. **Service Unavailable (503)**
   - Cannot connect to webhook
   - Network errors

5. **Timeout (504)**
   - Webhook request exceeded 10 seconds

## Testing

### Running Tests

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run tests with coverage
bun test:coverage

# Run tests with UI
bun test:ui
```

### Test Files

1. **Component Tests**: `tests/components/RegistrationForm.test.jsx`
   - Form rendering
   - Field validation
   - Password strength validation
   - Form submission
   - Error handling

2. **API Tests**: `tests/api/bidsquire-registration.test.js`
   - Input validation
   - County verification
   - Webhook integration
   - Error scenarios

## Database Schema

The integration uses a `TrialRegistrations` table to track trial registrations:

```sql
CREATE TABLE TrialRegistrations (
    trial_registration_id SERIAL PRIMARY KEY,
    county_id INT NOT NULL REFERENCES Counties(county_id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    bidsquire_user_id VARCHAR(255),
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    CONSTRAINT chk_trial_registration_status CHECK (status IN ('active', 'cancelled', 'upgraded')),
    CONSTRAINT unique_trial_per_county UNIQUE (county_id)
);
```

**Status Values:**
- `active` - Currently on free trial
- `cancelled` - Trial ended
- `upgraded` - Moved to a paid plan

The `unique_trial_per_county` constraint ensures only one active trial can exist per county.

## Security Considerations

1. **Password Handling**
   - Passwords are sent to BidSquire webhook over HTTPS
   - Consider hashing passwords before sending if BidSquire requires it
   - Password is not stored in this application

2. **API Key Protection**
   - Keep `BIDSQUIRE_WEBHOOK_API_KEY` secret
   - Never commit to version control
   - Use different keys for development and production

3. **Input Validation**
   - All inputs are validated on both client and server
   - Email format validation
   - Password strength enforcement

4. **Privacy**
   - Trial registration information is stored locally for tracking
   - Email addresses are not exposed in public APIs
   - Only registration date is shown in public county status

## Future Enhancements

1. Send confirmation email to user
3. Add CAPTCHA to prevent spam
4. Implement rate limiting
5. Add support for password hashing before sending to webhook
6. Add support for two-factor authentication
7. Implement email verification before creating BidSquire account

## Troubleshooting

### Webhook URL Not Configured

**Error:** "Registration service is not configured"

**Solution:** Add `BIDSQUIRE_WEBHOOK_URL` to your environment variables

### Webhook Timeout

**Error:** "Registration request timed out"

**Possible Causes:**
- BidSquire webhook is slow to respond
- Network issues

**Solutions:**
- Check BidSquire webhook performance
- Increase timeout if needed (current: 10 seconds)

### Connection Refused

**Error:** "Unable to connect to registration service"

**Possible Causes:**
- Webhook URL is incorrect
- BidSquire service is down
- Network/firewall issues

**Solutions:**
- Verify webhook URL
- Check BidSquire service status
- Check network connectivity

## Support

For questions or issues related to:
- **This integration**: Contact your development team
- **BidSquire webhook**: Contact BidSquire support
