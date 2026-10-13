"use client";

/**
 * SearchEmptyState – hiển thị khi `total === 0` (kết quả rỗng).
 *
 * Stitch: search_off icon + title + description + 2 action buttons +
 * "Gợi ý từ khóa tìm kiếm phổ biến" chips.
 */

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Home, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { MOCK_SUGGESTED_KEYWORDS } from "@/features/search/mocks";
import { cn } from "@/lib/utils";

export interface SearchEmptyStateProps {
  query: string;
  onClearFilters?: () => void;
  className?: string;
}

export function SearchEmptyState({
  query,
  onClearFilters,
  className,
}: SearchEmptyStateProps) {
  const t = useTranslations("storefront.search.empty");
  const router = useRouter();

  const onKeywordClick = (kw: string) => {
    router.push(`/search?q=${encodeURIComponent(kw)}`);
  };

  return (
    <section
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-line bg-card px-4 py-12 text-center shadow-sm",
        className,
      )}
      data-testid="search-empty-state"
    >
      <div className="relative mb-4 flex h-28 w-28 items-center justify-center rounded-full bg-surface-container-high">
        <MaterialSymbol
          name="search_off"
          size="[64px]"
          className="text-primary"
        />
        <span className="absolute -bottom-1 -right-1 rounded-full bg-card p-1 text-sale shadow-sm">
          <MaterialSymbol name="error" size="[24px]" />
        </span>
      </div>
      <h2 className="mb-1 text-2xl font-bold tracking-tight text-ink">
        {t("title")}
      </h2>
      <p className="mb-6 max-w-lg text-sm leading-relaxed text-ink-2">
        {t("description")}
      </p>
      <div className="mb-8 flex flex-col items-center gap-3 sm:flex-row">
        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={onClearFilters}
        >
          <MaterialSymbol name="filter_alt_off" size="lg" />
          {t("clearFilters")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={() => router.push("/")}
        >
          <Home className="h-5 w-5" aria-hidden />
          {t("goHome")}
        </Button>
      </div>
      <div className="flex w-full max-w-xl flex-col items-center gap-2 rounded-xl bg-page p-4 pt-3">
        <span className="flex items-center gap-1 text-sm font-medium text-ink-2">
          <TrendingUp className="h-4 w-4 text-primary" aria-hidden />
          {t("suggestedLabel")}
        </span>
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {MOCK_SUGGESTED_KEYWORDS.map((kw) => (
            <button
              key={kw}
              type="button"
              onClick={() => onKeywordClick(kw)}
              className="rounded-full bg-card px-3 py-1 text-xs font-semibold text-ink shadow-xs transition-colors hover:bg-primary-fixed"
            >
              {kw}
            </button>
          ))}
        </div>
        {query && (
          <p className="mt-2 text-xs text-outline">
            Từ khóa hiện tại: <strong>{query}</strong>
          </p>
        )}
      </div>
    </section>
  );
}
