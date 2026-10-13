/**
 * Products hooks – TanStack Query wrappers.
 * Query keys: ["products", ...]
 */
import { useQuery } from "@tanstack/react-query";
import {
  getProductDetail,
  getProducts,
  getRecommendedProducts,
} from "./api";
import {
  mapProductDetailResponse,
} from "./types";
import {
  mockProductDetail,
  mockProductsBySlug,
} from "./mock";
import type {
  ProductDetail,
  ProductDetailResponse,
  ProductListParams,
} from "./types";

export const productKeys = {
  all: ["products"] as const,
  detail: (id: number) => [...productKeys.all, "detail", id] as const,
  list: (params: ProductListParams) => [...productKeys.all, "list", params] as const,
  recommended: (tab?: string) => [...productKeys.all, "recommended", tab ?? "all"] as const,
};

/**
 * useProductDetail – lấy chi tiết sản phẩm theo product ID.
 * Tự động fallback sang mock nếu API fail (development).
 *
 * @param id – product ID (number)
 * @returns ProductDetail | null
 */
export function useProductDetail(id: number | null | undefined) {
  return useQuery<ProductDetail | null>({
    queryKey: id ? productKeys.detail(id) : ["products", "detail", "__noop__"],
    queryFn: async (): Promise<ProductDetail | null> => {
      if (!id) return null;

      try {
        const api = await getProductDetail(id);
        // Merge API response với mock fields (Stitch UI fields mà BE chưa có)
        return mapProductDetailResponse(api, {
          questionCount: 76,
          reviews: mockProductDetail.reviews,
          relatedSameStore: mockProductDetail.relatedSameStore,
          relatedBestSellers: mockProductDetail.relatedBestSellers,
          specs: mockProductDetail.specs,
          sizeChart: mockProductDetail.sizeChart,
          features: mockProductDetail.features,
          descriptionRich: mockProductDetail.descriptionRich,
          storeProfile: mockProductDetail.storeProfile,
          vouchers: mockProductDetail.vouchers,
          shipping: mockProductDetail.shipping,
          commitments: mockProductDetail.commitments,
        });
      } catch {
        // Fallback: nếu API fail (backend offline), dùng mock
        // Chỉ dùng mock khi id trùng với mock product
        const mockById = Object.values(mockProductsBySlug).find(
          (p) => p.id === id
        );
        return mockById ?? null;
      }
    },
    enabled: !!id,
    staleTime: 30_000,
  });
}

/**
 * useProducts – danh sách sản phẩm (phân trang, lọc).
 */
export function useProducts(params: ProductListParams = {}) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => getProducts(params),
    staleTime: 60_000,
  });
}

/**
 * useRecommendedProducts – sản phẩm gợi ý.
 * @param tab – "all" | "for_you" | "best_seller" | "hot_deal"
 * @param limit – số lượng mỗi tab
 */
export function useRecommendedProducts(tab = "all", limit = 10) {
  return useQuery({
    queryKey: productKeys.recommended(tab),
    queryFn: () => getRecommendedProducts(tab, limit),
    staleTime: 60_000,
  });
}

/**
 * useProductSlugLookup – tìm product ID từ slug.
 * 
 * Backend không track slugs, nên cần duy trì local slug→ID mapping.
 * Cách hoạt động:
 *  1. Check cache (module-level Map)
 *  2. Nếu miss → fetch product list → update cache
 *  3. Trả về ID hoặc null
 * 
 * @param slug – product slug (vd: "ao-thun-unisex-cotton-utc-basic")
 * @returns product ID hoặc null
 */
const slugIdCache = new Map<string, number>();

export function useProductSlugLookup(slug: string | null | undefined) {
  return useQuery({
    queryKey: ["products", "slugLookup", slug],
    queryFn: async (): Promise<number | null> => {
      if (!slug) return null;

      // 1. Check cache
      if (slugIdCache.has(slug)) {
        return slugIdCache.get(slug)!;
      }

      // 2. Check mock (development)
      if (mockProductsBySlug[slug]) {
        const id = mockProductsBySlug[slug].id;
        slugIdCache.set(slug, id);
        return id;
      }

      // 3. Fetch product list để find ID
      // NOTE: Backend không có endpoint tìm theo slug.
      // Nếu cần, có thể fetch first page và check name → slugify
      // Hiện tại: fallback về null, user phải truyền ID
      try {
        const page = await getProducts({ page: 0, size: 20 });
        for (const product of page.content) {
          // Build slug from name (giống generateSlug)
          const productSlug = product.name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .slice(0, 60);
          
          slugIdCache.set(productSlug, product.id);
          
          if (productSlug === slug) {
            return product.id;
          }
        }
      } catch {
        // API fail
      }

      return null;
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 phút
  });
}
