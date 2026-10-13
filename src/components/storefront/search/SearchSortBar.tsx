"use client";

/**
 * SearchSortBar – thanh sắp xếp + mini pagination.
 *
 * Stitch: "Sắp xếp theo: [Liên quan] [Mới nhất] [Bán chạy] [Giá: ▼]"
 * + mini pagination 1/42 ‹ ›
 */

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

import { cn } from "@/lib/utils";

import type { SearchSortKey } from "@/features/search/types";

const SORT_OPTIONS: Array<{ key: SearchSortKey; i18nKey: string }> = [
  { key: "relevance", i18nKey: "relevance" },
  { key: "newest", i18nKey: "newest" },
  { key: "best_selling", i18nKey: "best_selling" },
  { key: "price_asc", i18nKey: "price_asc" },
  { key: "price_desc", i18nKey: "price_desc" },
];

export interface SearchSortBarProps {
  currentSort: SearchSortKey;
  page: number;
  totalPages: number;
  className?: string;
}

export function SearchSortBar({
  currentSort,
  page,
  totalPages,
  className,
}: SearchSortBarProps) {
  const t = useTranslations("storefront.search.sort");
  const tp = useTranslations("storefront.search.pagination");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const setSort = useCallback(
    (sort: SearchSortKey) => {
      const next = new URLSearchParams(searchParams.toString());
      if (sort === "relevance") {
        next.delete("sort");
      } else {
        next.set("sort", sort);
      }
      next.delete("page");
      startTransition(() => {
        router.push(`/search?${next.toString()}`);
      });
    },
    [router, searchParams],
  );

  const goToPage = useCallback(
    (target: number) => {
      const next = new URLSearchParams(searchParams.toString());
      if (target <= 1) {
        next.delete("page");
      } else {
        next.set("page", target.toString());
      }
      startTransition(() => {
        router.push(`/search?${next.toString()}`);
      });
    },
    [router, searchParams],
  );

  const isFirst = page <= 1;
  const isLast = page >= totalPages;

  return (
    <div
      className={cn(
        "flex flex-col items-stretch justify-between gap-2 rounded-xl border border-line bg-card p-3 shadow-sm sm:flex-row sm:items-center sm:px-4",
        className,
      )}
      data-testid="search-sort-bar"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="shrink-0 text-sm text-ink-2">{t("label")}</span>
        {SORT_OPTIONS.map((opt) => {
          const active = currentSort === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => setSort(opt.key)}
              disabled={isPending}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-white shadow-xs"
                  : "bg-page text-ink-2 hover:text-ink",
              )}
            >
              {t(opt.i18nKey as Parameters<typeof t>[0])}
            </button>
          );
        })}
      </div>

      {/* Mini pagination */}
      <div className="flex shrink-0 items-center justify-end gap-1 text-sm">
        <span className="font-semibold text-primary">{page}</span>
        <span className="text-outline">/</span>
        <span className="text-ink-2">{totalPages}</span>
        <div className="ml-2 flex items-center gap-1">
          <button
            type="button"
            onClick={() => goToPage(page - 1)}
            disabled={isFirst || isPending}
            aria-label={tp("previous")}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-page text-outline disabled:cursor-not-allowed enabled:hover:bg-surface-container-high enabled:text-ink"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => goToPage(page + 1)}
            disabled={isLast || isPending}
            aria-label={tp("next")}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-page text-outline-variant hover:bg-surface-container-high hover:text-ink disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
