import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * POST /api/bidsquire-registration
 * Handles user registration for BidSquire free trial
 * Validates input, checks county availability, and sends data to BidSquire webhook
 */
export async function POST(request) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, address, password, countyId, countyName } = body;

    // Log incoming request (without sensitive data like password)
    console.log('========================================');
    console.log(`[${requestId}] 📥 INCOMING REQUEST to /api/bidsquire-registration`);
    console.log(`[${requestId}] Timestamp: ${new Date().toISOString()}`);
    console.log(`[${requestId}] Request Body:`, {
      firstName,
      lastName,
      email,
      phone,
      address: address?.substring(0, 20) + '...',
      password: '***REDACTED***',
      countyId,
      countyName,
    });
    console.log('========================================');

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !address || !password || !countyId) {
      return NextResponse.json(
        {
          success: false,
          error: 'All fields are required',
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email format',
        },
        { status: 400 }
      );
    }

    // Validate phone number format
    const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid phone number format',
        },
        { status: 400 }
      );
    }

    // Validate password strength
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (
      password.length < minLength ||
      !hasUpperCase ||
      !hasLowerCase ||
      !hasNumbers ||
      !hasSpecialChar
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Password does not meet strength requirements',
        },
        { status: 400 }
      );
    }

    // Check if county exists and is available
    const countyResult = await query(
      'SELECT county_id, name, status FROM Counties WHERE county_id = $1',
      [countyId]
    );

    if (countyResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'County not found',
        },
        { status: 404 }
      );
    }

    const county = countyResult.rows[0];
    if (county.status !== 'available') {
      return NextResponse.json(
        {
          success: false,
          error: 'Free trial is not available for this county',
          county_status: county.status,
        },
        { status: 400 }
      );
    }

    // Check if county already has an active trial registration
    const trialCheckResult = await query(
      'SELECT trial_registration_id, email, status FROM TrialRegistrations WHERE county_id = $1 AND status = $2',
      [countyId, 'active']
    );

    if (trialCheckResult.rows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Free trial has already been claimed for this county',
          details: 'Only one free trial is allowed per county',
        },
        { status: 400 }
      );
    }

    // Prepare webhook payload
    const webhookPayload = {
      firstName,
      lastName,
      email,
      phone,
      address,
      password,
      countyId,
      countyName: countyName || county.name,
      registrationDate: new Date().toISOString(),
      source: 'offer-page',
    };

    // Get webhook URL from environment variables
    const webhookUrl = process.env.BIDSQUIRE_WEBHOOK_URL;

    if (!webhookUrl) {
      console.error('BIDSQUIRE_WEBHOOK_URL is not configured');
      return NextResponse.json(
        {
          success: false,
          error: 'Registration service is not configured',
        },
        { status: 500 }
      );
    }

    // Send request to BidSquire webhook
    let webhookResponse;
    try {
      // Log outgoing webhook request
      console.log('========================================');
      console.log(`[${requestId}] 📤 OUTGOING REQUEST to BidSquire Webhook`);
      console.log(`[${requestId}] Timestamp: ${new Date().toISOString()}`);
      console.log(`[${requestId}] Webhook URL: ${webhookUrl}`);
      // Add n8n authentication to payload
      const payloadWithAuth = {
        ...webhookPayload,
        // httpHeaderAuth: {
        //   name: 'bidsquire',
        //   value: process.env.BIDSQUIRE_WEBHOOK_API_KEY || '',
        // },
      };

      console.log(`[${requestId}] Request Headers:`, {
        'Content-Type': 'application/json',
      });
      console.log(`[${requestId}] Request Payload:`,
        JSON.stringify(payloadWithAuth)
      );
      console.log('========================================');

      const webhookStartTime = Date.now();

      webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'bidsquire': process.env.BIDSQUIRE_WEBHOOK_API_KEY || '',
          // httpHeaderAuth: {
          //   name: 'bidsquire',
          //   value: process.env.BIDSQUIRE_WEBHOOK_API_KEY || '',
          // },
        },
        body: JSON.stringify(payloadWithAuth),
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      const webhookEndTime = Date.now();
      const webhookDuration = webhookEndTime - webhookStartTime;

      // Try to parse response as JSON, but handle non-JSON responses
      let webhookData;
      let rawResponseText;
      const contentType = webhookResponse.headers.get('content-type');

      try {
        rawResponseText = await webhookResponse.text();
        console.log(`[${requestId}] Raw Response Text:`, rawResponseText.substring(0, 500));

        if (contentType && contentType.includes('application/json')) {
          webhookData = JSON.parse(rawResponseText);
        } else {
          // Non-JSON response, wrap it in an object
          webhookData = {
            rawResponse: rawResponseText,
            contentType: contentType,
          };
        }
      } catch (parseError) {
        console.error(`[${requestId}] Failed to parse webhook response:`, parseError.message);
        webhookData = {
          error: 'Invalid response format',
          rawResponse: rawResponseText,
          parseError: parseError.message,
        };
      }

      // Log webhook response
      console.log('========================================');
      console.log(`[${requestId}] 📨 RESPONSE from BidSquire Webhook`);
      console.log(`[${requestId}] Timestamp: ${new Date().toISOString()}`);
      console.log(`[${requestId}] Response Time: ${webhookDuration}ms`);
      console.log(`[${requestId}] Status Code: ${webhookResponse.status}`);
      console.log(`[${requestId}] Status Text: ${webhookResponse.statusText}`);
      console.log(`[${requestId}] Response Headers:`, {
        'content-type': contentType,
      });
      console.log(`[${requestId}] Response Body (Parsed):`, webhookData);
      console.log('========================================');

      // Check if webhook was successful
      if (!webhookResponse.ok) {
        console.error('========================================');
        console.error(`[${requestId}] ❌ BidSquire webhook FAILED`);
        console.error(`[${requestId}] Status: ${webhookResponse.status}`);
        console.error(`[${requestId}] Error Data:`, webhookData);
        console.error('========================================');

        return NextResponse.json(
          {
            success: false,
            error: webhookData.error || 'Failed to register with BidSquire',
            details: webhookData.message,
          },
          { status: webhookResponse.status }
        );
      }

      // Log successful registration
      console.log('========================================');
      console.log(`[${requestId}] ✅ BidSquire registration SUCCESSFUL`);
      console.log(`[${requestId}] User Email: ${email}`);
      console.log(`[${requestId}] County ID: ${countyId}`);
      console.log(`[${requestId}] BidSquire User ID: ${webhookData.userId || webhookData.id || 'N/A'}`);
      console.log('========================================');

      // Record trial registration in database
      try {
        await query(
          `INSERT INTO TrialRegistrations
           (county_id, email, first_name, last_name, phone, address, bidsquire_user_id, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            countyId,
            email,
            firstName,
            lastName,
            phone,
            address,
            webhookData.userId || webhookData.id,
            'active',
          ]
        );

        console.log('========================================');
        console.log(`[${requestId}] ✅ Trial registration recorded in database`);
        console.log(`[${requestId}] County ID: ${countyId} is now marked as trial taken`);
        console.log('========================================');
      } catch (dbError) {
        console.error('========================================');
        console.error(`[${requestId}] ⚠️ WARNING: Failed to record trial registration in database`);
        console.error(`[${requestId}] Error:`, dbError.message);
        console.error(`[${requestId}] Registration was successful in BidSquire but not tracked locally`);
        console.error('========================================');
        // Continue with success response even if local tracking fails
      }

      const successResponse = {
        success: true,
        message: 'Registration successful',
        data: {
          email,
          countyId,
          countyName: webhookPayload.countyName,
          bidsquireUserId: webhookData.userId || webhookData.id,
        },
      };

      console.log('========================================');
      console.log(`[${requestId}] 📤 SENDING RESPONSE to Client`);
      console.log(`[${requestId}] Status Code: 201`);
      console.log(`[${requestId}] Response Body:`, successResponse);
      console.log('========================================');

      return NextResponse.json(successResponse, { status: 201 });
    } catch (fetchError) {
      console.error('========================================');
      console.error(`[${requestId}] ❌ WEBHOOK REQUEST ERROR`);
      console.error(`[${requestId}] Error Name: ${fetchError.name}`);
      console.error(`[${requestId}] Error Code: ${fetchError.code || 'N/A'}`);
      console.error(`[${requestId}] Error Message: ${fetchError.message}`);
      console.error(`[${requestId}] Error Stack:`, fetchError.stack);
      console.error('========================================');

      let errorResponse;
      let statusCode;

      // Check if it's a timeout error
      if (fetchError.name === 'AbortError') {
        errorResponse = {
          success: false,
          error: 'Registration request timed out. Please try again.',
        };
        statusCode = 504;
      }
      // Check if webhook is unreachable
      else if (fetchError.code === 'ECONNREFUSED' || fetchError.code === 'ENOTFOUND') {
        errorResponse = {
          success: false,
          error: 'Unable to connect to registration service',
        };
        statusCode = 503;
      }
      else {
        errorResponse = {
          success: false,
          error: 'Failed to complete registration',
          message: fetchError.message,
        };
        statusCode = 500;
      }

      console.error('========================================');
      console.error(`[${requestId}] 📤 SENDING ERROR RESPONSE to Client`);
      console.error(`[${requestId}] Status Code: ${statusCode}`);
      console.error(`[${requestId}] Response Body:`, errorResponse);
      console.error('========================================');

      return NextResponse.json(errorResponse, { status: statusCode });
    }
  } catch (error) {
    console.error('========================================');
    console.error(`[${requestId}] ❌ GENERAL ERROR in /api/bidsquire-registration`);
    console.error(`[${requestId}] Error:`, error);
    console.error(`[${requestId}] Stack:`, error.stack);
    console.error('========================================');

    const errorResponse = {
      success: false,
      error: 'Failed to process registration',
      message: error.message,
    };

    console.error('========================================');
    console.error(`[${requestId}] 📤 SENDING ERROR RESPONSE to Client`);
    console.error(`[${requestId}] Status Code: 500`);
    console.error(`[${requestId}] Response Body:`, errorResponse);
    console.error('========================================');

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
