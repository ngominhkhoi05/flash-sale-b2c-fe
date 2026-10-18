"use client";

/**
 * SearchProductGrid – lưới sản phẩm 4 cột desktop / 2 mobile.
 *
 * Mỗi sản phẩm dùng `ProductCard` (Modern Clean) – match trang chủ.
 * `mapToProductCardProps` chuyển `RecommendedProductResponse` (BE shape) sang
 * `ProductCardBaseProps` để render. Card được wrap trong `<Link>` để user click
 * navigate tới product detail.
 *
 * Có "skeleton" 8-card cho trạng thái loading.
 *
 * Plan: docs/superpowers/plans/2026-10-18-search-endpoint-be-wire-fe.md
 */

import Link from "next/link";

import { ProductCard } from "@/components/storefront/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { mapToProductCardProps } from "@/features/products/map-to-product-card";
import type { RecommendedProductResponse } from "@/features/homepage/api";
import { cn } from "@/lib/utils";

export interface SearchProductGridProps {
  items: RecommendedProductResponse[];
  isLoading?: boolean;
  className?: string;
}

const SKELETON_KEYS = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"];

export function SearchProductGrid({
  items,
  isLoading = false,
  className,
}: SearchProductGridProps) {
  if (isLoading) {
    return (
      <div
        className={cn(
          "grid grid-cols-2 items-stretch gap-3 md:grid-cols-3 md:gap-5 xl:grid-cols-4",
          className,
        )}
        data-testid="search-grid-skeleton"
      >
        {SKELETON_KEYS.map((k) => (
          <ProductCardSkeleton key={k} />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-2 items-stretch gap-3 md:grid-cols-3 md:gap-5 xl:grid-cols-4",
        className,
      )}
      data-testid="search-grid"
    >
      {items.map((item) => {
        const cardProps = mapToProductCardProps(item);
        const hasDiscount =
          item.maxPrice > item.minPrice && item.maxPrice > 0;
        // Chọn variant theo label (giống RecommendedSection)
        //  - label === "freeship" → freeship variant
        //  - label === "voucher" (hoặc label khác "freeship") → voucher variant
        //  - hasDiscount → discount variant
        //  - default → default variant
        let variant: "default" | "discount" | "voucher" | "freeship" = "default";
        let voucherLabel: string | undefined;
        if (item.label === "freeship") {
          variant = "freeship";
        } else if (item.label) {
          variant = "voucher";
          // Map label thành text tiếng Việt cho corner tag
          voucherLabel =
            item.label === "voucher"
              ? "Voucher"
              : item.label === "flash_sale"
                ? "Flash Sale"
                : item.label === "hot_deal"
                  ? "Hot Deal"
                  : item.label;
        } else if (hasDiscount && cardProps.discountPercent) {
          variant = "discount";
        }

        return (
          <Link
            key={item.id}
            href={`/products/${item.id}`}
            className="contents"
          >
            <ProductCard
              variant={variant}
              {...cardProps}
              voucherLabel={voucherLabel}
            />
          </Link>
        );
      })}
    </div>
  );
}

function ProductCardSkeleton() {
  return (
    <div className="flex h-full flex-col gap-2 rounded-2xl border border-line bg-card p-3.5">
      <Skeleton className="aspect-square w-full rounded-lg" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}
