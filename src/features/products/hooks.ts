/**
 * Products hooks – TanStack Query wrappers.
 * Query keys: ["products", "recommended"] – refetch khi invalidate.
 *              ["products", "detail", slug] – product detail.
 */
import { useQuery } from "@tanstack/react-query";
import {
  getRecommendedProducts,
  fetchProductDetailBySlug,
  fetchProductDetailById,
} from "./api";
import { mockProductsBySlug } from "./mock";
import type { RecommendedProduct, ProductDetail } from "./types";

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
 * Wire tới backend thật (GET /api/v1/products/slug/{slug}).
 * Fallback về mock khi `NEXT_PUBLIC_USE_MOCK=true` (dev-only).
 *
 * @param slug – slug SEO sản phẩm (vd: "ao-thun-unisex-cotton-utc-basic")
 * @returns ProductDetail | null (null khi queryFn disabled, throw khi 404)
 */
export function useProductDetail(slug: string | null | undefined) {
  const useMock = process.env.NEXT_PUBLIC_USE_MOCK === "true";
  return useQuery<ProductDetail | null>({
    queryKey: slug ? productKeys.detail(slug) : ["products", "detail", "__noop__"],
    queryFn: async () => {
      if (!slug) return null;
      if (useMock) {
        return mockProductsBySlug[slug] ?? null;
      }
      return fetchProductDetailBySlug(slug);
    },
    enabled: !!slug,
    staleTime: 30_000,
  });
}

/**
 * useProductDetailBySlug – Server/Client Component safe wrapper.
 *
 * Ưu tiên: gọi API thật. Khi `NEXT_PUBLIC_USE_MOCK=true`, fallback mock.
 * Throw error khi 404 (để caller render not-found).
 */
export function useProductDetailBySlug(slug: string | null | undefined) {
  return useQuery<ProductDetail>({
    queryKey: slug ? productKeys.detail(slug) : ["products", "detail", "__noop__"],
    queryFn: () => {
      if (!slug) throw new Error("slug is required");
      return fetchProductDetailBySlug(slug);
    },
    enabled: !!slug,
    staleTime: 30_000,
  });
}

/**
 * useProductDetailById – dùng để resolve id → slug trong page detail route.
 * Throw error khi 404.
 */
export function useProductDetailById(id: number | null | undefined) {
  return useQuery<ProductDetail>({
    queryKey: id
      ? [...productKeys.all, "detail-by-id", id]
      : ["products", "detail-by-id", "__noop__"],
    queryFn: () => {
      if (id == null) throw new Error("id is required");
      return fetchProductDetailById(id);
    },
    enabled: id != null,
    staleTime: 30_000,
  });
}
