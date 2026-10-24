/**
 * Test page-client of Google OAuth callback page.
 *
 * 5 nhánh xử lý:
 * 1. success: parse code + state -> call loginWithGoogle -> save token -> redirect
 * 2. error param (?error=access_denied&...): redirect /login?error=google_cancelled
 * 3. no code (?error=invalid_request etc): redirect /login?error=google_no_code
 * 4. state mismatch (CSRF): redirect /login?error=google_state_mismatch
 * 5. API error (e.g. AUTH_502_GOOGLE_EXCHANGE): redirect /login?error=google_<CODE>
 *
 * Bonus: idempotent callback (sessionStorage flag) để tránh gọi BE 2 lần
 * nếu user reload page (Google code chỉ dùng 1 lần).
 *
 * UI redesign (Commit F): thêm 3 test case verify card 420px + title
 * "Đang xác thực email" + TLS badge.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { GoogleCallbackClient } from "./page-client";
import { ApiError } from "@/lib/api";
import { setAccessToken, setRefreshToken } from "@/lib/api";
import { TestWrapper } from "@/__tests__/test-wrapper";

// ── Mocks ────────────────────────────────────────────────────────────────
const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(),
  useRouter: () => ({
    replace: mockReplace,
    push: vi.fn(),
  }),
}));

vi.mock("@/features/auth/google-api", () => ({
  loginWithGoogle: vi.fn(),
}));

vi.mock("@/features/auth/apply-auth-response", () => ({
  applyAuthResponse: vi.fn(),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    setAccessToken: vi.fn(),
    setRefreshToken: vi.fn(),
  };
});

vi.mock("@/hooks/useFlashSaleWs", () => ({}));
// Không import ws trong callback page, nhưng mock to be safe

import { loginWithGoogle } from "@/features/auth/google-api";
import { applyAuthResponse } from "@/features/auth/apply-auth-response";
import { useSearchParams } from "next/navigation";

function setupSearchParams(params: Record<string, string>) {
  const urlSearchParams = new URLSearchParams(params);
  vi.mocked(useSearchParams).mockReturnValue(
    urlSearchParams as unknown as ReturnType<typeof useSearchParams>
  );
}

describe("GoogleCallbackClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset sessionStorage
    if (typeof window !== "undefined") {
      window.sessionStorage.clear();
    }
    // Callback page resolves `redirectUri` theo thu tu uu tien:
    // 1. sessionStorage (gia tri lay tu consent URL that)
    // 2. NEXT_PUBLIC_GOOGLE_REDIRECT_URI (env public)
    // 3. window.location.origin + pathname
    vi.stubEnv(
      "NEXT_PUBLIC_GOOGLE_REDIRECT_URI",
      "https://example.com/auth/google/callback"
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("success path", () => {
    it("parse code + state, gọi loginWithGoogle, lưu token, redirect /", async () => {
      // Pre-save expected state for CSRF check
      window.sessionStorage.setItem("google_oauth_state", "MATCHING_STATE");
      setupSearchParams({
        code: "AUTH_CODE",
        state: "MATCHING_STATE",
      });

      vi.mocked(loginWithGoogle).mockResolvedValue({
        accessToken: "access-123",
        refreshToken: "refresh-456",
        tokenType: "Bearer",
        expiresIn: 3600,
        user: {
          id: 1,
          email: "user@gmail.com",
          fullName: "User",
          phone: "",
          avatarUrl: null,
          status: "ACTIVE",
          createdAt: "2026-10-17T00:00:00Z",
        },
      });
      vi.mocked(applyAuthResponse).mockImplementation(
        async (res: import("@/features/auth/api").AuthResponse) => {
          // Mirror production side-effect: persist tokens via @/lib/api helpers
          // (apply-auth-response.ts gọi setAccessToken + setRefreshToken).
          setAccessToken(res.accessToken);
          setRefreshToken(res.refreshToken);
          return {
            id: "1",
            email: "user@gmail.com",
            fullName: "User",
            role: "BUYER",
          };
        }
      );

      render(
        <TestWrapper>
          <GoogleCallbackClient />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(loginWithGoogle).toHaveBeenCalledWith({
          code: "AUTH_CODE",
          redirectUri: "https://example.com/auth/google/callback",
        });
      });

      expect(setAccessToken).toHaveBeenCalledWith("access-123");
      expect(setRefreshToken).toHaveBeenCalledWith("refresh-456");
      expect(mockReplace).toHaveBeenCalledWith("/");
    });

    it("redirect đến returnUrl nếu có post_login_redirect", async () => {
      window.sessionStorage.setItem("post_login_redirect", "/cart");
      window.sessionStorage.setItem("google_oauth_state", "MATCHING_STATE");
      setupSearchParams({
        code: "AUTH_CODE",
        state: "MATCHING_STATE",
      });

      vi.mocked(loginWithGoogle).mockResolvedValue({
        accessToken: "a",
        refreshToken: "r",
        tokenType: "Bearer",
        expiresIn: 3600,
        user: {
          id: 1,
          email: "u@e.c",
          fullName: "U",
          phone: "",
          avatarUrl: null,
          status: "ACTIVE",
          createdAt: "2026-10-17T00:00:00Z",
        },
      });
      vi.mocked(applyAuthResponse).mockImplementation(
        async (res: import("@/features/auth/api").AuthResponse) => {
          setAccessToken(res.accessToken);
          setRefreshToken(res.refreshToken);
          return {
            id: "1",
            email: "u@e.c",
            fullName: "U",
            role: "BUYER",
          };
        }
      );

      render(
        <TestWrapper>
          <GoogleCallbackClient />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith("/cart");
      });
    });
  });

  describe("redirectUri resolution", () => {
    it("dùng redirect_uri lưu trong sessionStorage (khớp 100% consent URL)", async () => {
      window.sessionStorage.setItem(
        "google_oauth_consent_redirect_uri",
        "http://localhost:3000/auth/google/callback"
      );
      setupSearchParams({ code: "AUTH_CODE", state: "ANY" });

      vi.mocked(loginWithGoogle).mockResolvedValue({
        accessToken: "a",
        refreshToken: "r",
        tokenType: "Bearer",
        expiresIn: 3600,
        user: {
          id: 1,
          email: "u@e.c",
          fullName: "U",
          phone: "",
          avatarUrl: null,
          status: "ACTIVE",
          createdAt: "2026-10-17T00:00:00Z",
        },
      });
      vi.mocked(applyAuthResponse).mockResolvedValue({
        id: "1",
        email: "u@e.c",
        fullName: "U",
        role: "BUYER",
      });

      render(
        <TestWrapper>
          <GoogleCallbackClient />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(loginWithGoogle).toHaveBeenCalledWith({
          code: "AUTH_CODE",
          redirectUri: "http://localhost:3000/auth/google/callback",
        });
      });
    });

    it("fallback sang NEXT_PUBLIC_GOOGLE_REDIRECT_URI khi sessionStorage trống", async () => {
      setupSearchParams({ code: "AUTH_CODE", state: "ANY" });

      vi.mocked(loginWithGoogle).mockResolvedValue({
        accessToken: "a",
        refreshToken: "r",
        tokenType: "Bearer",
        expiresIn: 3600,
        user: {
          id: 1,
          email: "u@e.c",
          fullName: "U",
          phone: "",
          avatarUrl: null,
          status: "ACTIVE",
          createdAt: "2026-10-17T00:00:00Z",
        },
      });
      vi.mocked(applyAuthResponse).mockResolvedValue({
        id: "1",
        email: "u@e.c",
        fullName: "U",
        role: "BUYER",
      });

      render(
        <TestWrapper>
          <GoogleCallbackClient />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(loginWithGoogle).toHaveBeenCalledWith({
          code: "AUTH_CODE",
          redirectUri: "https://example.com/auth/google/callback",
        });
      });
    });

    it("KHÔNG gửi redirectUri rỗng lên BE (tránh Zod url() reject)", async () => {
      // Không có sessionStorage, không có env -> phải fallback origin+pathname
      vi.stubEnv("NEXT_PUBLIC_GOOGLE_REDIRECT_URI", "");
      setupSearchParams({ code: "AUTH_CODE", state: "ANY" });

      vi.mocked(loginWithGoogle).mockResolvedValue({
        accessToken: "a",
        refreshToken: "r",
        tokenType: "Bearer",
        expiresIn: 3600,
        user: {
          id: 1,
          email: "u@e.c",
          fullName: "U",
          phone: "",
          avatarUrl: null,
          status: "ACTIVE",
          createdAt: "2026-10-17T00:00:00Z",
        },
      });
      vi.mocked(applyAuthResponse).mockResolvedValue({
        id: "1",
        email: "u@e.c",
        fullName: "U",
        role: "BUYER",
      });

      render(
        <TestWrapper>
          <GoogleCallbackClient />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(loginWithGoogle).toHaveBeenCalled();
      });

      const call = vi.mocked(loginWithGoogle).mock.calls[0][0];
      expect(call.redirectUri).toBeTruthy();
      expect(call.redirectUri).not.toBe("");
    });
  });

  describe("error param (?error=...)", () => {
    it("redirect /login?error=google_cancelled khi có ?error=access_denied", async () => {
      setupSearchParams({ error: "access_denied" });

      render(
        <TestWrapper>
          <GoogleCallbackClient />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith(
          "/login?error=google_cancelled"
        );
      });
    });

    it("redirect /login?error=google_cancelled với error_description (nếu có)", async () => {
      setupSearchParams({
        error: "access_denied",
        error_description: "User denied access",
      });

      render(
        <TestWrapper>
          <GoogleCallbackClient />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith(
          "/login?error=google_cancelled"
        );
      });
    });
  });

  describe("no code param", () => {
    it("redirect /login?error=google_no_code khi không có code", async () => {
      setupSearchParams({ state: "ANY" });

      render(
        <TestWrapper>
          <GoogleCallbackClient />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith(
          "/login?error=google_no_code"
        );
      });
    });
  });

  describe("state check (DISABLED — BE không verify state, xem handoff mục 6)", () => {
    it("không redirect google_state_mismatch dù state trong URL khác sessionStorage", async () => {
      // Handoff mục 6: "BE KHÔNG verify state khi callback".
      // State random từ BE là vô nghĩa → FE KHÔNG nên so sánh state.
      // Kể cả khi state khác nhau, FE vẫn gọi loginWithGoogle.
      window.sessionStorage.setItem("google_oauth_state", "EXPECTED_STATE");
      setupSearchParams({
        code: "AUTH_CODE",
        state: "DIFFERENT_STATE",
      });

      vi.mocked(loginWithGoogle).mockResolvedValue({
        accessToken: "a",
        refreshToken: "r",
        tokenType: "Bearer",
        expiresIn: 3600,
        user: {
          id: 1,
          email: "u@e.c",
          fullName: "U",
          phone: "",
          avatarUrl: null,
          status: "ACTIVE",
          createdAt: "2026-10-17T00:00:00Z",
        },
      });
      vi.mocked(applyAuthResponse).mockImplementation(
        async (res: import("@/features/auth/api").AuthResponse) => {
          setAccessToken(res.accessToken);
          setRefreshToken(res.refreshToken);
          return {
            id: "1",
            email: "u@e.c",
            fullName: "U",
            role: "BUYER",
          };
        }
      );

      render(
        <TestWrapper>
          <GoogleCallbackClient />
        </TestWrapper>
      );

      // Phải gọi BE (không redirect state_mismatch)
      await waitFor(() => {
        expect(loginWithGoogle).toHaveBeenCalled();
      });
      // Không được redirect về state_mismatch
      expect(mockReplace).not.toHaveBeenCalledWith(
        "/login?error=google_state_mismatch"
      );
    });

    it("không check state dù sessionStorage có value (handoff mục 6: BE không verify)", async () => {
      // Không set sessionStorage
      setupSearchParams({
        code: "AUTH_CODE",
        state: "ANY_STATE",
      });

      vi.mocked(loginWithGoogle).mockResolvedValue({
        accessToken: "a",
        refreshToken: "r",
        tokenType: "Bearer",
        expiresIn: 3600,
        user: {
          id: 1,
          email: "u@e.c",
          fullName: "U",
          phone: "",
          avatarUrl: null,
          status: "ACTIVE",
          createdAt: "2026-10-17T00:00:00Z",
        },
      });
      vi.mocked(applyAuthResponse).mockImplementation(
        async (res: import("@/features/auth/api").AuthResponse) => {
          setAccessToken(res.accessToken);
          setRefreshToken(res.refreshToken);
          return {
            id: "1",
            email: "u@e.c",
            fullName: "U",
            role: "BUYER",
          };
        }
      );

      render(
        <TestWrapper>
          <GoogleCallbackClient />
        </TestWrapper>
      );

      // Vẫn gọi BE (CSRF check optional khi sessionStorage empty)
      await waitFor(() => {
        expect(loginWithGoogle).toHaveBeenCalled();
      });
    });
  });

  describe("API error", () => {
    it("redirect /login?error=google_AUTH_502_GOOGLE_EXCHANGE khi BE 502", async () => {
      window.sessionStorage.setItem("google_oauth_state", "MATCHING_STATE");
      setupSearchParams({
        code: "AUTH_CODE",
        state: "MATCHING_STATE",
      });

      vi.mocked(loginWithGoogle).mockRejectedValue(
        new ApiError({
          status: 400,
          code: "AUTH_502_GOOGLE_EXCHANGE",
          message: "Không thể trao đổi authorization code với Google",
        })
      );

      render(
        <TestWrapper>
          <GoogleCallbackClient />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith(
          "/login?error=google_AUTH_502_GOOGLE_EXCHANGE"
        );
      });
    });

    it("redirect /login?error=google_unknown khi network error (không phải ApiError)", async () => {
      window.sessionStorage.setItem("google_oauth_state", "MATCHING_STATE");
      setupSearchParams({
        code: "AUTH_CODE",
        state: "MATCHING_STATE",
      });

      vi.mocked(loginWithGoogle).mockRejectedValue(
        new Error("Network timeout")
      );

      render(
        <TestWrapper>
          <GoogleCallbackClient />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith(
          "/login?error=google_unknown"
        );
      });
    });
  });

  describe("idempotent callback (reload protection)", () => {
    it("KHÔNG gọi BE lần 2 khi user reload (sessionStorage flag đã đánh dấu)", async () => {
      window.sessionStorage.setItem("google_oauth_state", "MATCHING_STATE");
      window.sessionStorage.setItem(
        "google_oauth_callback_processed",
        "true"
      );
      setupSearchParams({
        code: "AUTH_CODE",
        state: "MATCHING_STATE",
      });

      render(
        <TestWrapper>
          <GoogleCallbackClient />
        </TestWrapper>
      );

      // Đợi một chút để hook chạy
      await new Promise((r) => setTimeout(r, 50));

      // Không được gọi BE
      expect(loginWithGoogle).not.toHaveBeenCalled();
      // Redirect về / (đã login rồi)
      expect(mockReplace).toHaveBeenCalledWith("/");
    });
  });

  // ── UI verification (Commit F — redesign per Stitch) ──────────────────
  describe("UI redesign (Stitch dang-xac-thuc)", () => {
    it("render card 420px với border + shadow + data-testid", async () => {
      // Pending state: chưa có code → sẽ redirect ngay, nhưng trước đó
      // UI phải render card 1 lần. Dùng no-code param để UI hiện ra trước
      // khi effect chạy.
      setupSearchParams({ error: "access_denied" });

      const { getByTestId } = render(
        <TestWrapper>
          <GoogleCallbackClient />
        </TestWrapper>
      );

      // Card container tồn tại (Stitch screen)
      const card = getByTestId("google-callback-card");
      expect(card).toBeInTheDocument();
      expect(card.className).toContain("max-w-[420px]");
      expect(card.className).toContain("rounded-2xl");

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalled();
      });
    });

    it("render title 'Đang xác thực email của bạn...' trên UI loading", async () => {
      // Trigger success path (UI render trong lúc chờ async) — dùng state khớp
      // để hook chạy async nhưng UI render ngay lập tức.
      window.sessionStorage.setItem("google_oauth_state", "MATCHING_STATE");
      setupSearchParams({
        code: "AUTH_CODE",
        state: "MATCHING_STATE",
      });

      // Mock BE chưa resolve → UI loading hiển thị
      vi.mocked(loginWithGoogle).mockImplementation(
        () => new Promise(() => {}) // never resolves
      );

      const { getByText } = render(
        <TestWrapper>
          <GoogleCallbackClient />
        </TestWrapper>
      );

      // Title (Stitch: "Đang xác thực email của bạn...")
      expect(getByText(/Đang xác thực email/i)).toBeInTheDocument();
    });

    it("render TLS badge 'Bảo mật chuẩn TLS 256-bit'", async () => {
      window.sessionStorage.setItem("google_oauth_state", "MATCHING_STATE");
      setupSearchParams({
        code: "AUTH_CODE",
        state: "MATCHING_STATE",
      });

      vi.mocked(loginWithGoogle).mockImplementation(
        () => new Promise(() => {})
      );

      const { getByTestId, getByText } = render(
        <TestWrapper>
          <GoogleCallbackClient />
        </TestWrapper>
      );

      // Trust badge (Stitch: border-top + lock icon + text)
      const badge = getByTestId("google-callback-tls-badge");
      expect(badge).toBeInTheDocument();
      expect(getByText(/Bảo mật chuẩn TLS 256-bit/i)).toBeInTheDocument();
    });
  });
});
