/**
 * Products hooks – TanStack Query wrappers.
 * Query keys: ["products", "recommended"] – refetch khi invalidate.
 *              ["products", "detail", slug] – product detail.
 */
import { useQuery } from "@tanstack/react-query";
import { getRecommendedProducts } from "./api";
import {
  mockProductsBySlug,
} from "./mock";
import type { RecommendedProduct } from "./types";
import type { ProductDetail } from "./types";

export const productKeys = {
  all: ["products"] as const,
  recommended: (size = 20) => [...productKeys.all, "recommended", size] as const,
  detail: (slug: string) => [...productKeys.all, "detail", slug] as const,
};

/**
 * useRecommendedProducts – sản phẩm gợi ý (cá nhân hoá nếu đã login).
 * @param size – số lượng cần lấy (default 20).
 */
export function useRecommendedProducts(size = 20) {
  return useQuery<RecommendedProduct[]>({
    queryKey: productKeys.recommended(size),
    queryFn: () => getRecommendedProducts(size),
    staleTime: 60_000,
  });
}

/**
 * useProductDetail – lấy chi tiết sản phẩm theo slug.
 *
 * Hiện tại dùng MOCK data (xem docs/superpowers/plans/2026-10-12-product-detail-be-required.md).
 * Khi BE sẵn sàng Phase 1, sẽ thay bằng apiFetch('/api/v1/products/{id}') (BE cần thêm slug lookup).
 *
 * @param slug – slug sản phẩm (vd: "ao-thun-unisex-cotton-utc-basic")
 * @returns ProductDetail | null (null khi slug không tồn tại)
 */
export function useProductDetail(slug: string | null | undefined) {
  return useQuery<ProductDetail | null>({
    queryKey: slug ? productKeys.detail(slug) : ["products", "detail", "__noop__"],
    queryFn: async () => {
      if (!slug) return null;
      // TODO(api): thay bằng apiFetch(`/api/v1/products/${slugOrId}`) khi BE ready.
      return mockProductsBySlug[slug] ?? null;
    },
    enabled: !!slug,
    staleTime: 30_000,
  });
}
