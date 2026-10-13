"use client";

/**
 * SearchFilterSidebar – sidebar filter cho /search.
 *
 * Mỗi filter là một form `<form>` riêng để submit URL params qua `useRouter`.
 * Cấu trúc:
 *   1. Subcategories (checkbox)
 *   2. Cities (checkbox)
 *   3. Price range (min/max)
 *   4. Rating (radio)
 *   5. Services (checkbox)
 *   6. Clear all (ghost)
 *
 * Props:
 *   - facets: count cho mỗi filter (để hiển thị số)
 *   - current: filter hiện tại (để check default checkbox)
 *   - onFilterChange: callback khi user thay đổi (để parent navigate)
 *
 * Plan: docs/superpowers/plans/2026-10-13-search-page-ui-stitch.md (Subplan B)
 */

import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import type { SearchFacets, SearchFilters } from "@/features/search/types";
import { cn } from "@/lib/utils";

const CITY_KEYS = ["HCM", "HN", "DN", "BD"] as const;

const SERVICE_KEYS = ["flash-sale", "voucher", "freeship", "official"] as const;

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

  const toggleArray = (
    key: "category" | "city" | "service",
    value: string,
    currentArray: string[] | undefined,
  ) => {
    const arr = currentArray ?? [];
    const next = arr.includes(value)
      ? arr.filter((v) => v !== value)
      : [...arr, value];
    navigate(buildHref({ [key]: next.length > 0 ? next : null }));
  };

  const setMinRating = (rating: 5 | 4 | 3 | null) => {
    navigate(buildHref({ rating: rating ? rating.toString() : null }));
  };

  const applyPrice = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(
      buildHref({
        priceMin: priceMin || null,
        priceMax: priceMax || null,
      }),
    );
  };

  const clearAll = () => {
    navigate("/search");
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

      {/* 1. Subcategories */}
      <Section title={t("subcategory")}>
        {facets.subcategories.map((f) => {
          const checked =
            current.categories?.includes(
              f.key as (typeof current.categories)[number],
            ) ?? false;
          return (
            <label
              key={f.key}
              className="flex cursor-pointer items-center justify-between gap-1 text-sm text-ink hover:text-primary"
            >
              <span className="flex items-center gap-1">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded text-primary accent-primary"
                  checked={checked}
                  onChange={() =>
                    toggleArray("category", f.key, current.categories)
                  }
                />
                {t(`subcategoryOptions.${f.key}` as const)}
              </span>
              <span className="text-xs text-outline">{f.count}</span>
            </label>
          );
        })}
      </Section>

      {/* 2. Cities */}
      <Section title={t("city")}>
        {CITY_KEYS.map((c) => {
          const checked = current.cities?.includes(c) ?? false;
          const facet = facets.cities.find((f) => f.key === c);
          return (
            <label
              key={c}
              className="flex cursor-pointer items-center gap-1 text-sm text-ink hover:text-primary"
            >
              <input
                type="checkbox"
                className="h-4 w-4 rounded text-primary accent-primary"
                checked={checked}
                onChange={() => toggleArray("city", c, current.cities)}
              />
              {t(`cityOptions.${c}` as const)}
              {facet && (
                <span className="ml-auto text-xs text-outline">
                  {facet.count}
                </span>
              )}
            </label>
          );
        })}
      </Section>

      {/* 3. Price range */}
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
              onChange={(e) => setPriceMin(e.target.value)}
              placeholder={t("pricePlaceholderMin")}
              className="h-9 w-full rounded-lg bg-page px-2 text-center text-sm text-ink focus:bg-surface-container focus:outline-none"
            />
            <span className="text-sm text-outline">-</span>
            <input
              type="text"
              inputMode="numeric"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              placeholder={t("pricePlaceholderMax")}
              className="h-9 w-full rounded-lg bg-page px-2 text-center text-sm text-ink focus:bg-surface-container focus:outline-none"
            />
          </div>
          <Button type="submit" variant="primary" size="sm">
            {t("priceApply")}
          </Button>
        </form>
      </Section>

      {/* 4. Rating */}
      <Section title={t("rating")}>
        {RATING_VALUES.map((r) => {
          const checked = current.minRating === r;
          return (
            <button
              key={r}
              type="button"
              onClick={() => setMinRating(checked ? null : r)}
              className={cn(
                "flex items-center gap-1 text-left text-sm hover:text-primary",
                checked ? "text-primary" : "text-ink-2",
              )}
            >
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
              {r === 5
                ? t("ratingFive")
                : r === 4
                  ? t("ratingFour")
                  : t("ratingThree")}
            </button>
          );
        })}
      </Section>

      {/* 5. Services */}
      <Section title={t("services")}>
        {SERVICE_KEYS.map((s) => {
          const checked = current.services?.includes(s) ?? false;
          const iconName =
            s === "flash-sale"
              ? "bolt"
              : s === "voucher"
                ? "confirmation_number"
                : s === "freeship"
                  ? "local_shipping"
                  : "verified";
          const iconColor =
            s === "flash-sale"
              ? "text-sale"
              : s === "voucher"
                ? "text-primary"
                : s === "freeship"
                  ? "text-seller"
                  : "text-primary";
          return (
            <label
              key={s}
              className={cn("group flex cursor-pointer items-center gap-1 text-sm text-ink hover:text-primary")}
            >
              <input
                type="checkbox"
                className="h-4 w-4 rounded accent-primary"
                checked={checked}
                onChange={() => toggleArray("service", s, current.services)}
              />
              <span className="flex items-center gap-1">
                <MaterialSymbol
                  name={iconName}
                  size="base"
                  className={cn(iconColor)}
                  fill={s === "flash-sale" ? true : undefined}
                />
                {t(`serviceOptions.${s}` as const)}
              </span>
            </label>
          );
        })}
      </Section>

      {/* Clear all */}
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
