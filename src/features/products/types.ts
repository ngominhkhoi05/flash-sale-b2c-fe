/**
 * Products (detail) feature – types.
 *
 * Mirror `ProductDetailResponse` của BE (Swagger: `http://180.93.137.28/v3/api-docs`).
 * 1:1 với response runtime — không thêm field Stitch-only ở đây (xem README plan).
 *
 * Lưu ý `RecommendedProduct` được re-export từ feature homepage (xem
 * src/features/homepage/types.ts) — KHÔNG nằm trong scope của file này nữa.
 * Dùng `RelatedProductSummary` cho related/best-sellers trên product detail.
 */

// (Không import RecommendedProduct ở đây để tránh circular dependency.)

/**
 * RecommendedProduct – subset của ProductSummaryResponse (BE).
 * Re-export từ homepage (xem src/features/homepage/types.ts) cho compatibility.
 * KHÔNG dùng cho product-detail related/best-sellers (xem RelatedProductSummary).
 *
 * @deprecated dùng RelatedProductSummary cho product-detail related/best-sellers.
 *             Homepage / search vẫn dùng type này.
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
 * RelatedProductSummary – mirror `ProductSummaryResponse` của BE.
 * Dùng cho `ProductDetail.relatedSameStore` / `relatedBestSellers`.
 *
 * Schema BE:
 *   {
 *     id, storeId, storeName, categoryId, categoryName,
 *     name, imageUrl, minPrice, maxPrice, totalStock, status, createdAt
 *   }
 *
 * Field dẫn xuất cho FE:
 *   - `href`: gen từ `name` (slugifyAscii) — chỗ nào cần link, FE gen.
 *   - `price`: dùng `minPrice` (BE không trả discountPercent cho summary).
 */
export interface RelatedProductSummary {
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

/**
 * DescriptionRichDto – mirror `descriptionRich` object của BE.
 *
 * Schema BE:
 *   { intro: string, highlights: string[], paragraphs: string[] }
 *
 * FE render 3 section: intro paragraph + bullets + multi-paragraph.
 */
export interface DescriptionRichDto {
  intro: string;
  highlights: string[];
  paragraphs: string[];
}

/**
 * ProductSpecsDto – mirror `specs` object của BE.
 *
 * Schema BE:
 *   { origin, weight, material, warranty }
 */
export interface ProductSpecsDto {
  origin: string;
  weight: string;
  material: string;
  warranty: string;
}

/**
 * SizeChartDimensionDto – mirror dimension row trong `sizeChart` BE.
 * Schema BE: { width_cm, height_cm }
 */
export interface SizeChartDimensionDto {
  width_cm: number;
  height_cm: number;
}

/**
 * SizeChartDto – mirror `sizeChart` object của BE.
 *
 * Schema BE:
 *   {
 *     large: { width_cm, height_cm },
 *     standard: { width_cm, height_cm }
 *   }
 */
export interface SizeChartDto {
  large: SizeChartDimensionDto;
  standard: SizeChartDimensionDto;
}

/**
 * ActiveFlashSaleDto – mirror `ActiveFlashSaleDto` trong `ProductDetailResponse.flashSales[]`.
 *
 * Schema BE:
 *   {
 *     slotId, slotStartTime, slotEndTime, slotStatus,
 *     itemId, variantId, originalPrice, flashSalePrice, stockAvailable
 *   }
 *
 * BE đặt product detail có thể tham gia nhiều flash sale slot (array).
 * FE pick `flashSales[0]` (slot ACTIVE, gần nhất) để hiển thị.
 *
 * Field dẫn xuất FE sẽ tự compute:
 *   - `totalStock` = `stockAvailable + soldStock` (BE không trả soldStock ở đây,
 *     phải derive từ variant.stockQuantity ban đầu — tạm thời hiển thị `stockAvailable`).
 *   - `soldPercent` = compute từ stockAvailable nếu biết totalStock ban đầu.
 *   - `endsAt` = `slotEndTime`.
 *   - `maxQtyPerUser`: BE không trả → null + ẩn stock bar (defer).
 *   - `discountPercent`: BE không trả → compute từ originalPrice/flashSalePrice.
 */
export interface ActiveFlashSaleDto {
  slotId: number;
  slotStartTime: string;
  slotEndTime: string;
  slotStatus: string;
  itemId: number;
  variantId: number;
  originalPrice: number;
  flashSalePrice: number;
  stockAvailable: number;
}

/**
 * RatingDistributionDto – mirror `ratingDistribution` object của BE.
 * Bổ sung cho ProductReviewsCard (optional, hiện tại FE không dùng).
 */
export interface RatingDistributionDto {
  stars5: number;
  stars4: number;
  stars3: number;
  stars2: number;
  stars1: number;
}

/**
 * ProductDetail – mirror `ProductDetailResponse` của BE.
 *
 * Lưu ý:
 * - `flashSale` (singular, cũ) → thay bằng `flashSales: ActiveFlashSaleDto[]`.
 * - `specs` (ProductSpecs cũ) → `ProductSpecsDto`.
 * - `sizeChart` (SizeChartRow[] cũ) → `SizeChartDto`.
 * - `features` (ProductFeature[] cũ) → `string[]`.
 * - `descriptionRich` (string[] cũ) → `DescriptionRichDto`.
 * - `minPrice`/`maxPrice` có thể null (BE có thể null khi variant chưa set).
 * - `relatedSameStore`/`relatedBestSellers` (RecommendedProduct[] cũ) → RelatedProductSummary[].
 * - `reviews`/`questionCount`: BE tách endpoint riêng `/products/{id}/reviews` —
 *   product-detail response KHÔNG có. FE sẽ empty khi gọi API thật; defer review integration.
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
  description: string;
  tierVariationConfigs: TierVariationConfig[];
  variants: ProductVariant[];
  status: string;
  createdAt: string;

  ratingAvg: number;
  ratingCount: number;
  soldCount: number;
  questionCount: number;
  /** BE có thể trả null (vd product mới chưa có variant). */
  minPrice: number | null;
  maxPrice: number | null;
  discountPercent: number | null;
  images: ProductImage[];
  /** BE trả array. FE pick `flashSales[0]` (slot ACTIVE) để render UI. */
  flashSales: ActiveFlashSaleDto[];
  /** Object BE shape. Không phải string[] HTML như trước. */
  descriptionRich: DescriptionRichDto;
  /** Object BE shape (4 field). */
  specs: ProductSpecsDto;
  /** Array of plain text (BE shape). Không phải ProductFeature[] như trước. */
  features: string[];
  commitments: BackendProductCommitment | null;
  vouchers: ShopVoucher[] | null;
  /** BE không trả `joinedAt`. Bỏ field này. */
  storeProfile: StoreProfile;
  shipping: ShippingInfo;
  /** Object BE shape {large, standard}. Không phải SizeChartRow[] như trước. */
  sizeChart: SizeChartDto;
  /** Bổ sung từ BE — chưa dùng trong UI hiện tại. */
  ratingDistribution: RatingDistributionDto;
  /** Empty khi gọi API thật (BE tách endpoint reviews riêng). FE mock có 3 review. */
  reviews: Review[];
  relatedSameStore: RelatedProductSummary[];
  relatedBestSellers: RelatedProductSummary[];
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

/**
 * Review – mirror `ProductReviewResponse` của BE (endpoint `/products/{id}/reviews`).
 * Hiện tại `ProductDetail.reviews` được mock — khi gọi API thật, reviews sẽ empty
 * và FE phải fetch qua endpoint reviews riêng (defer — xem plan 2026-10-12 mục 1.2).
 */
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

/**
 * ShopVoucher – mirror ShopVoucher nhỏ (id, label) dùng cho ProductVouchers section.
 */
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

/**
 * StoreProfile – mirror `storeProfile` trong ProductDetailResponse của BE.
 *
 * Schema BE:
 *   { id, name, initials, isOfficial, ratingAvg, ratingCount, productCount,
 *     responseRate, responseTimeLabel, lastActiveLabel }
 *
 * BE KHÔNG trả `joinedAt` (đã bỏ khỏi interface).
 */
export interface StoreProfile {
  id: number;
  name: string;
  initials: string;
  initialsBgClass?: string; // Bổ sung FE (Stitch design — UI render chip)
  isOfficial: boolean;
  ratingAvg: number;
  ratingCount: number;
  productCount: number;
  productCountUnit?: string; // Bổ sung FE (Stitch — vd "mẫu")
  responseRate: number;
  responseTimeLabel: string;
  lastActiveLabel: string;
}

export type ProductVariantMode = "standard" | "flash";