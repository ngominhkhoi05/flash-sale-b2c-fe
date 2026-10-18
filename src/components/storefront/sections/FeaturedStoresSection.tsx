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
 *
 * UI: Dùng ProductCard component chuẩn (11+ biến thể) để đảm bảo
 * pixel-match với Stitch design.
 */
import Link from "next/link";
import { useTranslations } from "next-intl";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import {
  useFeaturedStores,
  useFeaturedProducts,
} from "@/features/homepage/hooks";
import type { RecommendedProductResponse } from "@/features/homepage/api";
import {
  ProductCard,
  type ProductCardBaseProps,
} from "@/components/storefront/ProductCard";

const PRODUCT_LIMIT = 4;

function mapToProductCardProps(
  product: RecommendedProductResponse,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- reserved cho variant label theo index
  index: number,
): ProductCardBaseProps {
  const hasDiscount = product.minPrice < product.maxPrice;
  const discountPercent = hasDiscount
    ? Math.round(((product.maxPrice - product.minPrice) / product.maxPrice) * 100)
    : undefined;

  // Chọn variant phù hợp với Stitch design
  if (product.label === "Freeship") {
    // Freeship card - variant freeship
  } else if (product.label && product.label !== "Freeship") {
    // Voucher card
  } else if (hasDiscount) {
    // Discount card
  }

  return {
    imageUrl: product.imageUrl,
    imageAlt: product.name,
    title: product.name,
    price: product.minPrice,
    originalPrice: hasDiscount ? product.maxPrice : undefined,
    discountPercent,
    rating: undefined, // API chưa trả rating
    soldCount: product.totalSold,
    location: product.storeName,
    onClick: undefined,
  };
}

export function FeaturedStoresSection() {
  const t = useTranslations("storefront.home");
  const { data: stores, isLoading: storesLoading } = useFeaturedStores(PRODUCT_LIMIT);
  const { data: products, isLoading: productsLoading } = useFeaturedProducts(PRODUCT_LIMIT);

  // Ưu tiên stores nếu backend trả về data thật, fallback sang products.
  const isLoading = storesLoading && productsLoading;
  const displayProducts: RecommendedProductResponse[] =
    stores && stores.length > 0
      ? []
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 pt-5">
          {Array.from({ length: PRODUCT_LIMIT }).map((_, i) => (
            <ProductCard
              key={i}
              variant="skeleton"
              imageUrl=""
              title=""
              price={0}
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

      {/* Grid products dùng ProductCard chuẩn */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 pt-5">
        {displayProducts.map((product, index) => {
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
