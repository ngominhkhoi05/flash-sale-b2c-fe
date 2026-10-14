/**
 * Mock data cho trang Đặt hàng thành công (`/checkout/success`).
 *
 * Bám sát Stitch mockup (docs/superpowers/handoffs/dat-hang-thanh-cong.md):
 *  - 2 đơn: UTC Fashion Mall (FS-261001-A7K2Q) + TechZone Official (TZ-261001-B9X8M)
 *  - Tổng thanh toán: 1.292.000₫
 *  - Địa chỉ: Nguyễn Văn An, 450 Lê Văn Việt, TP. Thủ Đức
 *  - ETA: "Dự kiến giao ngày mai"
 */

import type { OrderSuccessView, OrderFailedView } from "./types";

export const mockOrderSuccessView: OrderSuccessView = {
  orderCodes: ["FS-261001-A7K2Q", "TZ-261001-B9X8M"],
  grandTotal: 1_292_000,
  totalItems: 3,
  totalOrders: 2,
  address: {
    recipientName: "Nguyễn Văn An",
    phone: "0901 234 567",
    fullAddress: "450 Lê Văn Việt, Tăng Nhơn Phú A, TP. Thủ Đức, TP.HCM",
  },
  orders: [
    {
      orderCode: "FS-261001-A7K2Q",
      storeId: 1,
      storeName: "UTC Fashion Mall",
      storeBadge: "Mall",
      amount: 538_000,
      paymentStatus: "SUCCESS",
      paymentMethod: "ZALOPAY",
    },
    {
      orderCode: "TZ-261001-B9X8M",
      storeId: 2,
      storeName: "TechZone Official",
      storeBadge: "OfficialMall",
      amount: 754_000,
      paymentStatus: "SUCCESS",
      paymentMethod: "ZALOPAY",
    },
  ],
  estimatedDeliveryLabel: "Dự kiến giao ngày mai",
};

/**
 * Mock data cho trang Thanh toán chưa thành công (`/checkout/failed`).
 *
 * Bám sát Stitch mockup (docs/superpowers/handoffs/thanh-toan-chua-thanh-cong.md):
 *  - 2 đơn: UTC Fashion Mall + TechZone Official
 *  - Mã giao dịch: 261001_000245
 *  - Tổng tiền: 1.292.000₫ (hiển thị đỏ)
 *  - Lý do: "Tài khoản không đủ số dư hoặc đã quá thời gian xác thực OTP"
 *  - Có voucher Flash Sale giảm 80K sắp hết hạn
 *  - Held until = now + 4:15 (match Stitch countdown "Còn 04:15")
 */
export const mockOrderFailedView: OrderFailedView = {
  orderCodes: ["FS-261001-A7K2Q", "TZ-261001-B9X8M"],
  transactionId: "261001_000245",
  grandTotal: 1_292_000,
  // Set heldUntil = now + 4 phút 15 giây (match Stitch mockup "Còn 04:15").
  // Sử dụng Date.now() khi load module để countdown luôn bắt đầu từ 4:15.
  heldUntil: new Date(Date.now() + 4 * 60 * 1000 + 15 * 1000).toISOString(),
  rejectionReason:
    "Tài khoản không đủ số dư hoặc đã quá thời gian xác thực OTP.",
  voucherWarning: {
    description: "voucher Flash Sale giảm 80K",
    expiresAt: new Date(Date.now() + 4 * 60 * 1000 + 15 * 1000).toISOString(),
  },
  address: {
    recipientName: "Nguyễn Văn An",
    phone: "0901 234 567",
    fullAddress: "450 Lê Văn Việt, Tăng Nhơn Phú A, TP. Thủ Đức, TP.HCM",
  },
  paymentMethod: "ZALOPAY",
};
