/**
 * Orders – types dùng cho trang đặt hàng thành công (`/checkout/success`).
 *
 * OrderSuccessView là aggregate nhiều BackendOrderDetail (1 đơn / shop)
 * thành 1 view duy nhất hiển thị trên trang success.
 *
 * - orderCodes: mảng mã đơn BE trả (thường là ["FS-...", "TZ-..."])
 * - grandTotal: tổng cộng tất cả đơn (sum totalAmount)
 * - address: shipping address từ 1 trong các orders (giống nhau)
 * - orders: 1 row / shop, hiển thị tóm tắt trong breakdown card
 */

import type { BackendOrderAddress, BackendOrderDetail } from "./api";

/** Tóm tắt 1 đơn trong OrderSuccessView. */
export interface OrderSuccessRow {
  orderCode: string;
  storeId: number;
  storeName: string;
  storeBadge?: "Mall" | "OfficialMall" | "";
  amount: number;
  paymentStatus: string;
  paymentMethod: "ZALOPAY" | "COD";
}

/** Address snapshot cho trang success. */
export interface OrderSuccessAddress {
  recipientName: string;
  phone: string;
  fullAddress: string;
}

/** Top-level view cho trang `/checkout/success`. */
export interface OrderSuccessView {
  orderCodes: string[];
  grandTotal: number;
  totalItems: number;
  totalOrders: number;
  address: OrderSuccessAddress;
  orders: OrderSuccessRow[];
  /** UI-only label đã format sẵn, vd: "Dự kiến giao ngày mai". */
  estimatedDeliveryLabel: string;
}

/**
 * Adapter: chuyển 1+ BackendOrderDetail thành OrderSuccessView.
 *
 * Logic:
 *  - Lấy address từ order đầu tiên (BE đảm bảo address giống nhau).
 *  - Tổng tiền = sum totalAmount.
 *  - Tổng sản phẩm = sum items.length.
 *  - estimatedDeliveryLabel: mặc định "Dự kiến giao ngày mai"
 *    (sau này có thể tính từ confirmedAt + shipping sla).
 */
export function adaptOrdersToSuccessView(
  orders: BackendOrderDetail[],
  fallbackAddress?: BackendOrderAddress,
): OrderSuccessView {
  const first = orders[0];
  const addressSource = first?.shippingAddress ?? fallbackAddress;
  const grandTotal = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalItems = orders.reduce((sum, o) => sum + o.items.length, 0);

  return {
    orderCodes: orders.map((o) => o.orderCode),
    grandTotal,
    totalItems,
    totalOrders: orders.length,
    address: addressSource
      ? {
          recipientName: addressSource.recipientName,
          phone: addressSource.phone,
          fullAddress: addressSource.fullAddress,
        }
      : {
          recipientName: "",
          phone: "",
          fullAddress: "",
        },
    orders: orders.map((o) => ({
      orderCode: o.orderCode,
      storeId: o.storeId,
      storeName: o.storeName,
      amount: o.totalAmount,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod,
    })),
    estimatedDeliveryLabel: "Dự kiến giao ngày mai",
  };
}
