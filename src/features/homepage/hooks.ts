/**
 * Homepage hooks – TanStack Query hooks cho các section trang chủ.
 *
 * Mỗi hook đều có:
 * - Query key chuẩn
 * - Stale time phù hợp
 * - Error handling
 */

import { useQuery } from "@tanstack/react-query";
import {
  fetchHomeBanners,
  fetchCategories,
  fetchFlashSaleSlots,
  fetchPlatformVouchers,
  fetchFeaturedStores,
  fetchRecommendedProducts,
  type HomeBannersResponse,
  type CategoryResponse,
  type PublicFlashSaleSlotResponse,
  type VoucherResponse,
  type FeaturedStoreResponse,
  type RecommendedProductsResponse,
  type RecommendedTab,
} from "./api";

// ─── Query keys ───────────────────────────────────────────────────────────────

export const homepageKeys = {
  all: ["homepage"] as const,
  banners: () => [...homepageKeys.all, "banners"] as const,
  categories: () => [...homepageKeys.all, "categories"] as const,
  flashSaleSlots: () => [...homepageKeys.all, "flash-sale-slots"] as const,
  vouchers: () => [...homepageKeys.all, "vouchers"] as const,
  featuredStores: () => [...homepageKeys.all, "featured-stores"] as const,
  recommended: (tab?: string) =>
    [...homepageKeys.all, "recommended", tab ?? "all"] as const,
};

// ─── Hooks ───────────────────────────────────────────────────────────────────

/**
 * Fetch home page banners (hero + side banners).
 * Cache: 15 phút.
 */
export function useHomeBanners() {
  return useQuery({
    queryKey: homepageKeys.banners(),
    queryFn: fetchHomeBanners,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}

/**
 * Fetch all categories.
 * Cache: 30 phút.
 */
export function useCategories() {
  return useQuery({
    queryKey: homepageKeys.categories(),
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

/**
 * Fetch flash sale slots với items.
 * Cache: 1 phút (realtime hơn vì flash sale time-sensitive).
 */
export function useFlashSaleSlots() {
  return useQuery({
    queryKey: homepageKeys.flashSaleSlots(),
    queryFn: fetchFlashSaleSlots,
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Fetch platform vouchers.
 * Cache: 15 phút.
 */
export function usePlatformVouchers() {
  return useQuery({
    queryKey: homepageKeys.vouchers(),
    queryFn: fetchPlatformVouchers,
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}

/**
 * Fetch featured stores (Vibe Mall).
 * Cache: 30 phút.
 */
export function useFeaturedStores(limit = 4) {
  return useQuery({
    queryKey: homepageKeys.featuredStores(),
    queryFn: () => fetchFeaturedStores(limit),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

/**
 * Fetch recommended products với tab support.
 * Cache: 5 phút.
 */
export function useRecommendedProducts(
  tab: RecommendedTab = "all",
  categoryId?: number,
  limit = 10
) {
  return useQuery({
    queryKey: homepageKeys.recommended(tab),
    queryFn: () => fetchRecommendedProducts(tab, categoryId, limit),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ─── Re-export types ─────────────────────────────────────────────────────────

export type {
  HomeBannersResponse,
  CategoryResponse,
  PublicFlashSaleSlotResponse,
  PublicFlashSaleItemResponse,
  VoucherResponse,
  FeaturedStoreResponse,
  RecommendedProductResponse,
  RecommendedProductsResponse,
} from "./api";
