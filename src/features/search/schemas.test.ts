/**
 * Unit tests for search URL schema.
 * Plan: docs/superpowers/plans/2026-10-13-search-page-ui-stitch.md (Subplan A)
 */

import { describe, expect, it } from "vitest";

import {
  DEFAULT_SEARCH_PAGE,
  DEFAULT_SEARCH_SORT,
} from "./types";
import {
  searchParamsSchema,
  normalizeRawSearchParams,
  toSearchFilters,
} from "./schemas";

describe("normalizeRawSearchParams", () => {
  it("returns empty object for undefined input", () => {
    expect(normalizeRawSearchParams(undefined)).toEqual({});
  });

  it("drops undefined values", () => {
    expect(normalizeRawSearchParams({ a: "x", b: undefined })).toEqual({
      a: "x",
    });
  });

  it("takes first element when value is string[]", () => {
    expect(normalizeRawSearchParams({ q: ["a", "b"] })).toEqual({ q: "a" });
  });

  it("preserves plain string values", () => {
    expect(normalizeRawSearchParams({ q: "tai nghe", page: "2" })).toEqual({
      q: "tai nghe",
      page: "2",
    });
  });

  it("trims whitespace? (no, normalizer does not – schema trims)", () => {
    expect(normalizeRawSearchParams({ q: "  hello  " })).toEqual({
      q: "  hello  ",
    });
  });
});

describe("searchParamsSchema – happy path", () => {
  it("parses an empty object with defaults", () => {
    const r = searchParamsSchema.parse({});
    expect(r.q).toBe("");
    expect(r.category).toEqual([]);
    expect(r.city).toEqual([]);
    expect(r.service).toEqual([]);
    expect(r.sort).toBe(DEFAULT_SEARCH_SORT);
    expect(r.page).toBe(DEFAULT_SEARCH_PAGE);
  });

  it("parses a complete query (q + multi filters + sort + page)", () => {
    const r = searchParamsSchema.parse({
      q: "tai nghe",
      category: ["true-wireless", "over-ear"],
      city: "HCM",
      service: ["freeship", "voucher"],
      priceMin: "100000",
      priceMax: "3000000",
      rating: "4",
      sort: "price_asc",
      page: "2",
    });
    expect(r.q).toBe("tai nghe");
    expect(r.category).toEqual(["true-wireless", "over-ear"]);
    expect(r.city).toEqual(["HCM"]);
    expect(r.service).toEqual(["freeship", "voucher"]);
    expect(r.priceMin).toBe(100000);
    expect(r.priceMax).toBe(3000000);
    expect(r.rating).toBe(4);
    expect(r.sort).toBe("price_asc");
    expect(r.page).toBe(2);
  });

  it("trims whitespace on q", () => {
    const r = searchParamsSchema.parse({ q: "  hello  " });
    expect(r.q).toBe("hello");
  });

  it("coerces page string to number", () => {
    const r = searchParamsSchema.parse({ page: "5" });
    expect(r.page).toBe(5);
  });

  it("treats min rating as the highest when multiple passed", () => {
    const r = searchParamsSchema.parse({ rating: ["3", "4", "5"] });
    expect(r.rating).toBe(5);
  });
});

describe("toSearchFilters", () => {
  it("returns empty object when all fields empty", () => {
    const parsed = searchParamsSchema.parse({});
    const filters = toSearchFilters(parsed);
    expect(filters).toEqual({});
  });

  it("groups parsed fields into SearchFilters", () => {
    const parsed = searchParamsSchema.parse({
      category: ["true-wireless"],
      city: "HCM",
      service: ["freeship"],
      priceMin: "100",
      priceMax: "1000",
      rating: "4",
    });
    const filters = toSearchFilters(parsed);
    expect(filters).toEqual({
      categories: ["true-wireless"],
      cities: ["HCM"],
      services: ["freeship"],
      priceMin: 100,
      priceMax: 1000,
      minRating: 4,
    });
  });
});

describe("searchParamsSchema – rejects invalid", () => {
  it("rejects unknown category", () => {
    const r = searchParamsSchema.safeParse({ category: "not-a-key" });
    expect(r.success).toBe(false);
  });

  it("rejects unknown city", () => {
    const r = searchParamsSchema.safeParse({ city: "HCMC" });
    expect(r.success).toBe(false);
  });

  it("rejects unknown service", () => {
    const r = searchParamsSchema.safeParse({ service: "super-ship" });
    expect(r.success).toBe(false);
  });

  it("rejects unknown sort", () => {
    const r = searchParamsSchema.safeParse({ sort: "oldest" });
    expect(r.success).toBe(false);
  });

  it("rejects non-positive priceMin", () => {
    const r = searchParamsSchema.safeParse({ priceMin: "0" });
    expect(r.success).toBe(false);
  });

  it("rejects negative priceMax", () => {
    const r = searchParamsSchema.safeParse({ priceMax: "-100" });
    expect(r.success).toBe(false);
  });

  it("rejects rating out of 3..5 range", () => {
    expect(searchParamsSchema.safeParse({ rating: "2" }).success).toBe(false);
    expect(searchParamsSchema.safeParse({ rating: "6" }).success).toBe(false);
  });

  it("rejects non-integer page", () => {
    const r = searchParamsSchema.safeParse({ page: "1.5" });
    expect(r.success).toBe(false);
  });
});
