/**
 * Email Service
 *
 * This module provides email sending functionality with support for multiple providers.
 * Currently supports console logging (development) and can be extended to support:
 * - SendGrid
 * - Mailgun
 * - AWS SES
 * - Resend
 * - Nodemailer with SMTP
 *
 * Configuration via environment variables:
 * - EMAIL_PROVIDER: 'console' | 'sendgrid' | 'mailgun' | 'ses' | 'resend' | 'smtp'
 * - EMAIL_FROM: Default sender email address
 * - Provider-specific API keys and settings
 */

const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || (process.env.RESEND_API_KEY ? 'resend' : 'console');
const EMAIL_FROM = (process.env.EMAIL_FROM || 'BidSquire <onboarding@resend.dev>').replace(/^['"]|['"]$/g, '');

/**
 * Send password reset email
 * @param {string} to - Recipient email address
 * @param {string} resetUrl - Password reset URL
 * @param {string} userName - User's full name
 */
export async function sendPasswordResetEmail(to, resetUrl, userName) {
  const subject = 'Reset Your Password';
  console.log('🔗 Magic Link (Onboarding Reset):', resetUrl);
  const html = getPasswordResetEmailTemplate(resetUrl, userName);
  const text = getPasswordResetEmailText(resetUrl, userName);

  return sendEmail({
    to,
    subject,
    html,
    text,
  });
}

/**
 * Send welcome email
 * @param {string} to - Recipient email address
 * @param {string} userName - User's full name
 */
export async function sendWelcomeEmail(to, userName) {
  const subject = 'Welcome to BidSquire!';
  const html = getWelcomeEmailTemplate(userName);
  const text = getWelcomeEmailText(userName);

  return sendEmail({
    to,
    subject,
    html,
    text,
  });
}

/**
 * Core email sending function
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content
 * @param {string} [options.from] - Sender email (optional, uses default)
 */
async function sendEmail({ to, subject, html, text, from = EMAIL_FROM }) {
  // ALWAYS log to console for debugging (regardless of provider)
  console.log('\n========================================');
  console.log('📧 EMAIL NOTIFICATION');
  console.log('========================================');
  console.log(`From: ${from}`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log('----------------------------------------');
  console.log(text);
  console.log('========================================\n');

  try {
    switch (EMAIL_PROVIDER) {
      case 'console':
        // Already logged above, just return success
        return { success: true, provider: 'console' };

      // case 'sendgrid':
      //   return sendEmailSendGrid({ to, from, subject, html, text });

      // case 'mailgun':
      //   return sendEmailMailgun({ to, from, subject, html, text });

      // case 'ses':
      //   return sendEmailSES({ to, from, subject, html, text });

      case 'resend':
        return sendEmailResend({ to, from, subject, html, text });

      // case 'smtp':
      //   return sendEmailSMTP({ to, from, subject, html, text });

      default:
        console.warn(`⚠️ Unsupported email provider: ${EMAIL_PROVIDER}, email logged to console only`);
        return { success: true, provider: 'console-fallback' };
    }
  } catch (error) {
    console.error('Email sending error:', error);
    // Don't throw - email was already logged to console
    return { success: false, error: error.message, provider: 'console-fallback' };
  }
}

/**
 * Console logger (for development)
 */
function sendEmailConsole({ to, from, subject, text }) {
  console.log('\n========================================');
  console.log('EMAIL (Console Mode)');
  console.log('========================================');
  console.log(`From: ${from}`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log('----------------------------------------');
  console.log(text);
  console.log('========================================\n');

  return Promise.resolve({ success: true, provider: 'console' });
}

// /**
//  * SendGrid implementation
//  * Requires: npm install @sendgrid/mail
//  * Environment: SENDGRID_API_KEY
//  */
// async function sendEmailSendGrid({ to, from, subject, html, text }) {
//   const sgMail = (await import('@sendgrid/mail')).default;
//   sgMail.setApiKey(process.env.SENDGRID_API_KEY);

//   const msg = {
//     to,
//     from,
//     subject,
//     text,
//     html,
//   };

//   await sgMail.send(msg);
//   return { success: true, provider: 'sendgrid' };
// }

// /**
//  * Mailgun implementation
//  * Requires: npm install mailgun.js form-data
//  * Environment: MAILGUN_API_KEY, MAILGUN_DOMAIN
//  */
// async function sendEmailMailgun({ to, from, subject, html, text }) {
//   const FormData = (await import('form-data')).default;
//   const Mailgun = (await import('mailgun.js')).default;

//   const mailgun = new Mailgun(FormData);
//   const mg = mailgun.client({
//     username: 'api',
//     key: process.env.MAILGUN_API_KEY,
//   });

//   await mg.messages.create(process.env.MAILGUN_DOMAIN, {
//     from,
//     to,
//     subject,
//     text,
//     html,
//   });

//   return { success: true, provider: 'mailgun' };
// }

// /**
//  * AWS SES implementation
//  * Requires: npm install @aws-sdk/client-ses
//  * Environment: AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
//  */
// async function sendEmailSES({ to, from, subject, html, text }) {
//   const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');

//   const client = new SESClient({
//     region: process.env.AWS_REGION || 'us-east-1',
//   });

//   const command = new SendEmailCommand({
//     Source: from,
//     Destination: {
//       ToAddresses: [to],
//     },
//     Message: {
//       Subject: {
//         Data: subject,
//       },
//       Body: {
//         Text: {
//           Data: text,
//         },
//         Html: {
//           Data: html,
//         },
//       },
//     },
//   });

//   await client.send(command);
//   return { success: true, provider: 'ses' };
// }

/**
 * Resend implementation
 * Requires: npm install resend
 * Environment: RESEND_API_KEY
 */
async function sendEmailResend({ to, from, subject, html, text }) {
  const { Resend } = await import('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from,
    to,
    subject,
    html,
    text,
  });

  return { success: true, provider: 'resend' };
}

// /**
//  * SMTP implementation (using Nodemailer)
//  * Requires: npm install nodemailer
//  * Environment: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
//  */
// async function sendEmailSMTP({ to, from, subject, html, text }) {
//   const nodemailer = (await import('nodemailer')).default;

//   const transporter = nodemailer.createTransport({
//     host: process.env.SMTP_HOST,
//     port: parseInt(process.env.SMTP_PORT || '587'),
//     secure: process.env.SMTP_SECURE === 'true',
//     auth: {
//       user: process.env.SMTP_USER,
//       pass: process.env.SMTP_PASS,
//     },
//   });

//   await transporter.sendMail({
//     from,
//     to,
//     subject,
//     text,
//     html,
//   });

//   return { success: true, provider: 'smtp' };
// }


/**
 * Email template for password reset (HTML)
 */
function getPasswordResetEmailTemplate(resetUrl, userName) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background-color: #42bdd1; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                Reset Your Password
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.5;">
                Hi ${userName || 'there'},
              </p>

              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.5;">
                We received a request to reset your password. Click the button below to create a new password:
              </p>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background-color: #42bdd1; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 20px; color: #374151; font-size: 14px; line-height: 1.5;">
                This link will expire in <strong>1 hour</strong> for security reasons.
              </p>

              <p style="margin: 0 0 20px; color: #374151; font-size: 14px; line-height: 1.5;">
                If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
              </p>

              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0 0 10px; color: #6b7280; font-size: 12px; line-height: 1.5;">
                  If the button doesn't work, copy and paste this link into your browser:
                </p>
                <p style="margin: 0; color: #42bdd1; font-size: 12px; word-break: break-all;">
                  ${resetUrl}
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; text-align: center; background-color: #f9fafb; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                This email was sent from BidSquire
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Email template for password reset (Plain Text)
 */
function getPasswordResetEmailText(resetUrl, userName) {
  return `
Hi ${userName || 'there'},

We received a request to reset your password.

To reset your password, visit the following link:
${resetUrl}

This link will expire in 1 hour for security reasons.

If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.

---
This email was sent from BidSquire
  `.trim();
}


/**
 * Email template for welcome email (HTML)
 */
function getWelcomeEmailTemplate(userName) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to BidSquire</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background-color: #42bdd1; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                Welcome to BidSquire!
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.5;">
                Hi ${userName || 'there'},
              </p>

              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.5;">
                Welcome to BidSquire! We're excited to have you on board.
              </p>

              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.5;">
                Get ready to discover and claim great auctions in your area.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${process.env.MAIN_APP_URL || 'https://app.bidsquire.com'}" style="display: inline-block; padding: 14px 32px; background-color: #42bdd1; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                      Go to Dashboard
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; text-align: center; background-color: #f9fafb; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                This email was sent from BidSquire
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Email template for welcome email (Plain Text)
 */
function getWelcomeEmailText(userName) {
  return `
Hi ${userName || 'there'},

Welcome to BidSquire! We're excited to have you on board.

Get ready to discover and claim great auctions in your area.

Visit your dashboard here:
${process.env.MAIN_APP_URL || 'https://app.bidsquire.com'}

---
This email was sent from BidSquire
  `.trim();
}

export default {
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendAuctionClaimEmail,
  sendActivationEmail,
  sendPaymentFailedEmail,
  sendSubscriptionConfirmationEmail,
  sendRenewalConfirmationEmail,
  sendCancellationEmail,
  sendEmail,
};

/**
 * Send account activation email with password set link
 * @param {string} to - Recipient email
 * @param {string} userName - User name
 * @param {string} resetUrl - Activation link
 */
export async function sendActivationEmail(to, userName, resetUrl) {
  const subject = 'Activate Your BidSquire Account';
  console.log('🔗 Magic Link (Onboarding Activation):', resetUrl);
  const html = `
<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 20px auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
  .header { text-align: center; margin-bottom: 30px; }
  .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }
  .footer { margin-top: 30px; text-align: center; color: #6b7280; font-size: 12px; }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="color: #2563eb;">Welcome to BidSquire!</h1>
    </div>
    <p>Hi ${userName || 'there'},</p>
    <p>Your account has been created successfully. To complete your setup and access your claimed auctions, please check the link below to set your password:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" class="button" style="color: white;">Activate Account & Set Password</a>
    </div>

    <p>This link is valid for 1 hour.</p>

    <p>If you have any questions, feel free to reply to this email.</p>

    <div class="footer">
      <p>BidSquire Inc.</p>
    </div>
  </div>
</body>
</html>
    `;
  const text = `
Welcome to BidSquire, ${userName || 'there'}!

Your account has been created. To complete configuration:
${resetUrl}

This link expires in 1 hour.
    `;

  return sendEmail({ to, subject, html, text });
}

/**
 * Send auction claim confirmation email
 * @param {string} to - Recipient email address
 * @param {string} userName - User's full name
 * @param {string} auctionTitle - Title of the claimed auction
 * @param {string} auctionUrl - URL of the claimed auction
 * @param {boolean} isFree - Whether this was a free claim
 */
export async function sendAuctionClaimEmail(to, userName, auctionTitle, auctionUrl, isFree = false) {
  const subject = isFree ? 'Free Trial Claim Confirmed: ' + auctionTitle : 'Auction Claim Confirmed: ' + auctionTitle;
  const html = getAuctionClaimEmailTemplate(userName, auctionTitle, auctionUrl, isFree);
  const text = getAuctionClaimEmailText(userName, auctionTitle, auctionUrl, isFree);

  return sendEmail({
    to,
    subject,
    html,
    text,
  });
}

/**
 * Email template for auction claim (HTML)
 */
function getAuctionClaimEmailTemplate(userName, auctionTitle, auctionUrl, isFree) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Auction Claim Confirmed</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background-color: ${isFree ? '#22c55e' : '#2563eb'}; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                ${isFree ? 'Free Trial Claim Confirmed!' : 'Auction Claim Confirmed!'}
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.5;">
                Hi ${userName || 'there'},
              </p>

              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.5;">
                You have successfully claimed exclusivity for the following auction:
              </p>

              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <p style="margin: 0; font-weight: bold; color: #111827;">${auctionTitle}</p>
                <p style="margin: 10px 0 0;"><a href="${auctionUrl}" style="color: ${isFree ? '#16a34a' : '#2563eb'}; text-decoration: none;">View Auction</a></p>
              </div>

              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.5;">
                This auction is now locked for other users on our platform. Good luck with your bidding!
              </p>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${process.env.MAIN_APP_URL || 'https://app.bidsquire.com'}/dashboard" style="display: inline-block; padding: 14px 32px; background-color: ${isFree ? '#22c55e' : '#2563eb'}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                      View Dashboard
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; text-align: center; background-color: #f9fafb; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                This email was sent from BidSquire
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Email template for auction claim (Plain Text)
 */
function getAuctionClaimEmailText(userName, auctionTitle, auctionUrl, isFree) {
  return `
Hi ${userName || 'there'},

${isFree ? 'Free Trial Claim Confirmed!' : 'Auction Claim Confirmed!'}

You have successfully claimed exclusivity for the following auction:
${auctionTitle}
${auctionUrl}

This auction is now locked for other users on our platform. Good luck with your bidding!

View Dashboard: ${process.env.MAIN_APP_URL || 'https://app.bidsquire.com'}/dashboard

---
This email was sent from BidSquire
  `.trim();
}

/**
 * Send payment failed notification email
 * @param {string} to - Recipient email
 * @param {string} userName - User name
 * @param {string} retryUrl - URL to retry payment (Stripe billing portal)
 */
export async function sendPaymentFailedEmail(to, userName, retryUrl) {
  const subject = 'Action Required: Payment Failed - BidSquire';
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Failed</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background-color: #dc2626; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                Payment Failed
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.5;">
                Hi ${userName || 'there'},
              </p>
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.5;">
                We were unable to process your recent payment. Your subscription may be interrupted if the payment is not resolved.
              </p>
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.5;">
                Please update your payment method to continue enjoying BidSquire's services.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${retryUrl}" style="display: inline-block; padding: 14px 32px; background-color: #dc2626; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                      Update Payment Method
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                If you have any questions, please reply to this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; text-align: center; background-color: #f9fafb; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                This email was sent from BidSquire
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
Hi ${userName || 'there'},

We were unable to process your recent payment. Your subscription may be interrupted if the payment is not resolved.

Please update your payment method here:
${retryUrl}

If you have any questions, please reply to this email.

---
This email was sent from BidSquire
  `.trim();

  return sendEmail({ to, subject, html, text });
}

/**
 * Send subscription confirmation email
 * @param {string} to - Recipient email
 * @param {string} userName - User name
 * @param {string} countyName - County name
 * @param {string} tierName - Subscription tier name
 * @param {number} credits - Credits included
 */
export async function sendSubscriptionConfirmationEmail(to, userName, countyName, tierName, credits) {
  const subject = `Subscription Confirmed: ${countyName} - BidSquire`;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Subscription Confirmed</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background-color: #22c55e; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                Subscription Confirmed!
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.5;">
                Hi ${userName || 'there'},
              </p>
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.5;">
                Thank you for subscribing to BidSquire! Here are your subscription details:
              </p>
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <table width="100%" style="border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">County:</td>
                    <td style="padding: 8px 0; color: #111827; font-weight: bold; text-align: right;">${countyName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Plan:</td>
                    <td style="padding: 8px 0; color: #111827; font-weight: bold; text-align: right;">${tierName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Credits Included:</td>
                    <td style="padding: 8px 0; color: #22c55e; font-weight: bold; text-align: right;">${credits}</td>
                  </tr>
                </table>
              </div>
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.5;">
                You now have exclusive access to auctions in ${countyName}. Start analyzing auctions today!
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${process.env.MAIN_APP_URL || 'http://localhost:3001'}" style="display: inline-block; padding: 14px 32px; background-color: #22c55e; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                      Go to Dashboard
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; text-align: center; background-color: #f9fafb; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                This email was sent from BidSquire
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
Hi ${userName || 'there'},

Thank you for subscribing to BidSquire!

Subscription Details:
- County: ${countyName}
- Plan: ${tierName}
- Credits Included: ${credits}

You now have exclusive access to auctions in ${countyName}. Start analyzing auctions today!

Go to Dashboard: ${process.env.MAIN_APP_URL || 'http://localhost:3001'}

---
This email was sent from BidSquire
  `.trim();

  return sendEmail({ to, subject, html, text });
}

/**
 * Send renewal confirmation email with credits balance
 * @param {string} to - Recipient email
 * @param {string} userName - User name
 * @param {string} countyName - County name
 * @param {number} creditsAdded - Credits added this renewal
 * @param {number} currentBalance - Current total credits balance
 */
export async function sendRenewalConfirmationEmail(to, userName, countyName, creditsAdded, currentBalance) {
  const subject = `Subscription Renewed: ${countyName} - BidSquire`;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Subscription Renewed</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background-color: #2563eb; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                Subscription Renewed!
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.5;">
                Hi ${userName || 'there'},
              </p>
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.5;">
                Your subscription for <strong>${countyName}</strong> has been renewed successfully.
              </p>
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <table width="100%" style="border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Credits Added:</td>
                    <td style="padding: 8px 0; color: #22c55e; font-weight: bold; text-align: right;">+${creditsAdded}</td>
                  </tr>
                  <tr style="border-top: 1px solid #e5e7eb;">
                    <td style="padding: 12px 0 8px; color: #6b7280; font-weight: bold;">Current Balance:</td>
                    <td style="padding: 12px 0 8px; color: #2563eb; font-weight: bold; font-size: 18px; text-align: right;">${currentBalance} credits</td>
                  </tr>
                </table>
              </div>
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.5;">
                Continue enjoying exclusive access to auctions in your area!
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${process.env.MAIN_APP_URL || 'http://localhost:3001'}" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                      View Dashboard
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; text-align: center; background-color: #f9fafb; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                This email was sent from BidSquire
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
Hi ${userName || 'there'},

Your subscription for ${countyName} has been renewed successfully.

Credits Added: +${creditsAdded}
Current Balance: ${currentBalance} credits

Continue enjoying exclusive access to auctions in your area!

View Dashboard: ${process.env.MAIN_APP_URL || 'http://localhost:3001'}

---
This email was sent from BidSquire
  `.trim();

  return sendEmail({ to, subject, html, text });
}

/**
 * Send subscription cancellation confirmation email
 * @param {string} to - Recipient email
 * @param {string} userName - User name
 * @param {string} countyName - County name
 * @param {Date} endDate - When access ends
 */
export async function sendCancellationEmail(to, userName, countyName, endDate) {
  const formattedDate = endDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const subject = `Subscription Cancelled: ${countyName} - BidSquire`;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Subscription Cancelled</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background-color: #6b7280; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">
                Subscription Cancelled
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.5;">
                Hi ${userName || 'there'},
              </p>
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.5;">
                Your subscription for <strong>${countyName}</strong> has been cancelled.
              </p>
              <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; color: #92400e;">
                  <strong>Note:</strong> You will continue to have access until <strong>${formattedDate}</strong>.
                </p>
              </div>
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.5;">
                We're sorry to see you go. If you change your mind, you can resubscribe at any time.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                      Resubscribe
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                If you have any feedback, we'd love to hear from you. Reply to this email anytime.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; text-align: center; background-color: #f9fafb; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                This email was sent from BidSquire
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
Hi ${userName || 'there'},

Your subscription for ${countyName} has been cancelled.

Note: You will continue to have access until ${formattedDate}.

We're sorry to see you go. If you change your mind, you can resubscribe at any time:
${process.env.NEXTAUTH_URL || 'http://localhost:3000'}

If you have any feedback, we'd love to hear from you. Reply to this email anytime.

---
This email was sent from BidSquire
  `.trim();

  return sendEmail({ to, subject, html, text });
}
