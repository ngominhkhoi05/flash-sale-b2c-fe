/**
 * Test useGoogleRedirect hook — redirect flow (no popup).
 *
 * Flow: click button -> call getGoogleConsentUrl() -> set
 * window.location.href to authorizationUrl -> browser navigates to Google.
 *
 * Callback page at /auth/google/callback handles the response.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { ApiError } from "@/lib/api";
import { useGoogleRedirect } from "./useGoogleRedirect";

// ── Mocks ────────────────────────────────────────────────────────────────
vi.mock("@/features/auth/google-api", () => ({
  getGoogleConsentUrl: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  ApiError: class ApiError extends Error {
    readonly status: number;
    readonly code: string;
    constructor(p: { status: number; code: string; message: string }) {
      super(p.message);
      this.status = p.status;
      this.code = p.code;
    }
  },
}));

import { getGoogleConsentUrl } from "@/features/auth/google-api";

const MOCK_AUTH_URL =
  "https://accounts.google.com/o/oauth2/v2/auth?client_id=test&redirect_uri=https%3A%2F%2Fexample.com%2Fauth%2Fgoogle%2Fcallback";
const MOCK_STATE = "f47ac10b-58cc-4372-a567-0e02b2c3d479";

/**
 * Stub window.location.href setter để hook không navigate thật.
 * Capture giá trị được set để test verify.
 */
function stubLocationHref() {
  const captured = { value: null as string | null };
  const originalLoc = window.location;
  Object.defineProperty(window, "location", {
    configurable: true,
    writable: true,
    value: {
      ...originalLoc,
      get href() {
        return captured.value ?? originalLoc.href ?? "";
      },
      set href(v: string) {
        captured.value = v;
      },
      assign: vi.fn(),
      replace: vi.fn(),
    },
  });
  return captured;
}

function restoreLocation(originalLoc: Location) {
  Object.defineProperty(window, "location", {
    configurable: true,
    writable: true,
    value: originalLoc,
  });
}

describe("useGoogleRedirect", () => {
  let originalLocation: Location;
  let hrefCapture: { value: string | null };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv(
      "OAUTH2_REDIRECT_URI",
      "https://example.com/auth/google/callback"
    );

    originalLocation = window.location;
    hrefCapture = stubLocationHref();
  });

  afterEach(() => {
    restoreLocation(originalLocation);
    vi.unstubAllEnvs();
  });

  describe("redirect()", () => {
    it("gọi getGoogleConsentUrl(), set window.location.href = authorizationUrl", async () => {
      vi.mocked(getGoogleConsentUrl).mockResolvedValue({
        authorizationUrl: MOCK_AUTH_URL,
        state: MOCK_STATE,
      });

      const { result } = renderHook(() => useGoogleRedirect());

      await act(async () => {
        await result.current.redirect();
      });

      expect(getGoogleConsentUrl).toHaveBeenCalledTimes(1);
      expect(hrefCapture.value).toBe(MOCK_AUTH_URL);
    });

    it("set status = 'redirecting' trong khi đang gọi API (synchronous)", async () => {
      let resolveConsent: (v: { authorizationUrl: string; state: string }) => void =
        () => {};
      vi.mocked(getGoogleConsentUrl).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveConsent = resolve;
          })
      );

      const { result } = renderHook(() => useGoogleRedirect());

      expect(result.current.status).toBe("idle");

      // Start redirect (don't await — sync check first)
      let redirectPromise: Promise<void> = Promise.resolve();
      act(() => {
        redirectPromise = result.current.redirect();
      });

      // Status phải chuyển sang 'redirecting' trước khi API resolve
      expect(result.current.status).toBe("redirecting");

      // Resolve API
      await act(async () => {
        resolveConsent({ authorizationUrl: MOCK_AUTH_URL, state: MOCK_STATE });
        await redirectPromise;
      });

      // Sau khi resolve xong, status về idle (vì đã trigger navigate)
      expect(result.current.status).toBe("idle");
    });

    it("trả về state cho onSuccess callback trước khi navigate", async () => {
      vi.mocked(getGoogleConsentUrl).mockResolvedValue({
        authorizationUrl: MOCK_AUTH_URL,
        state: MOCK_STATE,
      });

      const onSuccess = vi.fn();
      const { result } = renderHook(() => useGoogleRedirect({ onSuccess }));

      await act(async () => {
        await result.current.redirect();
      });

      // onSuccess được gọi với state trước khi navigate
      expect(onSuccess).toHaveBeenCalledWith(MOCK_STATE);
      expect(hrefCapture.value).toBe(MOCK_AUTH_URL);
    });
  });

  describe("error handling", () => {
    it("set status = 'error' khi getGoogleConsentUrl throw ApiError", async () => {
      vi.mocked(getGoogleConsentUrl).mockRejectedValue(
        new ApiError({
          status: 500,
          code: "AUTH_500_GOOGLE_CONFIG",
          message: "Thiếu cấu hình Google OAuth2 trên server",
        })
      );

      const onError = vi.fn();
      const { result } = renderHook(() => useGoogleRedirect({ onError }));

      await act(async () => {
        await result.current.redirect();
      });

      expect(result.current.status).toBe("error");
      expect(result.current.error).toBeInstanceOf(ApiError);
      expect((result.current.error as ApiError).code).toBe("AUTH_500_GOOGLE_CONFIG");
      expect(onError).toHaveBeenCalledWith(expect.any(ApiError));
      // window.location.href KHÔNG bị thay đổi
      expect(hrefCapture.value).toBeNull();
    });

    it("set status = 'error' khi network error (không phải ApiError)", async () => {
      vi.mocked(getGoogleConsentUrl).mockRejectedValue(
        new Error("Network request failed")
      );

      const { result } = renderHook(() => useGoogleRedirect());

      await act(async () => {
        await result.current.redirect();
      });

      expect(result.current.status).toBe("error");
      expect(result.current.error?.message).toBe("Network request failed");
    });

    it("không throw khi user click nhanh 2 lần liên tiếp", async () => {
      vi.mocked(getGoogleConsentUrl).mockResolvedValue({
        authorizationUrl: MOCK_AUTH_URL,
        state: MOCK_STATE,
      });

      const { result } = renderHook(() => useGoogleRedirect());

      await act(async () => {
        await result.current.redirect();
      });

      // Lần 2 cũng gọi được (user đã ở trang Google, callback page handle)
      await act(async () => {
        await result.current.redirect();
      });

      // Hook không throw
      expect(getGoogleConsentUrl).toHaveBeenCalled();
    });
  });

  describe("CSRF state management", () => {
    it("lưu state vào sessionStorage trước khi redirect (CSRF verification)", async () => {
      vi.mocked(getGoogleConsentUrl).mockResolvedValue({
        authorizationUrl: MOCK_AUTH_URL,
        state: MOCK_STATE,
      });

      // Mock sessionStorage
      const sessionStorageMock = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      };
      Object.defineProperty(window, "sessionStorage", {
        configurable: true,
        writable: true,
        value: sessionStorageMock,
      });

      const { result } = renderHook(() => useGoogleRedirect());

      await act(async () => {
        await result.current.redirect();
      });

      // Hook save state với key "google_oauth_state"
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
        "google_oauth_state",
        MOCK_STATE
      );
    });
  });

  describe("redirect_uri persistence (khớp 100% consent URL)", () => {
    it("lưu redirect_uri lấy từ consent URL vào sessionStorage", async () => {
      vi.mocked(getGoogleConsentUrl).mockResolvedValue({
        authorizationUrl: MOCK_AUTH_URL,
        state: MOCK_STATE,
      });

      const setItemSpy = vi.spyOn(window.sessionStorage, "setItem");

      const { result } = renderHook(() => useGoogleRedirect());

      await act(async () => {
        await result.current.redirect();
      });

      expect(setItemSpy).toHaveBeenCalledWith(
        "google_oauth_consent_redirect_uri",
        "https://example.com/auth/google/callback"
      );
    });

    it("không lưu gì khi consent URL không có redirect_uri", async () => {
      vi.mocked(getGoogleConsentUrl).mockResolvedValue({
        authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth?client_id=test",
        state: MOCK_STATE,
      });

      const setItemSpy = vi.spyOn(window.sessionStorage, "setItem");

      const { result } = renderHook(() => useGoogleRedirect());

      await act(async () => {
        await result.current.redirect();
      });

      expect(setItemSpy).not.toHaveBeenCalledWith(
        "google_oauth_consent_redirect_uri",
        expect.anything()
      );
    });
  });

  describe("reset()", () => {
    it("reset status = 'idle' và error = null", async () => {
      vi.mocked(getGoogleConsentUrl).mockRejectedValue(
        new ApiError({
          status: 502,
          code: "AUTH_502_GOOGLE_EXCHANGE",
          message: "BE fail",
        })
      );

      const { result } = renderHook(() => useGoogleRedirect());

      await act(async () => {
        await result.current.redirect();
      });

      expect(result.current.status).toBe("error");

      act(() => {
        result.current.reset();
      });

      expect(result.current.status).toBe("idle");
      expect(result.current.error).toBeNull();
    });
  });
});
