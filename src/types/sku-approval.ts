export type SkuApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";
export type StoreBadgeType = "MALL" | "FAVORITE" | "NORMAL";
export type PriceAdvantageType = "WARNING_30_DAYS" | "BEST_60_DAYS" | "DEEP_DISCOUNT";

export interface SkuPriceAdvantage {
  type: PriceAdvantageType;
  message: string;
  tooltip?: string;
}

export interface SkuApprovalItem {
  id: number;
  slotId: number;
  productId: number;
  variantId: number;
  productName: string;
  variantName: string; // e.g. "Màu: Đen, Size: L"
  skuCode: string; // e.g. "AT-BLK-L"
  imageUrl: string;
  storeId: number;
  storeName: string; // e.g. "Coolmate Official"
  storeBadge: StoreBadgeType; // "MALL" | "FAVORITE" | "NORMAL"
  originalPrice: number; // e.g. 299000
  flashSalePrice: number; // e.g. 149000
  discountPercent: number; // e.g. 50
  priceAdvantage?: SkuPriceAdvantage;
  allocatedStock: number; // e.g. 50
  originalStock: number; // e.g. 248
  customerLimit: number; // e.g. 2
  submittedAt: string; // e.g. "09:30 Hôm nay"
  category: "fashion" | "tech" | "beauty" | "home";
  status: SkuApprovalStatus; // "PENDING" | "APPROVED" | "REJECTED"
  commissionOverride?: number; // e.g. 3.5 (%)
  rejectionReason?: string; // e.g. "Ảnh không đạt chuẩn bìa"
  rejectionNote?: string;
  reviewedAt?: string;
}

export interface SkuApprovalCounts {
  pending: number;
  approved: number;
  rejected: number;
}

export interface SkuApprovalFilter {
  search?: string;
  shopType?: string; // "" | "mall" | "favorite" | "normal"
  category?: string; // "" | "fashion" | "tech" | "beauty" | "home"
  discountRange?: string; // "" | "50" | "30" | "under30"
}
