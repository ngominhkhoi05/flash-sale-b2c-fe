/**
 * Products (detail) feature – types.
 * Mở rộng `ProductSummaryResponse` (BE) với các field Stitch cần hiển thị.
 * Khi BE bổ sung các field còn thiếu, sẽ migrate sang gọi API thật (xem
 * docs/superpowers/plans/2026-10-12-product-detail-be-required.md).
 *
 * Lưu ý: `RecommendedProduct` được re-export từ "./types" cũ (xem index.ts
 * của feature cart hoặc các feature khác dùng chung). Để tránh circular
 * import, type này được import từ file này trong mock.ts/hooks.ts.
 */

// (Không import RecommendedProduct ở đây để tránh circular dependency.)

/**
 * RecommendedProduct – subset của ProductSummaryResponse (BE).
 * Đã có từ trước (dùng cho trang chủ Recommended Section), giữ lại để
 * dùng cho related products trong product detail page.
 */
export interface RecommendedProduct {
  id: string;
  name: string;
  imageUrl: string;
  imageAlt: string;
  /** Giá hiện tại (đã giảm nếu có KM). */
  price: number;
  /** Giá gốc (nếu có KM). */
  originalPrice?: number;
  discountPercent?: number;
  rating?: number;
  totalSold?: number;
  location?: string;
  voucherLabel?: string; // vd: "Giảm 10K", "Freeship"
  href: string;
}

/**
 * ProductDetail – mirror `ProductDetailResponse` của BE + bổ sung field
 * Stitch yêu cầu mà BE chưa trả (đánh dấu `// BE PENDING`).
 */
export interface ProductDetail {
  id: number;
  slug: string;
  storeId: number;
  storeName: string;
  categoryId: number;
  categoryName: string;
  name: string;
  imageUrl: string;
  images: ProductImage[];
  description: string;
  tierVariationConfigs: TierVariationConfig[];
  /** Variants (BE có field này, nhưng đảm bảo rõ trong FE type). */
  variants: ProductVariant[];
  status: string;
  createdAt: string;

  // ── BE PENDING: chưa có trong ProductDetailResponse ────────────────────
  ratingAvg: number;
  ratingCount: number;
  soldCount: number;
  questionCount: number;
  minPrice: number;
  maxPrice: number;
  discountPercent: number | null;
  flashSale: FlashSaleInfo | null;
  reviews: Review[];
  relatedSameStore: RecommendedProduct[];
  relatedBestSellers: RecommendedProduct[];
  specs: ProductSpecs;
  sizeChart: SizeChartRow[];
  features: ProductFeature[];
  descriptionRich: string[];
  storeProfile: StoreProfile;
  vouchers: ShopVoucher[] | null;
  shipping: ShippingInfo;
  /** Mirror `ProductCommitmentsResponse` của BE (xem Swagger). BE có thể
   * trả về `null` khi store chưa cấu hình cam kết. */
  commitments: BackendProductCommitment | null;
}

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

/**
 * ProductVariant – mirror `ProductVariantResponse` của BE + bổ sung flag
 * disabled (size hết hàng) để UI render.
 */
export interface ProductVariant {
  id: number;
  productId: number;
  sku: string;
  variantName: string;
  attributes: Record<string, string>;
  originalPrice: number;
  stockQuantity: number;
  imageUrl: string | null;
  status: "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK";
  /** Bổ sung ở FE: variant nào disable trong UI (vd size XL hết hàng). */
  isDisabled: boolean;
  version: number;
  createdAt: string;
}

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

/**
 * BackendProductCommitment – mirror `ProductCommitmentsResponse` của BE.
 *
 * Ví dụ response thật:
 * ```json
 * {
 *   "return_days": 7,
 *   "warranty_months": 3,
 *   "authentic_guarantee": true,
 *   "shipping_time_hours": 48,
 *   "free_shipping_threshold": 0
 * }
 * ```
 *
 * FE render tối đa 3 badge (theo Stitch design): đổi trả / bảo hành /
 * chính hãng. Các field còn lại (`shipping_time_hours`,
 * `free_shipping_threshold`) đã được dùng ở `ShippingInfo` section.
 */
export interface BackendProductCommitment {
  return_days: number;
  warranty_months: number;
  authentic_guarantee: boolean;
  shipping_time_hours: number;
  free_shipping_threshold: number;
}

export type ProductVariantMode = "standard" | "flash";
