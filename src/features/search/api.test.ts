/**
 * Unit tests for the search feature API layer.
 * Plan: docs/superpowers/plans/2026-10-18-search-endpoint-be-wire-fe.md
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from "@/lib/api";

import { buildSearchQueryString } from "./api";
import type { SearchQuery, SearchResult } from "./types";

const mockApiFetch = apiFetch as unknown as ReturnType<typeof vi.fn>;

const MOCK_RESULT: SearchResult = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 20,
  facets: {
    subcategories: [],
    cities: [],
    ratings: [],
    services: [],
  },
};

describe("buildSearchQueryString", () => {
  it("includes q, sort, page (1→0 converted), size=20", () => {
    const query: SearchQuery = {
      q: "tai nghe",
      filters: {},
      sort: "newest",
      page: 1,
    };
    const qs = buildSearchQueryString(query);
    expect(qs).toContain("q=tai+nghe");
    expect(qs).toContain("sort=newest");
    expect(qs).toContain("page=0");
    expect(qs).toContain("size=20");
  });

  it("omits empty q", () => {
    const qs = buildSearchQueryString({
      q: "",
      filters: {},
      sort: "relevance",
      page: 1,
    });
    // q is not set when empty
    expect(qs).not.toContain("q=");
  });

  it("appends category[] as repeated subcategory param", () => {
    const qs = buildSearchQueryString({
      q: "",
      filters: { categories: ["true-wireless", "over-ear"] },
      sort: "relevance",
      page: 1,
    });
    const params = new URLSearchParams(qs);
    expect(params.getAll("subcategory")).toEqual(["true-wireless", "over-ear"]);
  });

  it("omits city and service params from search query", () => {
    const qs = buildSearchQueryString({
      q: "",
      filters: { cities: ["HCM"], services: ["flash-sale"] },
      sort: "relevance",
      page: 1,
    });
    const params = new URLSearchParams(qs);
    expect(params.get("city")).toBeNull();
    expect(params.get("service")).toBeNull();
  });

  it("passes priceMin/priceMax/rating through", () => {
    const qs = buildSearchQueryString({
      q: "",
      filters: { priceMin: 100000, priceMax: 500000, minRating: 4 },
      sort: "relevance",
      page: 1,
    });
    const params = new URLSearchParams(qs);
    expect(params.get("priceMin")).toBe("100000");
    expect(params.get("priceMax")).toBe("500000");
    expect(params.get("rating")).toBe("4");
  });

  it("converts FE 1-based page to BE 0-based", () => {
    const qs = buildSearchQueryString({
      q: "",
      filters: {},
      sort: "relevance",
      page: 5,
    });
    const params = new URLSearchParams(qs);
    expect(params.get("page")).toBe("4");
  });

  it("converts FE page=1 to BE page=0", () => {
    const qs = buildSearchQueryString({
      q: "",
      filters: {},
      sort: "relevance",
      page: 1,
    });
    const params = new URLSearchParams(qs);
    expect(params.get("page")).toBe("0");
  });
});

describe("searchProducts (apiFetch path)", () => {
  let originalMockEnv: string | undefined;

  beforeEach(() => {
    originalMockEnv = process.env.NEXT_PUBLIC_USE_MOCK;
    delete process.env.NEXT_PUBLIC_USE_MOCK;
    mockApiFetch.mockReset();
    mockApiFetch.mockResolvedValue({
      items: [],
      total: 0,
      page: 0,
      pageSize: 20,
      facets: MOCK_RESULT.facets,
    });
  });

  afterEach(() => {
    if (originalMockEnv === undefined) {
      delete process.env.NEXT_PUBLIC_USE_MOCK;
    } else {
      process.env.NEXT_PUBLIC_USE_MOCK = originalMockEnv;
    }
  });

  it("calls apiFetch with the constructed query string", async () => {
    const { searchProducts } = await import("./api");
    await searchProducts({
      q: "tai nghe",
      filters: {},
      sort: "newest",
      page: 1,
    });
    expect(mockApiFetch).toHaveBeenCalledTimes(1);
    const [path] = mockApiFetch.mock.calls[0];
    expect(path).toContain("/api/v1/products/search?");
    expect(path).toContain("q=tai+nghe");
    expect(path).toContain("sort=newest");
    expect(path).toContain("page=0");
    expect(path).toContain("size=20");
  });

  it("converts BE 0-based page back to FE 1-based in result", async () => {
    mockApiFetch.mockResolvedValueOnce({
      items: [],
      total: 100,
      page: 2, // BE 0-based
      pageSize: 20,
      facets: MOCK_RESULT.facets,
    });
    const { searchProducts } = await import("./api");
    const result = await searchProducts({
      q: "",
      filters: {},
      sort: "relevance",
      page: 3, // FE 1-based
    });
    expect(result.page).toBe(3);
  });
});

/**
 * Tests cho `searchProductsMock` — verify filter/sort/page trên local mock.
 *
 * Plan: docs/superpowers/plans/2026-10-18-fix-search-mock-filter-shape.md
 *
 * Quy tắc: service filter (freeship, voucher) map sang field `label`
 * trong `RecommendedProductResponse` (BE contract). Price filter dùng
 * `minPrice` (giá bán hiện tại) vì BE chưa trả field `price` riêng.
 */
describe("searchProductsMock (NEXT_PUBLIC_USE_MOCK=true)", () => {
  let originalMockEnv: string | undefined;

  beforeEach(() => {
    originalMockEnv = process.env.NEXT_PUBLIC_USE_MOCK;
    process.env.NEXT_PUBLIC_USE_MOCK = "true";
    mockApiFetch.mockReset();
  });

  afterEach(() => {
    if (originalMockEnv === undefined) {
      delete process.env.NEXT_PUBLIC_USE_MOCK;
    } else {
      process.env.NEXT_PUBLIC_USE_MOCK = originalMockEnv;
    }
  });

  it("filters by freeship service via label === 'freeship'", async () => {
    const { searchProducts } = await import("./api");
    const result = await searchProducts({
      q: "",
      filters: { services: ["freeship"] },
      sort: "relevance",
      page: 1,
    });
    // Mỗi item phải có label === "freeship" (hoặc nếu BE đổi shape thì tất cả
    // đều match — test này vẫn pass vì filter ở client)
    for (const item of result.items) {
      expect(item.label).toBe("freeship");
    }
    // Phải có ít nhất 1 item (mock có nhiều freeship)
    expect(result.items.length).toBeGreaterThan(0);
  });

  it("filters by voucher service via label === 'voucher'", async () => {
    const { searchProducts } = await import("./api");
    const result = await searchProducts({
      q: "",
      filters: { services: ["voucher"] },
      sort: "relevance",
      page: 1,
    });
    for (const item of result.items) {
      expect(item.label).toBe("voucher");
    }
    expect(result.items.length).toBeGreaterThan(0);
  });

  it("filters by priceMin using minPrice field", async () => {
    const { searchProducts } = await import("./api");
    const result = await searchProducts({
      q: "",
      filters: { priceMin: 1_000_000 },
      sort: "relevance",
      page: 1,
    });
    for (const item of result.items) {
      expect(item.minPrice).toBeGreaterThanOrEqual(1_000_000);
    }
  });

  it("filters by priceMax using minPrice field", async () => {
    const { searchProducts } = await import("./api");
    const result = await searchProducts({
      q: "",
      filters: { priceMax: 1_000_000 },
      sort: "relevance",
      page: 1,
    });
    for (const item of result.items) {
      expect(item.minPrice).toBeLessThanOrEqual(1_000_000);
    }
  });

  it("sorts by price_asc using minPrice (ascending)", async () => {
    const { searchProducts } = await import("./api");
    const result = await searchProducts({
      q: "",
      filters: {},
      sort: "price_asc",
      page: 1,
    });
    for (let i = 1; i < result.items.length; i++) {
      expect(result.items[i]!.minPrice).toBeGreaterThanOrEqual(
        result.items[i - 1]!.minPrice,
      );
    }
  });
});
