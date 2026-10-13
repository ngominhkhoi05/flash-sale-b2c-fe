/**
 * Search feature – React Query hooks.
 *
 * Plan: docs/superpowers/plans/2026-10-13-search-page-ui-stitch.md (Subplan A)
 */

"use client";

import {
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

import { searchProducts } from "./api";
import {
  DEFAULT_SEARCH_PAGE,
  DEFAULT_SEARCH_SORT,
  type SearchQuery,
  type SearchResult,
} from "./types";

/** Query key factory – xem rule `api-data.mdc` §3. */
export const searchKeys = {
  all: ["search"] as const,
  results: (query: SearchQuery) =>
    [
      ...searchKeys.all,
      "results",
      {
        q: query.q,
        filters: query.filters,
        sort: query.sort,
        page: query.page,
      },
    ] as const,
};

/** Hook: lấy kết quả search theo `query` (đã chuẩn hoá). */
export function useSearchProducts(
  query: SearchQuery,
  options?: Omit<UseQueryOptions<SearchResult, Error>, "queryKey" | "queryFn">,
) {
  return useQuery<SearchResult, Error>({
    queryKey: searchKeys.results(query),
    queryFn: () => searchProducts(query),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    ...options,
  });
}

/** Hook: chuẩn hoá & gộp searchQuery từ URL. */
export function useSearchQuery(input: {
  q: string;
  filters?: SearchQuery["filters"];
  sort?: SearchQuery["sort"];
  page?: number;
}): SearchQuery {
  return useMemo(
    () => ({
      q: input.q,
      filters: input.filters ?? {},
      sort: input.sort ?? DEFAULT_SEARCH_SORT,
      page: input.page ?? DEFAULT_SEARCH_PAGE,
    }),
    [input.q, input.filters, input.sort, input.page],
  );
}

/** Hook: prefetch page kế tiếp (UX mượt khi bấm "Sau"). */
export function usePrefetchNextPage(currentQuery: SearchQuery) {
  const qc = useQueryClient();
  return useCallback(() => {
    const nextQuery: SearchQuery = {
      ...currentQuery,
      page: (currentQuery.page ?? DEFAULT_SEARCH_PAGE) + 1,
    };
    void qc.prefetchQuery({
      queryKey: searchKeys.results(nextQuery),
      queryFn: () => searchProducts(nextQuery),
    });
  }, [qc, currentQuery]);
}
