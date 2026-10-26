import type {
  AdminDashboardData,
  AdminCampaign,
  AdminRealtimeMonitorData,
} from "@/types/admin";
import { getMockSlots } from "./flash-sale.mock";

export function getMockAdminDashboard(): AdminDashboardData {
  const activeSlot = getMockSlots().find((s) => s.status === "ACTIVE");
  const now = Date.now();
  const activeStart = activeSlot?.startTime || new Date(now - 45 * 60 * 1000).toISOString();
  const activeEnd = activeSlot?.endTime || new Date(now + 2 * 3600 * 1000 + 15 * 60 * 1000).toISOString();

  return {
    kpis: [
      {
        title: "GMV hôm nay",
        value: "1,28 tỷ₫",
        trend: {
          direction: "up",
          percentage: 18.0,
          comparisonText: "so với hôm qua",
        },
        iconName: "payments",
        isMockSample: true, // Label: "Dữ liệu mẫu"
      },
      {
        title: "Hoa hồng thu được",
        value: "64,2 triệu₫",
        trend: {
          direction: "up",
          percentage: 12.5,
          comparisonText: "tỷ lệ sàn ~5.01%",
        },
        iconName: "account_balance_wallet",
        isMockSample: true,
      },
      {
        title: "Tổng đơn Flash Sale",
        value: "4.820 đơn",
        trend: {
          direction: "up",
          percentage: 24.2,
          comparisonText: "tỷ lệ thành công 98.4%",
        },
        iconName: "shopping_bag",
        isMockSample: true,
      },
      {
        title: "Tốc độ xử lý Redis Lock",
        value: "1.450 req/s",
        trend: {
          direction: "neutral",
          percentage: 0,
          comparisonText: "độ trễ trung bình 18ms",
        },
        iconName: "bolt",
        isMockSample: true,
      },
    ],
    activeCampaign: {
      id: activeSlot?.id || 102,
      name: activeSlot ? `Phiên ${activeSlot.name} đang diễn ra` : "Phiên Giờ Vàng đang diễn ra",
      startTime: activeStart,
      endTime: activeEnd,
      confirmedOrders: 2315,
      totalRevenue: 1828750000,
    },
    lastUpdated: new Date().toISOString(),
  };
}

const initialSlots = getMockSlots();
export const mockAdminCampaigns: AdminCampaign[] = [
  {
    id: 101,
    name: "Sáng Khởi Động Siêu Sale",
    slotName: initialSlots[0]?.name || "09:00 - Sáng Khởi Động",
    startTime: initialSlots[0]?.startTime || new Date(Date.now() - 3 * 3600000).toISOString(),
    endTime: initialSlots[0]?.endTime || new Date(Date.now() - 45 * 60000).toISOString(),
    status: "ENDED",
    productCount: 16,
    totalAllocatedStock: 800,
    totalSoldStock: 742,
    revenue: 642000000,
  },
  {
    id: 102,
    name: "Giờ Vàng Trưa Giá Sốc",
    slotName: initialSlots[1]?.name || "12:00 - Giờ Vàng Siêu Sale",
    startTime: initialSlots[1]?.startTime || new Date(Date.now() - 45 * 60000).toISOString(),
    endTime: initialSlots[1]?.endTime || new Date(Date.now() + 2 * 3600000 + 15 * 60000).toISOString(),
    status: "ACTIVE",
    productCount: 24,
    totalAllocatedStock: 1200,
    totalSoldStock: 532,
    revenue: 1828750000,
  },
  {
    id: 103,
    name: "Chiều Cao Điểm Săn Deal",
    slotName: initialSlots[2]?.name || "15:00 - Chiều Cao Điểm",
    startTime: initialSlots[2]?.startTime || new Date(Date.now() + 2 * 3600000 + 15 * 60000).toISOString(),
    endTime: initialSlots[2]?.endTime || new Date(Date.now() + 5 * 3600000 + 15 * 60000).toISOString(),
    status: "UPCOMING",
    productCount: 20,
    totalAllocatedStock: 950,
    totalSoldStock: 0,
    revenue: 0,
  },
  {
    id: 104,
    name: "Tan Ca Đón Bão Sale",
    slotName: initialSlots[3]?.name || "18:00 - Tan Ca Săn Deal",
    startTime: initialSlots[3]?.startTime || new Date(Date.now() + 5 * 3600000 + 15 * 60000).toISOString(),
    endTime: initialSlots[3]?.endTime || new Date(Date.now() + 8 * 3600000 + 15 * 60000).toISOString(),
    status: "UPCOMING",
    productCount: 18,
    totalAllocatedStock: 850,
    totalSoldStock: 0,
    revenue: 0,
  },
];

export function getMockRealtimeMonitoringData(): AdminRealtimeMonitorData {
  const activeSlot = getMockSlots().find((s) => s.status === "ACTIVE");
  const now = Date.now();
  const startTime = activeSlot?.startTime || new Date(now - 45 * 60 * 1000).toISOString();
  const endTime = activeSlot?.endTime || new Date(now + 2 * 3600 * 1000 + 15 * 60 * 1000).toISOString();

  return {
    slotId: activeSlot?.id || 102,
    slotName: activeSlot ? `Phiên ${activeSlot.name}` : "Phiên Giờ Vàng 12:00 - 15:00",
    startTime,
    endTime,
    totalOrders: 2315,
    orderVelocityPerSecond: 14.8,
    redisConnections: 42,
    items: [
      {
        itemId: 1,
        productId: 1001,
        productName: "Tai nghe Bluetooth chống ồn ANC SoundCore Q30",
        imageUrl:
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&auto=format&fit=crop&q=80",
        allocatedStock: 100,
        availableStock: 28,
        soldQuantity: 72,
        sellThroughRate: 72,
        currentOrderRatePerMinute: 8.5,
        status: "HOT",
      },
      {
        itemId: 2,
        productId: 1002,
        productName: "Nồi chiên không dầu điện tử VibeCook 5.5L",
        imageUrl:
          "https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=300&auto=format&fit=crop&q=80",
        allocatedStock: 100,
        availableStock: 15,
        soldQuantity: 85,
        sellThroughRate: 85,
        currentOrderRatePerMinute: 11.2,
        status: "CRITICAL",
      },
      {
        itemId: 4,
        productId: 1004,
        productName: "Đồng hồ thông minh thể thao VibeFit Active",
        imageUrl:
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&auto=format&fit=crop&q=80",
        allocatedStock: 50,
        availableStock: 0,
        soldQuantity: 50,
        sellThroughRate: 100,
        currentOrderRatePerMinute: 0,
        status: "SOLD_OUT",
      },
      {
        itemId: 5,
        productId: 1005,
        productName: "Giày chạy bộ siêu nhẹ VibeRun Pro",
        imageUrl:
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&auto=format&fit=crop&q=80",
        allocatedStock: 60,
        availableStock: 12,
        soldQuantity: 48,
        sellThroughRate: 80,
        currentOrderRatePerMinute: 5.6,
        status: "HOT",
      },
      {
        itemId: 10,
        productId: 1010,
        productName: "Bàn phím cơ không dây RGB switch hot-swap",
        imageUrl:
          "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300&auto=format&fit=crop&q=80",
        allocatedStock: 40,
        availableStock: 8,
        soldQuantity: 32,
        sellThroughRate: 80,
        currentOrderRatePerMinute: 4.1,
        status: "CRITICAL",
      },
    ],
    lastUpdated: new Date().toISOString(),
  };
}

export interface MockStoreItem {
  id: number;
  name: string;
  ownerName: string;
  ownerEmail: string;
  phone: string;
  status: "PENDING" | "APPROVED" | "BANNED" | "REJECTED";
  productsCount: number;
  ordersCount: number;
  ratingAvg: number;
  createdAt: string;
  avatarUrl: string;
  legalName?: string;
  businessAddress?: string;
}

export const mockAdminStores: MockStoreItem[] = [
  {
    id: 1,
    name: "Coolmate Official",
    legalName: "Cty TNHH FASHION LAB",
    ownerName: "Phạm Chí Nhu",
    ownerEmail: "nhu.pham@coolmate.me",
    phone: "0901234567",
    status: "APPROVED",
    productsCount: 45,
    ordersCount: 1240,
    ratingAvg: 4.9,
    createdAt: "2026-08-15T08:00:00Z",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAbz76SRjW8_3yPmbvexhST_wIFQiYLumarocjtOVufren4m0-TVaMANG3U73E_07kLVfZ_SXV6oiDoL9iCMgqT-05TVuwX8nIG92rGi2Z2pb8Q-Di2YtgrY0StAy5R9rPGS4LJREjIRHZ9l-WaT5bwbdVT-Ot_p07PE3W18JpMZiV065KXmd9odEolIfJnhCm_B3QkAkRS9jF3eQGctcSnPSQQsuzZimqkYc1JfwDTjzlC6D_CvFJogg",
    businessAddress: "Quận 7, TP. Hồ Chí Minh",
  },
  {
    id: 2,
    name: "Anker Flagship Store",
    legalName: "Anker Innovations VN",
    ownerName: "Steven Yang",
    ownerEmail: "partner@anker.vn",
    phone: "0912345678",
    status: "APPROVED",
    productsCount: 68,
    ordersCount: 890,
    ratingAvg: 4.8,
    createdAt: "2026-08-20T10:30:00Z",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD3NVJSakeKNPo_drP6zlOEOJzrgF9fwtzi5alaYkof1sxxudxRLBx2DYM-c6EVVgCwYAaYRUO08c9mFZFLqn6icZC3Sjnrt6Q4L0sMfGNsX05uRMvcqnHdewruddS4YuXBcX-dGaBbWsyIGI1NxdMZPJLNZ1-0gNwalNT3lHsG9xFbRCESxBIYA04HQwP6HDVMbVc7rPoDKwzFt1yrUxLKaqc1h52IrobAd1_m5dUwBkhMNjgHSM6TEQ",
    businessAddress: "Cầu Giấy, Hà Nội",
  },
  {
    id: 3,
    name: "Gốm Sứ Bát Tràng Tinh Hoa",
    legalName: "Hộ kinh doanh Nguyễn Văn Nam",
    ownerName: "Nguyễn Văn Nam",
    ownerEmail: "battrang.ceramics@gmail.com",
    phone: "0934567890",
    status: "PENDING",
    productsCount: 12,
    ordersCount: 0,
    ratingAvg: 0,
    createdAt: "2026-10-17T14:15:00Z",
    avatarUrl:
      "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=120&auto=format&fit=crop&q=80",
    businessAddress: "Gia Lâm, Hà Nội",
  },
  {
    id: 4,
    name: "Mỹ Phẩm Thiên Nhiên Cocoon",
    legalName: "Nature Story Co., Ltd",
    ownerName: "Lê Thị Thu",
    ownerEmail: "cocoon.vietnam@outlook.com",
    phone: "0945678901",
    status: "PENDING",
    productsCount: 20,
    ordersCount: 0,
    ratingAvg: 0,
    createdAt: "2026-10-18T09:20:00Z",
    avatarUrl:
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=120&auto=format&fit=crop&q=80",
    businessAddress: "Tân Bình, TP. Hồ Chí Minh",
  },
  {
    id: 5,
    name: "Hàng Gia Dụng Giá Xưởng",
    legalName: "Hộ kinh doanh Trần Văn B",
    ownerName: "Trần Văn B",
    ownerEmail: "giadung.fake@test.com",
    phone: "0987654321",
    status: "BANNED",
    productsCount: 5,
    ordersCount: 14,
    ratingAvg: 1.8,
    createdAt: "2026-09-01T11:00:00Z",
    avatarUrl:
      "https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=120&auto=format&fit=crop&q=80",
    businessAddress: "Bình Chánh, TP. Hồ Chí Minh",
  },
];

export function getMockAdminStores(status?: string): MockStoreItem[] {
  if (!status || status === "ALL") return mockAdminStores;
  return mockAdminStores.filter((s) => s.status === status);
}

export interface MockUserItem {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: "ADMIN" | "SELLER" | "BUYER";
  status: "ACTIVE" | "LOCKED";
  ordersCount: number;
  createdAt: string;
  avatarUrl: string;
}

export const mockAdminUsers: MockUserItem[] = [
  {
    id: 1,
    fullName: "Trần Quản Trị",
    email: "admin@flashsale.local",
    phone: "0900000001",
    role: "ADMIN",
    status: "ACTIVE",
    ordersCount: 0,
    createdAt: "2026-01-01T00:00:00Z",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDK0gXbrsJHPE1l4J0FZ8M71kGSL8L_OHFGLNCRatickcS_crjibyNnwFNbvgINeJBnL6eMT1GLLrUtL_71bgti9vuRU6VhzIxcB6lVwjr1298mTmxI0-u5gVlY0urDs_K_RjyVgmbvBgKABkqgyq7HQdqpEignxAr3-T860UfH-DGo2Bd14jK6jTpxtDsU4ggD0rcf-rJaW-uOSON7VilbcwixF_LjGVOW10KI6YwQx-iJ2ZAOOHkQtw",
  },
  {
    id: 2,
    fullName: "Nguyễn Đối Tác 1",
    email: "seller1@demo.local",
    phone: "0900000002",
    role: "SELLER",
    status: "ACTIVE",
    ordersCount: 120,
    createdAt: "2026-03-15T08:30:00Z",
    avatarUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAbz76SRjW8_3yPmbvexhST_wIFQiYLumarocjtOVufren4m0-TVaMANG3U73E_07kLVfZ_SXV6oiDoL9iCMgqT-05TVuwX8nIG92rGi2Z2pb8Q-Di2YtgrY0StAy5R9rPGS4LJREjIRHZ9l-WaT5bwbdVT-Ot_p07PE3W18JpMZiV065KXmd9odEolIfJnhCm_B3QkAkRS9jF3eQGctcSnPSQQsuzZimqkYc1JfwDTjzlC6D_CvFJogg",
  },
  {
    id: 3,
    fullName: "Lê Hoàng Buyer",
    email: "buyer1@demo.local",
    phone: "0911223344",
    role: "BUYER",
    status: "ACTIVE",
    ordersCount: 18,
    createdAt: "2026-05-10T12:00:00Z",
    avatarUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
  },
  {
    id: 4,
    fullName: "Vũ Minh Anh",
    email: "minhanh.vu@gmail.com",
    phone: "0922334455",
    role: "BUYER",
    status: "ACTIVE",
    ordersCount: 8,
    createdAt: "2026-07-22T15:45:00Z",
    avatarUrl:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
  },
  {
    id: 5,
    fullName: "Tài Khoản Vi Phạm",
    email: "spammer.bot@tempmail.com",
    phone: "0999888777",
    role: "BUYER",
    status: "LOCKED",
    ordersCount: 2,
    createdAt: "2026-09-12T03:10:00Z",
    avatarUrl:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
  },
];

export function getMockAdminUsers(params?: {
  role?: string;
  status?: string;
  search?: string;
}): MockUserItem[] {
  let list = mockAdminUsers;
  if (params?.role && params.role !== "ALL") {
    list = list.filter((u) => u.role === params.role);
  }
  if (params?.status && params.status !== "ALL") {
    list = list.filter((u) => u.status === params.status);
  }
  if (params?.search) {
    const q = params.search.toLowerCase();
    list = list.filter(
      (u) =>
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.includes(q)
    );
  }
  return list;
}

export interface MockProductItem {
  id: number;
  name: string;
  slug: string;
  storeName: string;
  categoryName: string;
  minPrice: number;
  maxPrice: number;
  totalStock: number;
  status: "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK" | "BANNED";
  primaryImageUrl: string;
  createdAt: string;
}

export const mockAdminProducts: MockProductItem[] = [
  {
    id: 1001,
    name: "Tai nghe Bluetooth chống ồn ANC SoundCore Q30",
    slug: "tai-nghe-soundcore-q30",
    storeName: "Anker Flagship Store",
    categoryName: "Thiết bị điện tử",
    minPrice: 1250000,
    maxPrice: 1590000,
    totalStock: 350,
    status: "ACTIVE",
    primaryImageUrl:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&auto=format&fit=crop&q=80",
    createdAt: "2026-09-10T08:00:00Z",
  },
  {
    id: 1002,
    name: "Áo thun thể thao nam thoáng khí Coolmate Promax",
    slug: "ao-thun-coolmate-promax",
    storeName: "Coolmate Official",
    categoryName: "Thời trang nam",
    minPrice: 189000,
    maxPrice: 229000,
    totalStock: 800,
    status: "ACTIVE",
    primaryImageUrl:
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300&auto=format&fit=crop&q=80",
    createdAt: "2026-09-15T10:00:00Z",
  },
  {
    id: 1003,
    name: "Nồi chiên không dầu điện tử Lock&Lock 5.5L",
    slug: "noi-chien-lock-and-lock-5-5l",
    storeName: "Lock&Lock Vietnam",
    categoryName: "Nhà cửa & Đời sống",
    minPrice: 1890000,
    maxPrice: 2190000,
    totalStock: 120,
    status: "ACTIVE",
    primaryImageUrl:
      "https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=300&auto=format&fit=crop&q=80",
    createdAt: "2026-09-20T11:00:00Z",
  },
  {
    id: 1004,
    name: "Đầm xòe công sở thanh lịch GUMAC Elegance",
    slug: "dam-xoe-gumac-elegance",
    storeName: "GUMAC Fashion",
    categoryName: "Thời trang nữ",
    minPrice: 350000,
    maxPrice: 480000,
    totalStock: 0,
    status: "OUT_OF_STOCK",
    primaryImageUrl:
      "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=300&auto=format&fit=crop&q=80",
    createdAt: "2026-09-22T14:30:00Z",
  },
  {
    id: 1005,
    name: "Bếp từ đôi cảm ứng cao cấp Sunhouse Apex",
    slug: "bep-tu-doi-sunhouse-apex",
    storeName: "Sunhouse Mall",
    categoryName: "Nhà cửa & Đời sống",
    minPrice: 3890000,
    maxPrice: 4290000,
    totalStock: 45,
    status: "INACTIVE",
    primaryImageUrl:
      "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=300&auto=format&fit=crop&q=80",
    createdAt: "2026-09-25T16:00:00Z",
  },
  {
    id: 1006,
    name: "Sạc dự phòng không rõ nguồn gốc 50000mAh Fake Pro",
    slug: "sac-du-phong-fake-pro",
    storeName: "Cửa hàng Phụ kiện Giá rẻ",
    categoryName: "Thiết bị điện tử",
    minPrice: 99000,
    maxPrice: 120000,
    totalStock: 50,
    status: "BANNED",
    primaryImageUrl:
      "https://images.unsplash.com/photo-1609592807908-1e247413d735?w=300&auto=format&fit=crop&q=80",
    createdAt: "2026-09-28T09:00:00Z",
  },
];

export function getMockAdminProducts(params?: {
  categoryId?: number;
  status?: string;
  search?: string;
}): MockProductItem[] {
  let list = mockAdminProducts;
  if (params?.status && params.status !== "ALL") {
    list = list.filter((p) => p.status === params.status);
  }
  if (params?.search) {
    const q = params.search.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.storeName.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q)
    );
  }
  return list;
}

export function updateMockAdminProductStatus(
  id: number,
  status: "ACTIVE" | "INACTIVE" | "BANNED"
): MockProductItem | undefined {
  const item = mockAdminProducts.find((p) => p.id === id);
  if (item) {
    item.status = status;
  }
  return item;
}

