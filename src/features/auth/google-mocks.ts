/**
 * Mock data cho Google OAuth2 flow.
 * Kích hoạt khi NEXT_PUBLIC_USE_MOCK === 'true'.
 *
 * Pattern: tương tự api.ts (verifyOtpMock, resendOtpMock).
 * Mock trả AuthResponse giả lập với user id 9999 — token giả, không verify được
 * nhưng đủ để test UI flow.
 */
import type { AuthResponse } from "./api";
import type {
  GoogleConsentUrlResponse,
  GoogleOAuth2LoginRequest,
} from "./google-api";

/**
 * Mock consent URL: trỏ về trang callback local với code giả.
 * BE thật sẽ trỏ về https://accounts.google.com/o/oauth2/v2/auth?...
 */
export function getGoogleConsentUrlMock(): GoogleConsentUrlResponse {
  return {
    authorizationUrl:
      typeof window !== "undefined"
        ? `${window.location.origin}/oauth2/redirect?code=MOCK_AUTH_CODE&state=MOCK_STATE`
        : "/oauth2/redirect?code=MOCK_AUTH_CODE&state=MOCK_STATE",
    state: "MOCK_STATE",
  };
}

/**
 * Mock login: trả AuthResponse giả lập với user MOCK_GOOGLE_USER.
 * Dùng để test popup flow end-to-end mà không cần Google thật.
 */
export function loginWithGoogleMock(
  _payload: GoogleOAuth2LoginRequest
): AuthResponse {
  return {
    accessToken: "MOCK_GOOGLE_ACCESS_TOKEN",
    refreshToken: "MOCK_GOOGLE_REFRESH_TOKEN",
    tokenType: "Bearer",
    expiresIn: 3600,
    user: {
      id: 9999,
      email: "mock.google.user@gmail.com",
      fullName: "Mock Google User",
      phone: "",
      avatarUrl: null,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    },
  };
}
