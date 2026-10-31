/**
 * mapToProductCardProps – shared mapper từ BE shape (RecommendedProductResponse)
 * sang FE shape (ProductCardBaseProps) để render ProductCard.
 *
 * Được dùng bởi:
 *  - Homepage (RecommendedSection)
 *  - Search page (SearchProductGrid)
 *
 * Lưu ý:
 *  - `RecommendedProductResponse` ở đây là FE type trong `src/features/homepage/api.ts`
 *    (id, storeId, storeName, name, imageUrl, minPrice, maxPrice, totalStock,
 *    totalSold, label). Cùng shape với BE `RecommendedProductResponse`.
 *  - `ProductCardBaseProps` ở `src/components/storefront/ProductCard/ProductCard.types.ts`
 *    (imageUrl, imageAlt, title, price, originalPrice, discountPercent, rating,
 *    soldCount, location, ...).
 *
 * Mapping:
 *  - minPrice → price (giá bán hiện tại)
 *  - maxPrice → originalPrice (nếu khác minPrice, nghĩa là có discount)
 *  - discountPercent = round((max - min) / max * 100) nếu hasDiscount
 *  - totalSold → soldCount
 *  - storeName → location
 *  - rating: BE chưa trả → undefined
 */

import type { ProductCardBaseProps } from "@/components/storefront/ProductCard/ProductCard.types";
import type { RecommendedProductResponse } from "@/features/homepage/api";
import { imageUrlWithFallback } from "@/lib/images/with-fallback";

export function mapToProductCardProps(
  product: RecommendedProductResponse,
): ProductCardBaseProps {
  const hasDiscount =
    product.maxPrice > product.minPrice && product.maxPrice > 0;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.maxPrice - product.minPrice) / product.maxPrice) * 100,
      )
    : undefined;

  return {
    imageUrl: imageUrlWithFallback(product.imageUrl, "product"),
    imageAlt: product.name,
    title: product.name,
    price: product.minPrice,
    originalPrice: hasDiscount ? product.maxPrice : undefined,
    discountPercent,
    rating: undefined, // BE chưa trả rating
    soldCount: product.totalSold ?? undefined,
    location: product.storeName,
  };
}
