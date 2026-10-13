"use client";

/**
 * SearchProductGrid – lưới sản phẩm 4 cột desktop / 2 mobile.
 *
 * Mỗi sản phẩm dùng `ProductCardDiscount` (Modern Clean) – match Stitch.
 * Có "skeleton" 8-card cho trạng thái loading.
 */

import { ProductCard } from "@/components/storefront/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { RecommendedProduct } from "@/features/products/types";
import { cn } from "@/lib/utils";

export interface SearchProductGridProps {
  items: RecommendedProduct[];
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
      {items.map((item) => (
        <ProductCard
          key={item.id}
          variant={item.discountPercent ? "discount" : "default"}
          imageUrl={item.imageUrl}
          imageAlt={item.imageAlt}
          title={item.name}
          price={item.price}
          originalPrice={item.originalPrice ?? item.price}
          discountPercent={item.discountPercent ?? 0}
          rating={item.rating ?? 0}
          soldCount={item.totalSold ?? 0}
          location={item.location ?? ""}
          voucherLabel={item.voucherLabel}
        />
      ))}
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
