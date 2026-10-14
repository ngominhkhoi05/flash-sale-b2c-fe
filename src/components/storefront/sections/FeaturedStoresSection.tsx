"use client";

/**
 * FeaturedStoresSection – Stitch "SHOP NỔI BẬT (VIBE MALL)" (Section #6).
 *
 * 4 product cards từ featured products (fallback khi /stores/featured chưa có).
 *
 * Data (ưu tiên):
 * - GET /api/v1/stores/featured (chuẩn)
 * - Fallback: GET /api/v1/products?size=4&sort=createdAt,desc
 *
 * Pixel-match reference:
 * Stitch HTML lines 557-719
 */
import Link from "next/link";
import { useTranslations } from "next-intl";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import {
  useFeaturedStores,
  useFeaturedProducts,
} from "@/features/homepage/hooks";
import type { RecommendedProductResponse } from "@/features/homepage/api";
import { cn } from "@/lib/utils";

function formatVND(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0₫";
  return new Intl.NumberFormat("vi-VN").format(value) + "₫";
}

function formatVNDShort(value: number): string {
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(1).replace(/\.0$/, "") + "tr";
  if (value >= 1_000) return (value / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return value.toString();
}

const PRODUCT_LIMIT = 4;

export function FeaturedStoresSection() {
  const t = useTranslations("storefront.home");
  const { data: stores, isLoading: storesLoading } = useFeaturedStores(PRODUCT_LIMIT);
  const { data: products, isLoading: productsLoading } = useFeaturedProducts(PRODUCT_LIMIT);

  // Ưu tiên stores nếu backend trả về data thật, fallback sang products.
  const isLoading = storesLoading && productsLoading;
  const displayProducts: RecommendedProductResponse[] =
    stores && stores.length > 0
      ? [] // stores path — không dùng product layout, render riêng
      : (products ?? []).slice(0, PRODUCT_LIMIT);

  // Loading skeleton
  if (isLoading) {
    return (
      <section className="bg-surface-container-lowest rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between pb-5 border-b border-surface-container">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-primary text-on-primary text-label-sm font-bold">
              {t("stores.mallBadge")}
            </span>
            <h2 className="text-headline-md text-on-surface font-bold">
              {t("stores.title")}
            </h2>
          </div>
          <Link
            href="/categories/authentic-stores"
            className="text-label-md text-primary hover:underline flex items-center gap-1"
          >
            {t("stores.seeAll")}
            <MaterialSymbol name="chevron_right" size="sm" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 pt-5">
          {Array.from({ length: PRODUCT_LIMIT }).map((_, i) => (
            <div
              key={i}
              className="bg-surface-container-low rounded-xl p-4 h-48 animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  // Empty state
  if (displayProducts.length === 0 && (!stores || stores.length === 0)) {
    return (
      <section className="bg-surface-container-lowest rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between pb-5 border-b border-surface-container">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-primary text-on-primary text-label-sm font-bold">
              {t("stores.mallBadge")}
            </span>
            <h2 className="text-headline-md text-on-surface font-bold">
              {t("stores.title")}
            </h2>
          </div>
          <Link
            href="/categories/authentic-stores"
            className="text-label-md text-primary hover:underline flex items-center gap-1"
          >
            {t("stores.seeAll")}
            <MaterialSymbol name="chevron_right" size="sm" />
          </Link>
        </div>
        <div className="py-12 text-center text-on-surface-variant">
          <p>{t("stores.empty")}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-surface-container-lowest rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-5 border-b border-surface-container">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-primary text-on-primary text-label-sm font-bold">
            {t("stores.mallBadge")}
          </span>
          <h2 className="text-headline-md text-on-surface font-bold">
            {t("stores.title")}
          </h2>
        </div>
        <Link
          href="/categories/authentic-stores"
          className="text-label-md text-primary hover:underline flex items-center gap-1"
        >
          {t("stores.seeAll")}
          <MaterialSymbol name="chevron_right" size="sm" />
        </Link>
      </div>

      {/* Grid products (fallback) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-5">
        {displayProducts.map((product) => {
          const hasDiscount = product.minPrice < product.maxPrice;
          return (
            <Link
              key={product.id}
              href={`/san-pham/${product.id}`}
              data-testid={`featured-product-${product.id}`}
              className={cn(
                "group relative bg-white border border-surface-container rounded-xl overflow-hidden",
                "hover:border-primary hover:-translate-y-0.5 hover:shadow-md transition-all duration-200",
              )}
            >
              <div className="relative w-full aspect-square bg-surface-container overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={product.name}
                  src={product.imageUrl}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-3 space-y-1.5">
                <h3
                  className={cn(
                    "text-[14px] font-normal text-on-surface line-clamp-2 min-h-[40px] leading-snug",
                    "group-hover:text-primary transition-colors",
                  )}
                  title={product.name}
                >
                  {product.name}
                </h3>
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span
                    className={cn(
                      "text-[16px] font-semibold leading-none",
                      hasDiscount ? "text-tertiary" : "text-on-surface",
                    )}
                  >
                    {hasDiscount
                      ? `${formatVNDShort(product.minPrice)}-${formatVNDShort(product.maxPrice)}`
                      : formatVND(product.minPrice)}
                  </span>
                </div>
                <div className="flex items-center text-[12px] text-on-surface-variant gap-1">
                  <MaterialSymbol name="store" size="[14px]" />
                  <span className="truncate">{product.storeName}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
