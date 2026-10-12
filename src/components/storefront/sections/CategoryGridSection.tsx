/**
 * CategoryGridSection – Stitch "DANH MỤC NỔI BẬT" (Section #3).
 *
 * Gồm 8 ô danh mục (hoặc 16 tổng) với icon + label.
 * Grid: 4 cols mobile → 8 cols tablet.
 *
 * Pixel-match reference:
 * Stitch HTML lines 125-220
 */
import Link from "next/link";
import { useTranslations } from "next-intl";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";

interface CategoryItem {
  icon: Parameters<typeof MaterialSymbol>[0]["name"];
  labelKey: string;
  href: string;
}

const CATEGORIES: CategoryItem[] = [
  { icon: "man", labelKey: "categoryGrid.items.mensFashion", href: "/categories/mens-fashion" },
  { icon: "woman", labelKey: "categoryGrid.items.womensFashion", href: "/categories/womens-fashion" },
  { icon: "smartphone", labelKey: "categoryGrid.items.phone", href: "/categories/phones" },
  { icon: "laptop_mac", labelKey: "categoryGrid.items.laptop", href: "/categories/laptops" },
  { icon: "headphones", labelKey: "categoryGrid.items.headphones", href: "/categories/headphones" },
  { icon: "chair", labelKey: "categoryGrid.items.furniture", href: "/categories/furniture" },
  { icon: "spa", labelKey: "categoryGrid.items.beauty", href: "/categories/beauty" },
  { icon: "child_friendly", labelKey: "categoryGrid.items.momBaby", href: "/categories/mom-baby" },
];

export function CategoryGridSection() {
  const t = useTranslations("storefront.home");
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
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.icon}
            href={cat.href}
            className="flex flex-col items-center text-center group"
          >
            <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center group-hover:bg-primary-soft group-hover:scale-105 transition-all">
              <MaterialSymbol
                name={cat.icon}
                size="2xl"
                className="text-primary"
              />
            </div>
            <span className="mt-2 text-label-lg text-on-surface leading-tight">
              {t(cat.labelKey)}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
