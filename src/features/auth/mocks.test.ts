import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import { ApiError } from '@/lib/api';
import {
  verifyOtpMock,
  resendOtpMock,
  MOCK_OTP_CODE,
  MOCK_OTP_TTL_MS,
  MOCK_OTP_MAX_ATTEMPTS,
  __resetOtpMockState,
  __getOtpMockState,
  __setMockDelay,
} from './mocks';

const TEST_EMAIL = 'an@example.com';

beforeEach(() => {
  __resetOtpMockState();
  __setMockDelay(0); // tắt network delay để test chạy nhanh
});

afterEach(() => {
  vi.useRealTimers();
});

describe('verifyOtpMock', () => {
  it('accepts MOCK_OTP_CODE và trả về AuthResponse', async () => {
    const res = await verifyOtpMock({ email: TEST_EMAIL, code: MOCK_OTP_CODE });
    expect(res.accessToken).toMatch(/^mock-access-token-/);
    expect(res.refreshToken).toMatch(/^mock-refresh-token-/);
    expect(res.user.email).toBe(TEST_EMAIL);
    expect(res.user.status).toBe('ACTIVE');
  });

  it('reset state sau khi verify thành công', async () => {
    await verifyOtpMock({ email: TEST_EMAIL, code: MOCK_OTP_CODE });
    expect(__getOtpMockState()).toBeNull();
  });

  it('reject mã sai với ApiError 401 OTP_INVALID', async () => {
    try {
      await verifyOtpMock({ email: TEST_EMAIL, code: '000000' });
      throw new Error('Expected ApiError to be thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(401);
      expect(apiErr.code).toBe('OTP_INVALID');
      expect((apiErr.details as { attemptsLeft: number })?.attemptsLeft).toBe(
        MOCK_OTP_MAX_ATTEMPTS - 1
      );
    }
  });

  it('đếm số lần sai và khoá sau MOCK_OTP_MAX_ATTEMPTS', async () => {
    // Lần 1: sai → attempts = 1
    await expect(
      verifyOtpMock({ email: TEST_EMAIL, code: '000000' })
    ).rejects.toMatchObject({ code: 'OTP_INVALID' });
    expect(__getOtpMockState()?.attempts).toBe(1);

    // Lần 2..MAX: vẫn OTP_INVALID
    for (let i = 2; i <= MOCK_OTP_MAX_ATTEMPTS; i++) {
      await expect(
        verifyOtpMock({ email: TEST_EMAIL, code: '000000' })
      ).rejects.toMatchObject({ code: 'OTP_INVALID' });
    }
    expect(__getOtpMockState()?.attempts).toBe(MOCK_OTP_MAX_ATTEMPTS);

    // Lần tiếp theo: OTP_TOO_MANY_ATTEMPTS
    await expect(
      verifyOtpMock({ email: TEST_EMAIL, code: '000000' })
    ).rejects.toMatchObject({ code: 'OTP_TOO_MANY_ATTEMPTS', status: 429 });

    // Ngay cả khi nhập đúng cũng không qua
    await expect(
      verifyOtpMock({ email: TEST_EMAIL, code: MOCK_OTP_CODE })
    ).rejects.toMatchObject({ code: 'OTP_TOO_MANY_ATTEMPTS' });
  });

  it('reject với OTP_EXPIRED sau MOCK_OTP_TTL_MS', async () => {
    // Tạo state
    await resendOtpMock({ email: TEST_EMAIL });
    // Verify thử 1 lần OK
    await expect(
      verifyOtpMock({ email: TEST_EMAIL, code: MOCK_OTP_CODE })
    ).resolves.toBeDefined();
    // Sau khi verify thành công state đã bị reset → cần resend lại
    await resendOtpMock({ email: TEST_EMAIL });
    // Manipulate mock state để mô phỏng quá thời gian
    // (dùng Date.now() thực tế - đợi thực sẽ làm test chậm)
    // Thay vào đó gọi Date.now() với delta
    const realDateNow = Date.now;
    const future = realDateNow() + MOCK_OTP_TTL_MS + 1000;
    Date.now = () => future;
    try {
      await expect(
        verifyOtpMock({ email: TEST_EMAIL, code: MOCK_OTP_CODE })
      ).rejects.toMatchObject({ code: 'OTP_EXPIRED', status: 401 });
    } finally {
      Date.now = realDateNow;
    }
  });
});

describe('resendOtpMock', () => {
  it('trả về success và reset attempts', async () => {
    // Tạo state với attempts cao
    __resetOtpMockState();
    await resendOtpMock({ email: TEST_EMAIL });
    // Sai 1 lần
    await expect(
      verifyOtpMock({ email: TEST_EMAIL, code: '000000' })
    ).rejects.toMatchObject({ code: 'OTP_INVALID' });
    const beforeResend = __getOtpMockState();
    expect(beforeResend?.attempts).toBe(1);

    // Resend → reset
    const res = await resendOtpMock({ email: TEST_EMAIL });
    expect(res).toEqual({ success: true, email: TEST_EMAIL });
    const afterResend = __getOtpMockState();
    expect(afterResend?.attempts).toBe(0);
  });
});
