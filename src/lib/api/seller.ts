import { apiFetch, isMockMode } from "./client";
import type { PageResponse } from "@/types/api";
import type {
  SidebarSummaryResponse,
  SellerOrderResponse,
  SellerProductSummaryResponse,
  SellerProductDetailResponse,
  SellerRevenueDayPoint,
} from "@/types/seller";

/**
 * Fallback dữ liệu giả lập cho biểu đồ doanh thu 7 ngày khi BE chưa có API time-series.
 */
function getMockRevenuePoints(): SellerRevenueDayPoint[] {
  return [
    { date: "2026-10-12", dayLabel: "T2", revenue: 5200000, previousWeekRevenue: 4800000, ordersCount: 38 },
    { date: "2026-10-13", dayLabel: "T3", revenue: 6450000, previousWeekRevenue: 5900000, ordersCount: 44 },
    { date: "2026-10-14", dayLabel: "T4", revenue: 7800000, previousWeekRevenue: 6200000, ordersCount: 52 },
    { date: "2026-10-15", dayLabel: "T5", revenue: 6100000, previousWeekRevenue: 5800000, ordersCount: 41 },
    { date: "2026-10-16", dayLabel: "T6", revenue: 8900000, previousWeekRevenue: 7500000, ordersCount: 65 },
    { date: "2026-10-17", dayLabel: "T7", revenue: 10400000, previousWeekRevenue: 9100000, ordersCount: 78 },
    { date: "2026-10-18", dayLabel: "CN", revenue: 11200000, previousWeekRevenue: 9800000, ordersCount: 82 },
  ];
}

/**
 * Fallback dữ liệu mẫu KPI cho Seller Dashboard khi shop mới tinh hoặc mock mode.
 */
function getMockStoreSummary(): SidebarSummaryResponse {
  return {
    totalProducts: 48,
    pendingOrders: 12,
    todayOrders: 14,
    todayRevenue: 4850000,
    monthRevenue: 68400000,
    ratingAvg: 4.8,
    ratingCount: 120,
    lowStockProducts: 3,
    storeStatus: "APPROVED",
  };
}

/**
 * 1. Lấy thống kê KPI tổng hợp của shop (KHỚP BE: GET /api/v1/stores/sidebar/summary)
 */
export async function getStoreSidebarSummary(): Promise<SidebarSummaryResponse> {
  try {
    return await apiFetch<SidebarSummaryResponse>("/stores/sidebar/summary");
  } catch (err) {
    if (isMockMode()) {
      return getMockStoreSummary();
    }
    throw err;
  }
}

/**
 * 2. Lấy danh sách đơn hàng gần đây của shop (KHỚP BE: GET /api/v1/seller/orders)
 */
export async function getSellerRecentOrders(
  page: number = 0,
  size: number = 5
): Promise<PageResponse<SellerOrderResponse>> {
  return apiFetch<PageResponse<SellerOrderResponse>>("/seller/orders", {
    query: { page, size },
  });
}

/**
 * 3. Lấy top sản phẩm bán chạy của shop (KHỚP BE: GET /api/v1/seller/products)
 */
export async function getSellerTopProducts(
  page: number = 0,
  size: number = 4
): Promise<PageResponse<SellerProductSummaryResponse>> {
  return apiFetch<PageResponse<SellerProductSummaryResponse>>("/seller/products", {
    query: { page, size, sort: "totalSold,desc" },
  });
}

/**
 * 4. Lấy dữ liệu biểu đồ doanh thu chuỗi ngày (THIẾU BE: Cần request BE P1)
 * Fallback mock data khi bật NEXT_PUBLIC_USE_MOCKS
 */
export async function getSellerRevenueChart(
  period: "today" | "7days" | "30days" = "7days"
): Promise<SellerRevenueDayPoint[]> {
  try {
    return await apiFetch<SellerRevenueDayPoint[]>("/seller/analytics/revenue-chart", {
      query: { period },
    });
  } catch {
    if (isMockMode()) {
      return getMockRevenuePoints();
    }
    // Khi tắt mock: trả về dữ liệu rỗng để UI render empty state / warning banner
    return [];
  }
}

/**
 * 5. Lấy danh sách sản phẩm của shop có lọc và phân trang (KHỚP BE: GET /api/v1/seller/products)
 */
export async function getSellerProducts(
  page: number = 0,
  size: number = 10,
  status?: string
): Promise<PageResponse<SellerProductSummaryResponse>> {
  const query: Record<string, string | number> = { page, size };
  if (status && status !== "ALL") {
    query.status = status;
  }
  return apiFetch<PageResponse<SellerProductSummaryResponse>>("/seller/products", {
    query,
  });
}

/**
 * 6. Lấy chi tiết sản phẩm kèm danh sách biến thể SKU (KHỚP BE: GET /api/v1/seller/products/{id})
 */
export async function getSellerProductDetail(
  productId: number
): Promise<SellerProductDetailResponse> {
  return apiFetch<SellerProductDetailResponse>(`/seller/products/${productId}`);
}

/**
 * 7. Bật/tắt trạng thái sản phẩm SPU (KHỚP BE: PATCH /api/v1/seller/products/{id}/status?status=...)
 */
export async function updateProductStatus(
  productId: number,
  status: "ACTIVE" | "INACTIVE"
): Promise<void> {
  return apiFetch<void>(`/seller/products/${productId}/status`, {
    method: "PATCH",
    query: { status },
  });
}

/**
 * 8. Xóa sản phẩm SPU (KHỚP BE: DELETE /api/v1/seller/products/{id})
 */
export async function deleteProduct(productId: number): Promise<void> {
  return apiFetch<void>(`/seller/products/${productId}`, {
    method: "DELETE",
  });
}
