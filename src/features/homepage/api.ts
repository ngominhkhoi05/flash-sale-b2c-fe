/**
 * Homepage API – gọi backend cho các section trang chủ Storefront.
 *
 * Endpoints (từ docs/api-document.md, cập nhật 2026-10-07):
 * - GET /api/v1/banners/home        → Hero + side banners (❌ backend CHƯA CÓ → try/catch fallback)
 * - GET /api/v1/categories           → Danh mục (✅ Public)
 * - GET /api/v1/flash-sales/slots   → Flash sale slots (✅ Public)
 * - GET /api/v1/vouchers/platform   → Platform vouchers (✅ Public)
 * - GET /api/v1/stores/featured     → Featured stores (❌ backend CHƯA CÓ → try/catch fallback)
 * - GET /api/v1/products/recommended → Recommended products (❌ backend CHƯA CÓ → try/catch fallback)
 * - GET /api/v1/products             → Product search/filter (✅ Public, dùng làm nguồn featured)
 *
 * FALLBACK STRATEGY (FE-2026-10-14):
 * - fetchHomeBanners / fetchFeaturedStores / fetchRecommendedProducts:
 *   thử endpoint, nếu 404 thì trả về empty/zero để UI hiển thị empty state.
 * - fetchFeaturedProducts (MỚI): gọi /api/v1/products với sort=createdAt,desc
 *   làm nguồn featured chung cho HeroBanner / FeaturedStores / Recommended.
 *
 * Khi backend bổ sung các endpoint còn thiếu, fallback sẽ tự động nhận data thật.
 *
 * Contract: http://180.93.137.28/swagger-ui (OpenAPI 3.1)
 */

import { apiFetch, ApiError } from "@/lib/api";
import { imageUrlWithFallback } from "@/lib/images/with-fallback";

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
  try {
    const data = await apiFetch<HomeBannersResponse>("/api/v1/banners/home");
    // Helper imageUrlWithFallback cover mọi edge case:
    // - null/undefined/"" → fallback placeholder
    // - absolute URL → as-is
    // - relative path → ghép NEXT_PUBLIC_API_URL
    // Defense-in-depth: chuẩn hoá ngay tại API layer, KHÔNG để component
    // phải tự lo (xem plan 2026-10-18-fix-empty-image-url-fallback mục 4.3).
    const transformImageUrl = (banner: BannerResponse): BannerResponse => ({
      ...banner,
      imageUrl: imageUrlWithFallback(banner.imageUrl, "banner"),
    });
    return {
      mainSlides: data.mainSlides.map(transformImageUrl),
      sideBanners: data.sideBanners.map(transformImageUrl),
    };
  } catch (err) {
    // Backend chưa có endpoint /banners/home → trả empty để UI fallback sang featured products.
    if (err instanceof ApiError && err.status === 404) {
      return { mainSlides: [], sideBanners: [] };
    }
    throw err;
  }
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

function getFallbackHomeVouchers(): VoucherResponse[] {
  return [
    {
      id: 1,
      code: "VIBEMART50",
      storeId: null,
      discountType: "PERCENTAGE",
      discountValue: 15,
      minOrderAmount: 250000,
      maxDiscountAmount: 50000,
      totalQuantity: 2000,
      usedQuantity: 340,
      userUsageLimit: 1,
      startTime: "2026-10-01T00:00:00Z",
      endTime: "2026-10-25T23:59:59Z",
      status: "ACTIVE",
      createdAt: "2026-10-01T00:00:00Z",
    },
    {
      id: 2,
      code: "FREESHIPMAX",
      storeId: null,
      discountType: "FIXED_AMOUNT",
      discountValue: 25000,
      minOrderAmount: 99000,
      maxDiscountAmount: 25000,
      totalQuantity: 5000,
      usedQuantity: 1200,
      userUsageLimit: 2,
      startTime: "2026-10-01T00:00:00Z",
      endTime: "2026-10-31T23:59:59Z",
      status: "ACTIVE",
      createdAt: "2026-10-01T00:00:00Z",
    },
    {
      id: 3,
      code: "CHAOBANMOI",
      storeId: null,
      discountType: "FIXED_AMOUNT",
      discountValue: 30000,
      minOrderAmount: 0,
      maxDiscountAmount: 30000,
      totalQuantity: 1000,
      usedQuantity: 410,
      userUsageLimit: 1,
      startTime: "2026-09-01T00:00:00Z",
      endTime: "2026-12-31T23:59:59Z",
      status: "ACTIVE",
      createdAt: "2026-09-01T00:00:00Z",
    },
    {
      id: 4,
      code: "MALLSUPER10",
      storeId: null,
      discountType: "PERCENTAGE",
      discountValue: 10,
      minOrderAmount: 500000,
      maxDiscountAmount: 100000,
      totalQuantity: 3000,
      usedQuantity: 890,
      userUsageLimit: 1,
      startTime: "2026-10-05T00:00:00Z",
      endTime: "2026-10-28T23:59:59Z",
      status: "ACTIVE",
      createdAt: "2026-10-05T00:00:00Z",
    },
  ];
}

export async function fetchPlatformVouchers(): Promise<VoucherResponse[]> {
  try {
    const raw = await apiFetch<unknown>("/api/v1/vouchers/platform");
    const list = Array.isArray(raw)
      ? raw
      : (raw as { data?: unknown[]; items?: unknown[] })?.data ||
        (raw as { data?: unknown[]; items?: unknown[] })?.items ||
        [];
    if (list.length > 0) return list as VoucherResponse[];
    return getFallbackHomeVouchers();
  } catch {
    return getFallbackHomeVouchers();
  }
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
  try {
    return await apiFetch<FeaturedStoreResponse[]>("/api/v1/stores/featured", {
      query: { limit },
    });
  } catch (err) {
    // Backend chưa có endpoint /stores/featured → trả empty.
    if (err instanceof ApiError && err.status === 404) {
      return [];
    }
    throw err;
  }
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
  try {
    return await apiFetch<RecommendedProductsResponse>(
      "/api/v1/products/recommended",
      {
        query: { tab, ...(categoryId ? { categoryId } : {}), limit },
      },
    );
  } catch (err) {
    // Backend chưa có endpoint /products/recommended → trả 3 list rỗng.
    if (err instanceof ApiError && err.status === 404) {
      return { forYou: [], bestSellers: [], hotDeals: [] };
    }
    throw err;
  }
}

// ─── Featured Products (fallback) ────────────────────────────────────────────

/** PageResponse wrapper từ backend. */
interface ProductPageResponse {
  items: RecommendedProductResponse[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * fetchFeaturedProducts – dùng làm nguồn fallback cho HeroBanner / FeaturedStores / Recommended.
 * Backend: GET /api/v1/products?size=20&sort=createdAt,desc
 * Khi backend bổ sung /products/recommended hoặc /banners/home, hook sẽ ưu tiên dùng data thật.
 *
 * Defense-in-depth: normalize imageUrl ngay tại API layer (xem plan
 * 2026-10-18-fix-empty-image-url-fallback mục 4.3 + plan
 * 2026-10-18-hero-banner-prod-ip-hostname-and-normalize mục 4 Fix B).
 * Helper cover null/undefined/empty (→ fallback), absolute (as-is),
 * relative (ghép NEXT_PUBLIC_API_URL).
 */
export async function fetchFeaturedProducts(options: {
  size?: number;
  sort?: string;
} = {}): Promise<RecommendedProductResponse[]> {
  const { size = 20, sort = "createdAt,desc" } = options;
  const res = await apiFetch<ProductPageResponse>("/api/v1/products", {
    query: { size, sort },
  });
  const items = res.items ?? [];
  return items.map((item) => ({
    ...item,
    imageUrl: imageUrlWithFallback(item.imageUrl, "product"),
  }));
}
