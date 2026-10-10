import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useLoginMutation, useRegisterMutation } from "./hooks";

// ── Mock API layer ──────────────────────────────────────────────────────
const mockLoginRequest = vi.fn();
const mockRegisterRequest = vi.fn();
const mockSetAccessToken = vi.fn();
const mockSetRefreshToken = vi.fn();

vi.mock("./api", () => ({
  loginRequest: (input: unknown) => mockLoginRequest(input),
  registerRequest: (input: unknown) => mockRegisterRequest(input),
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
const mockUseAuthStore = vi.fn((selector: (s: { setUser: typeof mockSetUser }) => unknown) =>
  selector({ setUser: mockSetUser }),
);

vi.mock("@/stores/auth.store", () => ({
  useAuthStore: (selector: (s: { setUser: typeof mockSetUser }) => unknown) =>
    mockUseAuthStore(selector),
}));

vi.mock("@/lib/constants", () => ({
  ROUTES: { LOGIN: "/dang-nhap", HOME: "/trang-chu" },
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
