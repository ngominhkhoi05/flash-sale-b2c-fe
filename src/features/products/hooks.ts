/**
 * Products hooks – TanStack Query wrappers.
 * Query keys: ["products", "recommended"] – refetch khi invalidate.
 */
import { useQuery } from "@tanstack/react-query";
import { getRecommendedProducts } from "./api";
import type { RecommendedProduct } from "./types";

export const productKeys = {
  all: ["products"] as const,
  recommended: (size = 20) => [...productKeys.all, "recommended", size] as const,
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
