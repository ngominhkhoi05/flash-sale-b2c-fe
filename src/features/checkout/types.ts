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

/** Saved address (snapshot from /api/v1/users/addresses → AddressResponse).
 * Field names match backend Swagger 2026-10-14: contactName, detailAddress, province. */
export interface Address {
  id: number;
  contactName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  detailAddress: string;
  latitude?: number | null;
  longitude?: number | null;
  isDefault: boolean;
}

export type PaymentMethod = "ZALOPAY" | "COD";

/** Một dòng sản phẩm trong đơn hàng kiện (sau khi group theo shop). */
export interface CheckoutItem {
  id: number;
  variantId: number;
  productName: string;
  variantName: string;
  /** NOTE: Backend OrderItemResponse KHÔNG có imageUrl.
   *  FE cần resolve ảnh từ product/variant API riêng. */
  imageUrl: string | null;
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
  /** NOTE: BE có thể không return — tạm nullable */
  estimatedDeliveryLabel?: string;
  /** NOTE: BE có thể không return — tạm nullable */
  shippingMethodLabel?: string;
  /** NOTE: BE có thể không return — tạm default 0 */
  shippingFee?: number;
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

/** Response từ API `POST /api/v1/checkout/apply-voucher`. */
export interface ApplyVoucherResponse {
  applied: boolean;
  voucher: Voucher;
  /** Tổng cập nhật sau khi áp voucher. */
  grandTotal: number;
  totalDiscount: number;
  /** Voucher không áp được vì lý do này (vd: "MIN_ORDER_NOT_MET"). */
  reasonCode?: string;
}

/** Request body cho `POST /api/v1/orders/checkout`. */
export interface SubmitOrderRequest {
  /** shippingAddressId (BE field). */
  addressId: number;
  paymentMethod: PaymentMethod;
  platformVoucherCode?: string;
  /** Map storeId -> voucher code + note. */
  shopSelections: Array<{
    storeId: number;
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
  orderCode: string;
  qrCodeUrl: string;
  expiresAt: string;
  amount: number;
  shopOrders: QrShopOrder[];
}
