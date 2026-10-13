/**
 * FlashSaleCategoryFilter – chip filter dạng pill, scroll ngang trên mobile.
 *
 * Trả về key "all" là tất cả danh mục. Active chip: bg tertiary + text on-tertiary.
 * Inactive: bg transparent + border outline-variant + text on-surface-variant.
 *
 * Stitch reference: trang-flash-sale.md L150-L177
 */

"use client";

import { cn } from "@/lib/utils";

export interface FlashSaleCategoryChip {
  key: string;
  label: string;
  count: number;
}

export interface FlashSaleCategoryFilterProps {
  categories: FlashSaleCategoryChip[];
  active: string;
  onChange?: (key: string) => void;
  className?: string;
}

export function FlashSaleCategoryFilter({
  categories,
  active,
  onChange,
  className,
}: FlashSaleCategoryFilterProps) {
  return (
    <div
      data-testid="flash-sale-category-filter"
      className={cn(
        "mb-6 flex items-center gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {categories.map((cat) => {
        const isActive = active === cat.key;
        return (
          <button
            key={cat.key}
            type="button"
            onClick={() => onChange?.(cat.key)}
            aria-pressed={isActive}
            data-testid={`category-${cat.key}`}
            className={cn(
              "flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-body-sm font-semibold transition-all active:scale-95",
              isActive
                ? "border-tertiary bg-tertiary text-on-tertiary shadow-sm"
                : "border-outline-variant bg-transparent text-on-surface-variant hover:border-tertiary/40 hover:text-tertiary",
            )}
          >
            <span>{cat.label}</span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                isActive ? "bg-on-tertiary/20 text-on-tertiary" : "bg-surface-container text-on-surface-variant",
              )}
            >
              {cat.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
