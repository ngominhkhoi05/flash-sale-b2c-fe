import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useVerifyOtpMutation,
  useResendOtpMutation,
} from "./hooks";

// ── Mock API layer ──────────────────────────────────────────────────────
const mockLoginRequest = vi.fn();
const mockRegisterRequest = vi.fn();
const mockVerifyOtpRequest = vi.fn();
const mockResendOtpRequest = vi.fn();
const mockSetAccessToken = vi.fn();
const mockSetRefreshToken = vi.fn();

vi.mock("./api", () => ({
  loginRequest: (input: unknown) => mockLoginRequest(input),
  registerRequest: (input: unknown) => mockRegisterRequest(input),
  verifyOtpRequest: (input: unknown) => mockVerifyOtpRequest(input),
  resendOtpRequest: (input: unknown) => mockResendOtpRequest(input),
  fetchMe: vi.fn(),
  logoutRequest: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  setAccessToken: (t: string) => mockSetAccessToken(t),
  setRefreshToken: (t: string) => mockSetRefreshToken(t),
  clearAccessToken: vi.fn(),
  clearRefreshToken: vi.fn(),
}));

// ── Mock auth store ─────────────────────────────────────────────────────
const mockSetUser = vi.fn();
const mockReset = vi.fn();
const mockUseAuthStore = vi.fn(
  (selector: (s: { setUser: typeof mockSetUser; reset: typeof mockReset }) => unknown) =>
    selector({ setUser: mockSetUser, reset: mockReset }),
);

vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (selector: (s: { setUser: typeof mockSetUser; reset: typeof mockReset }) => unknown) =>
    mockUseAuthStore(selector),
}));

vi.mock("@/lib/constants", () => ({
  ROUTES: { LOGIN: "/login", HOME: "/" },
}));

// Mock sonner to avoid toast warnings in test
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// ── Mock JWT decoder ────────────────────────────────────────────────────
vi.mock("./jwt", () => ({
  decodeJwtPrimaryRole: () => "BUYER",
}));

function withQueryClient() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  // Spy on invalidateQueries
  const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return { wrapper, qc, invalidateSpy };
}

beforeEach(() => {
  mockLoginRequest.mockReset();
  mockRegisterRequest.mockReset();
  mockVerifyOtpRequest.mockReset();
  mockResendOtpRequest.mockReset();
  mockSetUser.mockReset();
  mockSetAccessToken.mockReset();
  mockSetRefreshToken.mockReset();
});

describe("useLoginMutation - post-login invalidation", () => {
  it("invalidates auth, cart, vouchers.mine, products.recommended on success", async () => {
    mockLoginRequest.mockResolvedValue({
      accessToken: "at_test",
      refreshToken: "rt_test",
      tokenType: "Bearer",
      expiresIn: 900,
      user: {
        id: 1,
        email: "u@e.com",
        fullName: "U",
        phone: "0912345678",
        avatarUrl: null,
        status: "ACTIVE",
        createdAt: "2026-10-10T00:00:00Z",
      },
    });

    const { wrapper, invalidateSpy } = withQueryClient();
    const { result } = renderHook(() => useLoginMutation(), { wrapper });

    await act(async () => {
      result.current.mutate({ email: "u@e.com", password: "password123" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify invalidateQueries called với 4 keys
    expect(invalidateSpy).toHaveBeenCalledTimes(4);

    const calledKeys = invalidateSpy.mock.calls
      .map((c) => c[0]?.queryKey)
      .filter(Boolean);
    expect(calledKeys).toEqual(
      expect.arrayContaining([
        ["auth", "me"],
        ["cart"],
        ["vouchers", "mine"],
        ["products", "recommended"],
      ]),
    );
  });

  it("stores tokens + user on success", async () => {
    mockLoginRequest.mockResolvedValue({
      accessToken: "at_xyz",
      refreshToken: "rt_xyz",
      tokenType: "Bearer",
      expiresIn: 900,
      user: {
        id: 7,
        email: "buyer@example.com",
        fullName: "B",
        phone: "0912345678",
        avatarUrl: null,
        status: "ACTIVE",
        createdAt: "2026-10-10T00:00:00Z",
      },
    });

    const { wrapper } = withQueryClient();
    const { result } = renderHook(() => useLoginMutation(), { wrapper });

    await act(async () => {
      result.current.mutate({ email: "buyer@example.com", password: "password123" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockSetAccessToken).toHaveBeenCalledWith("at_xyz");
    expect(mockSetRefreshToken).toHaveBeenCalledWith("rt_xyz");
    expect(mockSetUser).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "7",
        email: "buyer@example.com",
        role: "BUYER",
      }),
    );
  });

  it("maps UserResponse.avatarUrl to AuthUser.avatarUrl when backend returns one", async () => {
    // Backend UserResponse có avatarUrl: string | null. toAuthUser phải map
    // field này sang AuthUser để header có thể render avatar thật của user.
    const AVATAR = "https://cdn.vibemart.vn/users/7/avatar.png";
    mockLoginRequest.mockResolvedValue({
      accessToken: "at_xyz",
      refreshToken: "rt_xyz",
      tokenType: "Bearer",
      expiresIn: 900,
      user: {
        id: 7,
        email: "buyer@example.com",
        fullName: "B",
        phone: "0912345678",
        avatarUrl: AVATAR,
        status: "ACTIVE",
        createdAt: "2026-10-10T00:00:00Z",
      },
    });

    const { wrapper } = withQueryClient();
    const { result } = renderHook(() => useLoginMutation(), { wrapper });

    await act(async () => {
      result.current.mutate({ email: "buyer@example.com", password: "password123" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockSetUser).toHaveBeenCalledWith(
      expect.objectContaining({
        avatarUrl: AVATAR,
      }),
    );
  });

  it("maps avatarUrl as undefined when backend returns null (fallback to default avatar)", async () => {
    mockLoginRequest.mockResolvedValue({
      accessToken: "at_xyz",
      refreshToken: "rt_xyz",
      tokenType: "Bearer",
      expiresIn: 900,
      user: {
        id: 7,
        email: "buyer@example.com",
        fullName: "B",
        phone: "0912345678",
        avatarUrl: null,
        status: "ACTIVE",
        createdAt: "2026-10-10T00:00:00Z",
      },
    });

    const { wrapper } = withQueryClient();
    const { result } = renderHook(() => useLoginMutation(), { wrapper });

    await act(async () => {
      result.current.mutate({ email: "buyer@example.com", password: "password123" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // avatarUrl phải là undefined (không truyền xuống store) để header
    // biết dùng default fallback.
    const setUserCall = mockSetUser.mock.calls[0][0] as Record<string, unknown>;
    expect(setUserCall).not.toHaveProperty("avatarUrl");
  });
});

describe("useRegisterMutation - post-register invalidation", () => {
  it("invalidates same 4 keys on success", async () => {
    mockRegisterRequest.mockResolvedValue({
      accessToken: "at_new",
      refreshToken: "rt_new",
      tokenType: "Bearer",
      expiresIn: 900,
      user: {
        id: 99,
        email: "new@example.com",
        fullName: "New",
        phone: "0912345678",
        avatarUrl: null,
        status: "ACTIVE",
        createdAt: "2026-10-10T00:00:00Z",
      },
    });

    const { wrapper, invalidateSpy } = withQueryClient();
    const { result } = renderHook(() => useRegisterMutation(), { wrapper });

    await act(async () => {
      result.current.mutate({
        fullName: "New",
        email: "new@example.com",
        phone: "0912345678",
        password: "password123",
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledTimes(4);
    const calledKeys = invalidateSpy.mock.calls
      .map((c) => c[0]?.queryKey)
      .filter(Boolean);
    expect(calledKeys).toEqual(
      expect.arrayContaining([
        ["auth", "me"],
        ["cart"],
        ["vouchers", "mine"],
        ["products", "recommended"],
      ]),
    );
  });
});

// ── useLogoutMutation – redirect về / thay vì /login ─────────────────────
//
// Bug trước: useLogoutMutation ép `window.location.href = '/login'` trong
// onSettled. UX tệ — user click "Đăng xuất" ở trang chủ thì bị đá sang
// trang đăng nhập mặc dù họ không cần auth để xem trang chủ.
//
// Fix: sau logout, redirect về ROUTES.HOME ("/"). Tokens + auth store
// vẫn phải được clear.
describe("useLogoutMutation - post-logout redirect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // jsdom chặn set window.location.href trực tiếp. Mỗi test sẽ tự
    // defineProperty lại location với setter capture.
    // Stub sessionStorage để có refresh token
    vi.spyOn(window.sessionStorage, "getItem").mockReturnValue("rt-abc");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function setup() {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    );
    return renderHook(() => useLogoutMutation(), { wrapper });
  }

  it("after onSettled, redirects to ROUTES.HOME ('/'), not /login", async () => {
    // jsdom chặn set window.location.href trực tiếp. Dùng defineProperty
    // trên `location` của window để override setter của `href`.
    const captured: { href: string } = { href: "" };
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: {
        set href(url: string) {
          captured.href = url;
        },
        get href() {
          return captured.href;
        },
        assign: () => {
          /* noop */
        },
        replace: () => {
          /* noop */
        },
      },
    });

    const { result } = setup();
    await act(async () => {
      result.current.mutate();
    });
    await waitFor(() => expect(captured.href).not.toBe(""));
    expect(captured.href).toBe("/");
    expect(captured.href).not.toBe("/login");
  });

  it("still clears access token + refresh token after logout", async () => {
    const captured: { href: string } = { href: "" };
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: {
        set href(url: string) {
          captured.href = url;
        },
        get href() {
          return captured.href;
        },
        assign: () => {
          /* noop */
        },
        replace: () => {
          /* noop */
        },
      },
    });

    const accessModule = await import("@/lib/api");
    const accessSpy = vi
      .spyOn(accessModule, "clearAccessToken")
      .mockImplementation(() => undefined);
    const refreshSpy = vi
      .spyOn(accessModule, "clearRefreshToken")
      .mockImplementation(() => undefined);

    const { result } = setup();
    await act(async () => {
      result.current.mutate();
    });
    await waitFor(() => expect(captured.href).not.toBe(""));

    expect(accessSpy).toHaveBeenCalledTimes(1);
    expect(refreshSpy).toHaveBeenCalledTimes(1);
  });
});

// ── useVerifyOtpMutation – xác thực OTP 6 số ────────────────────────────
//
// Sau khi verify thành công:
//  - Lưu accessToken + refreshToken + user vào store
//  - Invalidate 4 query keys (auth, cart, vouchers, recommended)
// Component chủ động router.push('/login') – KHÔNG auto login
describe("useVerifyOtpMutation", () => {
  it("lưu token + user vào store khi thành công", async () => {
    mockVerifyOtpRequest.mockResolvedValue({
      accessToken: "at_otp",
      refreshToken: "rt_otp",
      tokenType: "Bearer",
      expiresIn: 3600,
      user: {
        id: 42,
        email: "an@example.com",
        fullName: "An",
        phone: "0912345678",
        avatarUrl: null,
        status: "ACTIVE",
        createdAt: "2026-10-10T00:00:00Z",
      },
    });

    const { wrapper } = withQueryClient();
    const { result } = renderHook(() => useVerifyOtpMutation(), { wrapper });

    await act(async () => {
      result.current.mutate({ email: "an@example.com", code: "123456" });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockSetAccessToken).toHaveBeenCalledWith("at_otp");
    expect(mockSetRefreshToken).toHaveBeenCalledWith("rt_otp");
    expect(mockSetUser).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "42",
        email: "an@example.com",
        role: "BUYER",
      })
    );
  });

  it("invalidates 4 query keys (auth, cart, vouchers.mine, products.recommended) khi thành công", async () => {
    mockVerifyOtpRequest.mockResolvedValue({
      accessToken: "at",
      refreshToken: "rt",
      tokenType: "Bearer",
      expiresIn: 3600,
      user: {
        id: 1,
        email: "a@e.com",
        fullName: "A",
        phone: "0912345678",
        avatarUrl: null,
        status: "ACTIVE",
        createdAt: "2026-10-10T00:00:00Z",
      },
    });

    const { wrapper, invalidateSpy } = withQueryClient();
    const { result } = renderHook(() => useVerifyOtpMutation(), { wrapper });

    await act(async () => {
      result.current.mutate({ email: "a@e.com", code: "123456" });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledTimes(4);
  });

  it("expose isError khi API throw ApiError (OTP_INVALID)", async () => {
    // Tạo ApiError thật từ source (bypass vi.mock của @/lib/api)
    const realApi = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
    mockVerifyOtpRequest.mockRejectedValue(
      new realApi.ApiError({
        status: 401,
        code: "OTP_INVALID",
        message: "Invalid code",
        details: { attemptsLeft: 4 },
      })
    );

    const { wrapper } = withQueryClient();
    const { result } = renderHook(() => useVerifyOtpMutation(), { wrapper });

    await act(async () => {
      result.current.mutate({ email: "a@e.com", code: "000000" });
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as unknown as { code: string }).code).toBe("OTP_INVALID");
  });

  it("KHÔNG tự động toast lỗi – component tự quyết định UX", async () => {
    mockVerifyOtpRequest.mockRejectedValue(new Error("boom"));

    const { wrapper } = withQueryClient();
    const { result } = renderHook(() => useVerifyOtpMutation(), { wrapper });

    await act(async () => {
      result.current.mutate({ email: "a@e.com", code: "000000" });
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    // toast.error là mock – kiểm tra nó KHÔNG được gọi từ hook
    // (rule error-handling: chỉ toast network/system, validation/business hiển thị inline)
    const sonner = await import("sonner");
    const toastErrorSpy = vi.spyOn(sonner.toast, "error");
    expect(toastErrorSpy).not.toHaveBeenCalled();
  });
});

// ── useResendOtpMutation – yêu cầu gửi lại OTP ─────────────────────────
//
// Hook chỉ gọi API, KHÔNG toast tự động. Component tự quyết định UX
// (toast hoặc inline message).
describe("useResendOtpMutation", () => {
  it("gọi API với email truyền vào", async () => {
    mockResendOtpRequest.mockResolvedValue({
      success: true,
      email: "an@example.com",
    });

    const { wrapper } = withQueryClient();
    const { result } = renderHook(() => useResendOtpMutation(), { wrapper });

    await act(async () => {
      result.current.mutate({ email: "an@example.com" });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockResendOtpRequest).toHaveBeenCalledWith({
      email: "an@example.com",
    });
  });

  it("expose isError khi API throw", async () => {
    mockResendOtpRequest.mockRejectedValue(new Error("Network down"));

    const { wrapper } = withQueryClient();
    const { result } = renderHook(() => useResendOtpMutation(), { wrapper });

    await act(async () => {
      result.current.mutate({ email: "an@example.com" });
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
