/**
 * Google OAuth2 login API (Authorization Code + popup flow).
 * Backend contract: docs/handoffs/fe-google-login-integration-guide.md
 * (BE soạn 2026-10-16).
 *
 * - GET /api/v1/auth/google/url        public, trả { authorizationUrl, state }
 * - POST /api/v1/auth/google           public, body { code, redirectUri }
 *   → trả về AuthResponse (giống email/password login).
 *
 * Mọi response thành công đều có envelope ApiResponse<T> = { success, code,
 * message, data: T, timestamp }. apiFetch tự extract payload.data, nên ở đây
 * chỉ cần khai báo T.
 */
import { apiFetch } from "@/lib/api";
import { z } from "zod";
import type { AuthResponse } from "./api";

/**
 * Response từ GET /api/v1/auth/google/url.
 * FE dùng luôn authorizationUrl (đã build sẵn từ BE).
 */
export interface GoogleConsentUrlResponse {
  authorizationUrl: string;
  /** CSRF state do BE generate; FE dùng trong verification (nếu cần). */
  state?: string;
}

/** Request body cho POST /api/v1/auth/google. */
export interface GoogleOAuth2LoginRequest {
  code: string;
  redirectUri: string;
}

const googleLoginPayloadSchema = z.object({
  code: z.string().min(1, "Authorization code is required"),
  redirectUri: z.string().url("redirectUri must be a valid URL"),
});

/**
 * Bước 1: Lấy Google consent URL.
 * BE tự build URL với client_id / redirect_uri đã cấu hình ở server.
 *
 * @throws ApiError khi BE thiếu config (HTTP 500 AUTH_500_GOOGLE_CONFIG)
 */
export async function getGoogleConsentUrl(): Promise<GoogleConsentUrlResponse> {
  if (process.env.NEXT_PUBLIC_USE_MOCK === "true") {
    const { getGoogleConsentUrlMock } = await import("./google-mocks");
    return getGoogleConsentUrlMock();
  }
  return apiFetch<GoogleConsentUrlResponse>("/api/v1/auth/google/url", {
    method: "GET",
    withAuth: false,
  });
}

/**
 * Bước 2: Đổi authorization code lấy JWT.
 * BE tự đổi code → id_token, verify JWKS, upsert user, generate JWT.
 *
 * @throws ApiError với code tương ứng (AUTH_502_GOOGLE_EXCHANGE,
 * AUTH_401_GOOGLE_TOKEN, AUTH_401_GOOGLE_EMAIL_UNVERIFIED, ...)
 */
export async function loginWithGoogle(
  payload: GoogleOAuth2LoginRequest
): Promise<AuthResponse> {
  const parsed = googleLoginPayloadSchema.parse(payload);
  if (process.env.NEXT_PUBLIC_USE_MOCK === "true") {
    const { loginWithGoogleMock } = await import("./google-mocks");
    return loginWithGoogleMock(parsed);
  }
  return apiFetch<AuthResponse>("/api/v1/auth/google", {
    method: "POST",
    json: {
      code: parsed.code,
      redirectUri: parsed.redirectUri,
    },
    withAuth: false,
  });
}
