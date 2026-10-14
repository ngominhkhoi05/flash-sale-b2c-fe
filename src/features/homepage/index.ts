/**
 * Homepage feature public API.
 *
 * Components cho từng section sống trong `src/components/storefront/sections/`.
 * File này re-export types + hooks cho consumer dễ dùng (`@/features/homepage`).
 */

export type {
  BannerResponse,
  HomeBannersResponse,
  CategoryResponse,
  PublicFlashSaleItemResponse,
  PublicFlashSaleSlotResponse,
  VoucherResponse,
  FeaturedStoreResponse,
  RecommendedProductResponse,
  RecommendedProductsResponse,
  RecommendedTab,
} from "./api";

export {
  fetchHomeBanners,
  fetchCategories,
  fetchFlashSaleSlots,
  fetchPlatformVouchers,
  fetchFeaturedStores,
  fetchFeaturedProducts,
  fetchRecommendedProducts,
} from "./api";

export {
  useHomeBanners,
  useCategories,
  useFlashSaleSlots,
  usePlatformVouchers,
  useFeaturedStores,
  useFeaturedProducts,
  useRecommendedProducts,
  homepageKeys,
} from "./hooks";
