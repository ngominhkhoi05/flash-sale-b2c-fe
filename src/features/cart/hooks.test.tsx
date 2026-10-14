import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useCart, cartKeys } from "./hooks";
import type { BackendCartResponse } from "./api";

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
