/**
 * /search – Trang tìm kiếm sản phẩm (Storefront).
 *
 * Server Component:
 *  - Đọc `searchParams` (async, Next 16) → validate qua Zod.
 *  - Chuẩn hoá → SearchQuery.
 *  - Gọi `searchProducts(query)` (mock hoặc BE).
 *  - Pass xuống `SearchPageContent` (Client Component) để render.
 *
 * Plan: docs/superpowers/plans/2026-10-13-search-page-ui-stitch.md (Subplan B)
 */

import { Suspense } from "react";

import {
  SearchBreadcrumb,
  SearchPageContent,
} from "@/components/storefront/search";
import {
  searchProducts,
  type SearchQuery,
} from "@/features/search";
import {
  DEFAULT_SEARCH_PAGE,
  DEFAULT_SEARCH_PAGE_SIZE,
  DEFAULT_SEARCH_SORT,
} from "@/features/search/types";
import { normalizeRawSearchParams, searchParamsSchema, toSearchFilters } from "@/features/search/schemas";

export const metadata = {
  title: "Tìm kiếm sản phẩm | Vibe Mart",
  description:
    "Tìm kiếm sản phẩm theo từ khoá, danh mục, khoảng giá, đánh giá và các dịch vụ đi kèm trên Vibe Mart.",
};

export const dynamic = "force-dynamic";

interface SearchPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  // 1. Chuẩn hoá + validate URL params
  const raw = normalizeRawSearchParams(await searchParams);
  const parsed = searchParamsSchema.parse(raw);

  // 2. Build SearchQuery chuẩn hoá
  const query: SearchQuery = {
    q: parsed.q,
    filters: toSearchFilters(parsed),
    sort: parsed.sort ?? DEFAULT_SEARCH_SORT,
    page: parsed.page ?? DEFAULT_SEARCH_PAGE,
  };

  // 3. Fetch result (mock hoặc BE tuỳ env)
  let result = null;
  let isError = false;
  try {
    result = await searchProducts(query);
  } catch (err) {
    console.error("[search.page] searchProducts failed", err);
    isError = true;
  }

  // 4. Tính totalPages
  const totalPages = result
    ? Math.max(1, Math.ceil(result.total / (result.pageSize || DEFAULT_SEARCH_PAGE_SIZE)))
    : 1;

  return (
    <main className="mx-auto w-full max-w-[1240px] px-4 py-6 lg:px-8">
      <div className="flex flex-col gap-6">
        <SearchBreadcrumb query={query.q} />
        <Suspense>
          <SearchPageContent
            query={query}
            result={result}
            isLoading={false}
            isError={isError}
            totalPages={totalPages}
          />
        </Suspense>
      </div>
    </main>
  );
}
