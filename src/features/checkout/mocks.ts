/**
 * Mock data for checkout – bám sát hiển thị Stitch L1–687.
 * Khi backend có endpoint thật (xem docs/superpowers/handoffs/2026-10-13-backend-gap-report.md),
 * chuyển sang gọi api.ts thật và xóa mocks.ts.
 */
import type {
  Address,
  CheckoutData,
  CheckoutShopGroup,
  Voucher,
} from "./types";

export const mockAddresses: Address[] = [
  {
    id: 1,
    recipientName: "Nguyễn Văn An",
    phone: "0901 234 567",
    street: "Số 450 Lê Văn Việt",
    ward: "Phường Tăng Nhơn Phú A",
    district: "TP. Thủ Đức",
    city: "TP. Hồ Chí Minh",
    isDefault: true,
  },
  {
    id: 2,
    recipientName: "Nguyễn Văn An (Văn phòng)",
    phone: "0901 234 567",
    street: "Tầng 25 Landmark 81, 720A Điện Biên Phủ",
    ward: "Phường 22",
    district: "Bình Thạnh",
    city: "TP. Hồ Chí Minh",
    isDefault: false,
  },
  {
    id: 3,
    recipientName: "Trần Thị Bình",
    phone: "0988 765 432",
    street: "Số 68 Đường Nguyễn Huệ",
    ward: "Phường Bến Nghé",
    district: "Quận 1",
    city: "TP. Hồ Chí Minh",
    isDefault: false,
  },
];

export const mockShopVouchers: Voucher[] = [
  {
    id: 101,
    code: "SHOP10K400",
    label: "Giảm 10K (Đơn từ 400K)",
    scope: "SHOP",
    discountAmount: 10000,
    minOrderValue: 400000,
  },
  {
    id: 102,
    code: "SHOP10K500",
    label: "Giảm 10K (Đơn từ 500K)",
    scope: "SHOP",
    discountAmount: 10000,
    minOrderValue: 500000,
  },
];

export const mockPlatformVouchers: Voucher[] = [
  {
    id: 201,
    code: "FREESHIP50K",
    label: "FREESHIP50K",
    scope: "PLATFORM",
    discountAmount: 50000,
    expiresAt: "2026-12-30T00:00:00Z",
  },
  {
    id: 202,
    code: "VIBE30K",
    label: "VIBE30K",
    scope: "PLATFORM",
    discountAmount: 30000,
    minOrderValue: 1000000,
    expiresAt: "2026-10-14T00:00:00Z",
    isDisabled: false,
  },
  {
    id: 203,
    code: "MEGA100K",
    label: "MEGA100K",
    scope: "PLATFORM",
    discountAmount: 100000,
    minOrderValue: 2000000,
    isDisabled: true,
    disabledReason: "Chưa đủ điều kiện (Thiếu 708.000₫)",
  },
];

const utcFashionGroup: CheckoutShopGroup = {
  storeId: 1,
  storeName: "UTC Fashion",
  storeBadge: "Mall",
  estimatedDeliveryLabel: "Ngày mai, 14:00 - 18:00",
  shippingMethodLabel: "Giao Hỏa Tốc",
  shippingFee: 15000,
  shopSubtotal: 548000,
  buyerNote: "",
  items: [
    {
      id: 100,
      variantId: 5,
      productName: "Áo thun unisex cotton UTC Basic thoáng khí cao cấp",
      variantName: "Trắng / Size M",
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuD8HBQHi7HeJbiH5sVh_yGFv1UP1D4nqQzcz_lX69CwLEgb8iXMkLpclvcanQecgIHs0_NZpWRbKXTzpqoG83Uha4von3IsQ6xFsAFsSd2vYkCsVdhRc-HW3Mb1EpFuxbnjVbhypuU5knrW9GL1BcJFJm8a4xXm-H0Lhj6lHr-NCpZLdaAOtegv0VHdMC1MmreHWlskkOb8B4DbVaupsB13sDm2E3B_Ji-iqN7FJ1PLwmEvbRg0ELtsvw",
      price: 199000,
      quantity: 2,
      itemSubtotal: 398000,
    },
    {
      id: 101,
      variantId: 6,
      productName: "Quần short thể thao co giãn 4 chiều UTC Pro Active",
      variantName: "Đen / Size L",
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDDoYLez4SxDH7L_COu4oc8hbQaUTyjdcySQvuA98Kqx_Mh8zF2jwqaV5ecLRtgRF3OZqXRfStZAGs81TozsyTGrILLFkT5ln-xtDcK5pEv96Zw2auBbHHPhX5guaofK4aC8xWXF6YPAVAPYb95H1o_vhYk12qy3WiUCk0u-G9OIvH6F2rQ2vzq-dS7uWRbzSdBAjmF5LdEc4v1afFwxbG_YYopcSJI_3XxNHnxUZC1jgK2vsYOOPcUYg",
      price: 150000,
      quantity: 1,
      itemSubtotal: 150000,
    },
  ],
  appliedShopVoucher: mockShopVouchers[0],
};

const techzoneGroup: CheckoutShopGroup = {
  storeId: 2,
  storeName: "TechZone",
  storeBadge: "OfficialMall",
  estimatedDeliveryLabel: "2 - 3 ngày tới",
  shippingMethodLabel: "Tiết kiệm",
  shippingFee: 15000,
  shopSubtotal: 749000,
  buyerNote: "",
  items: [
    {
      id: 200,
      variantId: 50,
      productName:
        "Tai nghe Bluetooth ANC chống ồn chủ động XYZ Pro Max Vibe Edition",
      variantName: "Đen nhám / Bản Pro Wireless",
      imageUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuB_DLJ46I9A0hrzdVvkOd7FbmjN3BVw1Q4bTWfQyVC1PwH8bSEKII7odTpiSSSGHTHjC15eUE18vDSTOOr4vRVIGT24hfZP5Eds2GbKHKZtk3gE-1sI8zJPazSlpifUyihpID6u9VIW2XCFtmyIhhJPN0-1gpc7nhsatXiQHZCfRP-rWLQNx3OvtnUcQgqzFlXoHVJR1JZbcCL2mOu6LnsILoDy94MxKLRp3urgSJoiTpo9Xy5BadwTfA",
      price: 749000,
      originalPrice: 890000,
      discountPercent: 16,
      quantity: 1,
      itemSubtotal: 749000,
    },
  ],
  appliedShopVoucher: mockShopVouchers[1],
};

/** Cart snapshot mock – 3 sản phẩm / 2 shop. */
export const mockCheckoutData: CheckoutData = {
  id: "checkout-snapshot-1",
  userId: 42,
  selectedAddress: mockAddresses[0],
  addresses: mockAddresses,
  shopGroups: [utcFashionGroup, techzoneGroup],
  goodsSubtotal: 1332000,
  shippingFee: 30000,
  totalDiscount: 70000,
  grandTotal: 1292000,
  appliedPlatformVoucher: mockPlatformVouchers[0],
  paymentMethod: "ZALOPAY",
  totalItems: 3,
  totalOrders: 2,
};
