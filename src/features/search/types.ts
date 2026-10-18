/**
 * Search feature – types.
 *
 * Mirror BE `GET /api/v1/products/search` response shape.
 * Items use `RecommendedProductResponse` (same as `/api/v1/products/recommended`)
 * so the FE can render storefront `ProductCard` directly.
 *
 * Stitch reference: docs/superpowers/handoffs/tim-kiem-san-pham.md
 * Plan: docs/superpowers/plans/2026-10-13-search-page-ui-stitch.md (Subplan A)
 * Plan: docs/superpowers/plans/2026-10-18-search-endpoint-be-wire-fe.md
 */

import type { RecommendedProductResponse } from "@/features/homepage/api";

/** Subcategory key cho filter "Danh mục con". */
export type SearchSubcategoryKey =
  | "true-wireless"
  | "over-ear"
  | "sport-waterproof"
  | "gaming-mic"
  | "accessories";

/** Thành phố nơi bán (filter "Nơi bán"). */
export type SearchCityKey = "HCM" | "HN" | "DN" | "BD";

/** Service flag filter. */
export type SearchServiceKey = "flash-sale" | "voucher" | "freeship" | "official";

/** Sort options (theo Stitch sort bar). */
export type SearchSortKey =
  | "relevance"
  | "newest"
  | "best_selling"
  | "price_asc"
  | "price_desc";

/** Tập filter hiện tại. Tất cả optional, URL-driven. */
export interface SearchFilters {
  categories?: SearchSubcategoryKey[];
  cities?: SearchCityKey[];
  priceMin?: number;
  priceMax?: number;
  minRating?: 3 | 4 | 5;
  services?: SearchServiceKey[];
}

/** 1 facet item cho sidebar filter — label + count. */
export interface SearchFacetItem {
  key: string;
  label: string;
  count: number;
}

/** Toàn bộ facet trả về từ API (BE) hoặc compute từ mock. */
export interface SearchFacets {
  subcategories: SearchFacetItem[];
  cities: SearchFacetItem[];
  ratings: SearchFacetItem[];
  services: SearchFacetItem[];
}

/** Mall banner (Sony như Stitch) — hiển thị khi query match brand. */
export interface SearchMall {
  storeId: string;
  name: string;
  initials: string;
  rating: number;
  ratingCountLabel: string;
  responseRate: number;
  productCount: number;
  badgeLabel: string;
  isOfficial: boolean;
  highlights: MallHighlightProduct[];
}

export interface MallHighlightProduct {
  id: string;
  name: string;
  imageUrl: string;
  imageAlt: string;
  price: number;
}

/** Kết quả search 1 page. */
export interface SearchResult {
  items: RecommendedProductResponse[];
  total: number;
  page: number;
  pageSize: number;
  facets: SearchFacets;
  mall?: SearchMall;
}

/** Query input — chuẩn hoá từ URL. */
export interface SearchQuery {
  q: string;
  filters: SearchFilters;
  sort: SearchSortKey;
  page: number;
}

/** Default sort + page khi URL không chỉ định. */
export const DEFAULT_SEARCH_SORT: SearchSortKey = "relevance";
export const DEFAULT_SEARCH_PAGE = 1;
export const DEFAULT_SEARCH_PAGE_SIZE = 20;
