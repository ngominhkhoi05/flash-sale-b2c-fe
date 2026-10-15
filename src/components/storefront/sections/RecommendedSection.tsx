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
import { useRecommendedProducts } from "@/features/homepage/hooks";
import {
  RecommendedTabs,
  TAB_TO_API,
  type RecommendedTab as UiTab,
} from "./RecommendedTabs";
import {
  ProductCard,
  type ProductCardBaseProps,
} from "@/components/storefront/ProductCard";

const INITIAL_TAB: UiTab = "forYou";

/**
 * Map UI tab key → backend RecommendedProductsResponse key.
 * - forYou     → forYou
 * - bestSellers → bestSellers
 * - hotDeals   → hotDeals
 */
const UI_TAB_TO_RESPONSE_KEY: Record<
  UiTab,
  "forYou" | "bestSellers" | "hotDeals"
> = {
  forYou: "forYou",
  bestSellers: "bestSellers",
  hotDeals: "hotDeals",
};

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

  // Gọi API /api/v1/products/recommended với tab tương ứng (UI tab → API tab).
  const { data: response, isLoading, isError } = useRecommendedProducts(
    TAB_TO_API[activeTab],
  );

  // Lấy đúng list theo UI tab từ response.
  // Dedupe theo id để phòng trường hợp backend trả duplicate rows
  // (vd id=195 xuất hiện 2 lần) — sẽ gây duplicate-key warning trong dev.
  const products = useMemo(() => {
    if (!response) return [];
    const list = response[UI_TAB_TO_RESPONSE_KEY[activeTab]] ?? [];
    const seen = new Set<number>();
    const unique: typeof list = [];
    for (const p of list) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        unique.push(p);
      }
    }
    return unique;
  }, [response, activeTab]);

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
            <ProductCard
              key={`skel-${i}`}
              variant="skeleton"
              imageUrl=""
              title=""
              price={0}
            />
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
        {!isLoading && !isError && products.length === 0 && (
          <div
            className="col-span-full text-center py-12 text-on-surface-variant"
            data-testid="recommended-empty"
          >
            <p>{t("recommended.empty")}</p>
          </div>
        )}

        {/* Data dùng ProductCard chuẩn */}
        {!isLoading && !isError && products.length > 0 &&
          products.map((product) => {
            const props = mapToProductCardProps(product);
            const hasDiscount = product.minPrice < product.maxPrice;
            // Key phải unique & ổn định giữa các tab — dùng `${activeTab}-${id}`
            // để khi switch tab React biết card nào là card nào (tránh remount
            // ngoài ý muốn khi 2 tab có chung id nhưng nội dung khác nhau).
            const cardKey = `${activeTab}-${product.id}`;

            // Chọn variant theo Stitch design
            if (product.label === "Freeship") {
              return (
                <Link key={cardKey} href={`/products/${product.id}`}>
                  <ProductCard variant="freeship" {...props} />
                </Link>
              );
            }
            if (product.label && product.label !== "Freeship") {
              return (
                <Link key={cardKey} href={`/products/${product.id}`}>
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
                <Link key={cardKey} href={`/products/${product.id}`}>
                  <ProductCard variant="discount" {...props} />
                </Link>
              );
            }
            return (
              <Link key={cardKey} href={`/products/${product.id}`}>
                <ProductCard variant="default" {...props} />
              </Link>
            );
          })}
      </div>
    </section>
  );
}
