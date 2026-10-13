"use client";

/**
 * SearchPageContent – composite của tất cả search components.
 *
 * Nhận `query` (đã chuẩn hoá) + `result` từ page (Server Component).
 * Quản lý loading / error / empty state chính.
 *
 * Plan: docs/superpowers/plans/2026-10-13-search-page-ui-stitch.md (Subplan B)
 */

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { ErrorState } from "@/components/common/ErrorState";
import { cn } from "@/lib/utils";

import { SearchActiveFilterChips } from "./SearchActiveFilterChips";
import { SearchEmptyState } from "./SearchEmptyState";
import { SearchFilterSidebar } from "./SearchFilterSidebar";
import { SearchHeading } from "./SearchHeading";
import { SearchMallBanner } from "./SearchMallBanner";
import { SearchPagination } from "./SearchPagination";
import { SearchProductGrid } from "./SearchProductGrid";
import { SearchSortBar } from "./SearchSortBar";
import type { SearchQuery, SearchResult } from "@/features/search/types";

export interface SearchPageContentProps {
  query: SearchQuery;
  result: SearchResult | null;
  isLoading: boolean;
  isError: boolean;
  totalPages: number;
  onRetry?: () => void;
  className?: string;
}

export function SearchPageContent({
  query,
  result,
  isLoading,
  isError,
  totalPages,
  onRetry,
  className,
}: SearchPageContentProps) {
  const t = useTranslations("storefront.search");
  const router = useRouter();

  if (isError) {
    return (
      <ErrorState
        title="Không tải được kết quả"
        message="Vui lòng kiểm tra kết nối mạng và thử lại."
        onRetry={onRetry}
        className="my-8"
      />
    );
  }

  const total = result?.total ?? 0;
  const items = result?.items ?? [];
  const showEmpty = !isLoading && total === 0;

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {/* Heading */}
      <SearchHeading query={query.q} total={total} />

      {/* Mall banner */}
      {result?.mall && !showEmpty && (
        <SearchMallBanner mall={result.mall} />
      )}

      {/* Two-column main */}
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        {/* Sidebar */}
        <SearchFilterSidebar
          facets={result?.facets ?? {
            subcategories: [],
            cities: [],
            ratings: [],
            services: [],
          }}
          current={query.filters}
          className="lg:col-span-3"
        />

        {/* Right column */}
        <section className="flex flex-col gap-4 lg:col-span-9">
          <SearchSortBar
            currentSort={query.sort}
            page={query.page}
            totalPages={totalPages}
          />

          <SearchActiveFilterChips filters={query.filters} />

          {showEmpty ? (
            <SearchEmptyState
              query={query.q}
              onClearFilters={() => router.push("/search")}
            />
          ) : (
            <>
              <SearchProductGrid items={items} isLoading={isLoading} />
              <SearchPagination current={query.page} totalPages={totalPages} />
            </>
          )}
        </section>
      </div>

      {/* Loading hint for screen reader */}
      {isLoading && (
        <span className="sr-only" aria-live="polite">
          {t("loading")}
        </span>
      )}
    </div>
  );
}
