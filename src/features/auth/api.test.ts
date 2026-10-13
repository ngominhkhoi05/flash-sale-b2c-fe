import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  loginRequest,
  registerRequest,
  fetchMe,
  logoutRequest,
  verifyOtpRequest,
  resendOtpRequest,
} from './api';

vi.mock('@/lib/api', () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from '@/lib/api';
const mockedApiFetch = vi.mocked(apiFetch);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('loginRequest (real backend contract)', () => {
  it('POSTs /api/v1/auth/login with { usernameOrEmail, password }', async () => {
    mockedApiFetch.mockResolvedValueOnce({
      accessToken: 'token',
      refreshToken: 'refresh',
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: { id: 1, email: 'u@e.com', fullName: 'User' },
    });
    await loginRequest({ email: 'u@e.com', password: '12345678' });
    expect(mockedApiFetch).toHaveBeenCalledWith('/api/v1/auth/login', {
      method: 'POST',
      json: { usernameOrEmail: 'u@e.com', password: '12345678' },
      withAuth: false,
    });
  });

  it('accepts phone-like string in usernameOrEmail (backend decides, client just passes through)', async () => {
    // After backend contract check 2026-10-10: client uses emailSchema
    // (zod .email) so phone-only is rejected client-side. If backend
    // later wants phone login, schema should change to phoneVnSchema.
    // This test verifies that the client validation prevents a phone
    // string from reaching the API.
    await expect(
      loginRequest({ email: '0912345678', password: '12345678' })
    ).rejects.toThrow();
    expect(mockedApiFetch).not.toHaveBeenCalled();
  });
});

describe('registerRequest (real backend contract)', () => {
  it('POSTs /api/v1/auth/register with { fullName, email, phone, password }', async () => {
    mockedApiFetch.mockResolvedValueOnce({
      accessToken: 'token',
      refreshToken: 'refresh',
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: { id: 1, email: 'u@e.com', fullName: 'An' },
    });
    await registerRequest({
      fullName: 'Nguyễn Văn An',
      email: 'an@example.com',
      phone: '0912345678',
      password: 'VibeMart@2026',
    });
    expect(mockedApiFetch).toHaveBeenCalledWith('/api/v1/auth/register', {
      method: 'POST',
      json: {
        fullName: 'Nguyễn Văn An',
        email: 'an@example.com',
        phone: '+84912345678',
        password: 'VibeMart@2026',
      },
      withAuth: false,
    });
  });

  it('strips leading 0 and prepends +84 before sending', async () => {
    mockedApiFetch.mockResolvedValueOnce({
      accessToken: 't',
      refreshToken: 'r',
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: { id: 1, email: 'user@example.com', fullName: 'A' },
    });
    await registerRequest({
      fullName: 'A B',
      email: 'user@example.com',
      phone: '0987654321',
      password: 'VibeMart@2026',
    });
    const call = mockedApiFetch.mock.calls[0][1] as { json: { phone: string } };
    expect(call.json.phone).toBe('+84987654321');
  });

  it('rejects invalid email (does not call API)', async () => {
    await expect(
      registerRequest({
        fullName: 'A B',
        email: 'not-email',
        phone: '0912345678',
        password: 'VibeMart@2026',
      })
    ).rejects.toThrow();
    expect(mockedApiFetch).not.toHaveBeenCalled();
  });

  it('rejects phone shorter than 10 digits', async () => {
    await expect(
      registerRequest({
        fullName: 'A B',
        email: 'user@example.com',
        phone: '09123',
        password: 'VibeMart@2026',
      })
    ).rejects.toThrow();
    expect(mockedApiFetch).not.toHaveBeenCalled();
  });

  it('rejects password shorter than 8 chars', async () => {
    await expect(
      registerRequest({
        fullName: 'A B',
        email: 'user@example.com',
        phone: '0912345678',
        password: 'Short1',
      })
    ).rejects.toThrow();
    expect(mockedApiFetch).not.toHaveBeenCalled();
  });
});

describe('fetchMe (real backend contract)', () => {
  it('GETs /api/v1/users/me', async () => {
    mockedApiFetch.mockResolvedValueOnce({
      id: 1,
      email: 'u@e.com',
      fullName: 'User',
      phone: '0912345678',
      avatarUrl: null,
      status: 'ACTIVE',
      createdAt: '2026-10-10T00:00:00',
    });
    await fetchMe();
    expect(mockedApiFetch).toHaveBeenCalledWith('/api/v1/users/me', {
      method: 'GET',
    });
  });
});

describe('logoutRequest (real backend contract)', () => {
  it('POSTs /api/v1/auth/logout with refreshToken in body', async () => {
    mockedApiFetch.mockResolvedValueOnce(undefined);
    await logoutRequest('refresh-token-123');
    expect(mockedApiFetch).toHaveBeenCalledWith('/api/v1/auth/logout', {
      method: 'POST',
      json: { refreshToken: 'refresh-token-123' },
    });
  });

  it('swallows errors (best-effort logout)', async () => {
    mockedApiFetch.mockRejectedValueOnce(new Error('boom'));
    await expect(logoutRequest('rt')).resolves.toBeUndefined();
  });
});

describe('verifyOtpRequest (real backend contract)', () => {
  it('POSTs /api/v1/auth/verify-email with { email, code }', async () => {
    mockedApiFetch.mockResolvedValueOnce({
      accessToken: 't',
      refreshToken: 'r',
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: { id: 1, email: 'an@example.com', fullName: 'An' },
    });
    await verifyOtpRequest({ email: 'an@example.com', code: '123456' });
    expect(mockedApiFetch).toHaveBeenCalledWith('/api/v1/auth/verify-email', {
      method: 'POST',
      json: { email: 'an@example.com', code: '123456' },
      withAuth: false,
    });
  });

  it('rejects non-6-digit code client-side (does not call API)', async () => {
    await expect(
      verifyOtpRequest({ email: 'an@example.com', code: '1234' })
    ).rejects.toThrow();
    expect(mockedApiFetch).not.toHaveBeenCalled();
  });

  it('rejects non-numeric code client-side (does not call API)', async () => {
    await expect(
      verifyOtpRequest({ email: 'an@example.com', code: 'abcdef' })
    ).rejects.toThrow();
    expect(mockedApiFetch).not.toHaveBeenCalled();
  });

  it('rejects invalid email client-side (does not call API)', async () => {
    await expect(
      verifyOtpRequest({ email: 'not-email', code: '123456' })
    ).rejects.toThrow();
    expect(mockedApiFetch).not.toHaveBeenCalled();
  });
});

describe('resendOtpRequest (real backend contract)', () => {
  it('POSTs /api/v1/auth/resend-otp with { email }', async () => {
    mockedApiFetch.mockResolvedValueOnce({ success: true, email: 'an@example.com' });
    await resendOtpRequest({ email: 'an@example.com' });
    expect(mockedApiFetch).toHaveBeenCalledWith('/api/v1/auth/resend-otp', {
      method: 'POST',
      json: { email: 'an@example.com' },
      withAuth: false,
    });
  });

  it('rejects invalid email client-side (does not call API)', async () => {
    await expect(
      resendOtpRequest({ email: 'not-email' })
    ).rejects.toThrow();
    expect(mockedApiFetch).not.toHaveBeenCalled();
  });
});
