/**
 * Test useGoogleLogin hook — popup flow + postMessage + error handling.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useGoogleLogin, POPUP_BLOCKED_CODE } from "./useGoogleLogin";

// ── Mocks ────────────────────────────────────────────────────────────────
vi.mock("./google-api", () => ({
  getGoogleConsentUrl: vi.fn(),
  loginWithGoogle: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  setAccessToken: vi.fn(),
  setRefreshToken: vi.fn(),
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

const mockSetUser = vi.fn();
vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (selector: (s: { setUser: typeof mockSetUser }) => unknown) =>
    selector({ setUser: mockSetUser }),
}));

import { getGoogleConsentUrl, loginWithGoogle } from "./google-api";

// ── Helpers ──────────────────────────────────────────────────────────────
function makeMockPopup() {
  return { closed: false, close: vi.fn() } as unknown as Window;
}

function withWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return { wrapper, qc };
}

beforeEach(() => {
  vi.clearAllMocks();
  // Default mock popup
  window.open = vi.fn(() => makeMockPopup());
  mockSetUser.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

// ── Tests ────────────────────────────────────────────────────────────────
describe("useGoogleLogin", () => {
  it("init state idle, error null", () => {
    const { wrapper } = withWrapper();
    const { result } = renderHook(() => useGoogleLogin(), { wrapper });
    expect(result.current.status).toBe("idle");
    expect(result.current.error).toBeNull();
  });

  it("login() gọi getGoogleConsentUrl + mở popup với authorizationUrl", async () => {
    vi.mocked(getGoogleConsentUrl).mockResolvedValue({
      authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth?...",
    });
    const { wrapper } = withWrapper();
    const { result } = renderHook(() => useGoogleLogin(), { wrapper });

    await act(async () => {
      await result.current.login();
    });

    expect(getGoogleConsentUrl).toHaveBeenCalledTimes(1);
    expect(window.open).toHaveBeenCalledWith(
      "https://accounts.google.com/o/oauth2/v2/auth?...",
      "google-oauth",
      expect.any(String)
    );
  });

  it("nhận postMessage với code → gọi loginWithGoogle + setUser + onSuccess", async () => {
    vi.mocked(getGoogleConsentUrl).mockResolvedValue({
      authorizationUrl: "https://accounts.google.com/...",
    });
    vi.mocked(loginWithGoogle).mockResolvedValue({
      accessToken:
        "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiYXV0aG9yaXRpZXMiOlsiUk9MRV9CVVlFUiJdfQ.sig",
      refreshToken: "refresh-456",
      tokenType: "Bearer",
      expiresIn: 3600,
      user: {
        id: 1,
        email: "test@gmail.com",
        fullName: "Test",
        phone: "",
        avatarUrl: null,
        status: "ACTIVE",
        createdAt: "2026-10-16T00:00:00Z",
      },
    });

    const onSuccess = vi.fn();
    const { wrapper } = withWrapper();
    const { result } = renderHook(() => useGoogleLogin({ onSuccess }), {
      wrapper,
    });

    await act(async () => {
      await result.current.login();
    });

    // Giả lập popup postMessage về parent
    await act(async () => {
      const event = new MessageEvent("message", {
        origin: window.location.origin,
        data: { type: "google-oauth-callback", code: "AUTH_CODE" },
      });
      window.dispatchEvent(event);
    });

    await waitFor(() => {
      expect(loginWithGoogle).toHaveBeenCalledWith({
        code: "AUTH_CODE",
        redirectUri: expect.stringContaining("/oauth2/redirect"),
      });
    });

    await waitFor(() => {
      expect(mockSetUser).toHaveBeenCalled();
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);
    const userArg = onSuccess.mock.calls[0][0];
    expect(userArg.email).toBe("test@gmail.com");
    expect(userArg.role).toBe("BUYER");
    expect(result.current.status).toBe("idle");
  });

  it("nhận postMessage với error → set error state + gọi onError", async () => {
    vi.mocked(getGoogleConsentUrl).mockResolvedValue({
      authorizationUrl: "https://accounts.google.com/...",
    });

    const onError = vi.fn();
    const { wrapper } = withWrapper();
    const { result } = renderHook(() => useGoogleLogin({ onError }), {
      wrapper,
    });

    await act(async () => {
      await result.current.login();
    });

    await act(async () => {
      const event = new MessageEvent("message", {
        origin: window.location.origin,
        data: {
          type: "google-oauth-callback",
          error: "User cancelled",
        },
      });
      window.dispatchEvent(event);
    });

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });
    expect(result.current.error?.message).toBe("User cancelled");
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("popup bị chặn (window.open trả null) → set error POPUP_BLOCKED", async () => {
    vi.mocked(getGoogleConsentUrl).mockResolvedValue({
      authorizationUrl: "https://accounts.google.com/...",
    });
    (window.open as ReturnType<typeof vi.fn>).mockReturnValueOnce(null);

    const onError = vi.fn();
    const { wrapper } = withWrapper();
    const { result } = renderHook(() => useGoogleLogin({ onError }), {
      wrapper,
    });

    await act(async () => {
      await result.current.login();
    });

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });
    expect(result.current.error?.message).toBe(POPUP_BLOCKED_CODE);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it("loginWithGoogle throw ApiError → set error state", async () => {
    vi.mocked(getGoogleConsentUrl).mockResolvedValue({
      authorizationUrl: "https://accounts.google.com/...",
    });
    const { ApiError } = await import("@/lib/api");
    vi.mocked(loginWithGoogle).mockRejectedValue(
      new ApiError({
        status: 502,
        code: "AUTH_502_GOOGLE_EXCHANGE",
        message: "Google fail",
      })
    );

    const onError = vi.fn();
    const { wrapper } = withWrapper();
    const { result } = renderHook(() => useGoogleLogin({ onError }), {
      wrapper,
    });

    await act(async () => {
      await result.current.login();
    });

    await act(async () => {
      const event = new MessageEvent("message", {
        origin: window.location.origin,
        data: { type: "google-oauth-callback", code: "X" },
      });
      window.dispatchEvent(event);
    });

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });
    expect(result.current.error).toBeInstanceOf(ApiError);
    expect((result.current.error as InstanceType<typeof ApiError>).code).toBe(
      "AUTH_502_GOOGLE_EXCHANGE"
    );
  });

  it("reset() đưa state về idle và clear error", async () => {
    const { wrapper } = withWrapper();
    const { result } = renderHook(() => useGoogleLogin(), { wrapper });

    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe("idle");
    expect(result.current.error).toBeNull();
  });

  it("postMessage từ origin khác bị bỏ qua (security)", async () => {
    vi.mocked(getGoogleConsentUrl).mockResolvedValue({
      authorizationUrl: "https://accounts.google.com/...",
    });
    const onSuccess = vi.fn();
    const { wrapper } = withWrapper();
    const { result } = renderHook(() => useGoogleLogin({ onSuccess }), {
      wrapper,
    });

    await act(async () => {
      await result.current.login();
    });

    // PostMessage từ origin KHÁC → bỏ qua
    await act(async () => {
      const event = new MessageEvent("message", {
        origin: "https://evil.com",
        data: { type: "google-oauth-callback", code: "EVIL_CODE" },
      });
      window.dispatchEvent(event);
    });

    expect(loginWithGoogle).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("postMessage với type khác bị bỏ qua", async () => {
    vi.mocked(getGoogleConsentUrl).mockResolvedValue({
      authorizationUrl: "https://accounts.google.com/...",
    });
    const { wrapper } = withWrapper();
    const { result } = renderHook(() => useGoogleLogin(), { wrapper });

    await act(async () => {
      await result.current.login();
    });

    await act(async () => {
      const event = new MessageEvent("message", {
        origin: window.location.origin,
        data: { type: "some-other-event", code: "X" },
      });
      window.dispatchEvent(event);
    });

    expect(loginWithGoogle).not.toHaveBeenCalled();
  });

  it("lưu redirectUri vào sessionStorage trước khi mở popup", async () => {
    vi.mocked(getGoogleConsentUrl).mockResolvedValue({
      authorizationUrl: "https://accounts.google.com/...",
    });
    const setItemSpy = vi.spyOn(window.sessionStorage.__proto__, "setItem");
    const { wrapper } = withWrapper();
    const { result } = renderHook(() => useGoogleLogin(), { wrapper });

    // Trigger login (async chain)
    act(() => {
      void result.current.login();
    });

    // Wait for setItem to be called after async chain resolves
    await waitFor(() => {
      expect(setItemSpy).toHaveBeenCalledWith(
        "google_oauth_redirect_uri",
        expect.stringContaining("/oauth2/redirect")
      );
    });
  });
});
