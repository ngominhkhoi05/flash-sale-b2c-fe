/**
 * Products feature – types.
 * Gồm 2 lớp:
 *   1. API types – khớp response từ OpenAPI `http://180.93.137.28/v3/api-docs`
 *   2. UI types – merge API response + Stitch UI fields (mock hoặc computed)
 *
 * Khi BE bổ sung field mới → cập nhật API types + loại bỏ mock.
 */

/** ─── API Response Types (khớp OpenAPI) ─────────────────────────────────── */

/** GET /api/v1/products/{id} */
export interface ProductDetailResponse {
  id: number;
  storeId: number;
  storeName: string;
  categoryId: number;
  categoryName: string;
  name: string;
  imageUrl: string;
  description: string;
  tierVariationConfigs: TierVariationConfigDto[];
  status: string;
  createdAt: string;
  variants: ProductVariantResponse[];
  ratingAvg: number;
  ratingCount: number;
  soldCount: number;
  minPrice: number;
  maxPrice: number;
  discountPercent: number;
  images: ProductImageDto[];
  flashSales: ActiveFlashSaleDto[];
}

export interface ProductVariantResponse {
  id: number;
  productId: number;
  sku: string;
  variantName: string;
  attributes: Record<string, string>;
  originalPrice: number;
  stockQuantity: number;
  imageUrl: string;
  status: string;
  version: number;
  createdAt: string;
}

export interface ProductImageDto {
  id: number;
  url: string;
  isPrimary: boolean;
  displayOrder: number;
  alt: string;
}

export interface TierVariationConfigDto {
  name: string;
  options: string[];
}

export interface ActiveFlashSaleDto {
  flashSaleItemId: number;
  variantId: number;
  price: number;
  originalPrice: number;
  discountPercent: number;
  totalStock: number;
  soldStock: number;
  maxQtyPerUser: number;
  endsAt: string;
}

/** GET /api/v1/products */
export interface ProductSummaryResponse {
  id: number;
  storeId: number;
  storeName: string;
  categoryId: number;
  categoryName: string;
  name: string;
  imageUrl: string;
  minPrice: number;
  maxPrice: number;
  totalStock: number;
  status: string;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface ProductListParams {
  categoryId?: number;
  keyword?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  size?: number;
}

/** ─── UI Types (API + Stitch UI fields) ─────────────────────────────────── */

/**
 * ProductDetail – dùng trong UI.
 * Merge `ProductDetailResponse` (từ BE) + Stitch UI fields (mock/computed).
 * Fields đánh dấu `// mock` = BE chưa có, dùng mock tạm.
 */
export interface ProductDetail {
  // ── From API ──────────────────────────────────────────────────────────
  id: number;
  storeId: number;
  storeName: string;
  categoryId: number;
  categoryName: string;
  name: string;
  imageUrl: string;
  description: string;
  tierVariationConfigs: TierVariationConfig[];
  variants: ProductVariant[];
  status: string;
  createdAt: string;
  ratingAvg: number;
  ratingCount: number;
  soldCount: number;
  minPrice: number;
  maxPrice: number;
  discountPercent: number;
  images: ProductImage[];
  flashSale: FlashSaleInfo | null;

  // ── Stitch UI fields (mock) ─────────────────────────────────────────────
  /** Slug for URL – generated from name, not from BE */
  slug: string;
  questionCount: number;
  reviews: Review[];
  relatedSameStore: RecommendedProduct[];
  relatedBestSellers: RecommendedProduct[];
  specs: ProductSpecs;
  sizeChart: SizeChartRow[];
  features: ProductFeature[];
  descriptionRich: string[];
  storeProfile: StoreProfile;
  vouchers: ShopVoucher[];
  shipping: ShippingInfo;
  commitments: CommitmentBadge[];
}

/** ─── Shared Types (dùng chung FE-BE) ─────────────────────────────────── */

export interface ProductImage {
  id: number;
  url: string;
  alt: string;
  displayOrder: number;
  isPrimary: boolean;
}

export interface TierVariationConfig {
  name: string;
  options: string[];
}

/** Variant cho UI — thêm computed field `isDisabled` từ `stockQuantity`. */
export type ProductVariant = ProductVariantResponse & {
  /** Computed: true khi stockQuantity === 0 hoặc status OUT_OF_STOCK */
  isDisabled: boolean;
};

export interface FlashSaleInfo {
  flashSaleItemId: number;
  variantId: number;
  price: number;
  originalPrice: number;
  discountPercent: number;
  totalStock: number;
  soldStock: number;
  maxQtyPerUser: number;
  endsAt: string;
}

export interface Review {
  id: number;
  userId: number;
  userDisplayName: string;
  userAvatarColor: string;
  rating: number;
  content: string;
  variantSku: string;
  variantAttributes: Record<string, string>;
  mediaUrls: string[];
  sellerReply: ReviewReply | null;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

export interface ReviewReply {
  content: string;
  storeName: string;
  repliedAt: string;
}

export interface ProductSpecs {
  category: string;
  material: string;
  origin: string;
  style: string;
  sku: string;
  careInstructions: string;
}

export interface SizeChartRow {
  size: string;
  height: string;
  weight: string;
  width: string;
  length: string;
  isCurrent: boolean;
  isOutOfStock: boolean;
}

export interface ProductFeature {
  icon: string;
  iconBgClass: string;
  iconTextClass: string;
  title: string;
  description: string;
}

export interface StoreProfile {
  id: number;
  name: string;
  initials: string;
  initialsBgClass: string;
  isOfficial: boolean;
  ratingAvg: number;
  ratingCount: number;
  productCount: number;
  productCountUnit: string;
  responseRate: number;
  responseTimeLabel: string;
  joinedAt: string;
  lastActiveLabel: string;
}

export interface ShopVoucher {
  id: number;
  label: string;
}

export interface ShippingInfo {
  freeshipBadge: string;
  freeshipText: string;
  shipTo: string;
  estimatedDays: string;
}

export interface CommitmentBadge {
  icon: string;
  iconClass: string;
  label: string;
}

/** RecommendedProduct – subset của ProductSummaryResponse. */
export interface RecommendedProduct {
  id: string;
  name: string;
  imageUrl: string;
  imageAlt: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  rating?: number;
  totalSold?: number;
  location?: string;
  voucherLabel?: string;
  href: string;
}

export type ProductVariantMode = "standard" | "flash";

/** ─── Helper Functions ─────────────────────────────────────────────────── */

/**
 * Chuyển ProductDetailResponse (BE) → ProductDetail (UI).
 * Thêm computed fields + merge mock Stitch UI fields.
 */
export function mapProductDetailResponse(
  api: ProductDetailResponse,
  mockFields: Partial<ProductDetail>
): ProductDetail {
  const mapped: ProductDetail = {
    ...api,
    // Computed fields từ API
    slug: generateSlug(api.name),
    images: api.images.map((img) => ({
      ...img,
      alt: img.alt ?? api.name,
    })),
    variants: api.variants.map((v) => ({
      ...v,
      isDisabled: v.stockQuantity === 0 || v.status === "OUT_OF_STOCK",
    })),
    flashSale: api.flashSales[0] ?? null,
    // Stitch UI fields mặc định
    questionCount: 0,
    reviews: [],
    relatedSameStore: [],
    relatedBestSellers: [],
    specs: { category: "", material: "", origin: "", style: "", sku: "", careInstructions: "" },
    sizeChart: [],
    features: [],
    descriptionRich: [],
    storeProfile: {
      id: api.storeId,
      name: api.storeName,
      initials: "",
      initialsBgClass: "",
      isOfficial: false,
      ratingAvg: 0,
      ratingCount: 0,
      productCount: 0,
      productCountUnit: "mẫu",
      responseRate: 0,
      responseTimeLabel: "",
      joinedAt: "",
      lastActiveLabel: "",
    },
    vouchers: [],
    shipping: { freeshipBadge: "", freeshipText: "", shipTo: "", estimatedDays: "" },
    commitments: [],
  };

  // Merge mock fields (override defaults)
  return { ...mapped, ...mockFields };
}

/** Tạo slug từ tên sản phẩm (simple slugify). */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}
