import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/api/bidsquire-registration/route';
import { query } from '@/lib/db';

// Mock dependencies
vi.mock('@/lib/db');

describe('/api/bidsquire-registration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    process.env.BIDSQUIRE_WEBHOOK_URL = 'https://test-webhook.com/register';
    process.env.BIDSQUIRE_WEBHOOK_API_KEY = 'test-api-key';
  });

  const validRequestData = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    address: '123 Main St, City, State 12345',
    password: 'StrongPass123!',
    countyId: 1,
    countyName: 'Test County',
  };

  const createMockRequest = (body) => ({
    json: async () => body,
  });

  describe('Input Validation', () => {
    it('should reject request with missing required fields', async () => {
      const request = createMockRequest({
        firstName: 'John',
        lastName: 'Doe',
        // Missing email, address, password, countyId
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('required');
    });

    it('should reject invalid email format', async () => {
      const request = createMockRequest({
        ...validRequestData,
        email: 'invalid-email',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid email format');
    });

    it('should reject weak password (no uppercase)', async () => {
      const request = createMockRequest({
        ...validRequestData,
        password: 'weakpass123!',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Password does not meet strength requirements');
    });

    it('should reject weak password (no lowercase)', async () => {
      const request = createMockRequest({
        ...validRequestData,
        password: 'WEAKPASS123!',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Password does not meet strength requirements');
    });

    it('should reject weak password (no numbers)', async () => {
      const request = createMockRequest({
        ...validRequestData,
        password: 'WeakPassword!',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Password does not meet strength requirements');
    });

    it('should reject weak password (no special characters)', async () => {
      const request = createMockRequest({
        ...validRequestData,
        password: 'WeakPassword123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Password does not meet strength requirements');
    });

    it('should reject weak password (too short)', async () => {
      const request = createMockRequest({
        ...validRequestData,
        password: 'Weak1!',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Password does not meet strength requirements');
    });
  });

  describe('County Validation', () => {
    it('should return 404 when county does not exist', async () => {
      query.mockResolvedValueOnce({ rows: [] });

      const request = createMockRequest(validRequestData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('County not found');
    });

    it('should reject when county is not available', async () => {
      query.mockResolvedValueOnce({
        rows: [
          {
            county_id: 1,
            name: 'Test County',
            status: 'fully_locked',
          },
        ],
      });

      const request = createMockRequest(validRequestData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Free trial is not available');
      expect(data.county_status).toBe('fully_locked');
    });

    it('should proceed when county is available', async () => {
      // Mock county query
      query.mockResolvedValueOnce({
        rows: [
          {
            county_id: 1,
            name: 'Test County',
            status: 'available',
          },
        ],
      });

      // Mock trial check query - no existing trial
      query.mockResolvedValueOnce({ rows: [] });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => 'application/json',
        },
        text: async () => JSON.stringify({ success: true, userId: '123' }),
      });

      // Mock INSERT query for trial registration
      query.mockResolvedValueOnce({ rows: [] });

      const request = createMockRequest(validRequestData);
      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(true);
    });
  });

  describe('Webhook Configuration', () => {
    it('should return 500 when webhook URL is not configured', async () => {
      delete process.env.BIDSQUIRE_WEBHOOK_URL;

      // Mock county query
      query.mockResolvedValueOnce({
        rows: [
          {
            county_id: 1,
            name: 'Test County',
            status: 'available',
          },
        ],
      });

      // Mock trial check query - no existing trial
      query.mockResolvedValueOnce({ rows: [] });

      const request = createMockRequest(validRequestData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('not configured');
    });
  });

  describe('Webhook Integration', () => {
    beforeEach(() => {
      // Mock county query (first call)
      query.mockResolvedValueOnce({
        rows: [
          {
            county_id: 1,
            name: 'Test County',
            status: 'available',
          },
        ],
      });
      // Mock trial check query (second call) - no existing trial
      query.mockResolvedValueOnce({ rows: [] });
    });

    it('should send correct payload to webhook', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => 'application/json',
        },
        text: async () => JSON.stringify({ success: true, userId: '123' }),
      });

      // Mock INSERT query for trial registration
      query.mockResolvedValueOnce({ rows: [] });

      const request = createMockRequest(validRequestData);
      await POST(request);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://test-webhook.com/register',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );

      const callArgs = global.fetch.mock.calls[0][1];
      const sentPayload = JSON.parse(callArgs.body);

      expect(sentPayload.firstName).toBe(validRequestData.firstName);
      expect(sentPayload.lastName).toBe(validRequestData.lastName);
      expect(sentPayload.email).toBe(validRequestData.email);
      expect(sentPayload.address).toBe(validRequestData.address);
      expect(sentPayload.password).toBe(validRequestData.password);
      expect(sentPayload.countyId).toBe(validRequestData.countyId);
      expect(sentPayload.countyName).toBe(validRequestData.countyName);
      expect(sentPayload.source).toBe('offer-page');
      expect(sentPayload.registrationDate).toBeDefined();
    });

    it('should return success when webhook succeeds', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => 'application/json',
        },
        text: async () => JSON.stringify({
          success: true,
          userId: 'user-123',
          id: 'id-456',
        }),
      });

      // Mock INSERT query for trial registration
      query.mockResolvedValueOnce({ rows: [] });

      const request = createMockRequest(validRequestData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Registration successful');
      expect(data.data.email).toBe(validRequestData.email);
      expect(data.data.bidsquireUserId).toBe('user-123');
    });

    it('should handle webhook failure', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: {
          get: () => 'application/json',
        },
        text: async () => JSON.stringify({
          error: 'Email already exists',
          message: 'User with this email already registered',
        }),
      });

      const request = createMockRequest(validRequestData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Email already exists');
    });

    it('should handle webhook timeout', async () => {
      global.fetch.mockRejectedValueOnce(
        Object.assign(new Error('Timeout'), { name: 'AbortError' })
      );

      const request = createMockRequest(validRequestData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(504);
      expect(data.success).toBe(false);
      expect(data.error).toContain('timed out');
    });

    it('should handle webhook connection error', async () => {
      const error = new Error('Connection refused');
      error.code = 'ECONNREFUSED';
      global.fetch.mockRejectedValueOnce(error);

      const request = createMockRequest(validRequestData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Unable to connect');
    });

    it('should handle webhook network error (ENOTFOUND)', async () => {
      const error = new Error('Host not found');
      error.code = 'ENOTFOUND';
      global.fetch.mockRejectedValueOnce(error);

      const request = createMockRequest(validRequestData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Unable to connect');
    });

    it('should handle generic webhook error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Unknown error'));

      const request = createMockRequest(validRequestData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Failed to complete registration');
    });
  });

  describe('Database Error Handling', () => {
    it('should handle database query errors', async () => {
      query.mockRejectedValueOnce(new Error('Database connection failed'));

      const request = createMockRequest(validRequestData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Failed to process registration');
    });
  });

  describe('Trial Registration Tracking', () => {
    beforeEach(() => {
      // Mock county query (first call)
      query.mockResolvedValueOnce({
        rows: [
          {
            county_id: 1,
            name: 'Test County',
            status: 'available',
          },
        ],
      });
    });

    it('should record trial registration in database after successful webhook', async () => {
      // Mock successful webhook response
      global.fetch.mockResolvedValueOnce({
        ok: true,
        headers: {
          get: () => 'application/json',
        },
        text: async () => JSON.stringify({ success: true, userId: 'user-123' }),
      });

      // Mock trial registration insert (second query call)
      query.mockResolvedValueOnce({ rows: [] });

      const request = createMockRequest(validRequestData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);

      // Verify that INSERT query was called to record trial registration
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO TrialRegistrations'),
        expect.arrayContaining([
          validRequestData.countyId,
          validRequestData.email,
          validRequestData.firstName,
          validRequestData.lastName,
          expect.any(String), // phone
          validRequestData.address,
          'user-123', // bidsquire_user_id
        ])
      );
    });

    it('should reject registration if county already has an active trial', async () => {
      // Mock county query showing trial already exists
      query.mockReset();
      query.mockResolvedValueOnce({
        rows: [
          {
            county_id: 1,
            name: 'Test County',
            status: 'available',
          },
        ],
      });

      // Mock trial check query showing existing trial
      query.mockResolvedValueOnce({
        rows: [
          {
            trial_registration_id: 1,
            county_id: 1,
            email: 'existing@example.com',
            status: 'active',
          },
        ],
      });

      const request = createMockRequest(validRequestData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('trial has already been claimed');
    });
  });
});
