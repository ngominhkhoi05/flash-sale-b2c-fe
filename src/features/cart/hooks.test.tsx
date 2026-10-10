import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useCartCount, useCartItems, useCartSummary, cartKeys } from "./hooks";
import type { CartItem, CartSummary } from "./types";

// Mock api layer
const mockGetCartItems = vi.fn();
const mockGetCartSummary = vi.fn();

vi.mock("./api", () => ({
  getCartItems: () => mockGetCartItems(),
  getCartSummary: () => mockGetCartSummary(),
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
  mockGetCartItems.mockReset();
  mockGetCartSummary.mockReset();
});

describe("cartKeys", () => {
  it("builds canonical key shape", () => {
    expect(cartKeys.all).toEqual(["cart"]);
    expect(cartKeys.items()).toEqual(["cart", "items"]);
    expect(cartKeys.summary()).toEqual(["cart", "summary"]);
  });
});

describe("useCartItems", () => {
  it("fetches cart items and exposes data", async () => {
    const items: CartItem[] = [
      {
        id: "i1",
        productId: "p1",
        productName: "Áo thun",
        imageUrl: "https://example.com/a.jpg",
        quantity: 2,
        unitPrice: 100000,
        storeId: "s1",
        storeName: "Shop A",
        inStock: true,
      },
    ];
    mockGetCartItems.mockResolvedValue(items);

    const { wrapper } = withQueryClient();
    const { result } = renderHook(() => useCartItems(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(items);
    expect(mockGetCartItems).toHaveBeenCalledTimes(1);
  });

  it("does not fetch when disabled", () => {
    const { wrapper } = withQueryClient();
    const { result } = renderHook(() => useCartItems(false), { wrapper });
    expect(result.current.isFetching).toBe(false);
    expect(mockGetCartItems).not.toHaveBeenCalled();
  });
});

describe("useCartSummary", () => {
  it("fetches summary and exposes data", async () => {
    const summary: CartSummary = {
      totalItems: 2,
      totalQuantity: 3,
      subtotal: 250000,
      estimatedShipping: 30000,
      estimatedTotal: 280000,
    };
    mockGetCartSummary.mockResolvedValue(summary);

    const { wrapper } = withQueryClient();
    const { result } = renderHook(() => useCartSummary(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(summary);
  });
});

describe("useCartCount", () => {
  it("returns totalItems from summary via select", async () => {
    mockGetCartSummary.mockResolvedValue({
      totalItems: 5,
      totalQuantity: 7,
      subtotal: 100000,
      estimatedShipping: 0,
      estimatedTotal: 100000,
    } satisfies CartSummary);

    const { wrapper } = withQueryClient();
    const { result } = renderHook(() => useCartCount(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(5);
  });

  it("calls getCartSummary (not getCartItems)", async () => {
    mockGetCartSummary.mockResolvedValue({
      totalItems: 0,
      totalQuantity: 0,
      subtotal: 0,
      estimatedShipping: 0,
      estimatedTotal: 0,
    } satisfies CartSummary);

    const { wrapper } = withQueryClient();
    renderHook(() => useCartCount(), { wrapper });

    await waitFor(() => {
      expect(mockGetCartSummary).toHaveBeenCalled();
      expect(mockGetCartItems).not.toHaveBeenCalled();
    });
  });
});
