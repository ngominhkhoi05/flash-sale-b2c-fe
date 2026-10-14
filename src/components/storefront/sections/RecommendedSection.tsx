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
 *
 * UI: Dùng ProductCard component chuẩn (11+ biến thể) để đảm bảo
 * pixel-match với Stitch design.
 */
import { useState, useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useFeaturedProducts } from "@/features/homepage/hooks";
import {
  RecommendedTabs,
  type RecommendedTab as UiTab,
} from "./RecommendedTabs";
import {
  ProductCard,
  type ProductCardBaseProps,
} from "@/components/storefront/ProductCard";

const INITIAL_TAB: UiTab = "forYou";
const PRODUCT_LIMIT = 20;

function mapToProductCardProps(
  product: {
    id: number;
    name: string;
    imageUrl: string;
    minPrice: number;
    maxPrice: number;
    totalSold?: number | null;
    storeName: string;
    label?: string | null;
  },
  index: number,
): ProductCardBaseProps {
  const hasDiscount = product.minPrice < product.maxPrice;
  const discountPercent = hasDiscount
    ? Math.round(((product.maxPrice - product.minPrice) / product.maxPrice) * 100)
    : undefined;

  return {
    imageUrl: product.imageUrl,
    imageAlt: product.name,
    title: product.name,
    price: product.minPrice,
    originalPrice: hasDiscount ? product.maxPrice : undefined,
    discountPercent,
    rating: undefined, // API chưa trả rating
    soldCount: product.totalSold ?? undefined,
    location: product.storeName,
    onClick: undefined,
  };
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
            <ProductCard key={`skel-${i}`} variant="skeleton" />
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

        {/* Data dùng ProductCard chuẩn */}
        {!isLoading && !isError && filteredProducts.length > 0 &&
          filteredProducts.map((product, index) => {
            const props = mapToProductCardProps(product, index);
            const hasDiscount = product.minPrice < product.maxPrice;

            // Chọn variant theo Stitch design
            if (product.label === "Freeship") {
              return (
                <Link key={product.id} href={`/products/${product.id}`}>
                  <ProductCard variant="freeship" {...props} />
                </Link>
              );
            }
            if (product.label && product.label !== "Freeship") {
              return (
                <Link key={product.id} href={`/products/${product.id}`}>
                  <ProductCard
                    variant="voucher"
                    {...props}
                    voucherLabel={product.label}
                  />
                </Link>
              );
            }
            if (hasDiscount && props.discountPercent) {
              return (
                <Link key={product.id} href={`/products/${product.id}`}>
                  <ProductCard variant="discount" {...props} />
                </Link>
              );
            }
            return (
              <Link key={product.id} href={`/products/${product.id}`}>
                <ProductCard variant="default" {...props} />
              </Link>
            );
          })}
      </div>
    </section>
  );
}
