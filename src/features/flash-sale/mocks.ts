/**
 * Mock data cho Flash Sale feature.
 *
 * Rule §7: dùng khi backend chưa sẵn sàng, types phải khớp DTO thật.
 * Bật bằng NEXT_PUBLIC_USE_MOCK=true (nếu cần) hoặc fallback khi API fail.
 *
 * Mỗi mock item phải pass Zod schema ở schemas.ts.
 */

import type { PublicFlashSaleSlotResponse } from "./types";

/** Tính ISO datetime tương đối so với hiện tại. */
function relativeIso(deltaMs: number): string {
  return new Date(Date.now() + deltaMs).toISOString();
}

/** Mock 1 item Flash Sale. */
function mockItem(
  id: number,
  slotId: number,
  opts: {
    productName: string;
    variantName: string;
    imageUrl: string;
    originalPrice: number;
    flashSalePrice: number;
    allocatedStock: number;
    availableStock: number;
    userPurchaseLimit: number;
    productId?: number;
    categoryId?: number;
    categoryName?: string;
    categorySlug?: string;
  },
): PublicFlashSaleSlotResponse["items"][number] {
  return {
    id,
    slotId,
    productId: opts.productId ?? id,
    variantId: id * 10,
    categoryId: opts.categoryId ?? 1,
    categoryName: opts.categoryName ?? "Điện tử",
    categorySlug: opts.categorySlug ?? "dien-tu",
    sku: `MOCK-${id.toString().padStart(4, "0")}`,
    variantName: opts.variantName,
    productName: opts.productName,
    imageUrl: opts.imageUrl,
    originalPrice: opts.originalPrice,
    flashSalePrice: opts.flashSalePrice,
    allocatedStock: opts.allocatedStock,
    availableStock: opts.availableStock,
    userPurchaseLimit: opts.userPurchaseLimit,
    status: "APPROVED",
  };
}

// ─── ACTIVE slot (12:00 - hiện tại) ───────────────────────────────────────
const activeSlot: PublicFlashSaleSlotResponse = {
  id: 101,
  title: "Flash Sale 12:00 - Hôm nay",
  startTime: relativeIso(-1000 * 60 * 60), // bắt đầu 1h trước
  endTime: relativeIso(1000 * 60 * 90), // kết thúc 90 phút nữa
  reservationTtlSeconds: 300, // 5 phút giữ chỗ
  status: "ACTIVE",
  items: [
    mockItem(1, 101, {
      productName: "Tai nghe Bluetooth chống ồn ANC AirPro không dây",
      variantName: "Đen",
      categoryName: "Điện tử",
      categorySlug: "dien-tu",
      imageUrl: "https://picsum.photos/seed/flash-1/600/600",
      originalPrice: 1_450_000,
      flashSalePrice: 790_000,
      allocatedStock: 100,
      availableStock: 28, // 72% sold
      userPurchaseLimit: 2,
    }),
    mockItem(2, 101, {
      productName: "Nồi chiên không dầu điện tử VibeCook 5.5L công nghệ nhiệt 360",
      variantName: "Đen",
      categoryName: "Gia dụng",
      categorySlug: "gia-dung",
      imageUrl: "https://picsum.photos/seed/flash-2/600/600",
      originalPrice: 1_990_000,
      flashSalePrice: 999_000,
      allocatedStock: 200,
      availableStock: 16, // 92% sold → almost sold out
      userPurchaseLimit: 1,
    }),
    mockItem(3, 101, {
      productName: "Bình giữ nhiệt Inox 304 dung tích 750ml khóa nhiệt 24h",
      variantName: "Xanh mint",
      categoryName: "Nhà cửa & Đời sống",
      categorySlug: "nha-cua",
      imageUrl: "https://picsum.photos/seed/flash-3/600/600",
      originalPrice: 320_000,
      flashSalePrice: 199_000,
      allocatedStock: 100,
      availableStock: 45, // 55% sold
      userPurchaseLimit: 2,
    }),
    mockItem(4, 101, {
      productName: "Đồng hồ thông minh thể thao VibeFit Active đo SpO2 chống nước",
      variantName: "Đen",
      categoryName: "Điện tử",
      categorySlug: "dien-tu",
      imageUrl: "https://picsum.photos/seed/flash-4/600/600",
      originalPrice: 1_190_000,
      flashSalePrice: 589_000,
      allocatedStock: 100,
      availableStock: 0, // sold out
      userPurchaseLimit: 2,
    }),
    mockItem(5, 101, {
      productName: "Giày chạy bộ siêu nhẹ Runner Pro Foam đệm khí êm ái",
      variantName: "Xanh neon",
      categoryName: "Thời trang",
      categorySlug: "thoi-trang",
      imageUrl: "https://picsum.photos/seed/flash-5/600/600",
      originalPrice: 799_000,
      flashSalePrice: 465_000,
      allocatedStock: 100,
      availableStock: 32, // 68% sold
      userPurchaseLimit: 1,
    }),
    mockItem(6, 101, {
      productName: "Bàn chải điện sóng âm Sonic 5 mode rung 42000 lần/phút",
      variantName: "Trắng",
      categoryName: "Làm đẹp & Sức khỏe",
      categorySlug: "lam-dep",
      imageUrl: "https://picsum.photos/seed/flash-6/600/600",
      originalPrice: 550_000,
      flashSalePrice: 299_000,
      allocatedStock: 100,
      availableStock: 19, // 81% sold
      userPurchaseLimit: 2,
    }),
    mockItem(7, 101, {
      productName: "Nước tẩy trang dịu nhẹ Ceramide 500ml cấp ẩm da nhạy cảm",
      variantName: "500ml",
      categoryName: "Làm đẹp & Sức khỏe",
      categorySlug: "lam-dep",
      imageUrl: "https://picsum.photos/seed/flash-7/600/600",
      originalPrice: 280_000,
      flashSalePrice: 145_000,
      allocatedStock: 200,
      availableStock: 10, // 95% sold → almost sold out
      userPurchaseLimit: 3,
    }),
    mockItem(8, 101, {
      productName: "Pin sạc dự phòng 20000mAh 65W sạc nhanh laptop & smartphone",
      variantName: "Đen",
      categoryName: "Điện tử",
      categorySlug: "dien-tu",
      imageUrl: "https://picsum.photos/seed/flash-8/600/600",
      originalPrice: 690_000,
      flashSalePrice: 449_000,
      allocatedStock: 100,
      availableStock: 38, // 62% sold
      userPurchaseLimit: 2,
    }),
    mockItem(9, 101, {
      productName: "Áo khoác dù chống nước 2 lớp thoáng khí cản gió du lịch",
      variantName: "Xanh navy / L",
      categoryName: "Thời trang",
      categorySlug: "thoi-trang",
      imageUrl: "https://picsum.photos/seed/flash-9/600/600",
      originalPrice: 499_000,
      flashSalePrice: 279_000,
      allocatedStock: 100,
      availableStock: 26, // 74% sold
      userPurchaseLimit: 3,
    }),
    mockItem(10, 101, {
      productName: "Bàn phím cơ không dây RGB switch hot-swap 3 chế độ kết nối",
      variantName: "Mint",
      categoryName: "Điện tử",
      categorySlug: "dien-tu",
      imageUrl: "https://picsum.photos/seed/flash-10/600/600",
      originalPrice: 1_060_000,
      flashSalePrice: 650_000,
      allocatedStock: 100,
      availableStock: 52, // 48% sold
      userPurchaseLimit: 1,
    }),
  ],
};

// ─── UPCOMING slot (15:00) ─────────────────────────────────────────────────
const upcomingSlot: PublicFlashSaleSlotResponse = {
  id: 102,
  title: "Flash Sale 15:00 - Hôm nay",
  startTime: relativeIso(1000 * 60 * 60 * 3), // bắt đầu 3h nữa
  endTime: relativeIso(1000 * 60 * 60 * 4), // kết thúc 4h nữa
  reservationTtlSeconds: 300,
  status: "UPCOMING",
  items: [
    mockItem(11, 102, {
      productName: "Máy pha cà phê Espresso cầm tay du lịch áp suất 18 bar",
      variantName: "Bạc",
      imageUrl: "https://picsum.photos/seed/flash-11/600/600",
      originalPrice: 850_000,
      flashSalePrice: 510_000,
      allocatedStock: 80,
      availableStock: 80,
      userPurchaseLimit: 1,
    }),
    mockItem(12, 102, {
      productName: "Gối cao su non công thái học định hình cổ chống mỏi vai gáy",
      variantName: "Tiêu chuẩn",
      imageUrl: "https://picsum.photos/seed/flash-12/600/600",
      originalPrice: 600_000,
      flashSalePrice: 330_000,
      allocatedStock: 100,
      availableStock: 100,
      userPurchaseLimit: 2,
    }),
    mockItem(13, 102, {
      productName: "Camera an ninh thông minh 2K AI xoay 360 đàm thoại 2 chiều",
      variantName: "Trắng",
      imageUrl: "https://picsum.photos/seed/flash-13/600/600",
      originalPrice: 799_000,
      flashSalePrice: 399_000,
      allocatedStock: 60,
      availableStock: 60,
      userPurchaseLimit: 1,
    }),
    mockItem(14, 102, {
      productName: "Chảo chống dính vân đá gốm ceramic cao cấp 26cm đáy từ",
      variantName: "Kem",
      imageUrl: "https://picsum.photos/seed/flash-14/600/600",
      originalPrice: 390_000,
      flashSalePrice: 239_000,
      allocatedStock: 120,
      availableStock: 120,
      userPurchaseLimit: 2,
    }),
    mockItem(15, 102, {
      productName: "Bộ đôi tinh chất dưỡng ẩm phục hồi Vitamin B5 & HA 30ml",
      variantName: "30ml",
      imageUrl: "https://picsum.photos/seed/flash-15/600/600",
      originalPrice: 550_000,
      flashSalePrice: 265_000,
      allocatedStock: 90,
      availableStock: 90,
      userPurchaseLimit: 2,
    }),
  ],
};

/** Tất cả mock slots cho /flash-sale. */
export const mockFlashSaleSlots: PublicFlashSaleSlotResponse[] = [
  activeSlot,
  upcomingSlot,
];

/** Lấy slot ACTIVE (1 cái duy nhất trong mock). */
export function getMockActiveSlot(): PublicFlashSaleSlotResponse {
  const slot = mockFlashSaleSlots.find((s) => s.status === "ACTIVE");
  if (!slot) throw new Error("Mock: no ACTIVE slot");
  return slot;
}

/** Lấy slot UPCOMING đầu tiên. */
export function getMockUpcomingSlot(): PublicFlashSaleSlotResponse {
  const slot = mockFlashSaleSlots.find((s) => s.status === "UPCOMING");
  if (!slot) throw new Error("Mock: no UPCOMING slot");
  return slot;
}

/** Lấy mock chi tiết 1 Flash Sale Item. */
export function getMockFlashSaleItemDetail(
  itemId: number
): import("./types").PublicFlashSaleItemDetailResponse {
  let foundSlot = mockFlashSaleSlots.find((s) =>
    s.items.some((i) => i.id === itemId)
  );
  let foundItem = foundSlot?.items.find((i) => i.id === itemId);

  if (!foundItem) {
    foundSlot = activeSlot;
    foundItem = activeSlot.items[0];
  }

  const discountPercent = Math.round(
    ((foundItem.originalPrice - foundItem.flashSalePrice) /
      foundItem.originalPrice) *
      100
  );

  return {
    id: itemId,
    slotId: foundSlot?.id ?? 101,
    slotTitle: foundSlot?.title ?? "Flash Sale Hôm Nay",
    slotStartTime: foundSlot?.startTime ?? relativeIso(-1000 * 60 * 60),
    slotEndTime: foundSlot?.endTime ?? relativeIso(1000 * 60 * 90),
    slotStatus: foundSlot?.status ?? "ACTIVE",
    reservationTtlSeconds: foundSlot?.reservationTtlSeconds ?? 300,
    originalPrice: foundItem.originalPrice,
    flashSalePrice: foundItem.flashSalePrice,
    discountPercent,
    allocatedStock: foundItem.allocatedStock,
    availableStock: foundItem.availableStock,
    userPurchaseLimit: foundItem.userPurchaseLimit,
    status: foundItem.status,
    productId: foundItem.productId ?? 1,
    productName: foundItem.productName,
    productDescription:
      "Sản phẩm chính hãng với tiêu chuẩn chất lượng cao. Được bảo hành chính hãng và hỗ trợ đổi trả trong vòng 7 ngày nếu có lỗi từ nhà sản xuất. Ưu đãi độc quyền chỉ có trong khung giờ Flash Sale này.",
    productSlug: "san-pham-flash-sale",
    totalSold: 124,
    ratingAvg: 4.9,
    ratingCount: 88,
    categoryId: foundItem.categoryId ?? 1,
    categoryName: foundItem.categoryName ?? "Công nghệ",
    categorySlug: foundItem.categorySlug ?? "cong-nghe",
    storeId: 1,
    storeName: "Official Flagship Store",
    storeTier: "OFFICIAL_MALL",
    storeLogoUrl: "https://picsum.photos/seed/store-1/120/120",
    variantId: foundItem.variantId ?? 16,
    sku: foundItem.sku ?? "FS-SKU-001",
    variantName: foundItem.variantName || "Size S - Green",
    attributes: {
      "Kích cỡ": "Size S",
      "Màu sắc": foundItem.variantName || "Green",
      "Quy cách": "Tiêu chuẩn phiên Flash Sale",
    },
    primaryImageUrl: foundItem.imageUrl,
    imageUrls: [
      foundItem.imageUrl,
      "https://picsum.photos/seed/gallery-1/600/600",
      "https://picsum.photos/seed/gallery-2/600/600",
      "https://picsum.photos/seed/gallery-3/600/600",
    ],
  };
}
