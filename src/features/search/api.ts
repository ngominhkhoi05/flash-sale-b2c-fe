/**
 * Search feature – API layer.
 *
 * Wire to backend `GET /api/v1/products/search` (added in this plan).
 * Falls back to local mock when `NEXT_PUBLIC_USE_MOCK === "true"` (dev only).
 *
 * Plan: docs/superpowers/plans/2026-10-18-search-endpoint-be-wire-fe.md
 */

import { apiFetch } from "@/lib/api";
import { MOCK_SEARCH_ITEMS, MOCK_SEARCH_FACETS, MOCK_SEARCH_MALL } from "./mocks";
import {
  DEFAULT_SEARCH_PAGE,
  DEFAULT_SEARCH_PAGE_SIZE,
  DEFAULT_SEARCH_SORT,
  type SearchQuery,
  type SearchResult,
  type SearchSortKey,
} from "./types";

/** Tính giá trị dùng cho pagination ở client (BE sẽ trả total). */
export const TOTAL_PAGES_MOCK = 42;

/**
 * searchProducts – entry chính cho SearchPage.
 *
 * @param query – `q`, `filters`, `sort`, `page` đã chuẩn hoá từ URL.
 *                `page` is 1-based on the FE side; converted to 0-based
 *                before being sent to the BE.
 * @returns `SearchResult` (items + total + facets + optional mall).
 *
 * Branch:
 *  - `NEXT_PUBLIC_USE_MOCK === "true"` → local mock (dev only).
 *  - Ngược lại → gọi `apiFetch('/api/v1/products/search', ...)`.
 */
export async function searchProducts(query: SearchQuery): Promise<SearchResult> {
  if (process.env.NEXT_PUBLIC_USE_MOCK === "true") {
    return searchProductsMock(query);
  }
  return searchProductsApi(query);
}

/** Build URL query string from a SearchQuery. Exported for unit tests. */
export function buildSearchQueryString(query: SearchQuery): string {
  const params = new URLSearchParams();

  if (query.q) params.set("q", query.q);
  if (query.filters.categories?.length) {
    for (const c of query.filters.categories) params.append("subcategory", c);
  }
  if (query.filters.cities?.length) {
    for (const c of query.filters.cities) params.append("city", c);
  }
  if (query.filters.services?.length) {
    for (const s of query.filters.services) params.append("service", s);
  }
  if (query.filters.priceMin !== undefined) {
    params.set("priceMin", String(query.filters.priceMin));
  }
  if (query.filters.priceMax !== undefined) {
    params.set("priceMax", String(query.filters.priceMax));
  }
  if (query.filters.minRating !== undefined) {
    params.set("rating", String(query.filters.minRating));
  }
  params.set("sort", query.sort ?? DEFAULT_SEARCH_SORT);
  // Page conversion: FE 1-based → BE 0-based
  params.set("page", String((query.page ?? DEFAULT_SEARCH_PAGE) - 1));
  params.set("size", String(DEFAULT_SEARCH_PAGE_SIZE));

  return params.toString();
}

/** Real BE call. */
async function searchProductsApi(query: SearchQuery): Promise<SearchResult> {
  const qs = buildSearchQueryString(query);
  const data = await apiFetch<SearchResponseEnvelope>(
    `/api/v1/products/search?${qs}`,
  );
  return {
    items: data.items,
    total: data.total,
    page: data.page + 1, // convert BE 0-based back to FE 1-based
    pageSize: data.pageSize,
    facets: data.facets,
  };
}

/** Minimal shape we read off the BE response. Backend may add fields we ignore. */
type SearchResponseEnvelope = {
  items: SearchResult["items"];
  total: number;
  page: number;
  pageSize: number;
  facets: SearchResult["facets"];
  mall?: SearchResult["mall"];
};

/** Local mock: lọc/sort/page trên 20 items Stitch. */
async function searchProductsMock(query: SearchQuery): Promise<SearchResult> {
  // Simulate network latency 200ms để skeleton hiển thị (dev UX).
  await new Promise((r) => setTimeout(r, 200));

  let items = [...MOCK_SEARCH_ITEMS];

  // Filter theo services
  if (query.filters.services?.includes("freeship")) {
    items = items.filter((it) => it.voucherLabel === "Freeship");
  }
  if (query.filters.services?.includes("voucher")) {
    items = items.filter((it) => it.voucherLabel?.startsWith("Giảm"));
  }

  // Filter theo khoảng giá
  if (query.filters.priceMin !== undefined) {
    items = items.filter((it) => it.price >= query.filters.priceMin!);
  }
  if (query.filters.priceMax !== undefined) {
    items = items.filter((it) => it.price <= query.filters.priceMax!);
  }

  // Filter theo rating tối thiểu
  if (query.filters.minRating !== undefined) {
    items = items.filter((it) => (it.rating ?? 0) >= query.filters.minRating!);
  }

  // Sort
  items = sortItems(items, query.sort);

  const page = query.page || DEFAULT_SEARCH_PAGE;
  const pageSize = DEFAULT_SEARCH_PAGE_SIZE;
  const start = (page - 1) * pageSize;
  const paged = items.slice(start, start + pageSize);

  return {
    items: paged,
    total: items.length > 0 ? Math.max(items.length, TOTAL_PAGES_MOCK * pageSize) : 0,
    page,
    pageSize,
    facets: MOCK_SEARCH_FACETS,
    mall: MOCK_SEARCH_MALL,
  };
}

function sortItems<T extends { price: number; totalSold?: number; rating?: number }>(
  items: T[],
  sort: SearchSortKey,
): T[] {
  const copy = [...items];
  switch (sort) {
    case "price_asc":
      return copy.sort((a, b) => a.price - b.price);
    case "price_desc":
      return copy.sort((a, b) => b.price - a.price);
    case "best_selling":
      return copy.sort((a, b) => (b.totalSold ?? 0) - (a.totalSold ?? 0));
    case "newest":
      // Không có createdAt trong mock → giữ nguyên thứ tự
      return copy;
    case "relevance":
    default:
      return copy;
  }
}

/**
 * Re-export cho test/legacy — không nên dùng ngoài feature.
 */
export const __searchInternals = {
  DEFAULT_SEARCH_SORT,
  DEFAULT_SEARCH_PAGE,
  DEFAULT_SEARCH_PAGE_SIZE,
};

