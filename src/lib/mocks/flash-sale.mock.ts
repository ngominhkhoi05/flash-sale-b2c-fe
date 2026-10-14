import type {
  FlashSaleSlot,
  FlashSaleItem,
  BuyNowRequest,
  BuyNowResponse,
} from "@/types/flash-sale";

/**
 * Sinh danh sách khung giờ Flash Sale động
 * Tính toán mốc thời gian logic từ Date.now(), không hard-code khoảng thời gian cố định.
 */
export function getMockSlots(): FlashSaleSlot[] {
  const now = Date.now();
  const slotDurationMs = 3 * 3600 * 1000; // 3 tiếng mỗi khung giờ

  // Slot ACTIVE bắt đầu trước thời điểm hiện tại 45 phút, kết thúc sau đó
  const activeStart = now - 45 * 60 * 1000;
  const activeEnd = activeStart + slotDurationMs;

  return [
    {
      id: 101,
      name: "09:00 - Sáng Khởi Động",
      startTime: new Date(activeStart - slotDurationMs).toISOString(),
      endTime: new Date(activeStart).toISOString(),
      status: "ENDED",
      totalProducts: 16,
    },
    {
      id: 102,
      name: "12:00 - Giờ Vàng Siêu Sale",
      startTime: new Date(activeStart).toISOString(),
      endTime: new Date(activeEnd).toISOString(),
      status: "ACTIVE",
      totalProducts: 24,
    },
    {
      id: 103,
      name: "15:00 - Chiều Cao Điểm",
      startTime: new Date(activeEnd).toISOString(),
      endTime: new Date(activeEnd + slotDurationMs).toISOString(),
      status: "UPCOMING",
      totalProducts: 20,
    },
    {
      id: 104,
      name: "18:00 - Tan Ca Săn Deal",
      startTime: new Date(activeEnd + slotDurationMs).toISOString(),
      endTime: new Date(activeEnd + 2 * slotDurationMs).toISOString(),
      status: "UPCOMING",
      totalProducts: 18,
    },
    {
      id: 105,
      name: "21:00 - Đêm Tiệc Giá Sốc",
      startTime: new Date(activeEnd + 2 * slotDurationMs).toISOString(),
      endTime: new Date(activeEnd + 3 * slotDurationMs).toISOString(),
      status: "UPCOMING",
      totalProducts: 25,
    },
  ];
}

/**
 * Hàm tiện ích tính toán thời gian đếm ngược trực tiếp từ Date.now() và endTime của slot
 */
export function calculateRemainingTime(endTimeIso: string, currentTimeMs: number = Date.now()) {
  const diffMs = Math.max(0, new Date(endTimeIso).getTime() - currentTimeMs);
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    hours,
    minutes,
    seconds,
    totalSeconds,
    isEnded: totalSeconds <= 0,
    formatted: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
  };
}

/**
 * Danh sách sản phẩm Flash Sale mẫu bám sát thiết kế Stitch Project 10601817506611057935
 */
export const mockFlashSaleItems: FlashSaleItem[] = [
  {
    id: 1,
    slotId: 102,
    productId: 1001,
    variantId: 2001,
    productName: "Tai nghe Bluetooth chống ồn ANC SoundCore Life Q30 chính hãng",
    imageUrl:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
    originalPrice: 1450000,
    flashSalePrice: 790000,
    discountPercent: 45,
    allocatedStock: 100,
    availableStock: 28,
    soldQuantity: 72,
    category: "Điện tử - Công nghệ",
    isSoldOut: false,
  },
  {
    id: 2,
    slotId: 102,
    productId: 1002,
    variantId: 2002,
    productName: "Nồi chiên không dầu điện tử VibeCook 5.5L công nghệ nhiệt 360",
    imageUrl:
      "https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=600&auto=format&fit=crop&q=80",
    originalPrice: 1850000,
    flashSalePrice: 990000,
    discountPercent: 46,
    allocatedStock: 100,
    availableStock: 15,
    soldQuantity: 85,
    category: "Gia dụng & Đời sống",
    isSoldOut: false,
  },
  {
    id: 3,
    slotId: 102,
    productId: 1003,
    variantId: 2003,
    productName: "Bình giữ nhiệt inox 304 dung tích 750ml khóa nhiệt 24h",
    imageUrl:
      "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80",
    originalPrice: 320000,
    flashSalePrice: 199000,
    discountPercent: 38,
    allocatedStock: 80,
    availableStock: 35,
    soldQuantity: 45,
    category: "Gia dụng & Đời sống",
    isSoldOut: false,
  },
  {
    id: 4,
    slotId: 102,
    productId: 1004,
    variantId: 2004,
    productName: "Đồng hồ thông minh thể thao VibeFit Active đo nhịp tim SpO2",
    imageUrl:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
    originalPrice: 1100000,
    flashSalePrice: 569000,
    discountPercent: 48,
    allocatedStock: 50,
    availableStock: 0,
    soldQuantity: 50,
    category: "Điện tử - Công nghệ",
    isSoldOut: true,
  },
  {
    id: 5,
    slotId: 102,
    productId: 1005,
    variantId: 2005,
    productName: "Giày chạy bộ siêu nhẹ VibeRun Pro thoáng khí đệm khí êm",
    imageUrl:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
    originalPrice: 750000,
    flashSalePrice: 465000,
    discountPercent: 38,
    allocatedStock: 60,
    availableStock: 12,
    soldQuantity: 48,
    category: "Thời trang",
    isSoldOut: false,
  },
  {
    id: 6,
    slotId: 102,
    productId: 1006,
    variantId: 2006,
    productName: "Bàn chải điện sóng âm Sonic 5 chế độ làm sạch sâu kháng nước",
    imageUrl:
      "https://images.unsplash.com/photo-1559591937-e62fb330bc1f?w=600&auto=format&fit=crop&q=80",
    originalPrice: 520000,
    flashSalePrice: 299000,
    discountPercent: 42,
    allocatedStock: 120,
    availableStock: 40,
    soldQuantity: 80,
    category: "Làm đẹp & Sức khỏe",
    isSoldOut: false,
  },
  {
    id: 7,
    slotId: 102,
    productId: 1007,
    variantId: 2007,
    productName: "Nước tẩy trang dịu nhẹ Centella 500ml lành tính mọi loại da",
    imageUrl:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80",
    originalPrice: 290000,
    flashSalePrice: 165000,
    discountPercent: 43,
    allocatedStock: 150,
    availableStock: 65,
    soldQuantity: 85,
    category: "Làm đẹp & Sức khỏe",
    isSoldOut: false,
  },
  {
    id: 8,
    slotId: 102,
    productId: 1008,
    variantId: 2008,
    productName: "Pin sạc dự phòng 20000mAh PD 65W sạc nhanh laptop điện thoại",
    imageUrl:
      "https://images.unsplash.com/photo-1609592424109-dd9892f1b177?w=600&auto=format&fit=crop&q=80",
    originalPrice: 950000,
    flashSalePrice: 649000,
    discountPercent: 32,
    allocatedStock: 70,
    availableStock: 18,
    soldQuantity: 52,
    category: "Điện tử - Công nghệ",
    isSoldOut: false,
  },
  {
    id: 9,
    slotId: 102,
    productId: 1009,
    variantId: 2009,
    productName: "Áo khoác dù chống nước 2 lớp thoáng khí cản gió du lịch",
    imageUrl:
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&auto=format&fit=crop&q=80",
    originalPrice: 490000,
    flashSalePrice: 279000,
    discountPercent: 43,
    allocatedStock: 90,
    availableStock: 32,
    soldQuantity: 58,
    category: "Thời trang",
    isSoldOut: false,
  },
  {
    id: 10,
    slotId: 102,
    productId: 1010,
    variantId: 2010,
    productName: "Bàn phím cơ không dây RGB switch hot-swap 3 chế độ kết nối",
    imageUrl:
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80",
    originalPrice: 1250000,
    flashSalePrice: 690000,
    discountPercent: 45,
    allocatedStock: 40,
    availableStock: 8,
    soldQuantity: 32,
    category: "Điện tử - Công nghệ",
    isSoldOut: false,
  },
];

/**
 * Sản phẩm khung giờ kế tiếp (15:00)
 */
export const mockUpcomingItems: FlashSaleItem[] = [
  {
    id: 11,
    slotId: 103,
    productId: 1011,
    variantId: 2011,
    productName: "Máy pha cà phê Espresso mini cầm tay du lịch áp suất 18 bar",
    imageUrl:
      "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=600&auto=format&fit=crop&q=80",
    originalPrice: 950000,
    flashSalePrice: 550000,
    discountPercent: 42,
    allocatedStock: 50,
    availableStock: 50,
    soldQuantity: 0,
    category: "Gia dụng & Đời sống",
    isSoldOut: false,
  },
  {
    id: 12,
    slotId: 103,
    productId: 1012,
    variantId: 2012,
    productName: "Gối cao su non nâng đỡ định hình cổ vai gáy kháng khuẩn",
    imageUrl:
      "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600&auto=format&fit=crop&q=80",
    originalPrice: 580000,
    flashSalePrice: 330000,
    discountPercent: 43,
    allocatedStock: 80,
    availableStock: 80,
    soldQuantity: 0,
    category: "Gia dụng & Đời sống",
    isSoldOut: false,
  },
  {
    id: 13,
    slotId: 103,
    productId: 1013,
    variantId: 2013,
    productName: "Camera an ninh không dây 2K AI quay quét 360 độ ban đêm có màu",
    imageUrl:
      "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&auto=format&fit=crop&q=80",
    originalPrice: 720000,
    flashSalePrice: 399000,
    discountPercent: 45,
    allocatedStock: 60,
    availableStock: 60,
    soldQuantity: 0,
    category: "Điện tử - Công nghệ",
    isSoldOut: false,
  },
  {
    id: 14,
    slotId: 103,
    productId: 1014,
    variantId: 2014,
    productName: "Chảo chống dính vân đá granite 26cm đáy từ dẫn nhiệt nhanh",
    imageUrl:
      "https://images.unsplash.com/photo-1584990347449-399c2db21fd0?w=600&auto=format&fit=crop&q=80",
    originalPrice: 399000,
    flashSalePrice: 239000,
    discountPercent: 40,
    allocatedStock: 100,
    availableStock: 100,
    soldQuantity: 0,
    category: "Gia dụng & Đời sống",
    isSoldOut: false,
  },
  {
    id: 15,
    slotId: 103,
    productId: 1015,
    variantId: 2015,
    productName: "Serum dưỡng ẩm phục hồi da Vitamin B5 & HA căng bóng",
    imageUrl:
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80",
    originalPrice: 520000,
    flashSalePrice: 260000,
    discountPercent: 50,
    allocatedStock: 120,
    availableStock: 120,
    soldQuantity: 0,
    category: "Làm đẹp & Sức khỏe",
    isSoldOut: false,
  },
];

/**
 * Xử lý mock mua hàng Flash Sale
 * Trả về 1 trong 3 trạng thái: SUCCESS, OUT_OF_STOCK, SYSTEM_ERROR
 */
export function handleMockBuyNow(req: BuyNowRequest): BuyNowResponse {
  const item = mockFlashSaleItems.find((i) => i.id === req.flashSaleItemId);

  if (!item || item.availableStock <= 0 || item.isSoldOut) {
    return {
      status: "OUT_OF_STOCK",
      message: "Rất tiếc! Mặt hàng Flash Sale này vừa hết suất do lượng đặt mua quá lớn.",
      remainingStock: 0,
    };
  }

  // Giảm tồn kho in-memory cho mock test
  item.availableStock -= req.quantity;
  item.soldQuantity += req.quantity;
  if (item.availableStock <= 0) {
    item.availableStock = 0;
    item.isSoldOut = true;
  }

  const orderId = Math.floor(100000 + Math.random() * 900000);
  const orderCode = `FS${Date.now().toString().slice(-8)}`;

  return {
    status: "SUCCESS",
    orderId,
    orderCode,
    message: "Đặt mua Flash Sale thành công! Đơn hàng của bạn đã được ghi nhận vào hệ thống.",
    remainingStock: item.availableStock,
  };
}
