/**
 * Unit tests for search mocks.
 * Plan: docs/superpowers/plans/2026-10-13-search-page-ui-stitch.md (Subplan A)
 * Plan: docs/superpowers/plans/2026-10-18-search-endpoint-be-wire-fe.md
 *
 * Mock items dùng shape `RecommendedProductResponse` (giống BE response).
 */

import { describe, expect, it } from "vitest";

import {
  MOCK_SEARCH_ITEMS,
  MOCK_SEARCH_FACETS,
  MOCK_SEARCH_MALL,
  MOCK_SUGGESTED_KEYWORDS,
  MOCK_SEARCH_RESULT,
} from "./mocks";

describe("MOCK_SEARCH_ITEMS", () => {
  it("contains exactly 20 products (mirror Stitch)", () => {
    expect(MOCK_SEARCH_ITEMS).toHaveLength(20);
  });

  it("every item has required RecommendedProductResponse fields", () => {
    for (const item of MOCK_SEARCH_ITEMS) {
      expect(typeof item.id).toBe("number");
      expect(item.id).toBeGreaterThan(0);
      expect(item.name).toBeTruthy();
      expect(item.imageUrl).toMatch(/^https?:\/\//);
      expect(item.storeName).toBeTruthy();
      expect(item.minPrice).toBeGreaterThan(0);
      expect(item.maxPrice).toBeGreaterThan(0);
      expect(item.totalStock).toBeGreaterThanOrEqual(0);
    }
  });

  it("every discounted item has minPrice < maxPrice", () => {
    for (const item of MOCK_SEARCH_ITEMS) {
      if (item.maxPrice > item.minPrice) {
        expect(item.minPrice).toBeLessThan(item.maxPrice);
      }
    }
  });

  it("all item IDs are unique", () => {
    const ids = MOCK_SEARCH_ITEMS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("label is one of: null | freeship | voucher | flash_sale | hot_deal", () => {
    const validLabels = [null, "freeship", "voucher", "flash_sale", "hot_deal"];
    for (const item of MOCK_SEARCH_ITEMS) {
      expect(validLabels).toContain(item.label);
    }
  });
});

describe("MOCK_SEARCH_FACETS", () => {
  it("has 5 subcategory facets", () => {
    expect(MOCK_SEARCH_FACETS.subcategories).toHaveLength(5);
  });

  it("every subcategory facet has positive count", () => {
    for (const f of MOCK_SEARCH_FACETS.subcategories) {
      expect(f.count).toBeGreaterThan(0);
      expect(f.label).toBeTruthy();
      expect(f.key).toBeTruthy();
    }
  });

  it("has 4 cities matching the 4 city keys", () => {
    expect(MOCK_SEARCH_FACETS.cities).toHaveLength(4);
    const keys = MOCK_SEARCH_FACETS.cities.map((c) => c.key);
    expect(keys).toEqual(["HCM", "HN", "DN", "BD"]);
  });

  it("has 3 rating levels (3/4/5)", () => {
    const ratingKeys = MOCK_SEARCH_FACETS.ratings.map((r) => r.key);
    expect(ratingKeys).toEqual(["5", "4", "3"]);
  });

  it("has 4 service options", () => {
    const serviceKeys = MOCK_SEARCH_FACETS.services.map((s) => s.key);
    expect(serviceKeys).toEqual([
      "flash-sale",
      "voucher",
      "freeship",
      "official",
    ]);
  });
});

describe("MOCK_SEARCH_MALL", () => {
  it("is marked official", () => {
    expect(MOCK_SEARCH_MALL.isOfficial).toBe(true);
    expect(MOCK_SEARCH_MALL.badgeLabel).toBe("MALL");
  });

  it("has 3 highlight products with positive price", () => {
    expect(MOCK_SEARCH_MALL.highlights).toHaveLength(3);
    for (const p of MOCK_SEARCH_MALL.highlights) {
      expect(p.price).toBeGreaterThan(0);
      expect(p.name).toBeTruthy();
      expect(p.imageUrl).toMatch(/^https?:\/\//);
    }
  });

  it("has a high rating (>= 4.5)", () => {
    expect(MOCK_SEARCH_MALL.rating).toBeGreaterThanOrEqual(4.5);
  });
});

describe("MOCK_SUGGESTED_KEYWORDS", () => {
  it("is a non-empty array of non-empty strings", () => {
    expect(MOCK_SUGGESTED_KEYWORDS.length).toBeGreaterThan(0);
    for (const k of MOCK_SUGGESTED_KEYWORDS) {
      expect(k).toBeTruthy();
    }
  });
});

describe("MOCK_SEARCH_RESULT (top-level)", () => {
  it("bundles items + facets + mall + page metadata", () => {
    expect(MOCK_SEARCH_RESULT.items).toBe(MOCK_SEARCH_ITEMS);
    expect(MOCK_SEARCH_RESULT.facets).toBe(MOCK_SEARCH_FACETS);
    expect(MOCK_SEARCH_RESULT.mall).toBe(MOCK_SEARCH_MALL);
    expect(MOCK_SEARCH_RESULT.page).toBe(1);
    expect(MOCK_SEARCH_RESULT.pageSize).toBe(20);
    expect(MOCK_SEARCH_RESULT.total).toBeGreaterThan(0);
  });
});
