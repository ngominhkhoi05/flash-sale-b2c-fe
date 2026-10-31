"use client";

/**
 * SearchHorizontalFilterBar – Thanh bộ lọc ngang hiện đại cho /search.
 *
 * Thay thế sidebar truyền thống, giải phóng 100% diện tích trang để hiển thị
 * 5 sản phẩm / 1 hàng trên desktop (đồng bộ với /search/image).
 *
 * Bao gồm:
 *   1. Dropdown chọn Danh mục (đa chọn có số lượng count và badge).
 *   2. Dropdown nhập Khoảng giá (min/max + gợi ý khoảng giá + nút Áp dụng).
 *   3. Các chip bấm nhanh Đánh giá sao (5★, 4★+, 3★+).
 *   4. Nút Xóa tất cả bộ lọc (khi có filter đang kích hoạt).
 */

import { ChevronDown, Star, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import type { SearchFacets, SearchFilters } from "@/features/search/types";
import { cn } from "@/lib/utils";

const RATING_VALUES = [5, 4, 3] as const;

export interface SearchHorizontalFilterBarProps {
  facets: SearchFacets;
  current: SearchFilters;
  className?: string;
}

export function SearchHorizontalFilterBar({
  facets,
  current,
  className,
}: SearchHorizontalFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Local state cho form khoảng giá
  const [priceMin, setPriceMin] = useState<string>(
    current.priceMin?.toString() ?? "",
  );
  const [priceMax, setPriceMax] = useState<string>(
    current.priceMax?.toString() ?? "",
  );

  /** Build URLSearchParams mới từ current + patch */
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

  const applyPrice = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let minVal = priceMin ? parseInt(priceMin.replace(/\D/g, ""), 10) : undefined;
    let maxVal = priceMax ? parseInt(priceMax.replace(/\D/g, ""), 10) : undefined;

    // Tự động hoán đổi nếu nhập min > max
    if (minVal !== undefined && maxVal !== undefined && minVal > maxVal) {
      const temp = minVal;
      minVal = maxVal;
      maxVal = temp;
      setPriceMin(minVal.toString());
      setPriceMax(maxVal.toString());
    }

    navigate(
      buildHref({
        priceMin: minVal !== undefined && !isNaN(minVal) ? minVal.toString() : null,
        priceMax: maxVal !== undefined && !isNaN(maxVal) ? maxVal.toString() : null,
      }),
    );
  };

  const clearPrice = () => {
    setPriceMin("");
    setPriceMax("");
    navigate(buildHref({ priceMin: null, priceMax: null }));
  };

  const clearAll = () => {
    setPriceMin("");
    setPriceMax("");
    navigate(
      buildHref({
        category: null,
        priceMin: null,
        priceMax: null,
        rating: null,
      }),
    );
  };

  const hasCategoryFilter = (current.categories?.length ?? 0) > 0;
  const hasPriceFilter = current.priceMin !== undefined || current.priceMax !== undefined;
  const hasRatingFilter = current.minRating !== undefined;
  const hasAnyFilter = hasCategoryFilter || hasPriceFilter || hasRatingFilter;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border border-line bg-card p-3 shadow-sm md:flex-row md:items-center md:justify-between md:px-4",
        className,
      )}
      data-testid="search-horizontal-filter-bar"
    >
      <div className="flex flex-wrap items-center gap-2">
        {/* Label & icon */}
        <div className="flex items-center gap-1.5 pr-1 text-sm font-semibold text-ink">
          <MaterialSymbol name="tune" size="sm" className="text-primary" />
          <span>Bộ lọc:</span>
        </div>

        {/* 1. Dropdown Danh mục */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              disabled={isPending}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                hasCategoryFilter
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-line bg-surface-container-lowest text-ink hover:bg-surface-container-low",
              )}
            >
              <span>Danh mục</span>
              {hasCategoryFilter && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                  {current.categories?.length}
                </span>
              )}
              <ChevronDown className="h-4 w-4 opacity-70" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-72 max-h-80 overflow-y-auto p-2"
          >
            <div className="px-2 py-1 text-xs font-semibold text-ink-3">
              Chọn danh mục sản phẩm
            </div>
            {facets.subcategories.length === 0 ? (
              <div className="px-2 py-3 text-center text-xs text-ink-3">
                Không có danh mục nào
              </div>
            ) : (
              <div className="flex flex-col gap-1 pt-1">
                {facets.subcategories.map((f) => {
                  const checked = current.categories?.includes(f.key) ?? false;
                  return (
                    <label
                      key={f.key}
                      className={cn(
                        "flex cursor-pointer items-center justify-between rounded-md px-2.5 py-1.5 text-sm transition-colors",
                        checked
                          ? "bg-primary/10 font-semibold text-primary"
                          : "text-ink hover:bg-surface-container-low",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCategory(f.key)}
                          className="h-4 w-4 rounded border-line text-primary focus:ring-primary cursor-pointer"
                        />
                        <span>{f.label || f.key}</span>
                      </div>
                      <span className="text-xs text-ink-3">({f.count})</span>
                    </label>
                  );
                })}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 2. Dropdown Khoảng giá */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              disabled={isPending}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                hasPriceFilter
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-line bg-surface-container-lowest text-ink hover:bg-surface-container-low",
              )}
            >
              <span>Khoảng giá</span>
              {hasPriceFilter && (
                <span className="flex h-2 w-2 rounded-full bg-primary" />
              )}
              <ChevronDown className="h-4 w-4 opacity-70" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-80 p-3.5 shadow-lg"
          >
            <form onSubmit={applyPrice} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink">
                  Khoảng giá (₫)
                </span>
                {hasPriceFilter && (
                  <button
                    type="button"
                    onClick={clearPrice}
                    className="text-xs text-primary hover:underline"
                  >
                    Đặt lại
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Từ"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  className="w-full rounded-lg border border-line bg-surface-container-lowest px-2.5 py-1.5 text-sm outline-none focus:border-primary"
                />
                <span className="text-ink-3">-</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Đến"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  className="w-full rounded-lg border border-line bg-surface-container-lowest px-2.5 py-1.5 text-sm outline-none focus:border-primary"
                />
              </div>

              {/* Quick price presets */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  { label: "< 100k", min: "0", max: "100000" },
                  { label: "100k - 500k", min: "100000", max: "500000" },
                  { label: "> 500k", min: "500000", max: "" },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setPriceMin(preset.min);
                      setPriceMax(preset.max);
                    }}
                    className="rounded-md border border-line px-2 py-0.5 text-xs text-ink-2 hover:border-primary hover:text-primary transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <Button
                type="submit"
                size="sm"
                className="mt-1 w-full bg-primary font-bold text-white hover:bg-primary/90"
              >
                Áp dụng khoảng giá
              </Button>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 3. Quick rating chips */}
        <div className="hidden items-center gap-1.5 sm:flex">
          {RATING_VALUES.map((r) => {
            const active = current.minRating === r;
            const facet = facets.ratings.find((f) => f.key === r.toString());
            return (
              <button
                key={r}
                type="button"
                onClick={() => setMinRating(active ? null : r)}
                disabled={isPending}
                className={cn(
                  "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "border-amber-500 bg-amber-50 text-amber-700 font-bold"
                    : "border-line bg-surface-container-lowest text-ink-2 hover:bg-surface-container-low",
                )}
              >
                <Star
                  className={cn(
                    "h-3.5 w-3.5",
                    active
                      ? "fill-amber-500 text-amber-500"
                      : "fill-amber-400 text-amber-400",
                  )}
                />
                <span>{r === 5 ? "5 sao" : `Từ ${r} sao`}</span>
                {facet && (
                  <span className="text-[10px] text-ink-3">({facet.count})</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Nút Xóa tất cả bộ lọc */}
      {hasAnyFilter && (
        <button
          type="button"
          onClick={clearAll}
          disabled={isPending}
          className="inline-flex items-center gap-1 text-xs font-semibold text-ink-2 hover:text-sale transition-colors self-end md:self-center shrink-0"
        >
          <X className="h-3.5 w-3.5" />
          <span>Xóa tất cả bộ lọc</span>
        </button>
      )}
    </div>
  );
}

