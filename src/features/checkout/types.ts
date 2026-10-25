/**
 * Checkout feature – types.
 *
 * Domain model for the checkout page:
 *  - Address[] – saved addresses; user can pick default
 *  - Voucher (sàn + shop) – applied per store / per cart
 *  - ShopGroup[] – split by store (same shape as CartStoreGroup)
 *  - PaymentMethod – "ZALOPAY" | "COD"
 *  - CheckoutData – top-level aggregate returned by API
 *  - OrderResponse (subset) – response after submit
 *
 * NOTE: Most backend endpoints for checkout are still P0-blocker per
 * docs/superpowers/handoffs/2026-10-13-backend-gap-report.md.
 * Types below mirror the contract we expect — wire to real API when ready.
 */

/** Saved address (snapshot of UserResponse.addresses). */
export interface Address {
  id: number;
  recipientName: string;
  phone: string;
  street: string;
  ward: string;
  district: string;
  city: string;
  isDefault: boolean;
}

export type PaymentMethod = "ZALOPAY" | "COD";

/** Một dòng sản phẩm trong đơn hàng kiện (sau khi group theo shop). */
export interface CheckoutItem {
  id: number;
  variantId: number;
  productName: string;
  variantName: string;
  imageUrl: string;
  /** Đơn giá (có thể giảm nếu flash sale). */
  price: number;
  quantity: number;
  itemSubtotal: number;
  originalPrice?: number;
  discountPercent?: number;
}

/** Một kiện = 1 đơn sau khi tách theo shop. */
export interface CheckoutShopGroup {
  storeId: number;
  storeName: string;
  /** Mall | Official Mall | '' */
  storeBadge?: "Mall" | "OfficialMall" | "";
  /** ISO date hoặc label hiển thị luôn ("Ngày mai, 14:00 - 18:00"). */
  estimatedDeliveryLabel: string;
  /** Hiển thị kiểu giao ("Giao Hỏa Tốc" | "Tiết kiệm"). */
  shippingMethodLabel: string;
  shippingFee: number;
  items: CheckoutItem[];
  /** shopSubtotal = sum(itemSubtotal). */
  shopSubtotal: number;
  /** voucher shop đã chọn (nếu có). */
  appliedShopVoucher?: Voucher;
  /** Lời nhắn user nhập cho shop (per group). */
  buyerNote?: string;
}

export interface Voucher {
  id: number;
  code: string;
  /** Nhãn tiếng Việt user-facing (vd: "Giảm 10K đơn từ 400K"). */
  label: string;
  /** Mô tả ngắn UI-only (vd: "Đơn từ 1.000.000₫"). */
  shortDescription?: string;
  /** Loại – phân biệt shop voucher vs sàn voucher. */
  scope: "SHOP" | "PLATFORM";
  /** Giảm tiền cố định (vd: 10000). */
  discountAmount?: number;
  /** Hoặc giảm % (vd: 0.1 = 10%). */
  discountPercent?: number;
  /** Giảm tối đa khi dùng %. */
  maxDiscount?: number;
  /** Đơn tối thiểu để áp dụng (vd: 400000). */
  minOrderValue?: number;
  /** Còn hiệu lực đến (ISO). */
  expiresAt?: string;
  /** UI-only: nhãn ngày hết hạn đã format sẵn. */
  expiresAtLabel?: string;
  /** Trạng thái hiển thị (ACTIVE / EXPIRED / EXHAUSTED / DISABLED). */
  status?: "ACTIVE" | "EXPIRED" | "EXHAUSTED" | "DISABLED" | "AVAILABLE";
  /** UI-only: chuỗi hiển thị số tiền giảm (vd: "30.000₫"). */
  discountLabel?: string;
  /** True khi user không đủ điều kiện (mờ card). */
  isDisabled?: boolean;
  /** Lý do không đủ điều kiện (vd: "Thiếu 708.000₫"). */
  disabledReason?: string;
}

/** Response từ API `GET /api/v1/checkout`. */
export interface CheckoutData {
  id: string;
  userId: number;
  /** Địa chỉ user đã chọn (mặc định = địa chỉ mặc định). */
  selectedAddress: Address | null;
  addresses: Address[];
  shopGroups: CheckoutShopGroup[];
  /** Subtotal = sum(shopSubtotal) trước voucher/ship. */
  goodsSubtotal: number;
  shippingFee: number;
  /** Tổng các khoản giảm (shop voucher + sàn voucher). */
  totalDiscount: number;
  /** Tổng cuối = goodsSubtotal + shippingFee - totalDiscount. */
  grandTotal: number;
  /** Voucher sàn đã chọn. */
  appliedPlatformVoucher: Voucher | null;
  /** Phương thức thanh toán (mặc định ZaloPay). */
  paymentMethod: PaymentMethod;
  /** Tổng số sản phẩm (count items, không tính quantity). */
  totalItems: number;
  /** Số shop → số đơn sẽ tách. */
  totalOrders: number;
}

/** Response từ API `POST /api/v1/vouchers/apply` (Swagger 2026-10-17). */
export interface ApplyVoucherResponse {
  /** Voucher có áp dụng được không (discountAmount > 0). */
  applied: boolean;
  /** ID voucher từ BE. */
  voucherId: number;
  /** Mã voucher đã áp dụng. Caller dùng để match trong cache lấy full Voucher object. */
  code: string;
  /** Số tiền được giảm. */
  discountAmount: number;
  /** Tổng tiền cuối sau khi áp voucher. */
  finalAmount: number;
  // ── Backward-compat aliases (giữ cho caller cũ không phải sửa) ──
  /** Alias của `finalAmount`. */
  grandTotal: number;
  /** Alias của `discountAmount`. */
  totalDiscount: number;
  /** Stub Voucher tối thiểu (id + code). Caller nên match trong cache để có full info. */
  voucher: Voucher;
  /** Lý do không áp được (optional, hiện BE không trả — để backward-compat). */
  reasonCode?: string;
}

/** Request body cho `POST /api/v1/orders/checkout`. */
export interface SubmitOrderRequest {
  /** shippingAddressId (BE field). */
  addressId: number;
  paymentMethod: PaymentMethod;
  /**
   * @deprecated BE Swagger 2026-10-18 không có `platformVoucherCode`
   * ở top-level `CreateOrderRequest`. Giữ field này cho tương thích
   * caller cũ — submitOrder sẽ KHÔNG forward lên BE (xem Bug #3).
   * Sẽ xoá khi có quyết định BE về voucher sàn.
   */
  platformVoucherCode?: string;
  /** Map storeId -> voucher code + note + items[]. */
  shopSelections: Array<{
    storeId: number;
    /** Items trong cart của user — BẮT BUỘC gửi theo Swagger. */
    items: Array<{ variantId: number; quantity: number }>;
    shopVoucherCode?: string;
    buyerNote?: string;
  }>;
  /** Idempotency-Key để chống double submit. (Optional trong body, thường gửi qua header.) */
  idempotencyKey?: string;
}

/** Response từ API `POST /api/v1/checkout/submit`. */
export interface OrderSubmitResponse {
  /** Mã đơn hiển thị cho user. */
  orderCode: string;
  /** QR URL nếu ZaloPay. */
  paymentUrl?: string;
  qrCodeUrl?: string;
  expiresAt?: string;
  status: "PENDING_PAYMENT" | "PAID" | "FAILED";
  orderIds: number[];
}

// ─── QR payment page types ────────────────────────────────────────────────

/**
 * Per-shop summary shown on the ZaloPay QR page right column.
 * Mirrors `QrOrderDetail.shopOrders` in api.ts.
 */
export interface QrShopOrder {
  orderId?: number;
  storeId: number;
  storeName: string;
  storeBadge?: "Mall" | "OfficialMall" | "";
  orderCode: string;
  amount: number;
  itemSummary: string;
}

/**
 * Top-level detail used by the QR payment page.
 * Re-exported from api.ts so feature consumers don't import from api directly.
 */
export interface QrOrderDetail {
  orderId?: number;
  orderCode: string;
  paymentStatus?: string;
  paymentUrl?: string;
  qrCodeUrl: string;
  expiresAt: string;
  amount: number;
  shopOrders: QrShopOrder[];
}
