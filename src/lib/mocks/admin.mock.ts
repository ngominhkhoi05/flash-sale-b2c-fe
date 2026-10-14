import type {
  AdminDashboardData,
  AdminCampaign,
  AdminRealtimeMonitorData,
} from "@/types/admin";

export function getMockAdminDashboard(): AdminDashboardData {
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
      id: 102,
      name: "Phiên Giờ Vàng 12:00 đang diễn ra",
      startTime: new Date(Date.now() - 3600000).toISOString(),
      endTime: new Date(Date.now() + 4 * 3600000 + 32 * 60000).toISOString(),
      confirmedOrders: 2315,
      totalRevenue: 1828750000,
    },
    lastUpdated: new Date().toISOString(),
  };
}

export const mockAdminCampaigns: AdminCampaign[] = [
  {
    id: 101,
    name: "Sáng Khởi Động Siêu Sale",
    slotName: "09:00 - 11:30",
    startTime: new Date(Date.now() - 4 * 3600000).toISOString(),
    endTime: new Date(Date.now() - 1 * 3600000).toISOString(),
    status: "ENDED",
    productCount: 16,
    totalAllocatedStock: 800,
    totalSoldStock: 742,
    revenue: 642000000,
  },
  {
    id: 102,
    name: "Giờ Vàng Trưa Giá Sốc",
    slotName: "12:00 - 15:00",
    startTime: new Date(Date.now() - 1 * 3600000).toISOString(),
    endTime: new Date(Date.now() + 4 * 3600000 + 32 * 60000).toISOString(),
    status: "ACTIVE",
    productCount: 24,
    totalAllocatedStock: 1200,
    totalSoldStock: 532,
    revenue: 1828750000,
  },
  {
    id: 103,
    name: "Chiều Cao Điểm Săn Deal",
    slotName: "15:00 - 18:00",
    startTime: new Date(Date.now() + 4 * 3600000 + 32 * 60000).toISOString(),
    endTime: new Date(Date.now() + 7 * 3600000).toISOString(),
    status: "UPCOMING",
    productCount: 20,
    totalAllocatedStock: 950,
    totalSoldStock: 0,
    revenue: 0,
  },
  {
    id: 104,
    name: "Tan Ca Đón Bão Sale",
    slotName: "18:00 - 21:00",
    startTime: new Date(Date.now() + 7 * 3600000).toISOString(),
    endTime: new Date(Date.now() + 10 * 3600000).toISOString(),
    status: "UPCOMING",
    productCount: 18,
    totalAllocatedStock: 850,
    totalSoldStock: 0,
    revenue: 0,
  },
];

export function getMockRealtimeMonitoringData(): AdminRealtimeMonitorData {
  return {
    slotId: 102,
    slotName: "Phiên Giờ Vàng 12:00 - 15:00",
    startTime: new Date(Date.now() - 3600000).toISOString(),
    endTime: new Date(Date.now() + 4 * 3600000 + 32 * 60000).toISOString(),
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
