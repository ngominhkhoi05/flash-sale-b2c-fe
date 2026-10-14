import type {
  SkuApprovalItem,
  SkuApprovalCounts,
  SkuApprovalStatus,
} from "@/types/sku-approval";

// Helper broadcast số lượng pending tới AdminSidebar
function notifySkuPendingCount(count: number) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("admin:sku-pending-count", { detail: count })
    );
  }
}

const INITIAL_SKU_APPROVALS: SkuApprovalItem[] = [
  // ================= 14 PENDING ITEMS =================
  {
    id: 1,
    slotId: 3, // Giờ Vàng 12:00
    productId: 101,
    variantId: 1001,
    productName: "Áo thun nam Cotton Compact Vibe",
    variantName: "Màu: Đen, Size: L",
    skuCode: "AT-BLK-L",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuARR11zzViVslvGQA3-5JP6q7euWhf_GskDKrCbryYH-pHk_yUtgwTJIijYuDOZwfJvAOF4F_q4yTfRItfYn2yN2jviChaaK9dJWb95Q9xWdHDZQ8bfEUzgP1_ZhPo5U_OySbCRxSi_JKRxC3Gr0KryQpGH0skVtqKoVinvXwTcQ2jWZL7sZ-RhKdHW_uhMheX350qiz2VPZx-EJpV3AwGv15TBA4--b1M94m41jk_nJxnhJAOmEripsQ",
    storeId: 10,
    storeName: "Coolmate Official",
    storeBadge: "MALL",
    originalPrice: 299000,
    flashSalePrice: 149000,
    discountPercent: 50,
    priceAdvantage: {
      type: "WARNING_30_DAYS",
      message: "Cao hơn giá 30 ngày",
      tooltip:
        "Giá đề xuất Flash Sale cao hơn giá bán trung bình 30 ngày qua (135.000₫)",
    },
    allocatedStock: 50,
    originalStock: 248,
    customerLimit: 2,
    submittedAt: "09:30 Hôm nay",
    category: "fashion",
    status: "PENDING",
  },
  {
    id: 2,
    slotId: 3,
    productId: 102,
    variantId: 1002,
    productName: "Tai nghe không dây AirPro ANC",
    variantName: "Trắng",
    skuCode: "TN-WHT",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDEZ7FAkaKc9ioKXUgnKlwZr0Zo4ppfpyom9vUoM8LM0_wo86b2ifxM-qa7rPV5djhFNPsUMItYPEhS_HnB5xSuZcCxtZEROXL65r6fIqbYLoEzprBO9bIU4SZexaw08-sTxkMOmuGSyZK-F9OMaAYQJhmsIkJ3lMK2ouOvzJIzBqCoFJ_oKrQaVHZUGgtLDhO3oibTeyHpPUKAopkFTp5xEq3NhoIXzwLuiMqh9ek_uxOnIo547O9CTQ",
    storeId: 11,
    storeName: "TechSound Global",
    storeBadge: "FAVORITE",
    originalPrice: 890000,
    flashSalePrice: 445000,
    discountPercent: 50,
    priceAdvantage: {
      type: "BEST_60_DAYS",
      message: "Giá rẻ nhất 60 ngày",
      tooltip: "Đạt kỷ lục giá thấp nhất trong 60 ngày trên sàn Vibe Mart",
    },
    allocatedStock: 100,
    originalStock: 520,
    customerLimit: 1,
    submittedAt: "10:15 Hôm nay",
    category: "tech",
    status: "PENDING",
  },
  {
    id: 3,
    slotId: 3,
    productId: 103,
    variantId: 1003,
    productName: "Bàn chải điện Sonic Wave Pro",
    variantName: "Xanh Mint",
    skuCode: "BC-MNT",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB4HzZ-1AYW8hwnq2Eig60Vhj202IUKy1MRnbmqVtjRYobZk6BwUFSbUFznzrYcu7huaa_HY756duM2UquU6kxT0Utq4VCIEFU7jvGbF3lxQQ59GA-k9aLjqdGon8SqmL7M0NFuwZvqwdrIGRUNfTZkEoX9z3l-ovYqbDrWh_QFpMJMuHJh7LIitxTZ-D-wXckiZbd4joc-qE2q1NraCUNXgq2Bc8SUVHiNMN31UkjPQEQbhZBH7OeREQ",
    storeId: 12,
    storeName: "OralCare VN",
    storeBadge: "NORMAL",
    originalPrice: 450000,
    flashSalePrice: 199000,
    discountPercent: 56,
    priceAdvantage: {
      type: "DEEP_DISCOUNT",
      message: "Đạt chuẩn giảm giá sâu",
      tooltip: "Mức giảm thực tế trên 55% so với giá niêm yết",
    },
    allocatedStock: 80,
    originalStock: 190,
    customerLimit: 2,
    submittedAt: "11:00 Hôm nay",
    category: "beauty",
    status: "PENDING",
  },
  {
    id: 4,
    slotId: 3,
    productId: 104,
    variantId: 1004,
    productName: "Chuột công thái học Không Dây Vibe Ergonomic",
    variantName: "Xám Không Gian",
    skuCode: "MS-ERGO-GRY",
    imageUrl:
      "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=150&auto=format&fit=crop&q=80",
    storeId: 14,
    storeName: "LogiTech Official",
    storeBadge: "MALL",
    originalPrice: 650000,
    flashSalePrice: 325000,
    discountPercent: 50,
    priceAdvantage: {
      type: "DEEP_DISCOUNT",
      message: "Đạt chuẩn giảm giá sâu",
    },
    allocatedStock: 60,
    originalStock: 310,
    customerLimit: 2,
    submittedAt: "09:45 Hôm nay",
    category: "tech",
    status: "PENDING",
  },
  {
    id: 5,
    slotId: 3,
    productId: 105,
    variantId: 1005,
    productName: "Nồi chiên không dầu AirFryer 6L Cảm Ứng",
    variantName: "Đen Bóng",
    skuCode: "AF-6L-BLK",
    imageUrl:
      "https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=150&auto=format&fit=crop&q=80",
    storeId: 15,
    storeName: "Sunhouse Flagship",
    storeBadge: "FAVORITE",
    originalPrice: 1890000,
    flashSalePrice: 945000,
    discountPercent: 50,
    allocatedStock: 40,
    originalStock: 150,
    customerLimit: 1,
    submittedAt: "10:00 Hôm nay",
    category: "home",
    status: "PENDING",
  },
  {
    id: 6,
    slotId: 3,
    productId: 106,
    variantId: 1006,
    productName: "Giày Thể Thao Running Pro Speed Max",
    variantName: "Trắng/Xanh, Size: 42",
    skuCode: "RUN-WHT-42",
    imageUrl:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=150&auto=format&fit=crop&q=80",
    storeId: 16,
    storeName: "Biti's Official Store",
    storeBadge: "MALL",
    originalPrice: 1200000,
    flashSalePrice: 600000,
    discountPercent: 50,
    allocatedStock: 75,
    originalStock: 300,
    customerLimit: 1,
    submittedAt: "09:50 Hôm nay",
    category: "fashion",
    status: "PENDING",
  },
  {
    id: 7,
    slotId: 3,
    productId: 107,
    variantId: 1007,
    productName: "Kem Chống Nắng Phổ Rộng Ultra Sun SPF50+",
    variantName: "Tuýp 50ml",
    skuCode: "SUN-50ML",
    imageUrl:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=150&auto=format&fit=crop&q=80",
    storeId: 17,
    storeName: "LaRoche Beauty Store",
    storeBadge: "MALL",
    originalPrice: 490000,
    flashSalePrice: 245000,
    discountPercent: 50,
    allocatedStock: 120,
    originalStock: 450,
    customerLimit: 3,
    submittedAt: "10:20 Hôm nay",
    category: "beauty",
    status: "PENDING",
  },
  {
    id: 8,
    slotId: 3,
    productId: 108,
    variantId: 1008,
    productName: "Bình giữ nhiệt Inox 316 800ml Nắp Bật",
    variantName: "Bạc Nhám",
    skuCode: "BN-800-SLV",
    imageUrl:
      "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=150&auto=format&fit=crop&q=80",
    storeId: 18,
    storeName: "Lock&Lock Official",
    storeBadge: "FAVORITE",
    originalPrice: 380000,
    flashSalePrice: 190000,
    discountPercent: 50,
    allocatedStock: 90,
    originalStock: 380,
    customerLimit: 2,
    submittedAt: "10:25 Hôm nay",
    category: "home",
    status: "PENDING",
  },
  {
    id: 9,
    slotId: 3,
    productId: 109,
    variantId: 1009,
    productName: "Bộ Ga Giường Tencel Cao Cấp 4 Món",
    variantName: "Họa tiết Vintage, 1m8x2m",
    skuCode: "GA-TNC-18",
    imageUrl:
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=150&auto=format&fit=crop&q=80",
    storeId: 19,
    storeName: "Everon Home Living",
    storeBadge: "FAVORITE",
    originalPrice: 1500000,
    flashSalePrice: 750000,
    discountPercent: 50,
    allocatedStock: 30,
    originalStock: 110,
    customerLimit: 1,
    submittedAt: "10:30 Hôm nay",
    category: "home",
    status: "PENDING",
  },
  {
    id: 10,
    slotId: 3,
    productId: 110,
    variantId: 1010,
    productName: "Củ sạc nhanh 65W GaN 3 Cổng Type-C",
    variantName: "Đen Mờ",
    skuCode: "CHG-65W-BLK",
    imageUrl:
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=150&auto=format&fit=crop&q=80",
    storeId: 20,
    storeName: "Anker Flagship Mall",
    storeBadge: "MALL",
    originalPrice: 790000,
    flashSalePrice: 395000,
    discountPercent: 50,
    allocatedStock: 150,
    originalStock: 600,
    customerLimit: 2,
    submittedAt: "10:40 Hôm nay",
    category: "tech",
    status: "PENDING",
  },
  {
    id: 11,
    slotId: 3,
    productId: 111,
    variantId: 1011,
    productName: "Son Dưỡng Ẩm Môi Tự Nhiên Không Màu",
    variantName: "Chiết xuất Oliu 1.5g",
    skuCode: "LIP-OLV-15",
    imageUrl:
      "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=150&auto=format&fit=crop&q=80",
    storeId: 21,
    storeName: "DHC Beauty VN",
    storeBadge: "NORMAL",
    originalPrice: 180000,
    flashSalePrice: 89000,
    discountPercent: 51,
    allocatedStock: 200,
    originalStock: 500,
    customerLimit: 3,
    submittedAt: "10:45 Hôm nay",
    category: "beauty",
    status: "PENDING",
  },
  {
    id: 12,
    slotId: 3,
    productId: 112,
    variantId: 1012,
    productName: "Quần Jean Nam Co Giãn Dáng Slim-fit",
    variantName: "Xanh Đậm, Size: 31",
    skuCode: "JN-SLM-BL-31",
    imageUrl:
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=150&auto=format&fit=crop&q=80",
    storeId: 22,
    storeName: "Yody Fashion Store",
    storeBadge: "FAVORITE",
    originalPrice: 499000,
    flashSalePrice: 249000,
    discountPercent: 50,
    allocatedStock: 85,
    originalStock: 340,
    customerLimit: 2,
    submittedAt: "10:50 Hôm nay",
    category: "fashion",
    status: "PENDING",
  },
  {
    id: 13,
    slotId: 3,
    productId: 113,
    variantId: 1013,
    productName: "Máy cạo râu 3 lưỡi kép Kháng Nước IPX7",
    variantName: "Xanh Titan",
    skuCode: "SHV-IPX7-TTN",
    imageUrl:
      "https://images.unsplash.com/photo-1621607512214-68297480165e?w=150&auto=format&fit=crop&q=80",
    storeId: 23,
    storeName: "Philips Consumer",
    storeBadge: "MALL",
    originalPrice: 990000,
    flashSalePrice: 495000,
    discountPercent: 50,
    allocatedStock: 50,
    originalStock: 220,
    customerLimit: 1,
    submittedAt: "10:55 Hôm nay",
    category: "beauty",
    status: "PENDING",
  },
  {
    id: 14,
    slotId: 3,
    productId: 114,
    variantId: 1014,
    productName: "Balo Laptop Chống Nước Đa Năng 15.6 inch",
    variantName: "Xám Than",
    skuCode: "BP-156-GRY",
    imageUrl:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=150&auto=format&fit=crop&q=80",
    storeId: 24,
    storeName: "Mark Ryden VN",
    storeBadge: "NORMAL",
    originalPrice: 550000,
    flashSalePrice: 275000,
    discountPercent: 50,
    allocatedStock: 70,
    originalStock: 280,
    customerLimit: 2,
    submittedAt: "11:05 Hôm nay",
    category: "fashion",
    status: "PENDING",
  },

  // ================= 32 APPROVED ITEMS =================
  ...Array.from({ length: 32 }, (_, idx) => {
    const id = 100 + idx + 1;
    const categories: Array<"fashion" | "tech" | "beauty" | "home"> = [
      "tech",
      "fashion",
      "beauty",
      "home",
    ];
    const cat = categories[idx % categories.length];
    const stores = [
      { name: "Samsung Flagship", badge: "MALL" as const },
      { name: "Anker Official", badge: "MALL" as const },
      { name: "Coolmate Official", badge: "MALL" as const },
      { name: "Lock&Lock Official", badge: "FAVORITE" as const },
      { name: "Sunhouse Store", badge: "FAVORITE" as const },
      { name: "Gia Dụng Thông Minh VN", badge: "NORMAL" as const },
    ];
    const st = stores[idx % stores.length];
    const origPrice = 200000 + (idx % 8) * 150000;
    const flashPrice = Math.round(origPrice * 0.5);

    return {
      id,
      slotId: 3,
      productId: 200 + idx,
      variantId: 2000 + idx,
      productName: `Sản phẩm Flash Sale Đã Duyệt #${idx + 1}`,
      variantName: `Bản tiêu chuẩn · SKU-${idx + 101}`,
      skuCode: `FS-APPROVED-${idx + 101}`,
      imageUrl:
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=150&auto=format&fit=crop&q=80",
      storeId: 30 + (idx % 6),
      storeName: st.name,
      storeBadge: st.badge,
      originalPrice: origPrice,
      flashSalePrice: flashPrice,
      discountPercent: 50,
      allocatedStock: 50 + (idx % 10) * 10,
      originalStock: 200 + (idx % 10) * 50,
      customerLimit: 2,
      submittedAt: "08:30 Hôm nay",
      category: cat,
      status: "APPROVED" as SkuApprovalStatus,
      commissionOverride: idx % 3 === 0 ? 3.5 : undefined,
      reviewedAt: "11:15 Hôm nay",
    };
  }),

  // ================= 4 REJECTED ITEMS =================
  {
    id: 201,
    slotId: 3,
    productId: 301,
    variantId: 3001,
    productName: "Áo Polo Nam Thể Thao Phối Viền",
    variantName: "Trắng, Size XL",
    skuCode: "POLO-WHT-XL",
    imageUrl:
      "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=150&auto=format&fit=crop&q=80",
    storeId: 41,
    storeName: "VietStyle Fashion",
    storeBadge: "NORMAL",
    originalPrice: 350000,
    flashSalePrice: 280000,
    discountPercent: 20,
    allocatedStock: 30,
    originalStock: 100,
    customerLimit: 2,
    submittedAt: "08:15 Hôm nay",
    category: "fashion",
    status: "REJECTED",
    rejectionReason: "Giá chưa hấp dẫn (<40%)",
    rejectionNote:
      "Mức giảm giá đề xuất chỉ đạt 20%, quy chế phiên yêu cầu tối thiểu giảm 40%.",
    reviewedAt: "10:30 Hôm nay",
  },
  {
    id: 202,
    slotId: 3,
    productId: 302,
    variantId: 3002,
    productName: "Đồng Hồ Thông Minh Sport Fit 5",
    variantName: "Dây Đen",
    skuCode: "SW-FIT5-BLK",
    imageUrl:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=150&auto=format&fit=crop&q=80",
    storeId: 42,
    storeName: "SmartTech Retail",
    storeBadge: "NORMAL",
    originalPrice: 750000,
    flashSalePrice: 375000,
    discountPercent: 50,
    allocatedStock: 10,
    originalStock: 25,
    customerLimit: 1,
    submittedAt: "08:45 Hôm nay",
    category: "tech",
    status: "REJECTED",
    rejectionReason: "Tồn kho không đủ hạn mức",
    rejectionNote:
      "Số lượng phân bổ đăng ký chỉ có 10 chiếc, không đáp ứng hạn mức tối thiểu 30 chiếc cho phiên Giờ Vàng.",
    reviewedAt: "10:35 Hôm nay",
  },
  {
    id: 203,
    slotId: 3,
    productId: 303,
    variantId: 3003,
    productName: "Serum Dưỡng Trắng Mờ Thâm Vitamin C",
    variantName: "Chai 30ml",
    skuCode: "SERUM-VITC-30",
    imageUrl:
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=150&auto=format&fit=crop&q=80",
    storeId: 43,
    storeName: "Glow Skin Care",
    storeBadge: "FAVORITE",
    originalPrice: 420000,
    flashSalePrice: 210000,
    discountPercent: 50,
    allocatedStock: 50,
    originalStock: 200,
    customerLimit: 2,
    submittedAt: "09:10 Hôm nay",
    category: "beauty",
    status: "REJECTED",
    rejectionReason: "Ảnh không đạt chuẩn bìa",
    rejectionNote:
      "Ảnh đại diện sản phẩm bị chèn chữ khuyến mãi đè lên viền, phông nền không đồng nhất chuẩn thiết kế.",
    reviewedAt: "10:40 Hôm nay",
  },
  {
    id: 204,
    slotId: 3,
    productId: 304,
    variantId: 3004,
    productName: "Máy Xay Sinh Tố Mini Cầm Tay 4 Lưỡi",
    variantName: "Hồng Pastel",
    skuCode: "BLD-MN-PNK",
    imageUrl:
      "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=150&auto=format&fit=crop&q=80",
    storeId: 44,
    storeName: "Gia Dụng Xinh VN",
    storeBadge: "NORMAL",
    originalPrice: 320000,
    flashSalePrice: 160000,
    discountPercent: 50,
    allocatedStock: 40,
    originalStock: 120,
    customerLimit: 2,
    submittedAt: "09:20 Hôm nay",
    category: "home",
    status: "REJECTED",
    rejectionReason: "Trùng ngành hàng cùng khung giờ",
    rejectionNote:
      "Khung giờ 12:00 đã đạt hạn ngạch tối đa 5 SKU máy xay sinh tố mini từ các gian hàng Mall.",
    reviewedAt: "10:45 Hôm nay",
  },
];

// In-memory data store for the session
let skuApprovals: SkuApprovalItem[] = [...INITIAL_SKU_APPROVALS];

/**
 * Lấy toàn bộ SKU đăng ký theo slotId (mặc định lấy tất cả hoặc slot 3)
 */
export function getMockSkuApprovals(slotId?: number): SkuApprovalItem[] {
  if (slotId !== undefined) {
    return skuApprovals.filter((item) => item.slotId === slotId);
  }
  return [...skuApprovals];
}

/**
 * Đếm số lượng theo status
 */
export function getApprovalCounts(slotId?: number): SkuApprovalCounts {
  const items = slotId !== undefined ? getMockSkuApprovals(slotId) : skuApprovals;
  const pending = items.filter((i) => i.status === "PENDING").length;
  const approved = items.filter((i) => i.status === "APPROVED").length;
  const rejected = items.filter((i) => i.status === "REJECTED").length;
  return { pending, approved, rejected };
}

/**
 * Duyệt 1 SKU đơn lẻ
 */
export function approveSku(
  id: number,
  commissionOverride?: number
): SkuApprovalItem | null {
  const idx = skuApprovals.findIndex((item) => item.id === id);
  if (idx === -1) return null;

  skuApprovals[idx] = {
    ...skuApprovals[idx],
    status: "APPROVED",
    commissionOverride:
      commissionOverride !== undefined && !isNaN(commissionOverride)
        ? commissionOverride
        : skuApprovals[idx].commissionOverride,
    reviewedAt: "Vừa xong",
  };

  const counts = getApprovalCounts();
  notifySkuPendingCount(counts.pending);
  return skuApprovals[idx];
}

/**
 * Từ chối 1 SKU
 */
export function rejectSku(
  id: number,
  reason: string,
  note?: string
): SkuApprovalItem | null {
  const idx = skuApprovals.findIndex((item) => item.id === id);
  if (idx === -1) return null;

  skuApprovals[idx] = {
    ...skuApprovals[idx],
    status: "REJECTED",
    rejectionReason: reason,
    rejectionNote: note || reason,
    reviewedAt: "Vừa xong",
  };

  const counts = getApprovalCounts();
  notifySkuPendingCount(counts.pending);
  return skuApprovals[idx];
}

/**
 * Hoàn tác đưa SKU về Chờ duyệt (PENDING)
 */
export function undoSku(id: number): SkuApprovalItem | null {
  const idx = skuApprovals.findIndex((item) => item.id === id);
  if (idx === -1) return null;

  skuApprovals[idx] = {
    ...skuApprovals[idx],
    status: "PENDING",
    rejectionReason: undefined,
    rejectionNote: undefined,
    reviewedAt: undefined,
  };

  const counts = getApprovalCounts();
  notifySkuPendingCount(counts.pending);
  return skuApprovals[idx];
}

/**
 * Duyệt hàng loạt danh sách SKU ids
 */
export function batchApproveSkus(
  ids: number[],
  commissionOverride?: number
): SkuApprovalItem[] {
  const updated: SkuApprovalItem[] = [];
  skuApprovals = skuApprovals.map((item) => {
    if (ids.includes(item.id)) {
      const newItem: SkuApprovalItem = {
        ...item,
        status: "APPROVED",
        commissionOverride:
          commissionOverride !== undefined && !isNaN(commissionOverride)
            ? commissionOverride
            : item.commissionOverride,
        reviewedAt: "Vừa xong",
      };
      updated.push(newItem);
      return newItem;
    }
    return item;
  });

  const counts = getApprovalCounts();
  notifySkuPendingCount(counts.pending);
  return updated;
}

/**
 * Từ chối hàng loạt danh sách SKU ids
 */
export function batchRejectSkus(
  ids: number[],
  reason: string,
  note?: string
): SkuApprovalItem[] {
  const updated: SkuApprovalItem[] = [];
  skuApprovals = skuApprovals.map((item) => {
    if (ids.includes(item.id)) {
      const newItem: SkuApprovalItem = {
        ...item,
        status: "REJECTED",
        rejectionReason: reason,
        rejectionNote: note || reason,
        reviewedAt: "Vừa xong",
      };
      updated.push(newItem);
      return newItem;
    }
    return item;
  });

  const counts = getApprovalCounts();
  notifySkuPendingCount(counts.pending);
  return updated;
}
