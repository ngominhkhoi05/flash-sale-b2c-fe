/**
 * Search feature – public surface.
 * Plan: docs/superpowers/plans/2026-10-13-search-page-ui-stitch.md
 */

export * from "./types";
export * from "./schemas";
export {
  searchProducts,
  TOTAL_PAGES_MOCK,
} from "./api";
export {
  useSearchProducts,
  useSearchQuery,
  usePrefetchNextPage,
  searchKeys,
} from "./hooks";
