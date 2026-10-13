/**
 * Search feature – API layer.
 *
 * Hiện tại: chỉ hỗ trợ MOCK (mirror `MOCK_SEARCH_RESULT`).
 * Khi BE sẵn sàng (xem `docs/api-document.md` mục search), sửa `searchProducts`
 * để gọi `apiFetch('/products/search', { query: ... })`.
 *
 * Plan: docs/superpowers/plans/2026-10-13-search-page-ui-stitch.md (Subplan A)
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
 * @returns `SearchResult` (items + total + facets + optional mall).
 *
 * Branch:
 *  - `NEXT_PUBLIC_USE_MOCK === "true"` → filter/sort/page trên mock data local.
 *    Hỗ trợ dev không cần BE.
 *  - Ngược lại → gọi `apiFetch('/products/search', ...)` (BE TODO).
 */
export async function searchProducts(query: SearchQuery): Promise<SearchResult> {
  if (process.env.NEXT_PUBLIC_USE_MOCK === "true") {
    return searchProductsMock(query);
  }
  // TODO(api): gọi BE thật khi ready.
  // return apiFetch<SearchResult>("/products/search", {
  //   query: {
  //     q: query.q,
  //     page: query.page,
  //     pageSize: DEFAULT_SEARCH_PAGE_SIZE,
  //     sort: query.sort,
  //     ...query.filters,
  //   },
  // });
  return searchProductsMock(query);
}

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

// Silence unused import warning khi BE chưa ready.
// biome-ignore lint/correctness/noUnusedImports: keep apiFetch import để sẵn sàng dùng khi BE ready
void apiFetch;
