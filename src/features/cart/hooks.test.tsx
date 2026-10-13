import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  cartKeys,
  useCart,
  useCartCount,
  useAddToCartMutation,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useClearCartMutation,
} from "./hooks";
import type { CartResponse } from "./types";

// Mock api layer
const mockGetCart = vi.fn();
const mockAddToCart = vi.fn();
const mockUpdateCartItem = vi.fn();
const mockRemoveCartItem = vi.fn();
const mockClearCart = vi.fn();

vi.mock("./api", () => ({
  getCart: () => mockGetCart(),
  addToCart: (payload: unknown) => mockAddToCart(payload),
  updateCartItem: (itemId: number, payload: unknown) =>
    mockUpdateCartItem(itemId, payload),
  removeCartItem: (itemId: number) => mockRemoveCartItem(itemId),
  clearCart: () => mockClearCart(),
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

const MOCK_CART: CartResponse = {
  id: 1,
  userId: 42,
  totalItems: 2,
  grandTotal: 350000,
  storeGroups: [
    {
      storeId: 1,
      storeName: "UTC Fashion",
      storeSubtotal: 250000,
      items: [
        {
          id: 100,
          variantId: 5,
          sku: "AO-001",
          productName: "Áo thun cotton",
          variantName: "Đen, M",
          imageUrl: "https://example.com/a.jpg",
          price: 125000,
          stockQuantity: 50,
          quantity: 2,
          itemSubtotal: 250000,
          storeId: 1,
          storeName: "UTC Fashion",
        },
      ],
    },
  ],
};

beforeEach(() => {
  mockGetCart.mockReset();
  mockAddToCart.mockReset();
  mockUpdateCartItem.mockReset();
  mockRemoveCartItem.mockReset();
  mockClearCart.mockReset();
});

describe("cartKeys", () => {
  it("builds canonical key shape", () => {
    expect(cartKeys.all).toEqual(["cart"]);
    expect(cartKeys.detail()).toEqual(["cart", "detail"]);
  });
});

describe("useCart", () => {
  it("fetches cart and exposes data", async () => {
    mockGetCart.mockResolvedValue(MOCK_CART);

    const { wrapper } = withQueryClient();
    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(MOCK_CART);
    expect(mockGetCart).toHaveBeenCalledTimes(1);
  });

  it("does not fetch when disabled", () => {
    const { wrapper } = withQueryClient();
    const { result } = renderHook(() => useCart(false), { wrapper });
    expect(result.current.isFetching).toBe(false);
    expect(mockGetCart).not.toHaveBeenCalled();
  });
});

describe("useCartCount", () => {
  it("returns totalItems from cart via select", async () => {
    mockGetCart.mockResolvedValue(MOCK_CART);

    const { wrapper } = withQueryClient();
    const { result } = renderHook(() => useCartCount(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(2);
  });
});

describe("useAddToCartMutation", () => {
  it("calls API and updates cache on success", async () => {
    const updatedCart: CartResponse = { ...MOCK_CART, totalItems: 3 };
    mockAddToCart.mockResolvedValue(updatedCart);

    const { wrapper, qc } = withQueryClient();
    qc.setQueryData(cartKeys.detail(), MOCK_CART);

    const { result } = renderHook(() => useAddToCartMutation(), { wrapper });

    await act(async () => {
      result.current.mutate({ variantId: 99, quantity: 1 });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockAddToCart).toHaveBeenCalledWith({ variantId: 99, quantity: 1 });
    expect(qc.getQueryData(cartKeys.detail())).toEqual(updatedCart);
  });
});

describe("useUpdateCartItemMutation", () => {
  it("calls API with itemId + payload and updates cache", async () => {
    const updated: CartResponse = { ...MOCK_CART, grandTotal: 500000 };
    mockUpdateCartItem.mockResolvedValue(updated);

    const { wrapper, qc } = withQueryClient();
    qc.setQueryData(cartKeys.detail(), MOCK_CART);

    const { result } = renderHook(() => useUpdateCartItemMutation(), {
      wrapper,
    });

    await act(async () => {
      result.current.mutate({ itemId: 100, payload: { quantity: 4 } });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockUpdateCartItem).toHaveBeenCalledWith(100, { quantity: 4 });
    expect(qc.getQueryData(cartKeys.detail())).toEqual(updated);
  });
});

describe("useRemoveCartItemMutation", () => {
  it("calls API and invalidates cart queries", async () => {
    mockRemoveCartItem.mockResolvedValue(undefined);
    mockGetCart.mockResolvedValue({ ...MOCK_CART, totalItems: 0 });

    const { wrapper, qc } = withQueryClient();
    qc.setQueryData(cartKeys.detail(), MOCK_CART);

    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useRemoveCartItemMutation(), {
      wrapper,
    });

    await act(async () => {
      result.current.mutate(100);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockRemoveCartItem).toHaveBeenCalledWith(100);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: cartKeys.all });
  });
});

describe("useClearCartMutation", () => {
  it("calls API and invalidates cart queries", async () => {
    mockClearCart.mockResolvedValue(undefined);

    const { wrapper, qc } = withQueryClient();
    qc.setQueryData(cartKeys.detail(), MOCK_CART);

    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useClearCartMutation(), { wrapper });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockClearCart).toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: cartKeys.all });
  });
});
