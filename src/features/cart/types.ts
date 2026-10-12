/**
 * Cart feature – types (rule features-migration).
 * Giỏ hàng của user đã đăng nhập. Trang stub `/cart` sẽ dùng những type này.
 *
 * Hiện tại chưa có API backend thật (xem handoff docs/handoffs/2026-10-10-frontend-storefront-homepage-api-requests.md).
 * Khi backend sẵn sàng, các function trong api.ts sẽ thay thế mock trả về.
 */
export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  imageUrl: string;
  variantLabel?: string; // vd: "Đen, Size M"
  quantity: number;
  unitPrice: number; // BigDecimal VND, dùng decimal.js ở tầng feature
  originalPrice?: number; // giá gốc (nếu có KM)
  storeId: string;
  storeName: string;
  inStock: boolean;
}

export interface CartSummary {
  totalItems: number; // tổng số lượng sản phẩm
  totalQuantity: number; // tổng qty (sum qty)
  subtotal: number; // tổng tiền trước giảm
  estimatedShipping: number; // phí ship dự kiến
  estimatedTotal: number; // subtotal + shipping
  appliedVoucherCode?: string;
  appliedVoucherDiscount?: number;
}
