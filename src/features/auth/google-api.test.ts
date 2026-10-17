/**
 * Test Google OAuth2 API.
 * Mock apiFetch để kiểm soát response — không phụ thuộc BE thật.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApiError } from "@/lib/api";
import {
  getGoogleConsentUrl,
  loginWithGoogle,
} from "./google-api";
import type { AuthResponse } from "./api";

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
  ApiError: class ApiError extends Error {
    readonly status: number;
    readonly code: string;
    readonly details?: unknown;
    constructor(p: { status: number; code: string; message: string; details?: unknown }) {
      super(p.message);
      this.status = p.status;
      this.code = p.code;
      this.details = p.details;
    }
  },
}));

import { apiFetch } from "@/lib/api";

describe("Google OAuth API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Tắt mock mode cho unit test (test logic thật)
    vi.stubEnv("NEXT_PUBLIC_USE_MOCK", "false");
  });

  describe("getGoogleConsentUrl", () => {
    it("gọi GET /api/v1/auth/google/url và trả về authorizationUrl", async () => {
      const mockUrl =
        "https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=...";
      vi.mocked(apiFetch).mockResolvedValue({
        authorizationUrl: mockUrl,
        state: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      });

      const result = await getGoogleConsentUrl();

      expect(result.authorizationUrl).toBe(mockUrl);
      expect(result.state).toBe("f47ac10b-58cc-4372-a567-0e02b2c3d479");
      expect(apiFetch).toHaveBeenCalledWith("/api/v1/auth/google/url", {
        method: "GET",
        withAuth: false,
      });
    });

    it("throw ApiError khi BE trả lỗi 500 (config missing)", async () => {
      vi.mocked(apiFetch).mockRejectedValue(
        new ApiError({
          status: 500,
          code: "AUTH_500_GOOGLE_CONFIG",
          message: "Thiếu cấu hình Google OAuth2 trên server",
        })
      );

      await expect(getGoogleConsentUrl()).rejects.toThrow(ApiError);
    });
  });

  describe("loginWithGoogle", () => {
    const mockAuthResponse: AuthResponse = {
      accessToken: "access-123",
      refreshToken: "refresh-456",
      tokenType: "Bearer",
      expiresIn: 3600,
      user: {
        id: 1,
        email: "buyer@gmail.com",
        fullName: "Nguyen Van A",
        phone: "",
        avatarUrl: null,
        status: "ACTIVE",
        createdAt: "2026-10-16T10:00:00.000Z",
      },
    };

    it("gửi code + redirectUri lên POST /api/v1/auth/google", async () => {
      vi.mocked(apiFetch).mockResolvedValue(mockAuthResponse);

      await loginWithGoogle({
        code: "AUTH_CODE",
        redirectUri: "https://vibe-mart-utc2.canluaz.io.vn/oauth2/redirect",
      });

      expect(apiFetch).toHaveBeenCalledWith("/api/v1/auth/google", {
        method: "POST",
        json: {
          code: "AUTH_CODE",
          redirectUri:
            "https://vibe-mart-utc2.canluaz.io.vn/oauth2/redirect",
        },
        withAuth: false,
      });
    });

    it("trả về AuthResponse khi thành công", async () => {
      vi.mocked(apiFetch).mockResolvedValue(mockAuthResponse);

      const result = await loginWithGoogle({
        code: "AUTH_CODE",
        redirectUri: "https://example.com/oauth2/redirect",
      });

      expect(result).toEqual(mockAuthResponse);
      expect(result.user.email).toBe("buyer@gmail.com");
    });

    it("throw ApiError khi BE trả 502 (Google exchange fail)", async () => {
      vi.mocked(apiFetch).mockRejectedValue(
        new ApiError({
          status: 502,
          code: "AUTH_502_GOOGLE_EXCHANGE",
          message: "Không thể trao đổi authorization code với Google",
        })
      );

      await expect(
        loginWithGoogle({
          code: "X",
          redirectUri: "https://example.com/oauth2/redirect",
        })
      ).rejects.toThrow(ApiError);
    });

    it("throw zod error khi code rỗng", async () => {
      await expect(
        loginWithGoogle({
          code: "",
          redirectUri: "https://example.com/oauth2/redirect",
        })
      ).rejects.toThrow();
    });

    it("throw zod error khi redirectUri không phải URL hợp lệ", async () => {
      await expect(
        loginWithGoogle({
          code: "AUTH_CODE",
          redirectUri: "not-a-url",
        })
      ).rejects.toThrow();
    });
  });

  describe("Mock mode", () => {
    it("khi NEXT_PUBLIC_USE_MOCK=true, getGoogleConsentUrl dùng mock", async () => {
      vi.stubEnv("NEXT_PUBLIC_USE_MOCK", "true");
      vi.mocked(apiFetch).mockClear();

      const result = await getGoogleConsentUrl();

      expect(result.authorizationUrl).toContain("/oauth2/redirect");
      expect(apiFetch).not.toHaveBeenCalled();
    });

    it("khi NEXT_PUBLIC_USE_MOCK=true, loginWithGoogle dùng mock", async () => {
      vi.stubEnv("NEXT_PUBLIC_USE_MOCK", "true");
      vi.mocked(apiFetch).mockClear();

      const result = await loginWithGoogle({
        code: "AUTH_CODE",
        redirectUri: "https://example.com/oauth2/redirect",
      });

      expect(result.user.email).toBe("mock.google.user@gmail.com");
      expect(apiFetch).not.toHaveBeenCalled();
    });
  });
});
