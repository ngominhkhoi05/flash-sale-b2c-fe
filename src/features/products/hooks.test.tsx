import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useRecommendedProducts, productKeys } from "./hooks";
import type { RecommendedProduct } from "./types";

const mockGetRecommended = vi.fn();
vi.mock("./api", () => ({
  getRecommendedProducts: (size: number) => mockGetRecommended(size),
}));

function withQueryClient() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return { wrapper, qc };
}

beforeEach(() => mockGetRecommended.mockReset());

describe("productKeys", () => {
  it("builds canonical key with size", () => {
    expect(productKeys.all).toEqual(["products"]);
    expect(productKeys.recommended()).toEqual(["products", "recommended", 20]);
    expect(productKeys.recommended(10)).toEqual(["products", "recommended", 10]);
  });
});

describe("useRecommendedProducts", () => {
  it("fetches with default size=20", async () => {
    const products: RecommendedProduct[] = [
      {
        id: "p1",
        name: "Tai nghe ANC",
        imageUrl: "https://example.com/p.jpg",
        imageAlt: "Tai nghe",
        price: 299000,
        originalPrice: 500000,
        discountPercent: 40,
        rating: 4.8,
        totalSold: 1200,
        location: "Hà Nội",
        href: "/san-pham/p1",
      },
    ];
    mockGetRecommended.mockResolvedValue(products);

    const { wrapper } = withQueryClient();
    const { result } = renderHook(() => useRecommendedProducts(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(products);
    expect(mockGetRecommended).toHaveBeenCalledWith(20);
  });

  it("passes custom size to queryFn", async () => {
    mockGetRecommended.mockResolvedValue([]);

    const { wrapper } = withQueryClient();
    renderHook(() => useRecommendedProducts(10), { wrapper });

    await waitFor(() => {
      expect(mockGetRecommended).toHaveBeenCalledWith(10);
    });
  });
});
