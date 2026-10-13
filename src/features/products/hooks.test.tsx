import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  useProductDetail,
  useProducts,
  productKeys,
} from "./hooks";
import { mockProductDetail } from "./mock";

// Mocks
const mockGetProductDetail = vi.fn();
const mockGetProducts = vi.fn();

vi.mock("./api", () => ({
  getProductDetail: (id: number) => mockGetProductDetail(id),
  getProducts: (params: unknown) => mockGetProducts(params),
  getRecommendedProducts: vi.fn(),
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
  mockGetProductDetail.mockReset();
  mockGetProducts.mockReset();
});

describe("productKeys", () => {
  it("builds canonical keys", () => {
    expect(productKeys.all).toEqual(["products"]);
    expect(productKeys.detail(123)).toEqual(["products", "detail", 123]);
  });
});

describe("useProductDetail", () => {
  it("fetches by ID and merges mock UI fields on success", async () => {
    const apiResponse = {
      id: 1,
      storeId: 1,
      storeName: "UTC Fashion Official",
      categoryId: 1,
      categoryName: "Thời trang Unisex",
      name: "Áo thun unisex cotton UTC Basic",
      imageUrl: "https://example.com/a.jpg",
      description: "Mô tả sản phẩm",
      tierVariationConfigs: [],
      variants: [
        {
          id: 1,
          productId: 1,
          sku: "SKU-001",
          variantName: "Trắng, M",
          attributes: { "Màu Sắc": "Trắng", "Kích Thước": "M" },
          originalPrice: 159000,
          stockQuantity: 50,
          imageUrl: "",
          status: "ACTIVE",
          version: 1,
          createdAt: "2026-10-01T00:00:00Z",
          isDisabled: false,
        },
      ],
      status: "ACTIVE",
      createdAt: "2026-10-01T00:00:00Z",
      ratingAvg: 4.8,
      ratingCount: 326,
      soldCount: 2100,
      minPrice: 89000,
      maxPrice: 159000,
      discountPercent: 44,
      images: [
        {
          id: 1,
          url: "https://example.com/a.jpg",
          isPrimary: true,
          displayOrder: 0,
          alt: "Áo thun",
        },
      ],
      flashSales: [
        {
          flashSaleItemId: 1,
          variantId: 1,
          price: 89000,
          originalPrice: 159000,
          discountPercent: 44,
          totalStock: 100,
          soldStock: 72,
          maxQtyPerUser: 2,
          endsAt: "2026-10-14T18:00:00Z",
        },
      ],
    };

    mockGetProductDetail.mockResolvedValue(apiResponse);

    const { wrapper } = withQueryClient();
    const { result } = renderHook(() => useProductDetail(1), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGetProductDetail).toHaveBeenCalledWith(1);
    expect(result.current.data).not.toBeNull();
    expect(result.current.data!.name).toBe("Áo thun unisex cotton UTC Basic");
    // Mock fields merged
    expect(result.current.data!.questionCount).toBe(76);
    expect(result.current.data!.reviews).toEqual(mockProductDetail.reviews);
  });

  it("falls back to mock when API fails", async () => {
    mockGetProductDetail.mockRejectedValue(new Error("API Error"));

    const { wrapper } = withQueryClient();
    const { result } = renderHook(() => useProductDetail(1), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    // Should return mock data for ID=1
    expect(result.current.data).toEqual(mockProductDetail);
  });

  it("returns null when ID not found in mock", async () => {
    mockGetProductDetail.mockRejectedValue(new Error("Not found"));

    const { wrapper } = withQueryClient();
    const { result } = renderHook(() => useProductDetail(999), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it("does not fetch when ID is null", () => {
    const { wrapper } = withQueryClient();
    const { result } = renderHook(() => useProductDetail(null), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockGetProductDetail).not.toHaveBeenCalled();
  });

  it("does not fetch when ID is undefined", () => {
    const { wrapper } = withQueryClient();
    const { result } = renderHook(() => useProductDetail(undefined), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useProducts", () => {
  it("fetches product list with params", async () => {
    const pageResponse = {
      content: [],
      totalPages: 0,
      totalElements: 0,
      size: 20,
      number: 0,
      first: true,
      last: true,
      numberOfElements: 0,
      empty: true,
    };
    mockGetProducts.mockResolvedValue(pageResponse);

    const { wrapper } = withQueryClient();
    const { result } = renderHook(
      () => useProducts({ categoryId: 1, page: 0, size: 20 }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGetProducts).toHaveBeenCalledWith({
      categoryId: 1,
      page: 0,
      size: 20,
    });
  });
});
