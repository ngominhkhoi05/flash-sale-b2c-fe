import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  useRecommendedProducts,
  useProductDetailBySlug,
  productKeys,
} from "./hooks";
import type { RecommendedProduct } from "./types";
import { mockProductDetail } from "./mock";

const mockGetRecommended = vi.fn();
const mockFetchBySlug = vi.fn();
const mockFetchById = vi.fn();
vi.mock("./api", () => ({
  getRecommendedProducts: (size: number) => mockGetRecommended(size),
  fetchProductDetailBySlug: (slug: string) => mockFetchBySlug(slug),
  fetchProductDetailById: (id: number) => mockFetchById(id),
}));

function withQueryClient() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return { wrapper, qc };
}

beforeEach(() => {
  mockGetRecommended.mockReset();
  mockFetchBySlug.mockReset();
  mockFetchById.mockReset();
});

describe("productKeys", () => {
  it("builds canonical keys", () => {
    expect(productKeys.all).toEqual(["products"]);
    expect(productKeys.recommended()).toEqual(["products", "recommended", 20]);
    expect(productKeys.recommended(10)).toEqual(["products", "recommended", 10]);
    expect(productKeys.detail("abc")).toEqual(["products", "detail", "abc"]);
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
        href: "/products/p1",
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

describe("useProductDetail", () => {
  it("trả về data từ API khi slug hợp lệ", async () => {
    mockFetchBySlug.mockResolvedValue(mockProductDetail);
    const { wrapper } = withQueryClient();
    const { result } = renderHook(() => useProductDetailBySlug(mockProductDetail.slug), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockProductDetail);
    expect(mockFetchBySlug).toHaveBeenCalledWith(mockProductDetail.slug);
  });

  it("throw lỗi khi slug không tồn tại (để component xử lý 404)", async () => {
    const apiError = new Error("Not Found");
    mockFetchBySlug.mockRejectedValue(apiError);
    const { wrapper } = withQueryClient();
    const { result } = renderHook(() => useProductDetailBySlug("slug-khong-ton-tai"), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(apiError);
  });

  it("không fetch khi slug null/undefined (enabled=false)", async () => {
    const { wrapper } = withQueryClient();
    const { result } = renderHook(() => useProductDetailBySlug(null), { wrapper });

    // enabled=false → queryFn không chạy → fetchStatus giữ idle
    expect(result.current.fetchStatus).toBe("idle");
    expect(result.current.data).toBeUndefined();
  });

  it("không fetch khi slug empty string (enabled=false)", async () => {
    const { wrapper } = withQueryClient();
    const { result } = renderHook(() => useProductDetailBySlug(""), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
  });
});
