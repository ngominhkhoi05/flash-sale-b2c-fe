"use client";

/**
 * SearchFilterSidebar – sidebar filter tinh gọn cho /search.
 *
 * Cấu trúc 3 bộ lọc cốt lõi:
 *   1. Danh mục sản phẩm (Subcategories - checkbox)
 *   2. Khoảng giá (Price range - min/max)
 *   3. Đánh giá (Rating - radio)
 *   4. Xóa tất cả bộ lọc (Clear all)
 *
 * Props:
 *   - facets: count cho mỗi filter (danh mục thật, đánh giá thật)
 *   - current: filter hiện tại
 */

import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import type { SearchFacets, SearchFilters } from "@/features/search/types";
import { cn } from "@/lib/utils";

const RATING_VALUES = [5, 4, 3] as const;

export interface SearchFilterSidebarProps {
  facets: SearchFacets;
  current: SearchFilters;
  className?: string;
}

export function SearchFilterSidebar({
  facets,
  current,
  className,
}: SearchFilterSidebarProps) {
  const t = useTranslations("storefront.search.filter");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Local state for price inputs (commit on Apply button).
  const [priceMin, setPriceMin] = useState<string>(
    current.priceMin?.toString() ?? "",
  );
  const [priceMax, setPriceMax] = useState<string>(
    current.priceMax?.toString() ?? "",
  );

  /** Build new URLSearchParams từ current + patch. */
  const buildHref = useCallback(
    (patch: Record<string, string | string[] | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === null) {
          next.delete(key);
        } else if (Array.isArray(value)) {
          next.delete(key);
          for (const v of value) next.append(key, v);
        } else if (value === "") {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      }
      // Reset về page 1 khi filter thay đổi.
      next.delete("page");
      return `/search?${next.toString()}`;
    },
    [searchParams],
  );

  const navigate = useCallback(
    (href: string) => {
      startTransition(() => router.push(href));
    },
    [router],
  );

  const toggleCategory = (value: string) => {
    const arr = current.categories ?? [];
    const next = arr.includes(value)
      ? arr.filter((v) => v !== value)
      : [...arr, value];
    navigate(buildHref({ category: next.length > 0 ? next : null }));
  };

  const setMinRating = (rating: 5 | 4 | 3 | null) => {
    navigate(buildHref({ rating: rating ? rating.toString() : null }));
  };

  const applyPrice = (e: React.FormEvent) => {
    e.preventDefault();
    let minVal = priceMin ? parseInt(priceMin.replace(/\D/g, ""), 10) : undefined;
    let maxVal = priceMax ? parseInt(priceMax.replace(/\D/g, ""), 10) : undefined;

    // Tự động hoán đổi nếu nhập min > max
    if (minVal !== undefined && maxVal !== undefined && minVal > maxVal) {
      const temp = minVal;
      minVal = maxVal;
      maxVal = temp;
      setPriceMin(String(minVal));
      setPriceMax(String(maxVal));
    }

    navigate(
      buildHref({
        priceMin: minVal ? minVal.toString() : null,
        priceMax: maxVal ? maxVal.toString() : null,
      }),
    );
  };

  const clearAll = () => {
    const q = searchParams.get("q");
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  };

  return (
    <aside
      className={cn(
        "flex flex-col gap-4 rounded-xl border border-line bg-card p-4 shadow-sm",
        className,
      )}
      data-testid="search-filter-sidebar"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line pb-2">
        <h2 className="flex items-center gap-1 text-lg font-semibold text-ink">
          <MaterialSymbol name="tune" size="xl" className="text-primary" />
          {t("title")}
        </h2>
        <button
          type="button"
          onClick={() => navigate(buildHref({ sort: null }))}
          className="text-xs font-semibold text-primary hover:underline"
        >
          {t("reset")}
        </button>
      </div>

      {/* 1. Danh mục sản phẩm (Dynamic Categories from Facets) */}
      <Section title={t("subcategory")}>
        {facets.subcategories && facets.subcategories.length > 0 ? (
          facets.subcategories.map((f) => {
            const checked = current.categories?.includes(f.key) ?? false;
            // Ưu tiên hiển thị f.label từ Backend, nếu không có thì thử translation
            let label = f.label;
            if (!label || label === f.key) {
              try {
                label = t(`subcategoryOptions.${f.key}` as Parameters<typeof t>[0]);
              } catch {
                label = f.key;
              }
            }

            return (
              <label
                key={f.key}
                className="flex cursor-pointer items-center justify-between gap-1 text-sm text-ink hover:text-primary"
              >
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded text-primary accent-primary"
                    checked={checked}
                    onChange={() => toggleCategory(f.key)}
                  />
                  <span>{label}</span>
                </span>
                <span className="text-xs text-outline">{f.count}</span>
              </label>
            );
          })
        ) : (
          <p className="text-xs text-outline">Không có danh mục phù hợp</p>
        )}
      </Section>

      {/* 2. Khoảng giá (Price Range) */}
      <Section title={t("price")}>
        <form
          onSubmit={applyPrice}
          className="flex flex-col gap-2"
          aria-label="price"
        >
          <div className="flex items-center gap-1">
            <input
              type="text"
              inputMode="numeric"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value.replace(/\D/g, ""))}
              placeholder={t("pricePlaceholderMin")}
              className="h-9 w-full rounded-lg bg-page px-2 text-center text-sm text-ink focus:bg-surface-container focus:outline-none"
            />
            <span className="text-sm text-outline">-</span>
            <input
              type="text"
              inputMode="numeric"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value.replace(/\D/g, ""))}
              placeholder={t("pricePlaceholderMax")}
              className="h-9 w-full rounded-lg bg-page px-2 text-center text-sm text-ink focus:bg-surface-container focus:outline-none"
            />
          </div>
          <Button type="submit" variant="primary" size="sm">
            {t("priceApply")}
          </Button>
        </form>
      </Section>

      {/* 3. Đánh giá (Rating) */}
      <Section title={t("rating")}>
        {RATING_VALUES.map((r) => {
          const checked = current.minRating === r;
          const facet = facets.ratings?.find((f) => f.key === String(r));
          return (
            <button
              key={r}
              type="button"
              onClick={() => setMinRating(checked ? null : r)}
              className={cn(
                "flex w-full items-center justify-between text-left text-sm hover:text-primary",
                checked ? "font-medium text-primary" : "text-ink-2",
              )}
            >
              <span className="flex items-center gap-1">
                <span className="flex text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-4 w-4",
                        i < r ? "fill-amber-500" : "fill-transparent text-outline",
                      )}
                      aria-hidden
                    />
                  ))}
                </span>
                <span>
                  {r === 5
                    ? t("ratingFive")
                    : r === 4
                      ? t("ratingFour")
                      : t("ratingThree")}
                </span>
              </span>
              {facet && facet.count > 0 && (
                <span className="text-xs text-outline">{facet.count}</span>
              )}
            </button>
          );
        })}
      </Section>

      {/* 4. Xóa tất cả bộ lọc */}
      <div className="pt-2">
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={clearAll}
          className="w-full"
          disabled={isPending}
        >
          <MaterialSymbol name="restart_alt" size="sm" />
          {t("clearAll")}
        </Button>
      </div>
    </aside>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 border-t border-line pt-3 first:border-t-0 first:pt-0">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-ink">
        {title}
      </h3>
      <div className="mt-1 flex flex-col gap-1.5">{children}</div>
    </div>
  );
}
