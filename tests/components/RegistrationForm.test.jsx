import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegistrationForm from '@/components/RegistrationForm';

describe('RegistrationForm', () => {
  const mockOnSuccess = vi.fn();
  const defaultProps = {
    countyId: 1,
    countyName: 'Test County',
    onSuccess: mockOnSuccess,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('Rendering', () => {
    it('should render all form fields', () => {
      render(<RegistrationForm {...defaultProps} />);

      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /start free trial/i })).toBeInTheDocument();
    });

    it('should render password toggle buttons', () => {
      render(<RegistrationForm {...defaultProps} />);

      const toggleButtons = screen.getAllByRole('button', { name: '' });
      expect(toggleButtons.length).toBeGreaterThanOrEqual(2); // Password and confirm password toggles
    });
  });

  describe('Form Validation', () => {
    it('should show error when first name is empty', async () => {
      const user = userEvent.setup();
      render(<RegistrationForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /start free trial/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
      });
    });

    it('should show error when first name is too short', async () => {
      const user = userEvent.setup();
      render(<RegistrationForm {...defaultProps} />);

      const firstNameInput = screen.getByLabelText(/first name/i);
      await user.type(firstNameInput, 'A');

      const submitButton = screen.getByRole('button', { name: /start free trial/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/first name must be at least 2 characters/i)).toBeInTheDocument();
      });
    });

    it('should show error when email is invalid', async () => {
      const user = userEvent.setup();
      render(<RegistrationForm {...defaultProps} />);

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'invalid-email');

      const submitButton = screen.getByRole('button', { name: /start free trial/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
    });

    it('should show error when address is too short', async () => {
      const user = userEvent.setup();
      render(<RegistrationForm {...defaultProps} />);

      const addressInput = screen.getByLabelText(/address/i);
      await user.type(addressInput, 'Short');

      const submitButton = screen.getByRole('button', { name: /start free trial/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/please enter a complete address/i)).toBeInTheDocument();
      });
    });

    it('should show error when passwords do not match', async () => {
      const user = userEvent.setup();
      render(<RegistrationForm {...defaultProps} />);

      const passwordInput = screen.getByLabelText(/^password/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await user.type(passwordInput, 'Password123!');
      await user.type(confirmPasswordInput, 'DifferentPassword123!');

      const submitButton = screen.getByRole('button', { name: /start free trial/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
    });
  });

  describe('Password Strength Validation', () => {
    it('should show password strength indicator when typing', async () => {
      const user = userEvent.setup();
      render(<RegistrationForm {...defaultProps} />);

      const passwordInput = screen.getByLabelText(/^password/i);
      await user.type(passwordInput, 'weak');

      await waitFor(() => {
        expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('should validate password strength requirements', async () => {
      const user = userEvent.setup();
      render(<RegistrationForm {...defaultProps} />);

      const passwordInput = screen.getByLabelText(/^password/i);
      await user.type(passwordInput, 'weakpass');

      await waitFor(() => {
        expect(screen.getByText(/one uppercase letter/i)).toBeInTheDocument();
        expect(screen.getByText(/one special character/i)).toBeInTheDocument();
      });
    });

    it('should reject weak password on submit', async () => {
      const user = userEvent.setup();
      render(<RegistrationForm {...defaultProps} />);

      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
      await user.type(screen.getByLabelText(/address/i), '123 Main St, City, State 12345');
      await user.type(screen.getByLabelText(/^password/i), 'weakpass');
      await user.type(screen.getByLabelText(/confirm password/i), 'weakpass');

      const submitButton = screen.getByRole('button', { name: /start free trial/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password does not meet strength requirements/i)).toBeInTheDocument();
      });
    });

    it('should accept strong password', async () => {
      const user = userEvent.setup();
      render(<RegistrationForm {...defaultProps} />);

      const passwordInput = screen.getByLabelText(/^password/i);
      await user.type(passwordInput, 'StrongPass123!');

      await waitFor(() => {
        const strengthIndicator = screen.getByText(/strong/i);
        expect(strengthIndicator).toBeInTheDocument();
      });
    });
  });

  describe('Password Toggle', () => {
    it('should toggle password visibility', async () => {
      const user = userEvent.setup();
      render(<RegistrationForm {...defaultProps} />);

      const passwordInput = screen.getByLabelText(/^password/i);
      expect(passwordInput).toHaveAttribute('type', 'password');

      // Find and click the first toggle button (for password field)
      const toggleButtons = screen.getAllByRole('button', { name: '' });
      await user.click(toggleButtons[0]);

      expect(passwordInput).toHaveAttribute('type', 'text');
    });
  });

  describe('Form Submission', () => {
    const validFormData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      address: '123 Main St, City, State 12345',
      password: 'StrongPass123!',
    };

    it('should submit form with valid data', async () => {
      const user = userEvent.setup();
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            email: validFormData.email,
            countyId: 1,
            countyName: 'Test County',
            bidsquireUserId: '123',
          },
        }),
      });

      render(<RegistrationForm {...defaultProps} />);

      await user.type(screen.getByLabelText(/first name/i), validFormData.firstName);
      await user.type(screen.getByLabelText(/last name/i), validFormData.lastName);
      await user.type(screen.getByLabelText(/email address/i), validFormData.email);
      await user.type(screen.getByLabelText(/address/i), validFormData.address);
      await user.type(screen.getByLabelText(/^password/i), validFormData.password);
      await user.type(screen.getByLabelText(/confirm password/i), validFormData.password);

      const submitButton = screen.getByRole('button', { name: /start free trial/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/bidsquire-registration',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              firstName: validFormData.firstName,
              lastName: validFormData.lastName,
              email: validFormData.email,
              address: validFormData.address,
              password: validFormData.password,
              countyId: 1,
              countyName: 'Test County',
            }),
          })
        );
      });
    });

    it('should show success message on successful registration', async () => {
      const user = userEvent.setup();
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { email: validFormData.email },
        }),
      });

      render(<RegistrationForm {...defaultProps} />);

      await user.type(screen.getByLabelText(/first name/i), validFormData.firstName);
      await user.type(screen.getByLabelText(/last name/i), validFormData.lastName);
      await user.type(screen.getByLabelText(/email address/i), validFormData.email);
      await user.type(screen.getByLabelText(/address/i), validFormData.address);
      await user.type(screen.getByLabelText(/^password/i), validFormData.password);
      await user.type(screen.getByLabelText(/confirm password/i), validFormData.password);

      const submitButton = screen.getByRole('button', { name: /start free trial/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/registration successful/i)).toBeInTheDocument();
      });
    });

    it('should call onSuccess callback on successful registration', async () => {
      const user = userEvent.setup();
      const mockData = { success: true, data: { email: validFormData.email } };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      render(<RegistrationForm {...defaultProps} />);

      await user.type(screen.getByLabelText(/first name/i), validFormData.firstName);
      await user.type(screen.getByLabelText(/last name/i), validFormData.lastName);
      await user.type(screen.getByLabelText(/email address/i), validFormData.email);
      await user.type(screen.getByLabelText(/address/i), validFormData.address);
      await user.type(screen.getByLabelText(/^password/i), validFormData.password);
      await user.type(screen.getByLabelText(/confirm password/i), validFormData.password);

      const submitButton = screen.getByRole('button', { name: /start free trial/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(mockData);
      });
    });

    it('should show error message on failed registration', async () => {
      const user = userEvent.setup();
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          error: 'Email already exists',
        }),
      });

      render(<RegistrationForm {...defaultProps} />);

      await user.type(screen.getByLabelText(/first name/i), validFormData.firstName);
      await user.type(screen.getByLabelText(/last name/i), validFormData.lastName);
      await user.type(screen.getByLabelText(/email address/i), validFormData.email);
      await user.type(screen.getByLabelText(/address/i), validFormData.address);
      await user.type(screen.getByLabelText(/^password/i), validFormData.password);
      await user.type(screen.getByLabelText(/confirm password/i), validFormData.password);

      const submitButton = screen.getByRole('button', { name: /start free trial/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
      });
    });

    it('should show error message on network error', async () => {
      const user = userEvent.setup();
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      render(<RegistrationForm {...defaultProps} />);

      await user.type(screen.getByLabelText(/first name/i), validFormData.firstName);
      await user.type(screen.getByLabelText(/last name/i), validFormData.lastName);
      await user.type(screen.getByLabelText(/email address/i), validFormData.email);
      await user.type(screen.getByLabelText(/address/i), validFormData.address);
      await user.type(screen.getByLabelText(/^password/i), validFormData.password);
      await user.type(screen.getByLabelText(/confirm password/i), validFormData.password);

      const submitButton = screen.getByRole('button', { name: /start free trial/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/an error occurred/i)).toBeInTheDocument();
      });
    });

    it('should disable form during submission', async () => {
      const user = userEvent.setup();
      global.fetch.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      render(<RegistrationForm {...defaultProps} />);

      await user.type(screen.getByLabelText(/first name/i), validFormData.firstName);
      await user.type(screen.getByLabelText(/last name/i), validFormData.lastName);
      await user.type(screen.getByLabelText(/email address/i), validFormData.email);
      await user.type(screen.getByLabelText(/address/i), validFormData.address);
      await user.type(screen.getByLabelText(/^password/i), validFormData.password);
      await user.type(screen.getByLabelText(/confirm password/i), validFormData.password);

      const submitButton = screen.getByRole('button', { name: /start free trial/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeDisabled();
        expect(screen.getByLabelText(/last name/i)).toBeDisabled();
        expect(screen.getByLabelText(/email address/i)).toBeDisabled();
        expect(submitButton).toBeDisabled();
      });
    });

    it('should clear form after successful submission', async () => {
      const user = userEvent.setup();
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { email: validFormData.email },
        }),
      });

      render(<RegistrationForm {...defaultProps} />);

      await user.type(screen.getByLabelText(/first name/i), validFormData.firstName);
      await user.type(screen.getByLabelText(/last name/i), validFormData.lastName);
      await user.type(screen.getByLabelText(/email address/i), validFormData.email);
      await user.type(screen.getByLabelText(/address/i), validFormData.address);
      await user.type(screen.getByLabelText(/^password/i), validFormData.password);
      await user.type(screen.getByLabelText(/confirm password/i), validFormData.password);

      const submitButton = screen.getByRole('button', { name: /start free trial/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toHaveValue('');
        expect(screen.getByLabelText(/last name/i)).toHaveValue('');
        expect(screen.getByLabelText(/email address/i)).toHaveValue('');
        expect(screen.getByLabelText(/address/i)).toHaveValue('');
      });
    });
  });
});
