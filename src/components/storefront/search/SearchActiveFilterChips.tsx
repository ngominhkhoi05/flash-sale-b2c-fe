"use client";

/**
 * SearchActiveFilterChips – các chip filter đang active.
 *
 * Stitch: "Đang lọc: [TP.HCM ✕] [True Wireless ✕] [200.000 - 1.500.000 ✕] [⚡ Flash Sale ✕]"
 * + "Xóa tất cả" ở cuối.
 *
 * Click ✕ → navigate URL bỏ filter đó.
 */

import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

import { MaterialSymbol } from "@/components/ui/material-symbol";
import { formatVND } from "@/lib/format";
import { cn } from "@/lib/utils";

import type { SearchFilters } from "@/features/search/types";

const SUBCATEGORY_LABEL_KEYS = {
  "true-wireless": "filter.subcategoryOptions.true-wireless",
  "over-ear": "filter.subcategoryOptions.over-ear",
  "sport-waterproof": "filter.subcategoryOptions.sport-waterproof",
  "gaming-mic": "filter.subcategoryOptions.gaming-mic",
  accessories: "filter.subcategoryOptions.accessories",
} as const;

const CITY_LABEL_KEYS = {
  HCM: "filter.cityOptions.HCM",
  HN: "filter.cityOptions.HN",
  DN: "filter.cityOptions.DN",
  BD: "filter.cityOptions.BD",
} as const;

const SERVICE_LABEL_KEYS = {
  "flash-sale": "filter.serviceOptions.flash-sale",
  voucher: "filter.serviceOptions.voucher",
  freeship: "filter.serviceOptions.freeship",
  official: "filter.serviceOptions.official",
} as const;

export interface SearchActiveFilterChipsProps {
  filters: SearchFilters;
  className?: string;
}

export function SearchActiveFilterChips({
  filters,
  className,
}: SearchActiveFilterChipsProps) {
  const t = useTranslations("storefront.search");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const removeParam = useCallback(
    (key: string, value?: string) => {
      const next = new URLSearchParams(searchParams.toString());
      if (key === "all") {
        // Xoá hết filter liên quan: category, city, service, priceMin, priceMax, rating
        next.delete("category");
        next.delete("city");
        next.delete("service");
        next.delete("priceMin");
        next.delete("priceMax");
        next.delete("rating");
      } else if (value && next.getAll(key).length > 1) {
        // Mảng — bỏ phần tử này
        const remaining = next.getAll(key).filter((v) => v !== value);
        next.delete(key);
        for (const v of remaining) next.append(key, v);
      } else {
        next.delete(key);
      }
      next.delete("page");
      startTransition(() => router.push(`/search?${next.toString()}`));
    },
    [router, searchParams],
  );

  const chips: Array<{ key: string; value?: string; label: string; tone?: "sale" | "primary" }> = [];

  filters.categories?.forEach((c) => {
    chips.push({
      key: "category",
      value: c,
      label: t(SUBCATEGORY_LABEL_KEYS[c] as Parameters<typeof t>[0]),
      tone: "primary",
    });
  });

  filters.cities?.forEach((c) => {
    chips.push({
      key: "city",
      value: c,
      label: t(CITY_LABEL_KEYS[c] as Parameters<typeof t>[0]),
      tone: "primary",
    });
  });

  if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    const min = filters.priceMin ? formatVND(filters.priceMin) : "0";
    const max = filters.priceMax ? formatVND(filters.priceMax) : "∞";
    chips.push({
      key: "price",
      label: `${min} - ${max}`,
      tone: "primary",
    });
  }

  if (filters.minRating !== undefined) {
    chips.push({
      key: "rating",
      label:
        filters.minRating === 5
          ? t("filter.ratingFive")
          : filters.minRating === 4
            ? t("filter.ratingFour")
            : t("filter.ratingThree"),
      tone: "primary",
    });
  }

  filters.services?.forEach((s) => {
    chips.push({
      key: "service",
      value: s,
      label: t(SERVICE_LABEL_KEYS[s] as Parameters<typeof t>[0]),
      tone: s === "flash-sale" ? "sale" : "primary",
    });
  });

  if (chips.length === 0) return null;

  return (
    <div
      className={cn("flex flex-wrap items-center gap-1.5", className)}
      data-testid="search-active-chips"
    >
      <span className="shrink-0 text-sm text-outline">
        {t("activeChips.label")}
      </span>
      {chips.map((c) => (
        <span
          key={`${c.key}-${c.value ?? c.label}`}
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold",
            c.tone === "sale"
              ? "bg-tertiary-soft text-on-tertiary"
              : "bg-primary-fixed text-on-primary-fixed-variant",
          )}
        >
          {c.label}
          <button
            type="button"
            onClick={() => removeParam(c.key, c.value)}
            disabled={isPending}
            aria-label={`remove-${c.label}`}
            className="hover:opacity-70"
          >
            <MaterialSymbol name="close" size="[14px]" />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={() => removeParam("all")}
        disabled={isPending}
        className="ml-1 text-xs font-semibold text-primary hover:underline"
      >
        {t("activeChips.clearAll")}
      </button>
    </div>
  );
}
