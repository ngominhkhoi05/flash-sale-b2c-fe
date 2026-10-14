"use client";

/**
 * RecommendedSection – Stitch "GỢI Ý HÔM NAY" (Section #7).
 *
 * Gồm:
 * - Sticky tabs (Dành cho bạn / Bán chạy / Ưu đãi sốc) – UI only
 * - Lưới sản phẩm (2-5 cols responsive) load từ API
 *
 * Data (ưu tiên):
 * - GET /api/v1/products/recommended?tab=... (chuẩn)
 * - Fallback: GET /api/v1/products?size=20&sort=createdAt,desc
 *
 * Pixel-match reference:
 * Stitch HTML lines 719-end (grid 5 cols × 4 rows = 20 cards)
 */
import { useState, useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { useFeaturedProducts } from "@/features/homepage/hooks";
import {
  RecommendedTabs,
  type RecommendedTab as UiTab,
} from "./RecommendedTabs";
import { cn } from "@/lib/utils";

const INITIAL_TAB: UiTab = "forYou";
const PRODUCT_LIMIT = 20;

function formatVND(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0₫";
  return new Intl.NumberFormat("vi-VN").format(value) + "₫";
}

function formatVNDShort(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0";
  if (value >= 1_000_000) {
    const mil = value / 1_000_000;
    return (Math.round(mil * 10) / 10).toString() + "tr";
  }
  if (value >= 1_000) {
    return Math.round(value / 1_000) + "K";
  }
  return value.toString();
}

function compactNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "tr";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toString();
}

export function RecommendedSection() {
  const t = useTranslations("storefront.home");
  const [activeTab, setActiveTab] = useState<UiTab>(INITIAL_TAB);

  const { data: products, isLoading, isError } = useFeaturedProducts(PRODUCT_LIMIT);

  // Client-side filter theo tab (khi backend chưa có /products/recommended).
  // Sau này backend có endpoint này → chuyển sang useRecommendedProducts với 3 dataset.
  const filteredProducts = useMemo(() => {
    const all = products ?? [];
    if (activeTab === "bestSellers") {
      return [...all].sort((a, b) => (b.totalSold ?? 0) - (a.totalSold ?? 0));
    }
    if (activeTab === "hotDeals") {
      return all.filter((p) => p.minPrice < p.maxPrice);
    }
    return all;
  }, [products, activeTab]);

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
        {/* Loading skeleton */}
        {isLoading &&
          Array.from({ length: 10 }).map((_, i) => (
            <div
              key={`skel-${i}`}
              className="bg-white border border-surface-container rounded-xl overflow-hidden"
              data-testid={`recommended-skel-${i}`}
            >
              <div className="w-full aspect-square bg-surface-container animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-3 w-3/4 bg-surface-container rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-surface-container rounded animate-pulse" />
              </div>
            </div>
          ))}

        {/* Error state */}
        {isError && !isLoading && (
          <div
            className="col-span-full text-center py-12 text-on-surface-variant"
            data-testid="recommended-error"
          >
            <p>{t("recommended.error")}</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && filteredProducts.length === 0 && (
          <div
            className="col-span-full text-center py-12 text-on-surface-variant"
            data-testid="recommended-empty"
          >
            <p>{t("recommended.empty")}</p>
          </div>
        )}

        {/* Data */}
        {!isLoading && !isError && filteredProducts.length > 0 &&
          filteredProducts.map((product) => {
            const hasDiscount = product.minPrice < product.maxPrice;
            const priceLabel = hasDiscount
              ? `${formatVNDShort(product.minPrice)}-${formatVNDShort(product.maxPrice)}`
              : formatVNDShort(product.minPrice);
            const fullPrice = formatVND(product.minPrice);
            const productHref = `/san-pham/${product.id}`;

            return (
              <Link
                key={product.id}
                href={productHref}
                className="group relative bg-white border border-surface-container rounded-xl overflow-hidden flex flex-col justify-between hover:border-primary hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 h-full"
              >
                <div>
                  <div className="relative w-full aspect-square bg-surface-container overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={product.name}
                      src={product.imageUrl}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Voucher label bottom-left */}
                    {product.label && (
                      <div
                        className={cn(
                          "absolute bottom-2 left-2 h-5 px-1.5 rounded flex items-center gap-1 shadow-sm",
                          product.label === "Freeship"
                            ? "bg-secondary text-white"
                            : "bg-primary text-white"
                        )}
                      >
                        <MaterialSymbol
                          name={
                            product.label === "Freeship"
                              ? "local_shipping"
                              : "confirmation_number"
                          }
                          size="[12px]"
                        />
                        <span className="text-[11px] font-semibold leading-none">
                          {product.label}
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
                          hasDiscount ? "text-tertiary" : "text-on-surface"
                        )}
                      >
                        {priceLabel}
                      </span>
                      {hasDiscount && (
                        <span className="text-[12px] text-on-surface-variant line-through leading-none">
                          {fullPrice}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-[12px] text-on-surface-variant gap-1">
                      <MaterialSymbol
                        name="store"
                        size="[14px]"
                        className="text-on-surface-variant"
                      />
                      <span className="truncate">{product.storeName}</span>
                      <span className="text-outline">•</span>
                      <span>Đã bán {compactNumber(product.totalSold)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
      </div>
    </section>
  );
}
