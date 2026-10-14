"use client";

/**
 * CategoryGridSection – Stitch "DANH MỤC NỔI BẬT" (Section #3).
 *
 * Render 8 danh mục nổi bật (lấy từ API /api/v1/categories).
 * Grid: 4 cols mobile → 8 cols tablet.
 *
 * Pixel-match reference:
 * Stitch HTML lines 125-220
 *
 * Data: GET /api/v1/categories (Public).
 */
import Link from "next/link";
import { useTranslations } from "next-intl";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { useCategories } from "@/features/homepage/hooks";
import type { CategoryResponse } from "@/features/homepage/api";
import { cn } from "@/lib/utils";

/** Icon mapping theo slug (UI-only, hardcoded vì backend chưa trả icon). */
const CATEGORY_ICONS: Record<string, string> = {
  "thoi-trang-nam": "man",
  "thoi-trang-nu": "woman",
  "dien-thoai": "smartphone",
  "laptop": "laptop_mac",
  "tai-nghe": "headphones",
  "noi-that": "chair",
  "lam-dep": "spa",
  "me-va-be": "child_friendly",
};

const FALLBACK_ICONS = [
  "checkroom",
  "devices",
  "home",
  "sports_esports",
  "menu_book",
  "pets",
  "kitchen",
  "toys",
];

const CATEGORY_LIMIT = 8;

function pickIcon(category: CategoryResponse, index: number): string {
  return (
    CATEGORY_ICONS[category.slug] ??
    FALLBACK_ICONS[index % FALLBACK_ICONS.length] ??
    "category"
  );
}

export function CategoryGridSection() {
  const t = useTranslations("storefront.home");
  const { data: categories, isLoading, isError } = useCategories();

  const displayCategories = (categories ?? []).slice(0, CATEGORY_LIMIT);

  // Loading skeleton
  if (isLoading) {
    return (
      <section className="bg-surface-container-lowest rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between pb-5 border-b border-surface-container">
          <div className="h-6 w-48 bg-surface-container rounded animate-pulse" />
          <div className="h-4 w-20 bg-surface-container rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-4 pt-5">
          {Array.from({ length: CATEGORY_LIMIT }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-surface-container animate-pulse" />
              <div className="h-3 w-12 bg-surface-container rounded animate-pulse" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Empty / error state
  if (isError || displayCategories.length === 0) {
    return (
      <section className="bg-surface-container-lowest rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between pb-5 border-b border-surface-container">
          <h2 className="text-headline-md text-on-surface font-bold tracking-tight">
            {t("categoryGrid.title")}
          </h2>
          <Link
            href="/categories"
            className="text-label-md text-primary hover:underline flex items-center gap-1"
          >
            {t("categoryGrid.seeAll")}
            <MaterialSymbol name="chevron_right" size="sm" />
          </Link>
        </div>
        <div className="py-12 text-center text-on-surface-variant">
          <p>{t("categoryGrid.empty")}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-surface-container-lowest rounded-xl p-6 shadow-sm">
      {/* Header row */}
      <div className="flex items-center justify-between pb-5 border-b border-surface-container">
        <h2 className="text-headline-md text-on-surface font-bold tracking-tight">
          {t("categoryGrid.title")}
        </h2>
        <Link
          href="/categories"
          className="text-label-md text-primary hover:underline flex items-center gap-1"
        >
          {t("categoryGrid.seeAll")}
          <MaterialSymbol name="chevron_right" size="sm" />
        </Link>
      </div>
      {/* Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-4 pt-5">
        {displayCategories.map((category, idx) => (
          <Link
            key={category.id}
            href={`/categories/${category.slug}`}
            className="flex flex-col items-center text-center group"
            data-testid={`category-link-${category.id}`}
          >
            <div
              className={cn(
                "w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center",
                "group-hover:bg-primary-soft group-hover:scale-105 transition-all",
              )}
            >
              <MaterialSymbol
                name={pickIcon(category, idx) as never}
                size="2xl"
                className="text-primary"
              />
            </div>
            <span className="mt-2 text-label-lg text-on-surface leading-tight line-clamp-1">
              {category.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
