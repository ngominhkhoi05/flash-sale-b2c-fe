/**
 * Products (recommended) feature – types.
 * Subset của `ProductSummaryResponse` (xem docs/api-reference.md) – chỉ giữ
 * field cần cho trang chủ.
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
