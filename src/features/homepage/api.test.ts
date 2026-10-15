/**
 * Test cho homepage API functions.
 *
 * Coverage:
 * - fetchCategories: parse GET /api/v1/categories
 * - fetchFeaturedProducts: parse GET /api/v1/products (fallback cho /products/recommended)
 * - fetchHomeBanners: fallback khi backend trả 404
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApiError } from "@/lib/api";
import {
  fetchCategories,
  fetchFeaturedProducts,
  fetchFeaturedStores,
  fetchHomeBanners,
  fetchPlatformVouchers,
  fetchRecommendedProducts,
} from "./api";

const mockFetch = vi.fn();
beforeEach(() => {
  mockFetch.mockReset();
  globalThis.fetch = mockFetch as unknown as typeof fetch;
});

function makeResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status });
}

describe("fetchCategories", () => {
  it("parses backend CategoryResponse array", async () => {
    mockFetch.mockResolvedValueOnce(
      makeResponse(200, {
        data: [
          {
            id: 1,
            name: "Thời trang nam",
            slug: "thoi-trang-nam",
            commissionRate: 0.1,
            description: "Quần áo, phụ kiện nam",
          },
          {
            id: 2,
            name: "Điện thoại",
            slug: "dien-thoai",
            commissionRate: 0.1,
            description: "",
          },
        ],
      }),
    );

    const result = await fetchCategories();
    expect(result).toHaveLength(2);
    expect(result[0]?.id).toBe(1);
    expect(result[0]?.name).toBe("Thời trang nam");
    expect(result[0]?.slug).toBe("thoi-trang-nam");
  });

  it("also accepts raw array response (no envelope)", async () => {
    mockFetch.mockResolvedValueOnce(
      makeResponse(200, [
        { id: 1, name: "A", slug: "a", commissionRate: 0, description: "" },
      ]),
    );

    const result = await fetchCategories();
    expect(result).toHaveLength(1);
  });

  it("throws ApiError when backend returns 500", async () => {
    mockFetch.mockResolvedValueOnce(
      makeResponse(500, { message: "Internal error" }),
    );

    await expect(fetchCategories()).rejects.toBeInstanceOf(ApiError);
  });
});

describe("fetchFeaturedProducts", () => {
  it("parses PageResponse of products", async () => {
    mockFetch.mockResolvedValueOnce(
      makeResponse(200, {
        items: [
          {
            id: 1,
            storeId: 1,
            storeName: "Shop A",
            categoryId: 1,
            categoryName: "Cat",
            name: "Product 1",
            imageUrl: "https://example.com/p1.jpg",
            minPrice: 99000,
            maxPrice: 199000,
            totalStock: 50,
            status: "ACTIVE",
            createdAt: "2026-10-01T00:00:00Z",
          },
        ],
        pageNumber: 0,
        pageSize: 20,
        totalElements: 1,
        totalPages: 1,
        isFirst: true,
        isLast: true,
        hasNext: false,
        hasPrevious: false,
      }),
    );

    const result = await fetchFeaturedProducts({ size: 20 });
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("Product 1");
    expect(result[0]?.minPrice).toBe(99000);
  });

  it("passes query params (size, sort) to backend", async () => {
    mockFetch.mockResolvedValueOnce(
      makeResponse(200, {
        items: [],
        pageNumber: 0,
        pageSize: 20,
        totalElements: 0,
        totalPages: 0,
        isFirst: true,
        isLast: true,
        hasNext: false,
        hasPrevious: false,
      }),
    );

    await fetchFeaturedProducts({ size: 20, sort: "createdAt,desc" });
    const calledUrl = mockFetch.mock.calls[0]?.[0] as string;
    expect(calledUrl).toContain("size=20");
    expect(calledUrl).toContain("sort=createdAt%2Cdesc");
  });

  it("returns empty array when no products", async () => {
    mockFetch.mockResolvedValueOnce(
      makeResponse(200, {
        items: [],
        pageNumber: 0,
        pageSize: 20,
        totalElements: 0,
        totalPages: 0,
        isFirst: true,
        isLast: true,
        hasNext: false,
        hasPrevious: false,
      }),
    );

    const result = await fetchFeaturedProducts({ size: 20 });
    expect(result).toEqual([]);
  });
});

describe("fetchHomeBanners (fallback)", () => {
  it("returns empty banners when backend returns 404", async () => {
    mockFetch.mockResolvedValueOnce(
      makeResponse(404, { message: "Not Found" }),
    );

    const result = await fetchHomeBanners();
    expect(result.mainSlides).toEqual([]);
    expect(result.sideBanners).toEqual([]);
  });

  it("parses banners when backend returns data", async () => {
    mockFetch.mockResolvedValueOnce(
      makeResponse(200, {
        mainSlides: [
          {
            id: 1,
            type: "HERO",
            position: 1,
            imageUrl: "https://example.com/b1.jpg",
            imageAlt: "Banner 1",
            ctaHref: "/flash-sale",
            ctaText: "Mua ngay",
            isActive: true,
            startDate: null,
            endDate: null,
            createdAt: "2026-10-01",
          },
        ],
        sideBanners: [],
      }),
    );

    const result = await fetchHomeBanners();
    expect(result.mainSlides).toHaveLength(1);
    expect(result.mainSlides[0]?.imageUrl).toBe("https://example.com/b1.jpg");
  });
});

describe("fetchFeaturedStores", () => {
  it("parses backend FeaturedStoreResponse array", async () => {
    mockFetch.mockResolvedValueOnce(
      makeResponse(200, {
        data: [
          {
            id: 1,
            name: "Shop A",
            logoUrl: "https://example.com/logo-a.png",
            verified: true,
            rating: 4.8,
            totalRatings: 1200,
            followers: 5400,
            productThumbnails: [
              "https://example.com/p1.jpg",
              "https://example.com/p2.jpg",
            ],
            totalProducts: 42,
            createdAt: "2026-10-01T00:00:00Z",
          },
          {
            id: 2,
            name: "Shop B",
            logoUrl: "https://example.com/logo-b.png",
            verified: false,
            rating: 4.5,
            totalRatings: 800,
            followers: 2100,
            productThumbnails: [],
            totalProducts: 18,
            createdAt: "2026-09-15T00:00:00Z",
          },
        ],
      }),
    );

    const result = await fetchFeaturedStores(4);
    expect(result).toHaveLength(2);
    expect(result[0]?.id).toBe(1);
    expect(result[0]?.name).toBe("Shop A");
    expect(result[0]?.verified).toBe(true);
  });

  it("passes limit query param to backend", async () => {
    mockFetch.mockResolvedValueOnce(makeResponse(200, { data: [] }));

    await fetchFeaturedStores(4);
    const calledUrl = mockFetch.mock.calls[0]?.[0] as string;
    expect(calledUrl).toContain("limit=4");
  });

  it("throws ApiError when backend returns 500", async () => {
    mockFetch.mockResolvedValueOnce(
      makeResponse(500, { message: "Internal error" }),
    );

    await expect(fetchFeaturedStores(4)).rejects.toBeInstanceOf(ApiError);
  });
});

describe("fetchRecommendedProducts", () => {
  it("parses backend RecommendedProductsResponse (tab=all)", async () => {
    mockFetch.mockResolvedValueOnce(
      makeResponse(200, {
        data: {
          forYou: [
            {
              id: 1,
              storeId: 1,
              storeName: "Shop A",
              name: "Product 1",
              imageUrl: "https://example.com/p1.jpg",
              minPrice: 99000,
              maxPrice: 199000,
              totalStock: 50,
              totalSold: 1200,
              label: "Mới",
            },
          ],
          bestSellers: [
            {
              id: 2,
              storeId: 1,
              storeName: "Shop A",
              name: "Best Seller",
              imageUrl: "https://example.com/p2.jpg",
              minPrice: 49000,
              maxPrice: 99000,
              totalStock: 20,
              totalSold: 5500,
              label: "Bán chạy",
            },
          ],
          hotDeals: [
            {
              id: 3,
              storeId: 2,
              storeName: "Shop B",
              name: "Hot Deal",
              imageUrl: "https://example.com/p3.jpg",
              minPrice: 29000,
              maxPrice: 59000,
              totalStock: 5,
              totalSold: 800,
              label: "Flash sale",
            },
          ],
        },
      }),
    );

    const result = await fetchRecommendedProducts("all");
    expect(result.forYou).toHaveLength(1);
    expect(result.bestSellers).toHaveLength(1);
    expect(result.hotDeals).toHaveLength(1);
    expect(result.forYou[0]?.name).toBe("Product 1");
  });

  it("passes tab and limit query params to backend", async () => {
    mockFetch.mockResolvedValueOnce(
      makeResponse(200, {
        data: { forYou: [], bestSellers: [], hotDeals: [] },
      }),
    );

    await fetchRecommendedProducts("best_seller", undefined, 8);
    const calledUrl = mockFetch.mock.calls[0]?.[0] as string;
    expect(calledUrl).toContain("tab=best_seller");
    expect(calledUrl).toContain("limit=8");
  });

  it("returns empty lists when backend returns empty arrays", async () => {
    mockFetch.mockResolvedValueOnce(
      makeResponse(200, {
        data: { forYou: [], bestSellers: [], hotDeals: [] },
      }),
    );

    const result = await fetchRecommendedProducts("all");
    expect(result).toEqual({ forYou: [], bestSellers: [], hotDeals: [] });
  });

  it("throws ApiError when backend returns 500", async () => {
    mockFetch.mockResolvedValueOnce(
      makeResponse(500, { message: "Internal error" }),
    );

    await expect(fetchRecommendedProducts("all")).rejects.toBeInstanceOf(ApiError);
  });
});

describe("fetchPlatformVouchers (guest guard)", () => {
  it("returns empty array when backend returns 401 (guest user)", async () => {
    // Guest mở trang chủ → homepage fetch vouchers → BE trả 401 vì
    // /vouchers/platform yêu cầu auth. Hook phải fallback về [] để UI
    // ẩn section voucher, không spam error console.
    mockFetch.mockResolvedValueOnce(
      makeResponse(401, { message: "Unauthorized" }),
    );

    const result = await fetchPlatformVouchers();
    expect(result).toEqual([]);
  });

  it("returns empty array when backend returns 404 (endpoint missing)", async () => {
    // Tương tự fetchHomeBanners, BE có thể chưa implement endpoint →
    // 404 → fallback [].
    mockFetch.mockResolvedValueOnce(
      makeResponse(404, { message: "Not Found" }),
    );

    const result = await fetchPlatformVouchers();
    expect(result).toEqual([]);
  });

  it("throws ApiError when backend returns 500 (server error không phải guard)", async () => {
    // 5xx không phải guard case → throw để React Query hiển thị error UI.
    mockFetch.mockResolvedValueOnce(
      makeResponse(500, { message: "Internal error" }),
    );

    await expect(fetchPlatformVouchers()).rejects.toBeInstanceOf(ApiError);
  });

  it("parses voucher array when backend returns data", async () => {
    mockFetch.mockResolvedValueOnce(
      makeResponse(200, {
        data: [
          {
            id: 1,
            code: "WELCOME10",
            storeId: null,
            discountType: "PERCENT",
            discountValue: 10,
            minOrderAmount: 100000,
            maxDiscountAmount: 50000,
            totalQuantity: 1000,
            usedQuantity: 250,
            userUsageLimit: 1,
            startTime: "2026-10-01T00:00:00Z",
            endTime: "2026-12-31T23:59:59Z",
            status: "ACTIVE",
            createdAt: "2026-09-30T00:00:00Z",
          },
        ],
      }),
    );

    const result = await fetchPlatformVouchers();
    expect(result).toHaveLength(1);
    expect(result[0]?.code).toBe("WELCOME10");
    expect(result[0]?.storeId).toBeNull();
  });
});
