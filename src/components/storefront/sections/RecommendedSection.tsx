"use client";

/**
 * RecommendedSection – Stitch "GỢI Ý HÔM NAY" (Section #7).
 *
 * Gồm:
 * - Sticky tabs (Dành cho bạn / Bán chạy / Ưu đãi sốc)
 * - Lưới sản phẩm (2-5 cols responsive)
 *
 * Filter + state nội bộ.
 *
 * Pixel-match reference:
 * Stitch HTML lines 719-end (grid 5 cols × 4 rows = 20 cards)
 */
import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";
import {
  RecommendedTabs,
  filterProductsByTab,
  type RecommendedTab,
} from "./RecommendedTabs";
import { RECOMMENDED_PRODUCTS } from "./home-mocks";

const INITIAL_TAB: RecommendedTab = "forYou";

export function RecommendedSection() {
  const t = useTranslations("storefront.home");
  const [activeTab, setActiveTab] = useState<RecommendedTab>(INITIAL_TAB);
  const products = filterProductsByTab(RECOMMENDED_PRODUCTS, activeTab);

  return (
    <section className="space-y-4">
      <RecommendedTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        t={(k) => t(k as never)}
      />

      <div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5"
        data-testid={`recommended-grid-${activeTab}`}
      >
        {products.map((product) => (
          <Link
            key={product.id}
            href={product.href}
            className="group relative bg-white border border-surface-container rounded-xl overflow-hidden flex flex-col justify-between hover:border-primary hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 h-full"
          >
            <div>
              <div className="relative w-full aspect-square bg-surface-container overflow-hidden">
                <img
                  alt={product.imageAlt}
                  src={product.imageUrl}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* Discount badge top-right */}
                {product.discountPercent && product.discountPercent > 0 && (
                  <div className="absolute top-2 right-2 bg-tertiary-soft text-tertiary text-[12px] font-semibold px-2 py-0.5 rounded-md shadow-sm">
                    -{product.discountPercent}%
                  </div>
                )}
                {/* Voucher label bottom-left */}
                {product.voucherLabel && (
                  <div
                    className={cn(
                      "absolute bottom-2 left-2 h-5 px-1.5 rounded flex items-center gap-1 shadow-sm",
                      product.voucherLabel === "Freeship"
                        ? "bg-secondary text-white"
                        : "bg-primary text-white"
                    )}
                  >
                    <MaterialSymbol
                      name={
                        product.voucherLabel === "Freeship"
                          ? "local_shipping"
                          : "confirmation_number"
                      }
                      size="[12px]"
                    />
                    <span className="text-[11px] font-semibold leading-none">
                      {product.voucherLabel}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-3 space-y-2">
                <h3
                  className="text-[14px] font-normal text-on-surface line-clamp-2 min-h-[40px] leading-snug group-hover:text-primary transition-colors"
                  title={product.name}
                >
                  {product.name}
                </h3>
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span
                    className={cn(
                      "text-[16px] font-semibold leading-none",
                      product.discountPercent && product.discountPercent > 0
                        ? "text-tertiary"
                        : "text-on-surface"
                    )}
                  >
                    {product.price}
                  </span>
                  {product.originalPrice && (
                    <span className="text-[12px] text-on-surface-variant line-through leading-none">
                      {product.originalPrice}
                    </span>
                  )}
                </div>
                <div className="flex items-center text-[12px] text-on-surface-variant gap-1">
                  <MaterialSymbol
                    name="star"
                    size="[14px]"
                    fill
                    className="text-amber-500"
                  />
                  <span className="font-medium text-on-surface">{product.rating}</span>
                  <span className="text-outline">•</span>
                  <span>Đã bán {product.soldCount}</span>
                </div>
              </div>
            </div>
            <div className="px-3 pb-3 pt-0 flex items-center text-[12px] text-on-surface-variant gap-1">
              <MaterialSymbol
                name="location_on"
                size="[14px]"
                className="text-on-surface-variant"
              />
              <span className="truncate">{product.location}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
