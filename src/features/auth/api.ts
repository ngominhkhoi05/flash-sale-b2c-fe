import { apiFetch } from '@/lib/api';
import { z } from 'zod';
import {
  emailSchema,
  fullNameSchema,
  passwordRegisterSchema,
  phoneRegisterSchema,
  passwordSchema,
} from './schemas';

/**
 * Auth API – gọi backend Spring Boot thật.
 * Contract: đối chiếu với swagger tại http://180.93.137.28/swagger-ui
 * ngày 2026-10-10.
 *
 * - POST /api/v1/auth/login     payload: { usernameOrEmail, password }
 * - POST /api/v1/auth/logout    payload: { refreshToken }
 * - GET  /api/v1/users/me       trả về UserResponse (cần Bearer)
 * - POST /api/v1/auth/register  payload: { fullName, email, phone, password }
 *
 * Mọi response thành công đều có dạng envelope
 * ApiResponse<T> = { success, code, message, data: T, timestamp }.
 * `apiFetch` đã tự extract `payload.data` nên ở đây chỉ cần khai báo T.
 *
 * Lưu ý: backend KHÔNG có field `role` / `permissions` trong UserResponse.
 * Role được backend truyền qua JWT claims; client đọc qua
 * `decodeJwt(token)` (sẽ có ở auth-jwt.mdc).
 */

const loginPayloadSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

const registerPayloadSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  phone: phoneRegisterSchema,
  password: passwordRegisterSchema,
});

/** UserResponse – từ backend (OpenAPI UserResponse schema). */
export interface UserResponse {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  avatarUrl: string | null;
  status: 'ACTIVE' | 'LOCKED' | 'SUSPENDED' | string;
  createdAt: string; // ISO 8601
  /** Thêm trong Swagger 2026-10-17: danh sách role code (vd ["ROLE_BUYER"]).
   * Optional – schema cũ chưa có field này.
   * Note: FE vẫn ưu tiên đọc từ JWT (xem auth/jwt.ts) để tránh token cũ
   * chưa có claim roles. */
  roles?: string[];
}

/** AuthResponse – từ backend. */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string; // "Bearer"
  expiresIn: number; // giây
  user: UserResponse;
  /** Thêm trong Swagger 2026-10-17: roles ở top-level (vd ["ROLE_BUYER"]).
   * Optional – cũng có sẵn ở user.roles. */
  roles?: string[];
}

/** Alias cho FE – dùng ở useAuthStore. */
export type AuthUserDto = UserResponse;

/** FE form input. */
export interface LoginRequest {
  email: string;
  password: string;
}

/** FE form input – đăng ký (đã bỏ confirmPassword + agreedTerms). */
export interface RegisterRequest {
  fullName: string;
  email: string;
  /** Số điện thoại đã bỏ prefix +84, 9 chữ số VN. */
  phone: string;
  password: string;
}

/** FE form input – xác thực OTP 6 số sau khi đăng ký. */
export interface VerifyOtpRequest {
  email: string;
  /** Mã OTP 6 chữ số backend gửi qua email. */
  code: string;
}

/** Response sau khi verify OTP thành công – trả về auth đầy đủ. */
export type VerifyOtpResponse = AuthResponse;

/** FE form input – yêu cầu gửi lại mã OTP. */
export interface ResendOtpRequest {
  email: string;
}

export async function loginRequest(
  payload: LoginRequest
): Promise<AuthResponse> {
  const parsed = loginPayloadSchema.parse(payload);
  return apiFetch<AuthResponse>('/api/v1/auth/login', {
    method: 'POST',
    json: {
      usernameOrEmail: parsed.email,
      password: parsed.password,
    },
    withAuth: false,
  });
}

/**
 * registerRequest – gọi POST /api/v1/auth/register.
 * Lưu ý: chỉ gửi 4 field (fullName, email, phone, password) – KHÔNG gửi
 * confirmPassword hay agreedTerms (client-side only).
 * Phone: strip leading 0 (user nhập 0912...) → gửi +84912...
 */
export async function registerRequest(
  payload: RegisterRequest
): Promise<AuthResponse> {
  const parsed = registerPayloadSchema.parse(payload);
  const phoneWithoutLeadingZero = parsed.phone.replace(/^0/, '');
  return apiFetch<AuthResponse>('/api/v1/auth/register', {
    method: 'POST',
    json: {
      fullName: parsed.fullName,
      email: parsed.email,
      phone: `+84${phoneWithoutLeadingZero}`,
      password: parsed.password,
    },
    withAuth: false,
  });
}

export async function fetchMe(): Promise<UserResponse> {
  return apiFetch<UserResponse>('/api/v1/users/me', { method: 'GET' });
}

export async function logoutRequest(refreshToken: string): Promise<void> {
  await apiFetch<void>('/api/v1/auth/logout', {
    method: 'POST',
    json: { refreshToken },
  }).catch(() => undefined);
}

const verifyOtpPayloadSchema = z.object({
  email: emailSchema,
  code: z
    .string()
    .min(6, 'Mã OTP phải có 6 chữ số')
    .max(6, 'Mã OTP phải có 6 chữ số')
    .regex(/^\d{6}$/, 'Mã OTP chỉ chứa chữ số'),
});

/**
 * verifyOtpRequest – gọi POST /api/v1/auth/verify-email.
 * Backend (sẽ có) trả về AuthResponse đầy đủ (accessToken, refreshToken, user).
 *
 * Mock flow: nếu NEXT_PUBLIC_USE_MOCK=true thì dùng `verifyOtpMock` (xem mocks.ts).
 * Mock accept "123456" làm mã đúng, các mã khác trả OTP_INVALID.
 */
export async function verifyOtpRequest(
  payload: VerifyOtpRequest
): Promise<VerifyOtpResponse> {
  const parsed = verifyOtpPayloadSchema.parse(payload);
  if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
    const { verifyOtpMock } = await import('./mocks');
    return verifyOtpMock(parsed);
  }
  return apiFetch<VerifyOtpResponse>('/api/v1/auth/verify-email', {
    method: 'POST',
    json: { email: parsed.email, code: parsed.code },
    withAuth: false,
  });
}

const resendOtpPayloadSchema = z.object({
  email: emailSchema,
});

/**
 * resendOtpRequest – gọi POST /api/v1/auth/resend-otp.
 * Backend gửi lại mã OTP mới qua email.
 *
 * Mock flow: nếu NEXT_PUBLIC_USE_MOCK=true thì dùng `resendOtpMock` (xem mocks.ts).
 */
export async function resendOtpRequest(
  payload: ResendOtpRequest
): Promise<{ success: boolean; email: string }> {
  const parsed = resendOtpPayloadSchema.parse(payload);
  if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
    const { resendOtpMock } = await import('./mocks');
    return resendOtpMock(parsed);
  }
  return apiFetch<{ success: boolean; email: string }>(
    '/api/v1/auth/resend-otp',
    {
      method: 'POST',
      json: { email: parsed.email },
      withAuth: false,
    }
  );
}
