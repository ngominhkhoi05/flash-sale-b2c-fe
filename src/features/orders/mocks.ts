/**
 * Mock data cho trang Đặt hàng thành công (`/checkout/success`).
 *
 * Bám sát Stitch mockup (docs/superpowers/handoffs/dat-hang-thanh-cong.md):
 *  - 2 đơn: UTC Fashion Mall (FS-261001-A7K2Q) + TechZone Official (TZ-261001-B9X8M)
 *  - Tổng thanh toán: 1.292.000₫
 *  - Địa chỉ: Nguyễn Văn An, 450 Lê Văn Việt, TP. Thủ Đức
 *  - ETA: "Dự kiến giao ngày mai"
 */

import type { OrderSuccessView } from "./types";

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
