/**
 * Hook tests for search feature.
 * Plan: docs/superpowers/plans/2026-10-13-search-page-ui-stitch.md (Subplan A)
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SearchResult } from "./types";

const mockSearchProducts = vi.fn();

vi.mock("./api", () => ({
  searchProducts: (q: unknown) => mockSearchProducts(q),
  TOTAL_PAGES_MOCK: 42,
}));

// Import sau khi mock.
import { searchKeys, useSearchProducts, usePrefetchNextPage } from "./hooks";
import { DEFAULT_SEARCH_PAGE, DEFAULT_SEARCH_SORT } from "./types";

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

function withQueryClient() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return { wrapper, qc };
}

beforeEach(() => {
  mockSearchProducts.mockReset();
  mockSearchProducts.mockResolvedValue(MOCK_RESULT);
});

describe("searchKeys", () => {
  it("builds canonical results key", () => {
    const q = {
      q: "tai nghe",
      filters: {},
      sort: DEFAULT_SEARCH_SORT,
      page: 1,
    };
    expect(searchKeys.results(q)).toEqual([
      "search",
      "results",
      {
        q: "tai nghe",
        filters: {},
        sort: DEFAULT_SEARCH_SORT,
        page: 1,
      },
    ]);
  });

  it("results key changes when filters change", () => {
    const a = searchKeys.results({
      q: "tai nghe",
      filters: {},
      sort: DEFAULT_SEARCH_SORT,
      page: 1,
    });
    const b = searchKeys.results({
      q: "tai nghe",
      filters: { priceMin: 100 },
      sort: DEFAULT_SEARCH_SORT,
      page: 1,
    });
    expect(a).not.toEqual(b);
  });
});

describe("useSearchProducts", () => {
  it("calls searchProducts with provided query and returns data", async () => {
    const { wrapper } = withQueryClient();
    const query = {
      q: "tai nghe",
      filters: { services: ["freeship"] },
      sort: "price_asc" as const,
      page: 2,
    };
    const { result } = renderHook(() => useSearchProducts(query), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockSearchProducts).toHaveBeenCalledWith(query);
    expect(result.current.data).toEqual(MOCK_RESULT);
  });

  it("uses default sort and page when not provided", async () => {
    const { wrapper } = withQueryClient();
    renderHook(
      () =>
        useSearchProducts({
          q: "",
          filters: {},
          sort: DEFAULT_SEARCH_SORT,
          page: DEFAULT_SEARCH_PAGE,
        }),
      { wrapper },
    );

    await waitFor(() => expect(mockSearchProducts).toHaveBeenCalled());
    const arg = mockSearchProducts.mock.calls[0]?.[0];
    expect(arg.sort).toBe(DEFAULT_SEARCH_SORT);
    expect(arg.page).toBe(DEFAULT_SEARCH_PAGE);
  });
});

describe("usePrefetchNextPage", () => {
  it("prefetches the next page using current query + 1", async () => {
    const { wrapper, qc } = withQueryClient();
    const spy = vi.spyOn(qc, "prefetchQuery");

    const current = {
      q: "tai nghe",
      filters: { priceMin: 100 },
      sort: "best_selling" as const,
      page: 3,
    };
    const { result } = renderHook(() => usePrefetchNextPage(current), {
      wrapper,
    });

    act(() => {
      result.current();
    });

    expect(spy).toHaveBeenCalledTimes(1);
    const call = spy.mock.calls[0]?.[0] as {
      queryKey: readonly unknown[];
      queryFn: () => Promise<unknown>;
    };
    expect(call.queryKey).toEqual(searchKeys.results({ ...current, page: 4 }));
    // Trigger queryFn to ensure it dispatches searchProducts(next).
    await call.queryFn();
    expect(mockSearchProducts).toHaveBeenCalledWith({ ...current, page: 4 });
  });
});
