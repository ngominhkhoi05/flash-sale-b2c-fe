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

  it("appends city[] as repeated city param", () => {
    const qs = buildSearchQueryString({
      q: "",
      filters: { cities: ["HCM", "HN"] },
      sort: "relevance",
      page: 1,
    });
    const params = new URLSearchParams(qs);
    expect(params.getAll("city")).toEqual(["HCM", "HN"]);
  });

  it("appends service[] as repeated service param", () => {
    const qs = buildSearchQueryString({
      q: "",
      filters: { services: ["flash-sale", "voucher"] },
      sort: "relevance",
      page: 1,
    });
    const params = new URLSearchParams(qs);
    expect(params.getAll("service")).toEqual(["flash-sale", "voucher"]);
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
