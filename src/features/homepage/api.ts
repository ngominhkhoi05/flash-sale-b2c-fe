/**
 * Homepage API – gọi backend cho các section trang chủ Storefront.
 *
 * API endpoints:
 * - GET /api/v1/banners/home        → Hero + side banners
 * - GET /api/v1/categories           → Danh mục
 * - GET /api/v1/flash-sales/slots   → Flash sale slots
 * - GET /api/v1/vouchers/platform   → Platform vouchers
 * - GET /api/v1/stores/featured     → Featured stores (Vibe Mall)
 * - GET /api/v1/products/recommended → Recommended products
 *
 * Contract: http://180.93.137.28/swagger-ui (OpenAPI 3.1)
 */

import { apiFetch } from "@/lib/api";

// ─── Banner types ─────────────────────────────────────────────────────────────

export interface BannerResponse {
  id: number;
  type: "HERO" | "FREESHIP" | "VOUCHER_NEW_SHOP" | "PROMOTION";
  position: number;
  imageUrl: string;
  imageAlt: string;
  ctaHref: string;
  ctaText: string | null;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

export interface HomeBannersResponse {
  mainSlides: BannerResponse[];
  sideBanners: BannerResponse[];
}

export async function fetchHomeBanners(): Promise<HomeBannersResponse> {
  return apiFetch<HomeBannersResponse>("/api/v1/banners/home");
}

// ─── Category types ───────────────────────────────────────────────────────────

export interface CategoryResponse {
  id: number;
  name: string;
  slug: string;
  commissionRate: number;
  description: string;
}

export async function fetchCategories(): Promise<CategoryResponse[]> {
  return apiFetch<CategoryResponse[]>("/api/v1/categories");
}

// ─── Flash Sale types ────────────────────────────────────────────────────────

export interface PublicFlashSaleItemResponse {
  id: number;
  slotId: number;
  variantId: number;
  sku: string;
  variantName: string;
  productName: string;
  imageUrl: string;
  originalPrice: number;
  flashSalePrice: number;
  allocatedStock: number;
  availableStock: number;
  userPurchaseLimit: number;
  status: string;
}

export interface PublicFlashSaleSlotResponse {
  id: number;
  title: string;
  startTime: string;
  endTime: string;
  reservationTtlSeconds: number;
  status: string;
  items: PublicFlashSaleItemResponse[];
}

export async function fetchFlashSaleSlots(): Promise<PublicFlashSaleSlotResponse[]> {
  return apiFetch<PublicFlashSaleSlotResponse[]>("/api/v1/flash-sales/slots");
}

// ─── Voucher types ────────────────────────────────────────────────────────────

export interface VoucherResponse {
  id: number;
  code: string;
  storeId: number | null; // null = platform voucher
  discountType: string;
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount: number | null;
  totalQuantity: number;
  usedQuantity: number;
  userUsageLimit: number;
  startTime: string;
  endTime: string;
  status: string;
  createdAt: string;
}

export async function fetchPlatformVouchers(): Promise<VoucherResponse[]> {
  return apiFetch<VoucherResponse[]>("/api/v1/vouchers/platform");
}

// ─── Featured Store types ─────────────────────────────────────────────────────

export interface FeaturedStoreResponse {
  id: number;
  name: string;
  logoUrl: string;
  verified: boolean;
  rating: number;
  totalRatings: number;
  followers: number;
  productThumbnails: string[];
  totalProducts: number;
  createdAt: string;
}

export async function fetchFeaturedStores(
  limit = 4
): Promise<FeaturedStoreResponse[]> {
  return apiFetch<FeaturedStoreResponse[]>("/api/v1/stores/featured", {
    query: { limit },
  });
}

// ─── Recommended Products types ───────────────────────────────────────────────

export interface RecommendedProductResponse {
  id: number;
  storeId: number;
  storeName: string;
  name: string;
  imageUrl: string;
  minPrice: number;
  maxPrice: number;
  totalStock: number;
  totalSold: number;
  label: string | null;
}

export interface RecommendedProductsResponse {
  forYou: RecommendedProductResponse[];
  bestSellers: RecommendedProductResponse[];
  hotDeals: RecommendedProductResponse[];
}

export type RecommendedTab = "all" | "for_you" | "best_seller" | "hot_deal";

export async function fetchRecommendedProducts(
  tab: RecommendedTab = "all",
  categoryId?: number,
  limit = 10
): Promise<RecommendedProductsResponse> {
  return apiFetch<RecommendedProductsResponse>(
    "/api/v1/products/recommended",
    {
      query: { tab, ...(categoryId ? { categoryId } : {}), limit },
    }
  );
}
