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
  fetchHomeBanners,
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
