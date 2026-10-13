/**
 * Mock handlers cho OTP flow (dùng khi NEXT_PUBLIC_USE_MOCK=true).
 *
 * Quy tắc mock (sync với design từ docs/superpowers/handoffs/xac-thuc-email.md):
 *  - Mã đúng:  "123456"  → trả về AuthResponse đầy đủ (giả lập đăng ký xong).
 *  - Mã sai:  khác 6 số trên → throw ApiError 401 với code OTP_INVALID.
 *  - Mã hết hạn: nếu gọi sau mock-issued + 60s → throw ApiError 401 OTP_EXPIRED.
 *  - Quá số lần: quá 5 lần sai trong 1 phiên → throw 429 OTP_TOO_MANY_ATTEMPTS.
 *  - Resend: reset attempts + bump issued time + trả success.
 *
 * Lưu ý: mock state trong bộ nhớ – chỉ tồn tại trong 1 phiên trình duyệt.
 *
 * @see src/features/auth/api.ts (verifyOtpRequest, resendOtpRequest)
 */

import { ApiError } from '@/lib/api';
import type {
  AuthResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
  ResendOtpRequest,
} from './api';

/** Mã OTP đúng trong mock. */
export const MOCK_OTP_CODE = '123456';

/** Thời gian OTP có hiệu lực (ms). */
export const MOCK_OTP_TTL_MS = 60_000;

/** Số lần nhập sai tối đa trước khi khoá. */
export const MOCK_OTP_MAX_ATTEMPTS = 5;

interface OtpMockState {
  email: string;
  issuedAt: number;
  attempts: number;
}

let mockState: OtpMockState | null = null;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Mock network delay (ms). Test có thể override qua __setMockDelay. */
let mockDelayMs = 500;
export function __setMockDelay(ms: number) {
  mockDelayMs = ms;
}

function buildAuthResponse(email: string): AuthResponse {
  return {
    accessToken: 'mock-access-token-' + Date.now(),
    refreshToken: 'mock-refresh-token-' + Date.now(),
    tokenType: 'Bearer',
    expiresIn: 3600,
    user: {
      id: 1,
      email,
      fullName: 'Nguyễn Văn An',
      phone: '+84912345678',
      avatarUrl: null,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    },
  };
}

/**
 * verifyOtpMock – giả lập backend xác thực OTP.
 * Throw ApiError với code tương ứng nếu thất bại.
 */
export async function verifyOtpMock(
  payload: VerifyOtpRequest
): Promise<VerifyOtpResponse> {
  await sleep(mockDelayMs); // giả lập network delay

  // Auto-init state nếu chưa có (cho phép test mà không cần gọi resend trước)
  if (!mockState || mockState.email !== payload.email) {
    mockState = {
      email: payload.email,
      issuedAt: Date.now(),
      attempts: 0,
    };
  }

  if (mockState.attempts >= MOCK_OTP_MAX_ATTEMPTS) {
    throw new ApiError({
      status: 429,
      code: 'OTP_TOO_MANY_ATTEMPTS',
      message: 'Too many incorrect attempts',
    });
  }

  if (Date.now() - mockState.issuedAt > MOCK_OTP_TTL_MS) {
    throw new ApiError({
      status: 401,
      code: 'OTP_EXPIRED',
      message: 'OTP has expired',
    });
  }

  if (payload.code !== MOCK_OTP_CODE) {
    mockState.attempts += 1;
    throw new ApiError({
      status: 401,
      code: 'OTP_INVALID',
      message: 'Invalid OTP code',
      details: {
        attemptsLeft: MOCK_OTP_MAX_ATTEMPTS - mockState.attempts,
      },
    });
  }

  // Thành công → reset state
  mockState = null;
  return buildAuthResponse(payload.email);
}

/**
 * resendOtpMock – giả lập backend gửi lại OTP.
 * Reset attempts + bump issued time.
 */
export async function resendOtpMock(
  payload: ResendOtpRequest
): Promise<{ success: boolean; email: string }> {
  await sleep(mockDelayMs);
  mockState = {
    email: payload.email,
    issuedAt: Date.now(),
    attempts: 0,
  };
  return { success: true, email: payload.email };
}

/** Reset state (chỉ dùng cho test). */
export function __resetOtpMockState() {
  mockState = null;
}

/** Đọc state hiện tại (chỉ dùng cho test). */
export function __getOtpMockState(): Readonly<OtpMockState> | null {
  return mockState;
}
