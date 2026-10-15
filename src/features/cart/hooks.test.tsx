import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useCart, useCartCount, cartKeys } from "./hooks";
import type { BackendCartResponse } from "./api";

// Mock useAuth – trả về state tùy biến qua mockUseAuth.
const mockUseAuth = vi.fn<() => { isAuthenticated: boolean }>(() => ({
  isAuthenticated: true,
}));
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock api layer
const mockGetCart = vi.fn();

vi.mock("./api", () => ({
  getCart: () => mockGetCart(),
}));

function withQueryClient() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return { wrapper, qc };
}

beforeEach(() => {
  mockGetCart.mockReset();
});

describe("cartKeys", () => {
  it("builds canonical key shape", () => {
    expect(cartKeys.all).toEqual(["cart"]);
    expect(cartKeys.items()).toEqual(["cart", "items"]);
    expect(cartKeys.summary()).toEqual(["cart", "summary"]);
  });
});

describe("useCart", () => {
  it("fetches cart and exposes data", async () => {
    const cart: BackendCartResponse = {
      id: 1,
      userId: 5,
      storeGroups: [],
      totalItems: 0,
      grandTotal: 0,
    };
    mockGetCart.mockResolvedValue(cart);

    const { wrapper } = withQueryClient();
    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(cart);
    expect(mockGetCart).toHaveBeenCalledTimes(1);
  });

  it("does not fetch when disabled", () => {
    const { wrapper } = withQueryClient();
    const { result } = renderHook(() => useCart(false), { wrapper });
    expect(result.current.isFetching).toBe(false);
    expect(mockGetCart).not.toHaveBeenCalled();
  });
});

// ── Guest guard: cart hooks KHÔNG gọi API khi user chưa login ────────
describe("useCart – guest guard", () => {
  it("does NOT fetch when user is NOT authenticated (guest)", () => {
    // Guest user mở trang chủ → header gọi useCartCount → nếu vẫn fire
    // query sẽ nhận 401 từ BE (cart là protected endpoint). Hook phải
    // skip hoàn toàn và return count=0 để UI không hiển thị badge.
    mockUseAuth.mockReturnValue({ isAuthenticated: false });
    mockGetCart.mockClear();

    const { wrapper } = withQueryClient();
    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current.isFetching).toBe(false);
    expect(mockGetCart).not.toHaveBeenCalled();
  });

  it("fetches cart when user IS authenticated", async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true });
    const cart: BackendCartResponse = {
      id: 1,
      userId: 5,
      storeGroups: [],
      totalItems: 2,
      grandTotal: 1000,
    };
    mockGetCart.mockResolvedValue(cart);

    const { wrapper } = withQueryClient();
    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(cart);
    expect(mockGetCart).toHaveBeenCalledTimes(1);
  });
});

describe("useCartCount – guest guard", () => {
  it("returns 0 when user is NOT authenticated (no fetch)", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false });
    mockGetCart.mockClear();

    const { wrapper } = withQueryClient();
    const { result } = renderHook(() => useCartCount(), { wrapper });

    expect(result.current.data).toBe(0);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isFetching).toBe(false);
    expect(mockGetCart).not.toHaveBeenCalled();
  });

  it("fetches count when user IS authenticated", async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true });
    const cart: BackendCartResponse = {
      id: 1,
      userId: 5,
      storeGroups: [],
      totalItems: 5,
      grandTotal: 5000,
    };
    mockGetCart.mockResolvedValue(cart);

    const { wrapper } = withQueryClient();
    const { result } = renderHook(() => useCartCount(), { wrapper });

    await waitFor(() => expect(result.current.data).toBe(5));
    expect(mockGetCart).toHaveBeenCalledTimes(1);
  });
});
