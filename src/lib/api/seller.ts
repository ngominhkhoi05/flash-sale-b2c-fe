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
  SellerWalletResponse,
  SellerWalletTransaction,
  SellerWithdrawalRequest,
  SellerBankAccountPayload,
  SellerBankAccountResponse,
  SellerVoucherItem,
  CreateSellerVoucherPayload,
  SellerReviewItem,
  SellerReviewSummaryResponse,
  ReplySellerReviewPayload,
  SellerStoreProfileResponse,
  SellerWarehouseAddressItem,
  UpdateStoreProfilePayload,
  CreateStoreAddressPayload,
  SellerStaffMember,
  SellerRoleSummary,
  InviteStaffPayload,
  UpdateStaffRolePayload,
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
  try {
    return await apiFetch<PageResponse<SellerOrderResponse>>("/seller/orders", {
      query: { page, size },
    });
  } catch (err) {
    if (isMockMode()) {
      return getMockSellerOrders(page, size);
    }
    throw err;
  }
}

/**
 * Lấy toàn bộ danh sách đơn hàng có lọc theo trạng thái và phân trang (KHỚP BE: GET /api/v1/seller/orders)
 */
export async function getSellerOrders(
  page: number = 0,
  size: number = 10,
  status?: string
): Promise<PageResponse<SellerOrderResponse>> {
  try {
    const query: Record<string, string | number> = { page, size };
    if (status && status !== "ALL") {
      query.status = status;
    }
    interface RawOrderPageData {
      items?: SellerOrderResponse[];
      content?: SellerOrderResponse[];
      totalElements?: number;
      totalPages?: number;
      pageNumber?: number;
      pageSize?: number;
      isFirst?: boolean;
      first?: boolean;
      isLast?: boolean;
      last?: boolean;
      hasNext?: boolean;
      hasPrevious?: boolean;
    }

    const res = await apiFetch<RawOrderPageData | SellerOrderResponse[]>("/seller/orders", {
      query,
    });

    const isArray = Array.isArray(res);
    const pageObj: RawOrderPageData = !isArray && res && typeof res === "object" ? (res as RawOrderPageData) : {};
    const rawList: SellerOrderResponse[] = isArray
      ? (res as SellerOrderResponse[])
      : Array.isArray(pageObj.items)
      ? pageObj.items
      : Array.isArray(pageObj.content)
      ? pageObj.content
      : [];

    const list: SellerOrderResponse[] = rawList.map((o) => ({
      ...o,
      recipientAddress: o.recipientAddress || o.shippingAddressText || "Địa chỉ nhận hàng",
      shippingAddressText: o.shippingAddressText || o.recipientAddress || "Địa chỉ nhận hàng",
      totalAmount: typeof o.totalAmount === "number" ? o.totalAmount : (o.finalAmount ?? o.subtotalAmount ?? 0),
      paymentMethod: o.paymentMethod || "ZALOPAY",
      status: o.status || "PENDING",
      items: Array.isArray(o.items)
        ? o.items.map((it) => ({
            ...it,
            imageUrl: it.imageUrl || it.productImage || "",
            productImage: it.productImage || it.imageUrl || "",
            priceAtPurchase: typeof it.priceAtPurchase === "number" ? it.priceAtPurchase : (it.unitPrice ?? 0),
            unitPrice: typeof it.unitPrice === "number" ? it.unitPrice : (it.priceAtPurchase ?? 0),
            itemSubtotal:
              typeof it.itemSubtotal === "number"
                ? it.itemSubtotal
                : ((it.priceAtPurchase || it.unitPrice || 0) * (it.quantity || 1)),
          }))
        : [],
    }));

    return {
      content: list,
      items: list,
      totalElements: pageObj.totalElements ?? list.length,
      totalPages: pageObj.totalPages ?? Math.max(1, Math.ceil(list.length / size)),
      pageNumber: pageObj.pageNumber ?? page,
      pageSize: pageObj.pageSize ?? size,
      isFirst: pageObj.isFirst ?? pageObj.first ?? page === 0,
      isLast: pageObj.isLast ?? pageObj.last ?? true,
      hasNext: pageObj.hasNext ?? false,
      hasPrevious: pageObj.hasPrevious ?? false,
    };
  } catch (err) {
    if (isMockMode()) {
      return getMockSellerOrders(page, size, status);
    }
    throw err;
  }
}

/**
 * Lấy chi tiết đơn hàng (KHỚP BE: GET /api/v1/seller/orders/{id})
 */
export async function getSellerOrderById(id: number): Promise<SellerOrderResponse> {
  try {
    return await apiFetch<SellerOrderResponse>(`/seller/orders/${id}`);
  } catch (err) {
    if (isMockMode()) {
      return getMockSellerOrders(0, 50).content.find((o) => o.id === id) || {
        id,
        orderCode: `ORD-${id}`,
        recipientName: "Khách hàng",
        recipientPhone: "0901234567",
        recipientAddress: "123 Lê Lợi, Q.1, TP. Hồ Chí Minh",
        paymentMethod: "ZALOPAY",
        status: "PENDING",
        createdAt: new Date().toISOString(),
      };
    }
    throw err;
  }
}

/**
 * Cập nhật trạng thái đơn hàng (KHỚP BE: PATCH /api/v1/seller/orders/{id}/status)
 */
export async function updateSellerOrderStatus(
  id: number,
  status: string
): Promise<SellerOrderResponse> {
  try {
    return await apiFetch<SellerOrderResponse>(`/seller/orders/${id}/status`, {
      method: "PATCH",
      json: { status },
    });
  } catch (err) {
    if (isMockMode()) {
      return {
        id,
        orderCode: `ORD-${id}`,
        recipientName: "Khách hàng",
        recipientPhone: "0901234567",
        recipientAddress: "123 Lê Lợi, Q.1, TP. Hồ Chí Minh",
        paymentMethod: "ZALOPAY",
        status,
        createdAt: new Date().toISOString(),
      };
    }
    throw err;
  }
}

function getMockSellerOrders(
  page: number = 0,
  size: number = 10,
  statusFilter?: string
): PageResponse<SellerOrderResponse> {
  const allOrders: SellerOrderResponse[] = [
    {
      id: 201,
      orderCode: "FS-261005-M9B2",
      buyerId: 1001,
      storeId: 1,
      storeName: "UTC Fashion",
      slotId: 4,
      recipientName: "Nguyễn Văn An",
      recipientPhone: "0912 345 678",
      recipientAddress: "Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
      shippingAddressText: "Số 45 Lê Duẩn, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
      recipientCity: "TP. Hồ Chí Minh",
      recipientDistrict: "Quận 1",
      recipientWard: "Phường Bến Nghé",
      subtotalAmount: 380000,
      totalItemAmount: 380000,
      discountAmount: 76000,
      voucherDiscountAmount: 20000,
      shippingFee: 25000,
      totalAmount: 334000,
      finalAmount: 334000,
      commissionRate: 5,
      platformFee: 16700,
      sellerAmount: 300200,
      paymentMethod: "ZALOPAY",
      paymentStatus: "PAID",
      status: "PENDING",
      createdAt: "2026-10-18T05:02:15Z",
      expiresAt: "2026-10-18T09:00:00Z",
      trackingNumber: "SPX-VN-88392100",
      carrierName: "SPX Express",
      timeline: [
        { status: "PENDING_PAYMENT", label: "Người mua đặt hàng", at: "2026-10-18T05:00:10Z" },
        { status: "PAID", label: "Thanh toán ZaloPay thành công", at: "2026-10-18T05:02:15Z" },
        { status: "PENDING", label: "Chờ người bán xác nhận chuẩn bị hàng", at: "2026-10-18T05:02:16Z" },
      ],
      items: [
        {
          id: 501,
          productId: 1,
          productName: "Áo Hoodie Unisex Oversize Nỉ Bông",
          variantId: 1,
          variantSku: "HD-DEN-L",
          variantName: "Đen / Size L",
          imageUrl: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500&auto=format&fit=crop&q=60",
          productImage: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500&auto=format&fit=crop&q=60",
          unitPrice: 380000,
          priceAtPurchase: 304000,
          quantity: 1,
          totalPrice: 304000,
          itemSubtotal: 304000,
          flashSaleItemId: 101,
        },
      ],
    },
    {
      id: 202,
      orderCode: "FS-261005-K3A1",
      buyerId: 1002,
      storeId: 1,
      storeName: "UTC Fashion",
      slotId: 4,
      recipientName: "Trần Thị Bích",
      recipientPhone: "0988 765 432",
      recipientAddress: "Phường Dịch Vọng Hậu, Quận Cầu Giấy, Hà Nội",
      shippingAddressText: "Tòa nhà Keangnam, Phạm Hùng, Cầu Giấy, Hà Nội",
      recipientCity: "Hà Nội",
      recipientDistrict: "Cầu Giấy",
      subtotalAmount: 360000,
      totalItemAmount: 360000,
      discountAmount: 90000,
      voucherDiscountAmount: 0,
      shippingFee: 28000,
      totalAmount: 298000,
      finalAmount: 298000,
      commissionRate: 5,
      platformFee: 14900,
      sellerAmount: 268200,
      paymentMethod: "ZALOPAY",
      paymentStatus: "PAID",
      status: "PROCESSING",
      createdAt: "2026-10-18T04:20:00Z",
      trackingNumber: "GHTK-HN-9921445",
      carrierName: "Giao Hàng Tiết Kiệm",
      timeline: [
        { status: "PENDING_PAYMENT", label: "Đặt hàng", at: "2026-10-18T04:18:00Z" },
        { status: "PAID", label: "Thanh toán ZaloPay", at: "2026-10-18T04:20:00Z" },
        { status: "PROCESSING", label: "Shop đã xác nhận, đang đóng gói", at: "2026-10-18T04:35:00Z" },
      ],
      items: [
        {
          id: 502,
          productId: 2,
          productName: "Áo thun Basic Cotton Organic",
          variantId: 3,
          variantSku: "AT-TRANG-XL",
          variantName: "Trắng / Size XL",
          imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60",
          productImage: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60",
          unitPrice: 180000,
          priceAtPurchase: 135000,
          quantity: 2,
          totalPrice: 270000,
          itemSubtotal: 270000,
          flashSaleItemId: 102,
        },
      ],
    },
    {
      id: 203,
      orderCode: "ORD-261005-B7D8",
      buyerId: 1003,
      storeId: 1,
      storeName: "UTC Fashion",
      recipientName: "Lê Hoàng Nam",
      recipientPhone: "0977 112 233",
      recipientAddress: "Hải Châu, Đà Nẵng",
      shippingAddressText: "12 Bạch Đằng, Hải Châu, Đà Nẵng",
      recipientCity: "Đà Nẵng",
      subtotalAmount: 490000,
      totalItemAmount: 490000,
      discountAmount: 50000,
      voucherDiscountAmount: 30000,
      shippingFee: 30000,
      totalAmount: 450000,
      finalAmount: 450000,
      commissionRate: 5,
      platformFee: 22500,
      sellerAmount: 405000,
      paymentMethod: "COD",
      paymentStatus: "PENDING",
      status: "SHIPPING",
      createdAt: "2026-10-17T14:10:00Z",
      shippedAt: "2026-10-18T02:00:00Z",
      trackingNumber: "VTP-DN-110293",
      carrierName: "Viettel Post",
      timeline: [
        { status: "PENDING", label: "Đặt hàng (COD)", at: "2026-10-17T14:10:00Z" },
        { status: "PROCESSING", label: "Shop xác nhận đơn", at: "2026-10-17T15:00:00Z" },
        { status: "SHIPPING", label: "Đã bàn giao cho Viettel Post", at: "2026-10-18T02:00:00Z" },
      ],
      items: [
        {
          id: 503,
          productId: 3,
          productName: "Quần Jean Slimfit Co Giãn 4 Chiều",
          variantId: 5,
          variantSku: "QJ-XANH-32",
          variantName: "Xanh Đậm / Size 32",
          imageUrl: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&auto=format&fit=crop&q=60",
          productImage: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&auto=format&fit=crop&q=60",
          unitPrice: 490000,
          priceAtPurchase: 440000,
          quantity: 1,
          totalPrice: 440000,
          itemSubtotal: 440000,
        },
      ],
    },
    {
      id: 204,
      orderCode: "ORD-261004-C4E2",
      buyerId: 1004,
      storeId: 1,
      storeName: "UTC Fashion",
      recipientName: "Phạm Thu Trang",
      recipientPhone: "0933 445 566",
      recipientAddress: "Ninh Kiều, Cần Thơ",
      shippingAddressText: "88 Nguyễn Trãi, Ninh Kiều, Cần Thơ",
      recipientCity: "Cần Thơ",
      subtotalAmount: 410000,
      totalItemAmount: 410000,
      discountAmount: 45000,
      voucherDiscountAmount: 0,
      shippingFee: 24000,
      totalAmount: 389000,
      finalAmount: 389000,
      commissionRate: 5,
      platformFee: 19450,
      sellerAmount: 350100,
      paymentMethod: "ZALOPAY",
      paymentStatus: "PAID",
      status: "COMPLETED",
      createdAt: "2026-10-16T10:00:00Z",
      shippedAt: "2026-10-16T16:00:00Z",
      completedAt: "2026-10-18T03:00:00Z",
      trackingNumber: "SPX-CT-5544321",
      carrierName: "SPX Express",
      timeline: [
        { status: "PENDING", label: "Đặt hàng", at: "2026-10-16T10:00:00Z" },
        { status: "PROCESSING", label: "Shop xác nhận", at: "2026-10-16T11:00:00Z" },
        { status: "SHIPPING", label: "Đang giao hàng", at: "2026-10-16T16:00:00Z" },
        { status: "COMPLETED", label: "Giao hàng thành công", at: "2026-10-18T03:00:00Z" },
      ],
      items: [
        {
          id: 504,
          productId: 4,
          productName: "Áo Polo Thể Thao Quick-Dry",
          variantId: 7,
          variantSku: "PL-XAM-M",
          variantName: "Xám / Size M",
          imageUrl: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500&auto=format&fit=crop&q=60",
          productImage: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500&auto=format&fit=crop&q=60",
          unitPrice: 260000,
          priceAtPurchase: 239000,
          quantity: 1,
          totalPrice: 239000,
          itemSubtotal: 239000,
        },
        {
          id: 505,
          productId: 5,
          productName: "Vớ Cổ Cao Dệt Kim Thể Thao",
          variantId: 9,
          variantSku: "VO-TRANG-FREESIZE",
          variantName: "Trắng / Freesize",
          imageUrl: "https://images.unsplash.com/photo-1582966772680-860e372bb558?w=500&auto=format&fit=crop&q=60",
          productImage: "https://images.unsplash.com/photo-1582966772680-860e372bb558?w=500&auto=format&fit=crop&q=60",
          unitPrice: 50000,
          priceAtPurchase: 50000,
          quantity: 3,
          totalPrice: 150000,
          itemSubtotal: 150000,
        },
      ],
    },
    {
      id: 205,
      orderCode: "FS-261004-X9Z1",
      buyerId: 1005,
      storeId: 1,
      storeName: "UTC Fashion",
      slotId: 2,
      recipientName: "Vũ Đình Trọng",
      recipientPhone: "0944 556 677",
      recipientAddress: "Lê Chân, Hải Phòng",
      shippingAddressText: "56 Cầu Đất, Lê Chân, Hải Phòng",
      recipientCity: "Hải Phòng",
      subtotalAmount: 750000,
      totalItemAmount: 750000,
      discountAmount: 150000,
      voucherDiscountAmount: 0,
      shippingFee: 20000,
      totalAmount: 620000,
      finalAmount: 620000,
      commissionRate: 5,
      platformFee: 0,
      sellerAmount: 0,
      paymentMethod: "ZALOPAY",
      paymentStatus: "REFUNDED",
      status: "CANCELLED",
      createdAt: "2026-10-15T08:00:00Z",
      trackingNumber: "SPX-HP-998811",
      carrierName: "SPX Express",
      timeline: [
        { status: "PENDING", label: "Đặt hàng", at: "2026-10-15T08:00:00Z" },
        { status: "CANCELLED", label: "Đơn hàng đã hủy bởi Shop (Hết hàng)", at: "2026-10-15T09:12:00Z" },
      ],
      items: [
        {
          id: 506,
          productId: 6,
          productName: "Giày Sneaker Retro Classic",
          variantId: 11,
          variantSku: "SNK-RETRO-42",
          variantName: "Trắng Đỏ / Size 42",
          imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&auto=format&fit=crop&q=60",
          productImage: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&auto=format&fit=crop&q=60",
          unitPrice: 750000,
          priceAtPurchase: 600000,
          quantity: 1,
          totalPrice: 600000,
          itemSubtotal: 600000,
          flashSaleItemId: 98,
        },
      ],
    },
    {
      id: 206,
      orderCode: "ORD-261005-W1Q8",
      buyerId: 1006,
      storeId: 1,
      storeName: "UTC Fashion",
      recipientName: "Đỗ Minh Quân",
      recipientPhone: "0966 889 900",
      recipientAddress: "Bình Thạnh, TP. Hồ Chí Minh",
      shippingAddressText: "210 Điện Biên Phủ, Phường 25, Bình Thạnh, TP. Hồ Chí Minh",
      recipientCity: "TP. Hồ Chí Minh",
      subtotalAmount: 180000,
      totalItemAmount: 180000,
      discountAmount: 35000,
      voucherDiscountAmount: 0,
      shippingFee: 20000,
      totalAmount: 165000,
      finalAmount: 165000,
      commissionRate: 5,
      platformFee: 8250,
      sellerAmount: 148500,
      paymentMethod: "ZALOPAY",
      paymentStatus: "PENDING",
      status: "PENDING_PAYMENT",
      createdAt: "2026-10-18T05:25:00Z",
      expiresAt: "2026-10-18T05:30:00Z",
      timeline: [
        { status: "PENDING_PAYMENT", label: "Đang chờ thanh toán ZaloPay (còn 5 phút)", at: "2026-10-18T05:25:00Z" },
      ],
      items: [
        {
          id: 507,
          productId: 7,
          productName: "Mũ Lưỡi Trai Unisex Canvas",
          variantId: 14,
          variantSku: "MU-CANVAS-DEN",
          variantName: "Đen / Freesize",
          imageUrl: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500&auto=format&fit=crop&q=60",
          productImage: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500&auto=format&fit=crop&q=60",
          unitPrice: 180000,
          priceAtPurchase: 145000,
          quantity: 1,
          totalPrice: 145000,
          itemSubtotal: 145000,
        },
      ],
    },
  ];

  let filtered = allOrders;
  if (statusFilter && statusFilter !== "ALL") {
    filtered = allOrders.filter((o) => o.status === statusFilter);
  }

  const start = page * size;
  const content = filtered.slice(start, start + size);
  const pageNumber = page;
  const pageSize = size;
  const totalElements = filtered.length;
  const totalPages = Math.ceil(totalElements / pageSize) || 1;
  return {
    content,
    pageNumber,
    pageSize,
    totalElements,
    totalPages,
    isFirst: pageNumber === 0,
    isLast: start + pageSize >= totalElements,
    hasNext: start + pageSize < totalElements,
    hasPrevious: pageNumber > 0,
  };
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

let mockSellerProductStore: SellerProductSummaryResponse[] = [
  {
    id: 1,
    storeId: 1,
    storeName: "UTC Fashion",
    categoryId: 1,
    categoryName: "Thời trang nam",
    name: "Áo thun nam Cotton Compact Vibe UTC cao cấp form rộng thoáng khí",
    slug: "ao-thun-nam-cotton-compact-vibe-utc",
    imageUrl:
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60",
    minPrice: 149000,
    maxPrice: 189000,
    totalStock: 350,
    totalSold: 120,
    status: "ACTIVE",
    createdAt: "2026-10-15T08:30:00Z",
  },
  {
    id: 2,
    storeId: 1,
    storeName: "UTC Fashion",
    categoryId: 1,
    categoryName: "Thời trang nam",
    name: "Quần Jeans Slimfit Co Giãn 4 Chiều Wash Xanh Đậm",
    slug: "quan-jeans-slimfit-co-gian-4-chieu",
    imageUrl:
      "https://images.unsplash.com/photo-1542272604-780c96856467?w=500&auto=format&fit=crop&q=60",
    minPrice: 320000,
    maxPrice: 350000,
    totalStock: 85,
    totalSold: 64,
    status: "ACTIVE",
    createdAt: "2026-10-14T09:15:00Z",
  },
  {
    id: 3,
    storeId: 1,
    storeName: "UTC Fashion",
    categoryId: 1,
    categoryName: "Thời trang nam",
    name: "Áo Polo Pique Cotton Phối Bo Cổ Viền Chỉ Tinh Tế",
    slug: "ao-polo-pique-cotton-phoi-bo-co",
    imageUrl:
      "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500&auto=format&fit=crop&q=60",
    minPrice: 220000,
    maxPrice: 240000,
    totalStock: 0,
    totalSold: 210,
    status: "OUT_OF_STOCK",
    createdAt: "2026-10-10T14:20:00Z",
  },
  {
    id: 4,
    storeId: 1,
    storeName: "UTC Fashion",
    categoryId: 1,
    categoryName: "Thời trang nam",
    name: "Áo Khoác Bomber Gió 2 Lớp Chống Nước Khóa Kéo YKK",
    slug: "ao-khoac-bomber-gio-2-lop",
    imageUrl:
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&auto=format&fit=crop&q=60",
    minPrice: 450000,
    maxPrice: 480000,
    totalStock: 40,
    totalSold: 15,
    status: "INACTIVE",
    createdAt: "2026-10-08T11:00:00Z",
  },
];

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
  try {
    interface RawPageData {
      items?: SellerProductSummaryResponse[];
      content?: SellerProductSummaryResponse[];
      totalElements?: number;
      totalPages?: number;
      pageNumber?: number;
      pageSize?: number;
      isFirst?: boolean;
      first?: boolean;
      isLast?: boolean;
      last?: boolean;
      hasNext?: boolean;
      hasPrevious?: boolean;
    }

    const res = await apiFetch<RawPageData | SellerProductSummaryResponse[]>("/seller/products", {
      query,
    });

    const isArray = Array.isArray(res);
    const pageObj: RawPageData = !isArray && res && typeof res === "object" ? (res as RawPageData) : {};
    const rawList: SellerProductSummaryResponse[] = isArray
      ? (res as SellerProductSummaryResponse[])
      : Array.isArray(pageObj.items)
      ? pageObj.items
      : Array.isArray(pageObj.content)
      ? pageObj.content
      : [];

    const list: SellerProductSummaryResponse[] = rawList.map((item) => ({
      ...item,
      minPrice: typeof item.minPrice === "number" ? item.minPrice : 0,
      maxPrice: typeof item.maxPrice === "number" ? item.maxPrice : (item.minPrice ?? 0),
      totalStock: typeof item.totalStock === "number" ? item.totalStock : 0,
      totalSold: typeof item.totalSold === "number" ? item.totalSold : 0,
      status: item.status || "ACTIVE",
    }));

    return {
      content: list,
      items: list,
      totalElements: pageObj.totalElements ?? list.length,
      totalPages: pageObj.totalPages ?? Math.max(1, Math.ceil(list.length / size)),
      pageNumber: pageObj.pageNumber ?? page,
      pageSize: pageObj.pageSize ?? size,
      isFirst: pageObj.isFirst ?? pageObj.first ?? page === 0,
      isLast: pageObj.isLast ?? pageObj.last ?? true,
      hasNext: pageObj.hasNext ?? false,
      hasPrevious: pageObj.hasPrevious ?? false,
    };
  } catch {
    // Luôn fallback về mock data khi Backend chưa chạy hoặc lỗi kết nối
    let filtered = mockSellerProductStore;
    if (status && status !== "ALL") {
      filtered = filtered.filter((p) => p.status === status);
    }
    const start = page * size;
    const paginated = filtered.slice(start, start + size);
    return {
      content: paginated,
      items: paginated,
      totalElements: filtered.length,
      totalPages: Math.ceil(filtered.length / size) || 1,
      pageNumber: page,
      pageSize: size,
      isFirst: page === 0,
      isLast: start + size >= filtered.length,
      hasNext: start + size < filtered.length,
      hasPrevious: page > 0,
    };
  }
}

/**
 * 6. Lấy chi tiết sản phẩm kèm danh sách biến thể SKU (KHỚP BE: GET /api/v1/seller/products/{id})
 */
export async function getSellerProductDetail(
  productId: number
): Promise<SellerProductDetailResponse> {
  try {
    const res = await apiFetch<SellerProductDetailResponse>(
      `/seller/products/${productId}`
    );
    const configs = res.tierVariationConfigs || res.tierVariations || [];
    return {
      ...res,
      tierVariationConfigs: configs,
      tierVariations: configs,
      variants: Array.isArray(res.variants) ? res.variants : [],
    };
  } catch (err) {
    if (isMockMode()) {
      const summary = mockSellerProductStore.find((p) => p.id === productId);
      return {
        id: productId,
        storeId: summary?.storeId || 1,
        storeName: summary?.storeName || "UTC Fashion",
        categoryId: summary?.categoryId || 1,
        categoryName: summary?.categoryName || "Thời trang nam",
        name: summary?.name || "Áo thun nam Cotton Compact Vibe UTC cao cấp",
        slug: summary?.slug || "ao-thun-nam",
        description:
          "✔ **Chất liệu**: 100% Cotton Compact chải kỹ định lượng 220gsm.\n✔ **Đường may 2 kim**: Gia cố chắc chắn.",
        imageUrl:
          summary?.imageUrl ||
          "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60",
        status: summary?.status || "ACTIVE",
        tierVariations: [
          { name: "Màu sắc", options: ["Đen", "Trắng", "Vàng"] },
          { name: "Kích thước", options: ["S", "M", "L", "XL"] },
        ],
        tierVariationConfigs: [
          { name: "Màu sắc", options: ["Đen", "Trắng", "Vàng"] },
          { name: "Kích thước", options: ["S", "M", "L", "XL"] },
        ],
        variants: [
          {
            id: productId * 10 + 1,
            sku: "AT-DEN-S",
            skuCode: "AT-DEN-S",
            variantName: "Đen, Size S",
            originalPrice: summary?.minPrice || 149000,
            salePrice: summary?.minPrice || 149000,
            stockQuantity: 50,
            status: "ACTIVE",
            attributes: { "Màu sắc": "Đen", "Kích thước": "S" },
          },
        ],
      };
    }
    throw err;
  }
}

/**
 * 7. Bật/tắt trạng thái sản phẩm SPU (KHỚP BE: PATCH /api/v1/seller/products/{id}/status?status=...)
 */
export async function updateProductStatus(
  productId: number,
  status: "ACTIVE" | "INACTIVE"
): Promise<void> {
  try {
    await apiFetch<void>(`/seller/products/${productId}/status`, {
      method: "PATCH",
      query: { status },
    });
  } catch (err) {
    if (isMockMode()) {
      const target = mockSellerProductStore.find((p) => p.id === productId);
      if (target) {
        target.status = status;
      }
      return;
    }
    throw err;
  }
}

/**
 * 8. Xóa sản phẩm SPU (KHỚP BE: DELETE /api/v1/seller/products/{id})
 */
export async function deleteProduct(productId: number): Promise<void> {
  try {
    await apiFetch<void>(`/seller/products/${productId}`, {
      method: "DELETE",
    });
  } catch (err) {
    if (isMockMode()) {
      mockSellerProductStore = mockSellerProductStore.filter(
        (p) => p.id !== productId
      );
      return;
    }
    throw err;
  }
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
  try {
    return await apiFetch<SellerProductDetailResponse>("/seller/products", {
      method: "POST",
      json: payload,
    });
  } catch (err) {
    if (isMockMode()) {
      const newId = Date.now();
      const prices = payload.variants
        .map((v) => Number(v.originalPrice) || 0)
        .filter((p) => p > 0);
      const minPrice = prices.length > 0 ? Math.min(...prices) : 149000;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : 149000;
      const totalStock = payload.variants.reduce(
        (acc, v) => acc + (Number(v.stockQuantity) || 0),
        0
      );

      const newSummary: SellerProductSummaryResponse = {
        id: newId,
        storeId: 1,
        storeName: "UTC Fashion",
        categoryId: payload.categoryId,
        categoryName:
          payload.categoryId === 1 ? "Thời trang nam" : "Ngành hàng chung",
        name: payload.name,
        slug: payload.name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-"),
        imageUrl:
          payload.imageUrl ||
          "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60",
        minPrice,
        maxPrice,
        totalStock,
        totalSold: 0,
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
      };

      mockSellerProductStore.unshift(newSummary);

      return {
        id: newId,
        storeId: 1,
        storeName: "UTC Fashion",
        categoryId: payload.categoryId,
        categoryName: "Thời trang nam",
        name: payload.name,
        slug: newSummary.slug,
        description: payload.description,
        imageUrl: newSummary.imageUrl,
        status: "ACTIVE",
        tierVariations: payload.tierVariationConfigs,
        tierVariationConfigs: payload.tierVariationConfigs,
        variants: payload.variants.map((v, idx) => ({
          id: newId * 10 + idx,
          sku: v.sku,
          skuCode: v.sku,
          originalPrice: v.originalPrice,
          salePrice: v.originalPrice,
          stockQuantity: v.stockQuantity,
          status: "ACTIVE",
          attributes: v.attributes,
        })),
      };
    }
    throw err;
  }
}

/**
 * 11. Cập nhật thông tin sản phẩm và SKU (KHỚP BE: PUT /api/v1/seller/products/{id})
 */
export async function updateSellerProduct(
  productId: number,
  payload: UpdateProductPayload
): Promise<SellerProductDetailResponse> {
  try {
    return await apiFetch<SellerProductDetailResponse>(
      `/seller/products/${productId}`,
      {
        method: "PUT",
        json: payload,
      }
    );
  } catch (err) {
    if (isMockMode()) {
      const existing = mockSellerProductStore.find((p) => p.id === productId);
      if (existing) {
        existing.name = payload.name;
        existing.status = payload.status || existing.status;
        if (payload.imageUrl) existing.imageUrl = payload.imageUrl;
      }
      return {
        id: productId,
        storeId: 1,
        storeName: "UTC Fashion",
        categoryId: payload.categoryId,
        categoryName: "Thời trang nam",
        name: payload.name,
        slug: "updated-product",
        description: payload.description,
        status: payload.status,
        variants: payload.variants.map((v, idx) => ({
          id: v.id || productId * 10 + idx,
          sku: v.sku,
          skuCode: v.sku,
          originalPrice: v.originalPrice,
          salePrice: v.originalPrice,
          stockQuantity: v.stockQuantity,
          status: v.status || "ACTIVE",
          attributes: v.attributes,
        })),
      };
    }
    throw err;
  }
}

/**
 * 12. Upload ảnh cho sản phẩm SPU (KHỚP BE: POST /api/v1/seller/products/{id}/images)
 */
export async function uploadSellerProductImage(
  productId: number,
  file: Blob | File,
  isPrimary: boolean = false,
  displayOrder: number = 0
): Promise<unknown> {
  try {
    const formData = new FormData();
    formData.append("file", file, (file as File).name || "product_image.jpg");
    return await apiFetch(`/seller/products/${productId}/images`, {
      method: "POST",
      query: { isPrimary, displayOrder },
      body: formData,
    });
  } catch (err) {
    console.warn("Upload product image warning:", err);
    return null;
  }
}

/**
 * 13. Lấy danh sách phiên Flash Sale mở đăng ký (KHỚP BE: GET /api/v1/flash-sales/slots)
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
    const raw = await apiFetch<unknown>("/seller/flash-sales/items");
    const rawObj = raw as { content?: unknown[] } | unknown[];
    const items = (Array.isArray(rawObj) ? rawObj : (rawObj?.content || [])) as Array<{
      id: number;
      productId?: number;
      variantId?: number;
      productName?: string;
      skuCode?: string;
      sku?: string;
      imageUrl?: string;
      slotId?: number;
      slotTitle?: string;
      slotStartTime?: string;
      slotEndTime?: string;
      flashSalePrice?: number;
      allocatedStock?: number;
      availableStock?: number;
      status?: string;
      rejectReason?: string;
    }>;
    if (Array.isArray(items) && items.length > 0) {
      return items.map((item) => ({
        id: item.id,
        productName: item.productName || `Sản phẩm #${item.productId || item.variantId}`,
        sku: item.skuCode || item.sku || `SKU-${item.variantId}`,
        imageUrl:
          item.imageUrl ||
          "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60",
        slotTitle: item.slotTitle || `Phiên #${item.slotId}`,
        slotDate: item.slotStartTime
          ? new Date(item.slotStartTime).toLocaleDateString("vi-VN")
          : "Hôm nay",
        slotTime: item.slotStartTime
          ? `${new Date(item.slotStartTime).toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            })} - ${
              item.slotEndTime
                ? new Date(item.slotEndTime).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : ""
            }`
          : "12:00 – 14:00",
        flashSalePrice: item.flashSalePrice ?? 0,
        allocatedStock: item.allocatedStock ?? 0,
        soldStock:
          (item.allocatedStock ?? 0) - (item.availableStock ?? item.allocatedStock ?? 0),
        status:
          item.status === "PENDING_APPROVAL"
            ? "PENDING"
            : item.status || "PENDING",
        rejectReason: item.rejectReason,
      }));
    }
  } catch {
    // Trả về mock data lịch sử cho Stitch Screen 23 nếu mock mode bật
  }
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

/**
 * 16. Hủy đăng ký biến thể Flash Sale (KHỚP BE: DELETE /api/v1/seller/flash-sales/items/{id})
 */
export async function cancelFlashSaleRegistration(id: number): Promise<void> {
  await apiFetch<void>(`/seller/flash-sales/items/${id}`, {
    method: "DELETE",
  });
}

/**
 * Lấy thông tin ví & tài khoản ngân hàng của người bán (GET /api/v1/seller/wallet)
 */
export async function getSellerWallet(): Promise<SellerWalletResponse> {
  try {
    return await apiFetch<SellerWalletResponse>("/seller/wallet");
  } catch (err) {
    if (isMockMode()) {
      return getMockSellerWallet();
    }
    throw err;
  }
}

/**
 * Lấy thông tin tài khoản ngân hàng của shop (GET /api/v1/seller/wallet/bank-account)
 */
export async function getSellerBankAccount(): Promise<SellerBankAccountResponse | null> {
  try {
    return await apiFetch<SellerBankAccountResponse>("/seller/wallet/bank-account");
  } catch (err) {
    if (isMockMode()) {
      return {
        id: 1,
        bankName: "Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)",
        bankCode: "VCB",
        accountNumber: "102988391204",
        accountHolder: "NGUYEN VAN AN",
        branch: "Chi nhánh Thủ Đức, TP. Hồ Chí Minh",
        isVerified: true,
      };
    }
    throw err;
  }
}

/**
 * Cập nhật thông tin tài khoản ngân hàng của shop (PUT /api/v1/seller/wallet/bank-account)
 */
export async function updateSellerBankAccount(
  payload: SellerBankAccountPayload
): Promise<SellerBankAccountResponse> {
  return await apiFetch<SellerBankAccountResponse>("/seller/wallet/bank-account", {
    method: "PUT",
    json: payload,
  });
}


/**
 * Lấy danh sách lịch sử giao dịch ví (GET /api/v1/seller/wallet/transactions)
 */
export async function getSellerWalletTransactions(
  page: number = 0,
  size: number = 10,
  type?: string
): Promise<PageResponse<SellerWalletTransaction>> {
  try {
    const query: Record<string, string | number> = { page, size };
    if (type && type !== "ALL") {
      query.type = type;
    }
    return await apiFetch<PageResponse<SellerWalletTransaction>>(
      "/seller/wallet/transactions",
      { query }
    );
  } catch (err) {
    if (isMockMode()) {
      return getMockSellerWalletTransactions(page, size, type);
    }
    throw err;
  }
}

/**
 * Tạo yêu cầu rút tiền về tài khoản ngân hàng (POST /api/v1/seller/wallet/withdraw)
 */
export async function requestSellerWithdrawal(
  payload: SellerWithdrawalRequest
): Promise<SellerWalletTransaction> {
  try {
    return await apiFetch<SellerWalletTransaction>("/seller/wallet/withdraw", {
      method: "POST",
      json: payload,
    });
  } catch (err) {
    if (isMockMode()) {
      return {
        id: Math.floor(Math.random() * 10000),
        transactionCode: `TX-${Date.now().toString().slice(-8)}`,
        type: "WITHDRAWAL",
        amount: -payload.amount,
        balanceAfter: 48250000 - payload.amount,
        description: `Yêu cầu rút tiền về tài khoản ngân hàng ${payload.bankAccountNumber || "liên kết"}`,
        status: "PENDING",
        createdAt: new Date().toISOString(),
      };
    }
    throw err;
  }
}

function getMockSellerWallet(): SellerWalletResponse {
  return {
    balance: 48250000,
    pendingBalance: 5420000,
    totalWithdrawn: 126800000,
    bankAccount: {
      bankName: "Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)",
      accountNumber: "1029 8839 1204",
      accountHolder: "NGUYEN VAN AN - UTC FASHION",
      branch: "Chi nhánh Thủ Đức, TP. Hồ Chí Minh",
      isVerified: true,
    },
  };
}

function getMockSellerWalletTransactions(
  page: number = 0,
  size: number = 10,
  typeFilter?: string
): PageResponse<SellerWalletTransaction> {
  const allTxs: SellerWalletTransaction[] = [
    {
      id: 1,
      transactionCode: "TX-261018-091",
      orderCode: "FS-261005-M9B2",
      type: "ORDER_SETTLEMENT",
      amount: 300200,
      balanceAfter: 48250000,
      description: "Quyết toán đơn hàng Flash Sale #FS-261005-M9B2",
      status: "SUCCESS",
      createdAt: "2026-10-18T05:30:00Z",
    },
    {
      id: 2,
      transactionCode: "TX-261018-044",
      orderCode: "FS-261005-K3A1",
      type: "ORDER_SETTLEMENT",
      amount: 268200,
      balanceAfter: 47949800,
      description: "Quyết toán đơn hàng Flash Sale #FS-261005-K3A1",
      status: "SUCCESS",
      createdAt: "2026-10-18T04:45:00Z",
    },
    {
      id: 3,
      transactionCode: "TX-261017-102",
      type: "WITHDRAWAL",
      amount: -15000000,
      balanceAfter: 47681600,
      description: "Rút tiền về Vietcombank 1029****1204",
      status: "SUCCESS",
      createdAt: "2026-10-17T11:20:00Z",
    },
    {
      id: 4,
      transactionCode: "TX-261017-088",
      orderCode: "ORD-261005-B7D8",
      type: "ORDER_SETTLEMENT",
      amount: 405000,
      balanceAfter: 62681600,
      description: "Quyết toán đơn hàng tiêu chuẩn #ORD-261005-B7D8",
      status: "SUCCESS",
      createdAt: "2026-10-17T09:15:00Z",
    },
    {
      id: 5,
      transactionCode: "TX-261016-150",
      orderCode: "ORD-261004-C4E2",
      type: "ORDER_SETTLEMENT",
      amount: 350100,
      balanceAfter: 62276600,
      description: "Quyết toán đơn hàng tiêu chuẩn #ORD-261004-C4E2",
      status: "SUCCESS",
      createdAt: "2026-10-16T17:00:00Z",
    },
    {
      id: 6,
      transactionCode: "TX-261015-021",
      orderCode: "FS-261004-X9Z1",
      type: "REFUND",
      amount: 0,
      balanceAfter: 61926500,
      description: "Hoàn phí sàn cho đơn hủy #FS-261004-X9Z1",
      status: "SUCCESS",
      createdAt: "2026-10-15T09:15:00Z",
    },
  ];

  let filtered = allTxs;
  if (typeFilter && typeFilter !== "ALL") {
    filtered = allTxs.filter((t) => t.type === typeFilter);
  }

  const start = page * size;
  const content = filtered.slice(start, start + size);
  const totalElements = filtered.length;
  const totalPages = Math.ceil(totalElements / size) || 1;

  return {
    content,
    pageNumber: page,
    pageSize: size,
    totalElements,
    totalPages,
    isFirst: page === 0,
    isLast: start + size >= totalElements,
    hasNext: start + size < totalElements,
    hasPrevious: page > 0,
  };
}

/**
 * Lấy danh sách voucher do shop phát hành (GET /api/v1/seller/vouchers)
 */
export async function getSellerVouchers(
  page: number = 0,
  size: number = 50,
  status?: string
): Promise<PageResponse<SellerVoucherItem>> {
  try {
    const raw = await apiFetch<unknown>("/seller/vouchers");
    const rawObj = raw as { content?: unknown[]; items?: unknown[]; data?: unknown[] } | unknown[];
    const arr = (
      Array.isArray(rawObj)
        ? rawObj
        : rawObj?.content || rawObj?.items || rawObj?.data || []
    ) as Array<{
      id: number;
      code: string;
      name?: string;
      discountType?: string;
      discountValue?: number;
      maxDiscountAmount?: number;
      minOrderAmount?: number;
      totalQuantity?: number;
      totalUsageLimit?: number;
      usedQuantity?: number;
      currentUsageCount?: number;
      userUsageLimit?: number;
      startTime?: string;
      startDate?: string;
      endTime?: string;
      endDate?: string;
      status?: string;
      createdAt?: string;
    }>;

    const mapped: SellerVoucherItem[] = arr.map((v) => ({
      id: v.id,
      code: v.code,
      name: v.name || v.code,
      discountType:
        v.discountType === "PERCENT" || v.discountType === "PERCENTAGE"
          ? "PERCENTAGE"
          : "FIXED_AMOUNT",
      discountValue: Number(v.discountValue) || 0,
      maxDiscountAmount: v.maxDiscountAmount ? Number(v.maxDiscountAmount) : undefined,
      minOrderAmount: Number(v.minOrderAmount) || 0,
      totalUsageLimit: v.totalQuantity ?? v.totalUsageLimit ?? 100,
      currentUsageCount: v.usedQuantity ?? v.currentUsageCount ?? 0,
      userUsageLimit: v.userUsageLimit ?? 1,
      startDate: v.startTime
        ? typeof v.startTime === "string"
          ? v.startTime.split("T")[0]
          : v.startTime
        : v.startDate || "",
      endDate: v.endTime
        ? typeof v.endTime === "string"
          ? v.endTime.split("T")[0]
          : v.endTime
        : v.endDate || "",
      status: v.status || "ACTIVE",
      createdAt: v.createdAt || new Date().toISOString(),
    }));

    let filtered = mapped;
    if (status && status !== "ALL") {
      filtered = mapped.filter((item) => item.status === status);
    }

    return {
      content: filtered,
      pageNumber: page,
      pageSize: size,
      totalElements: filtered.length,
      totalPages: 1,
      isFirst: true,
      isLast: true,
      hasNext: false,
      hasPrevious: false,
    };
  } catch (err) {
    if (isMockMode()) {
      return getMockSellerVouchers(page, size, status);
    }
    throw err;
  }
}

/**
 * Tạo mới voucher của shop (POST /api/v1/seller/vouchers)
 */
export async function createSellerVoucher(
  payload: CreateSellerVoucherPayload
): Promise<SellerVoucherItem> {
  try {
    const startTime = payload.startDate.includes("T")
      ? payload.startDate
      : `${payload.startDate}T00:00:00Z`;
    const endTime = payload.endDate.includes("T")
      ? payload.endDate
      : `${payload.endDate}T23:59:59Z`;

    const body = {
      code: payload.code.trim().toUpperCase(),
      discountType: payload.discountType === "PERCENTAGE" ? "PERCENT" : payload.discountType,
      discountValue: payload.discountValue,
      minOrderAmount: payload.minOrderAmount,
      maxDiscountAmount:
        payload.maxDiscountAmount ||
        (payload.discountType === "PERCENTAGE" ? payload.discountValue * 1000 : null),
      totalQuantity: payload.totalUsageLimit,
      userUsageLimit: payload.userUsageLimit || 1,
      startTime,
      endTime,
    };

    const res = await apiFetch<Record<string, unknown>>("/seller/vouchers", {
      method: "POST",
      json: body,
    });

    return {
      id: Number(res?.id) || Math.floor(Math.random() * 10000),
      code: String(res?.code || payload.code.toUpperCase()),
      name: payload.name || String(res?.code || payload.code.toUpperCase()),
      discountType: payload.discountType,
      discountValue: payload.discountValue,
      maxDiscountAmount: payload.maxDiscountAmount,
      minOrderAmount: payload.minOrderAmount,
      totalUsageLimit: payload.totalUsageLimit,
      currentUsageCount: 0,
      userUsageLimit: payload.userUsageLimit || 1,
      startDate: payload.startDate,
      endDate: payload.endDate,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    };
  } catch (err) {
    if (isMockMode()) {
      return {
        id: Math.floor(Math.random() * 10000),
        code: payload.code.toUpperCase(),
        name: payload.name,
        discountType: payload.discountType,
        discountValue: payload.discountValue,
        maxDiscountAmount: payload.maxDiscountAmount,
        minOrderAmount: payload.minOrderAmount,
        totalUsageLimit: payload.totalUsageLimit,
        currentUsageCount: 0,
        userUsageLimit: payload.userUsageLimit || 1,
        startDate: payload.startDate,
        endDate: payload.endDate,
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
      };
    }
    throw err;
  }
}

/**
 * Cập nhật trạng thái voucher (bật/tắt) (PATCH /api/v1/seller/vouchers/{id}/status)
 */
export async function toggleSellerVoucherStatus(
  id: number,
  status: string
): Promise<SellerVoucherItem> {
  try {
    return await apiFetch<SellerVoucherItem>(`/seller/vouchers/${id}/status`, {
      method: "PATCH",
      json: { status },
    });
  } catch (err) {
    if (isMockMode()) {
      return {
        id,
        code: "VOUCHER",
        name: "Voucher Shop",
        discountType: "PERCENTAGE",
        discountValue: 10,
        minOrderAmount: 100000,
        totalUsageLimit: 100,
        currentUsageCount: 10,
        userUsageLimit: 1,
        startDate: "2026-10-01",
        endDate: "2026-10-31",
        status,
        createdAt: new Date().toISOString(),
      };
    }
    throw err;
  }
}

function getMockSellerVouchers(
  page: number = 0,
  size: number = 10,
  statusFilter?: string
): PageResponse<SellerVoucherItem> {
  const allVouchers: SellerVoucherItem[] = [
    {
      id: 1,
      code: "UTC10K",
      name: "Giảm 10% Tối đa 30k",
      discountType: "PERCENTAGE",
      discountValue: 10,
      maxDiscountAmount: 30000,
      minOrderAmount: 150000,
      totalUsageLimit: 100,
      currentUsageCount: 45,
      userUsageLimit: 1,
      startDate: "2026-10-10",
      endDate: "2026-10-31",
      status: "ACTIVE",
      createdAt: "2026-10-10T08:00:00Z",
    },
    {
      id: 2,
      code: "UTC50K",
      name: "Giảm 50k Đơn từ 350k",
      discountType: "FIXED_AMOUNT",
      discountValue: 50000,
      minOrderAmount: 350000,
      totalUsageLimit: 50,
      currentUsageCount: 50,
      userUsageLimit: 1,
      startDate: "2026-10-12",
      endDate: "2026-10-25",
      status: "ACTIVE",
      createdAt: "2026-10-12T09:00:00Z",
    },
    {
      id: 3,
      code: "FLASHOCT",
      name: "Đại tiệc Flash Sale 15%",
      discountType: "PERCENTAGE",
      discountValue: 15,
      maxDiscountAmount: 50000,
      minOrderAmount: 200000,
      totalUsageLimit: 200,
      currentUsageCount: 18,
      userUsageLimit: 2,
      startDate: "2026-10-15",
      endDate: "2026-10-20",
      status: "ACTIVE",
      createdAt: "2026-10-15T00:00:00Z",
    },
    {
      id: 4,
      code: "NEWBUYER",
      name: "Chào mừng bạn mới 20k",
      discountType: "FIXED_AMOUNT",
      discountValue: 20000,
      minOrderAmount: 99000,
      totalUsageLimit: 500,
      currentUsageCount: 124,
      userUsageLimit: 1,
      startDate: "2026-10-01",
      endDate: "2026-10-31",
      status: "ACTIVE",
      createdAt: "2026-10-01T00:00:00Z",
    },
    {
      id: 5,
      code: "PAYDAY11",
      name: "Siêu tiệc lương về 25%",
      discountType: "PERCENTAGE",
      discountValue: 25,
      maxDiscountAmount: 70000,
      minOrderAmount: 400000,
      totalUsageLimit: 150,
      currentUsageCount: 0,
      userUsageLimit: 1,
      startDate: "2026-10-25",
      endDate: "2026-10-28",
      status: "UPCOMING",
      createdAt: "2026-10-16T10:00:00Z",
    },
    {
      id: 6,
      code: "MIDMONTH",
      name: "Giữa tháng săn sale 30k",
      discountType: "FIXED_AMOUNT",
      discountValue: 30000,
      minOrderAmount: 180000,
      totalUsageLimit: 100,
      currentUsageCount: 100,
      userUsageLimit: 1,
      startDate: "2026-10-01",
      endDate: "2026-10-15",
      status: "EXPIRED",
      createdAt: "2026-10-01T00:00:00Z",
    },
  ];

  let filtered = allVouchers;
  if (statusFilter && statusFilter !== "ALL") {
    filtered = allVouchers.filter((v) => v.status === statusFilter);
  }

  const start = page * size;
  const content = filtered.slice(start, start + size);
  const totalElements = filtered.length;
  const totalPages = Math.ceil(totalElements / size) || 1;

  return {
    content,
    pageNumber: page,
    pageSize: size,
    totalElements,
    totalPages,
    isFirst: page === 0,
    isLast: start + size >= totalElements,
    hasNext: start + size < totalElements,
    hasPrevious: page > 0,
  };
}

/**
 * Lấy thống kê tổng quan đánh giá của shop (GET /api/v1/seller/reviews/summary)
 */
export async function getSellerReviewSummary(): Promise<SellerReviewSummaryResponse> {
  try {
    return await apiFetch<SellerReviewSummaryResponse>("/seller/reviews/summary");
  } catch (err) {
    if (isMockMode()) {
      return getMockSellerReviewSummary();
    }
    throw err;
  }
}

/**
 * Lấy danh sách đánh giá của khách hàng (GET /api/v1/seller/reviews)
 */
export async function getSellerReviews(
  page: number = 0,
  size: number = 10,
  rating?: number,
  replyStatus?: "ALL" | "UNREPLIED" | "REPLIED"
): Promise<PageResponse<SellerReviewItem>> {
  try {
    const query: Record<string, string | number> = { page, size };
    if (rating && rating > 0) {
      query.rating = rating;
    }
    if (replyStatus && replyStatus !== "ALL") {
      query.replyStatus = replyStatus;
    }
    return await apiFetch<PageResponse<SellerReviewItem>>("/seller/reviews", {
      query,
    });
  } catch (err) {
    if (isMockMode()) {
      return getMockSellerReviews(page, size, rating, replyStatus);
    }
    throw err;
  }
}

/**
 * Người bán phản hồi đánh giá khách hàng (POST /api/v1/seller/reviews/{id}/reply)
 */
export async function replySellerReview(
  payload: ReplySellerReviewPayload
): Promise<SellerReviewItem> {
  try {
    return await apiFetch<SellerReviewItem>(
      `/seller/reviews/${payload.reviewId}/reply`,
      {
        method: "POST",
        json: { replyText: payload.replyText },
      }
    );
  } catch (err) {
    if (isMockMode()) {
      return {
        id: payload.reviewId,
        productId: 1,
        productName: "Áo thun Basic Cotton Organic",
        buyerName: "Lê Minh Trang",
        rating: 3,
        comment: "Áo đẹp nhưng size M hơi rộng so với mình nghĩ...",
        sellerReply: {
          id: Math.floor(Math.random() * 1000),
          replyText: payload.replyText,
          repliedAt: new Date().toISOString(),
        },
        createdAt: new Date().toISOString(),
      };
    }
    throw err;
  }
}

function getMockSellerReviewSummary(): SellerReviewSummaryResponse {
  return {
    averageRating: 4.8,
    totalReviews: 1326,
    responseRate: 99.7,
    unrepliedCount: 3,
    ratingBreakdown: {
      5: 1150,
      4: 120,
      3: 35,
      2: 13,
      1: 8,
    },
  };
}

function getMockSellerReviews(
  page: number = 0,
  size: number = 10,
  ratingFilter?: number,
  replyStatusFilter?: "ALL" | "UNREPLIED" | "REPLIED"
): PageResponse<SellerReviewItem> {
  const allReviews: SellerReviewItem[] = [
    {
      id: 1,
      productId: 1,
      productName: "Áo Hoodie Unisex Oversize Nỉ Bông",
      productImage:
        "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500&auto=format&fit=crop&q=60",
      variantSku: "HD-DEN-L",
      variantName: "Đen / Size L",
      orderCode: "FS-261001-A7K2Q",
      buyerName: "Nguyễn Văn Tuấn",
      rating: 5,
      comment:
        "Chất vải nỉ dày dặn ấm áp, form oversize chuẩn đẹp. Mua trong Flash Sale giá hời bất ngờ!",
      sellerReply: {
        id: 11,
        replyText:
          "Cảm ơn bạn Tuấn đã tin tưởng ủng hộ UTC Fashion ạ! Chúc bạn luôn có trải nghiệm tuyệt vời cùng shop nhé ❤️",
        repliedAt: "2026-10-02T14:15:00Z",
      },
      createdAt: "2026-10-02T10:00:00Z",
    },
    {
      id: 2,
      productId: 2,
      productName: "Áo thun Basic Cotton Organic",
      productImage:
        "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60",
      variantSku: "AT-TRANG-M",
      variantName: "Trắng ngà / Size M",
      orderCode: "ORD-261004-R2X9",
      buyerName: "Lê Minh Trang",
      rating: 3,
      comment:
        "Áo đẹp nhưng size M hơi rộng so với mình nghĩ, shop có hỗ trợ đổi sang size S không ạ?",
      sellerReply: null,
      createdAt: "2026-10-18T02:30:00Z",
    },
    {
      id: 3,
      productId: 3,
      productName: "Quần Jean Slimfit Co Giãn 4 Chiều",
      productImage:
        "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&auto=format&fit=crop&q=60",
      variantSku: "QJ-XANH-XL",
      variantName: "Xanh Navy / Size XL",
      orderCode: "FS-260928-V9L1P",
      buyerName: "Trần Hoàng Long",
      rating: 5,
      comment:
        "Giao hàng siêu nhanh, đóng gói hộp carton cứng cáp rất chỉn chu. Đường may tỉ mỉ, đáng tiền 10/10.",
      sellerReply: {
        id: 12,
        replyText:
          "Dạ shop cảm ơn anh Long rất nhiều ạ! Mong anh tiếp tục ủng hộ các bộ sưu tập mới của UTC Fashion ạ!",
        repliedAt: "2026-09-30T09:00:00Z",
      },
      createdAt: "2026-09-29T19:40:00Z",
    },
    {
      id: 4,
      productId: 4,
      productName: "Áo Polo Thể Thao Quick-Dry",
      productImage:
        "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500&auto=format&fit=crop&q=60",
      variantSku: "PL-XAM-M",
      variantName: "Xám / Size M",
      orderCode: "ORD-261003-P4Y7",
      buyerName: "Đặng Mỹ Linh",
      rating: 4,
      comment:
        "Màu sắc bên ngoài nhạt hơn hình một chút nhưng chất vải mềm mát, thấm hút mồ hôi tốt khi tập thể thao.",
      sellerReply: null,
      createdAt: "2026-10-17T11:00:00Z",
    },
    {
      id: 5,
      productId: 5,
      productName: "Vớ Cổ Cao Dệt Kim Thể Thao",
      productImage:
        "https://images.unsplash.com/photo-1582966772680-860e372bb558?w=500&auto=format&fit=crop&q=60",
      variantSku: "VO-TRANG-FREESIZE",
      variantName: "Trắng / Freesize",
      orderCode: "ORD-261002-L1K0",
      buyerName: "Phạm Hải Đăng",
      rating: 2,
      comment:
        "Vớ bị xước sợi chỉ ngay đường may mũi chân, hơi thất vọng vì mua combo 3 đôi.",
      sellerReply: null,
      createdAt: "2026-10-18T04:10:00Z",
    },
  ];

  let filtered = allReviews;
  if (ratingFilter && ratingFilter > 0) {
    filtered = filtered.filter((r) => r.rating === ratingFilter);
  }
  if (replyStatusFilter === "UNREPLIED") {
    filtered = filtered.filter((r) => !r.sellerReply);
  } else if (replyStatusFilter === "REPLIED") {
    filtered = filtered.filter((r) => !!r.sellerReply);
  }

  const start = page * size;
  const content = filtered.slice(start, start + size);
  const totalElements = filtered.length;
  const totalPages = Math.ceil(totalElements / size) || 1;

  return {
    content,
    pageNumber: page,
    pageSize: size,
    totalElements,
    totalPages,
    isFirst: page === 0,
    isLast: start + size >= totalElements,
    hasNext: start + size < totalElements,
    hasPrevious: page > 0,
  };
}

/**
 * Lấy thông tin hồ sơ gian hàng của tôi (GET /api/v1/stores/me)
 */
export async function getMyStoreProfile(): Promise<SellerStoreProfileResponse> {
  try {
    return await apiFetch<SellerStoreProfileResponse>("/stores/me");
  } catch (err) {
    if (isMockMode()) {
      return getMockStoreProfile();
    }
    throw err;
  }
}

/**
 * Cập nhật hồ sơ gian hàng của tôi (PUT /api/v1/stores/me)
 */
export async function updateMyStoreProfile(
  payload: UpdateStoreProfilePayload
): Promise<SellerStoreProfileResponse> {
  try {
    return await apiFetch<SellerStoreProfileResponse>("/stores/me", {
      method: "PUT",
      json: payload,
    });
  } catch (err) {
    if (isMockMode()) {
      const current = getMockStoreProfile();
      return {
        ...current,
        storeName: payload.storeName,
        description: payload.description,
        logoUrl: payload.logoUrl || current.logoUrl,
        bannerUrl: payload.bannerUrl || current.bannerUrl,
      };
    }
    throw err;
  }
}

/**
 * Lấy danh sách địa chỉ kho lấy hàng của shop (GET /api/v1/stores/me/addresses)
 */
export async function getStoreAddresses(): Promise<SellerWarehouseAddressItem[]> {
  try {
    return await apiFetch<SellerWarehouseAddressItem[]>("/stores/me/addresses");
  } catch (err) {
    if (isMockMode()) {
      return getMockStoreAddresses();
    }
    throw err;
  }
}

/**
 * Thêm địa chỉ kho lấy hàng mới (POST /api/v1/stores/me/addresses)
 */
export async function createStoreAddress(
  payload: CreateStoreAddressPayload
): Promise<SellerWarehouseAddressItem> {
  try {
    return await apiFetch<SellerWarehouseAddressItem>("/stores/me/addresses", {
      method: "POST",
      json: payload,
    });
  } catch (err) {
    if (isMockMode()) {
      return {
        id: Math.floor(Math.random() * 10000),
        contactName: payload.contactName,
        phone: payload.phone,
        province: payload.province,
        district: payload.district,
        ward: payload.ward,
        detailAddress: payload.detailAddress,
        latitude: payload.latitude || 10.8457,
        longitude: payload.longitude || 106.7943,
        isDefault: !!payload.isDefault,
        warehouseCode: `KHO-${Date.now().toString().slice(-4)}`,
        workingHours: "08:00 - 18:00",
        createdAt: new Date().toISOString(),
      };
    }
    throw err;
  }
}

/**
 * Xóa địa chỉ kho lấy hàng (DELETE /api/v1/stores/me/addresses/{addressId})
 */
export async function deleteStoreAddress(addressId: number): Promise<void> {
  try {
    await apiFetch<void>(`/stores/me/addresses/${addressId}`, {
      method: "DELETE",
    });
  } catch (err) {
    if (isMockMode()) {
      return;
    }
    throw err;
  }
}

/**
 * Đặt địa chỉ kho làm kho mặc định (PATCH /api/v1/stores/me/addresses/{addressId}/default)
 */
export async function setDefaultStoreAddress(
  addressId: number
): Promise<SellerWarehouseAddressItem> {
  try {
    return await apiFetch<SellerWarehouseAddressItem>(
      `/stores/me/addresses/${addressId}/default`,
      { method: "PATCH" }
    );
  } catch (err) {
    if (isMockMode()) {
      return {
        id: addressId,
        contactName: "Nguyễn Văn Tuấn",
        phone: "0912345458",
        province: "TP. Hồ Chí Minh",
        district: "TP. Thủ Đức",
        ward: "Phường Thạnh Mỹ Lợi",
        detailAddress: "Cụm Công nghiệp Cát Lái 2",
        isDefault: true,
      };
    }
    throw err;
  }
}

function getMockStoreProfile(): SellerStoreProfileResponse {
  return {
    id: 1,
    userId: 2,
    storeName: "UTC Fashion",
    slug: "utc-fashion",
    logoUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=60",
    bannerUrl:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80",
    description:
      "UTC Fashion – Thương hiệu thời trang đường phố đương đại dành cho giới trẻ. Cam kết chất lượng vải nỉ bông hữu cơ 100%, bảo hành đường chỉ trọn đời và hỗ trợ đổi trả miễn phí trong 7 ngày.",
    defaultCommissionRate: 5.0,
    status: "APPROVED",
    createdAt: "15/03/2025",
    ratingAvg: 4.8,
    totalFollowers: 12400,
    totalProducts: 128,
  };
}

function getMockStoreAddresses(): SellerWarehouseAddressItem[] {
  return [
    {
      id: 1,
      contactName: "Nguyễn Văn Tuấn",
      phone: "0912 345 458",
      province: "TP. Hồ Chí Minh",
      district: "TP. Thủ Đức",
      ward: "Phường Thạnh Mỹ Lợi",
      detailAddress:
        "Kho A3 - Hub Cát Lái, Cụm Công nghiệp Cát Lái 2, Phường Thạnh Mỹ Lợi, TP. Thủ Đức, TP. Hồ Chí Minh",
      latitude: 10.8457,
      longitude: 106.7943,
      isDefault: true,
      warehouseCode: "KHO-SGN-01",
      workingHours: "08:00 - 18:30 (Thứ 2 - Thứ 7)",
      createdAt: "2025-03-20T08:00:00Z",
    },
    {
      id: 2,
      contactName: "Trần Văn Bình",
      phone: "0988 765 234",
      province: "TP. Hà Nội",
      district: "Quận Hoàng Mai",
      ward: "Phường Định Công",
      detailAddress:
        "Số 45 Ngõ 120 Định Công, Phường Định Công, Quận Hoàng Mai, TP. Hà Nội",
      latitude: 20.9835,
      longitude: 105.8412,
      isDefault: false,
      warehouseCode: "KHO-HAN-02",
      workingHours: "08:30 - 17:30",
      createdAt: "2025-06-10T10:00:00Z",
    },
  ];
}

function getMockStaffMembers(): SellerStaffMember[] {
  return [
    {
      id: 1,
      name: "Nguyễn Văn An",
      email: "an.nguyen@utcfashion.vn",
      role: "OWNER",
      roleLabel: "Chủ shop (Toàn quyền)",
      status: "ACTIVE",
      addedAt: "15/03/2025",
      permissions: ["*"],
    },
    {
      id: 2,
      name: "Trần Thị Mai Phương",
      email: "phuong.tran@utcfashion.vn",
      role: "WAREHOUSE_MANAGER",
      roleLabel: "Quản lý kho",
      status: "ACTIVE",
      addedAt: "20/05/2025",
      permissions: ["product:update", "inventory:sync", "order:pack", "order:shipping"],
    },
    {
      id: 3,
      name: "Lê Hoàng Long",
      email: "long.le@utcfashion.vn",
      role: "ACCOUNTANT",
      roleLabel: "Kế toán đối soát",
      status: "ACTIVE",
      addedAt: "12/08/2025",
      permissions: ["wallet:view", "payout:request", "report:export"],
    },
    {
      id: 4,
      name: "Đỗ Thị Bích Ngọc",
      email: "ngoc.do@utcfashion.vn",
      role: "FLASH_SALE_OPERATOR",
      roleLabel: "Vận hành Flash Sale",
      status: "ACTIVE",
      addedAt: "01/09/2026",
      permissions: ["flashsale:register", "price:adjust", "campaign:manage"],
    },
    {
      id: 5,
      name: "Vũ Quốc Hưng",
      email: "hung.vu@gmail.com",
      role: "WAREHOUSE_MANAGER",
      roleLabel: "Quản lý kho",
      status: "PENDING_INVITE",
      addedAt: "04/10/2026",
      permissions: ["product:update", "inventory:sync", "order:pack", "order:shipping"],
    },
  ];
}

function getMockRoleSummaries(): SellerRoleSummary[] {
  return [
    {
      id: "role-1",
      role: "WAREHOUSE_MANAGER",
      roleName: "Quản lý kho",
      description: "Chuyên trách nhập xuất, đồng bộ kho & đóng hàng",
      memberCount: 2,
      icon: "inventory_2",
      color: "sky",
      permissions: ["product:update", "inventory:sync", "order:pack", "order:shipping"],
    },
    {
      id: "role-2",
      role: "ACCOUNTANT",
      roleName: "Kế toán đối soát",
      description: "Theo dõi dòng tiền, phiên đối soát và rút tiền ví",
      memberCount: 1,
      icon: "account_balance_wallet",
      color: "emerald",
      permissions: ["wallet:view", "payout:request", "report:export"],
    },
    {
      id: "role-3",
      role: "FLASH_SALE_OPERATOR",
      roleName: "Vận hành Flash Sale",
      description: "Quản trị các chiến dịch giá sốc và deal độc quyền",
      memberCount: 1,
      icon: "bolt",
      color: "rose",
      permissions: ["flashsale:register", "price:adjust", "campaign:manage"],
    },
  ];
}

/**
 * 27. Lấy danh sách nhân viên của shop (GET /api/v1/seller/staff)
 */
export async function getSellerStaff(): Promise<SellerStaffMember[]> {
  try {
    return await apiFetch<SellerStaffMember[]>("/seller/staff");
  } catch (err) {
    if (isMockMode()) {
      return getMockStaffMembers();
    }
    throw err;
  }
}

/**
 * 28. Lấy tổng hợp các nhóm quyền vai trò của shop (GET /api/v1/seller/roles)
 */
export async function getSellerRoleSummaries(): Promise<SellerRoleSummary[]> {
  try {
    return await apiFetch<SellerRoleSummary[]>("/seller/roles");
  } catch (err) {
    if (isMockMode()) {
      return getMockRoleSummaries();
    }
    throw err;
  }
}

/**
 * 29. Mời nhân viên mới vào shop (POST /api/v1/seller/staff/invite)
 */
export async function inviteSellerStaff(
  payload: InviteStaffPayload
): Promise<SellerStaffMember> {
  try {
    return await apiFetch<SellerStaffMember>("/seller/staff/invite", {
      method: "POST",
      json: payload,
    });
  } catch (err) {
    if (isMockMode()) {
      const roleMap: Record<string, { label: string; perms: string[] }> = {
        WAREHOUSE_MANAGER: {
          label: "Quản lý kho",
          perms: ["product:update", "inventory:sync", "order:pack", "order:shipping"],
        },
        ACCOUNTANT: {
          label: "Kế toán đối soát",
          perms: ["wallet:view", "payout:request", "report:export"],
        },
        FLASH_SALE_OPERATOR: {
          label: "Vận hành Flash Sale",
          perms: ["flashsale:register", "price:adjust", "campaign:manage"],
        },
        OWNER: {
          label: "Chủ shop",
          perms: ["*"],
        },
      };
      const info = roleMap[payload.role] || roleMap.WAREHOUSE_MANAGER;
      return {
        id: Math.floor(Math.random() * 1000) + 10,
        name: payload.email.split("@")[0],
        email: payload.email,
        role: payload.role,
        roleLabel: info.label,
        status: "PENDING_INVITE",
        addedAt: new Date().toLocaleDateString("vi-VN"),
        permissions: info.perms,
      };
    }
    throw err;
  }
}

/**
 * 30. Đổi nhóm quyền của nhân viên (PUT /api/v1/seller/staff/{id}/role)
 */
export async function updateSellerStaffRole(
  id: number,
  payload: UpdateStaffRolePayload
): Promise<void> {
  try {
    await apiFetch<void>(`/seller/staff/${id}/role`, {
      method: "PUT",
      json: payload,
    });
  } catch (err) {
    if (isMockMode()) {
      return;
    }
    throw err;
  }
}

/**
 * 31. Khóa / mở khóa quyền của nhân viên (PATCH /api/v1/seller/staff/{id}/status)
 */
export async function toggleLockSellerStaff(
  id: number,
  status: "ACTIVE" | "LOCKED"
): Promise<void> {
  try {
    await apiFetch<void>(`/seller/staff/${id}/status`, {
      method: "PATCH",
      query: { status },
    });
  } catch (err) {
    if (isMockMode()) {
      return;
    }
    throw err;
  }
}

/**
 * 32. Xóa hoặc hủy lời mời nhân viên khỏi shop (DELETE /api/v1/seller/staff/{id})
 */
export async function deleteSellerStaff(id: number): Promise<void> {
  try {
    await apiFetch<void>(`/seller/staff/${id}`, {
      method: "DELETE",
    });
  } catch (err) {
    if (isMockMode()) {
      return;
    }
    throw err;
  }
}
