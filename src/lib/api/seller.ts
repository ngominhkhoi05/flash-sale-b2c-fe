import { apiFetch, isMockMode } from "./client";
import type { PageResponse } from "@/types/api";
import type {
  SidebarSummaryResponse,
  SellerOrderResponse,
  SellerProductSummaryResponse,
  SellerProductDetailResponse,
  SellerRevenueDayPoint,
  CategoryItem,
  CreateProductPayload,
  UpdateProductPayload,
  FlashSaleSlotItem,
  RegisterFlashSaleItemDto,
  RegisteredFlashSaleHistoryItem,
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

/**
 * 9. Lấy danh sách ngành hàng (KHỚP BE: GET /api/v1/categories)
 */
export async function getCategories(): Promise<CategoryItem[]> {
  try {
    return await apiFetch<CategoryItem[]>("/categories");
  } catch {
    // Dự phòng fallback danh mục mặc định khi offline / demo
    return [
      { id: 1, name: "Thời trang nam", slug: "thoi-trang-nam" },
      { id: 2, name: "Thời trang nữ", slug: "thoi-trang-nu" },
      { id: 3, name: "Điện thoại & Phụ kiện", slug: "dien-thoai-phu-kien" },
      { id: 4, name: "Thiết bị điện tử", slug: "thiet-bi-dien-tu" },
      { id: 5, name: "Nhà cửa & Đời sống", slug: "nha-cua-doi-song" },
      { id: 6, name: "Sắc đẹp & Sức khỏe", slug: "sac-dep-suc-khoe" },
    ];
  }
}

/**
 * 10. Đăng bán sản phẩm mới SPU-SKU (KHỚP BE: POST /api/v1/seller/products)
 */
export async function createSellerProduct(
  payload: CreateProductPayload
): Promise<SellerProductDetailResponse> {
  return apiFetch<SellerProductDetailResponse>("/seller/products", {
    method: "POST",
    json: payload,
  });
}

/**
 * 11. Cập nhật thông tin sản phẩm và SKU (KHỚP BE: PUT /api/v1/seller/products/{id})
 */
export async function updateSellerProduct(
  productId: number,
  payload: UpdateProductPayload
): Promise<SellerProductDetailResponse> {
  return apiFetch<SellerProductDetailResponse>(`/seller/products/${productId}`, {
    method: "PUT",
    json: payload,
  });
}

/**
 * 12. Lấy danh sách phiên Flash Sale mở đăng ký (KHỚP BE: GET /api/v1/flash-sales/slots)
 */
export async function getFlashSaleSlots(): Promise<FlashSaleSlotItem[]> {
  try {
    const res = await apiFetch<Array<{
      id: number;
      title: string;
      startTime: string;
      endTime: string;
      status: string;
      reservationTtlSeconds?: number;
    }>>("/flash-sales/slots");
    if (res && res.length > 0) {
      return res.map((s) => ({
        ...s,
        participatingStoresCount: 32,
        availableProductSlots: 64,
        badgeLabel: s.title.includes("HOT") ? "HOT" : undefined,
      }));
    }
  } catch {
    // fallback below if mock mode or BE empty
  }

  return [
    {
      id: 1,
      title: "Flash Sale Giờ Vàng 12:00 – 14:00",
      startTime: "2026-10-05T12:00:00Z",
      endTime: "2026-10-05T14:00:00Z",
      status: "UPCOMING",
      reservationTtlSeconds: 300,
      participatingStoresCount: 48,
      availableProductSlots: 18,
      badgeLabel: "HOT",
    },
    {
      id: 2,
      title: "Đại Tiệc Tối 20:00 – 22:00",
      startTime: "2026-10-05T20:00:00Z",
      endTime: "2026-10-05T22:00:00Z",
      status: "UPCOMING",
      reservationTtlSeconds: 300,
      participatingStoresCount: 32,
      availableProductSlots: 64,
    },
    {
      id: 3,
      title: "Siêu Khuyến Mãi Cuối Tuần 09:00 – 11:30",
      startTime: "2026-10-06T09:00:00Z",
      endTime: "2026-10-06T11:30:00Z",
      status: "UPCOMING",
      reservationTtlSeconds: 300,
      participatingStoresCount: 15,
      availableProductSlots: 82,
    },
  ];
}

/**
 * 13. Đăng ký biến thể SKU vào phiên Flash Sale (KHỚP BE: POST /api/v1/seller/flash-sales/items)
 */
export async function registerFlashSaleItem(
  item: RegisterFlashSaleItemDto
): Promise<void> {
  return apiFetch<void>("/seller/flash-sales/items", {
    method: "POST",
    json: item,
  });
}

/**
 * 14. Đăng ký hàng loạt biến thể SKU vào phiên Flash Sale
 */
export async function registerFlashSaleItems(
  items: RegisterFlashSaleItemDto[]
): Promise<void> {
  for (const item of items) {
    await registerFlashSaleItem(item);
  }
}

/**
 * 15. Lấy lịch sử đăng ký Flash Sale của shop
 */
export async function getRegisteredFlashSaleHistory(): Promise<
  RegisteredFlashSaleHistoryItem[]
> {
  try {
    return await apiFetch<RegisteredFlashSaleHistoryItem[]>(
      "/seller/flash-sales/items"
    );
  } catch {
    // Trả về mock data lịch sử cho Stitch Screen 23 nếu mock mode bật
    return [
      {
        id: 101,
        productName: "Áo thun Đen M",
        sku: "AT-DEN-M",
        imageUrl:
          "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60",
        slotTitle: "Giờ Vàng 12:00 – 14:00",
        slotDate: "05/10/2026",
        slotTime: "12:00 – 14:00",
        flashSalePrice: 89000,
        allocatedStock: 30,
        soldStock: 24,
        status: "APPROVED",
      },
      {
        id: 102,
        productName: "Áo sơ mi Trắng L",
        sku: "SM-TRANG-L",
        imageUrl:
          "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500&auto=format&fit=crop&q=60",
        slotTitle: "Đại Tiệc Tối 20:00",
        slotDate: "05/10/2026",
        slotTime: "20:00 – 22:00",
        flashSalePrice: 199000,
        allocatedStock: 15,
        soldStock: 0,
        status: "PENDING",
      },
      {
        id: 103,
        productName: "Quần Jean Slim 32",
        sku: "QJ-SLIM-32",
        imageUrl:
          "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&auto=format&fit=crop&q=60",
        slotTitle: "Giờ Vàng 12:00 – 14:00",
        slotDate: "05/10/2026",
        slotTime: "12:00 – 14:00",
        flashSalePrice: 299000,
        allocatedStock: 10,
        soldStock: 0,
        status: "REJECTED",
        rejectReason: "Giá sale chưa đủ hấp dẫn (giảm dưới 20% so với giá niêm yết).",
      },
      {
        id: 104,
        productName: "Áo Polo Navy M",
        sku: "PL-NAVY-M",
        imageUrl:
          "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500&auto=format&fit=crop&q=60",
        slotTitle: "Phiên 01/10/2026",
        slotDate: "01/10/2026",
        slotTime: "18:00 – 20:00",
        flashSalePrice: 139000,
        allocatedStock: 50,
        soldStock: 50,
        status: "ENDED",
      },
    ];
  }
}
