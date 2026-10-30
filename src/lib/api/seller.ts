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
  UpdateSellerVoucherPayload,
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
 * 1. Lấy thống kê KPI tổng hợp của shop (KHỚP BE: GET /api/v1/stores/sidebar/summary)
 */
export async function getStoreSidebarSummary(): Promise<SidebarSummaryResponse> {
  try {
    return await apiFetch<SidebarSummaryResponse>("/stores/sidebar/summary");
  } catch (err) {
    console.warn("[getStoreSidebarSummary] Error fetching summary from BE, returning real zero metrics:", err);
    return {
      totalProducts: 0,
      pendingOrders: 0,
      todayOrders: 0,
      todayRevenue: 0,
      monthRevenue: 0,
      ratingAvg: 0,
      ratingCount: 0,
      lowStockProducts: 0,
      storeStatus: "APPROVED",
    };
  }
}

/**
 * 2. Lấy danh sách đơn hàng gần đây của shop (KHỚP BE: GET /api/v1/seller/orders)
 */
export async function getSellerRecentOrders(
  page: number = 0,
  size: number = 5
): Promise<PageResponse<SellerOrderResponse>> {
  return await getSellerOrders(page, size);
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
    console.warn("[getSellerOrders] Error fetching orders from BE, returning empty page:", err);
    return {
      content: [],
      items: [],
      totalElements: 0,
      totalPages: 0,
      pageNumber: page,
      pageSize: size,
      isFirst: true,
      isLast: true,
      hasNext: false,
      hasPrevious: false,
    };
  }
}

/**
 * Lấy chi tiết đơn hàng (KHỚP BE: GET /api/v1/seller/orders/{id})
 */
export async function getSellerOrderById(id: number): Promise<SellerOrderResponse> {
  return await apiFetch<SellerOrderResponse>(`/seller/orders/${id}`);
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

export function getMockSellerOrders(
  page: number = 0,
  size: number = 10,
  statusFilter?: string
): PageResponse<SellerOrderResponse> {
  const now = new Date();
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600 * 1000).toISOString();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 3600 * 1000).toISOString();

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
      createdAt: hoursAgo(2),
      expiresAt: hoursAgo(1),
      trackingNumber: "SPX-VN-88392100",
      carrierName: "SPX Express",
      timeline: [
        { status: "PENDING_PAYMENT", label: "Người mua đặt hàng", at: hoursAgo(2.1) },
        { status: "PAID", label: "Thanh toán ZaloPay thành công", at: hoursAgo(2) },
        { status: "PENDING", label: "Chờ người bán xác nhận chuẩn bị hàng", at: hoursAgo(2) },
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
      createdAt: hoursAgo(5),
      trackingNumber: "GHTK-HN-9921445",
      carrierName: "Giao Hàng Tiết Kiệm",
      timeline: [
        { status: "PENDING_PAYMENT", label: "Đặt hàng", at: hoursAgo(5.2) },
        { status: "PAID", label: "Thanh toán ZaloPay", at: hoursAgo(5) },
        { status: "PROCESSING", label: "Shop đã xác nhận, đang đóng gói", at: hoursAgo(4.8) },
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
      paymentMethod: "ZALOPAY",
      paymentStatus: "PAID",
      status: "SHIPPING",
      createdAt: daysAgo(1),
      shippedAt: daysAgo(0.8),
      trackingNumber: "VTP-DN-110293",
      carrierName: "Viettel Post",
      timeline: [
        { status: "PENDING", label: "Đặt hàng", at: daysAgo(1) },
        { status: "PROCESSING", label: "Shop xác nhận đơn", at: daysAgo(0.9) },
        { status: "SHIPPING", label: "Đã bàn giao cho Viettel Post", at: daysAgo(0.8) },
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
      createdAt: daysAgo(2),
      shippedAt: daysAgo(1.8),
      completedAt: daysAgo(1.2),
      trackingNumber: "SPX-CT-5544321",
      carrierName: "SPX Express",
      timeline: [
        { status: "PENDING", label: "Đặt hàng", at: daysAgo(2) },
        { status: "PROCESSING", label: "Shop xác nhận", at: daysAgo(1.9) },
        { status: "SHIPPING", label: "Đang giao hàng", at: daysAgo(1.8) },
        { status: "COMPLETED", label: "Giao hàng thành công", at: daysAgo(1.2) },
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
      createdAt: daysAgo(3),
      trackingNumber: "SPX-HP-998811",
      carrierName: "SPX Express",
      timeline: [
        { status: "PENDING", label: "Đặt hàng", at: daysAgo(3) },
        { status: "CANCELLED", label: "Đơn hàng đã hủy bởi Shop (Hết hàng)", at: daysAgo(2.9) },
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
      createdAt: hoursAgo(0.5),
      expiresAt: hoursAgo(0.4),
      timeline: [
        { status: "PENDING_PAYMENT", label: "Đang chờ thanh toán ZaloPay (còn 5 phút)", at: hoursAgo(0.5) },
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
    {
      id: 207,
      orderCode: "ORD-261003-V8K1",
      buyerId: 1007,
      storeId: 1,
      storeName: "UTC Fashion",
      recipientName: "Bùi Thị Mai",
      recipientPhone: "0905 112 334",
      recipientAddress: "Đống Đa, Hà Nội",
      shippingAddressText: "102 Xã Đàn, Đống Đa, Hà Nội",
      recipientCity: "Hà Nội",
      subtotalAmount: 550000,
      totalItemAmount: 550000,
      discountAmount: 30000,
      voucherDiscountAmount: 0,
      shippingFee: 20000,
      totalAmount: 520000,
      finalAmount: 520000,
      commissionRate: 5,
      platformFee: 26000,
      sellerAmount: 494000,
      paymentMethod: "ZALOPAY",
      paymentStatus: "PAID",
      status: "COMPLETED",
      createdAt: daysAgo(4),
      shippedAt: daysAgo(3.8),
      completedAt: daysAgo(3),
      trackingNumber: "GHTK-HN-881122",
      carrierName: "Giao Hàng Tiết Kiệm",
      timeline: [
        { status: "PENDING", label: "Đặt hàng", at: daysAgo(4) },
        { status: "PROCESSING", label: "Shop xác nhận đơn", at: daysAgo(3.9) },
        { status: "SHIPPING", label: "Đang giao hàng", at: daysAgo(3.8) },
        { status: "COMPLETED", label: "Giao thành công", at: daysAgo(3) },
      ],
      items: [
        {
          id: 508,
          productId: 1,
          productName: "Áo Hoodie Unisex Oversize Nỉ Bông",
          variantId: 2,
          variantSku: "HD-TRANG-XL",
          variantName: "Trắng / Size XL",
          imageUrl: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500&auto=format&fit=crop&q=60",
          productImage: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500&auto=format&fit=crop&q=60",
          unitPrice: 380000,
          priceAtPurchase: 350000,
          quantity: 1,
          totalPrice: 350000,
          itemSubtotal: 350000,
        },
      ],
    },
    {
      id: 208,
      orderCode: "FS-261001-Z2P9",
      buyerId: 1008,
      storeId: 1,
      storeName: "UTC Fashion",
      recipientName: "Lê Quốc Bảo",
      recipientPhone: "0938 998 776",
      recipientAddress: "Sơn Trà, Đà Nẵng",
      shippingAddressText: "45 Võ Nguyên Giáp, Sơn Trà, Đà Nẵng",
      recipientCity: "Đà Nẵng",
      subtotalAmount: 280000,
      totalItemAmount: 280000,
      discountAmount: 30000,
      voucherDiscountAmount: 0,
      shippingFee: 20000,
      totalAmount: 250000,
      finalAmount: 250000,
      commissionRate: 5,
      platformFee: 12500,
      sellerAmount: 237500,
      paymentMethod: "ZALOPAY",
      paymentStatus: "PAID",
      status: "COMPLETED",
      createdAt: daysAgo(6),
      shippedAt: daysAgo(5.8),
      completedAt: daysAgo(5),
      trackingNumber: "VTP-DN-776655",
      carrierName: "Viettel Post",
      timeline: [
        { status: "PENDING", label: "Đặt hàng", at: daysAgo(6) },
        { status: "SHIPPING", label: "Đang giao hàng", at: daysAgo(5.8) },
        { status: "COMPLETED", label: "Giao thành công", at: daysAgo(5) },
      ],
      items: [
        {
          id: 509,
          productId: 2,
          productName: "Áo thun Basic Cotton Organic",
          variantId: 4,
          variantSku: "AT-DEN-L",
          variantName: "Đen / Size L",
          imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60",
          productImage: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60",
          unitPrice: 180000,
          priceAtPurchase: 150000,
          quantity: 1,
          totalPrice: 150000,
          itemSubtotal: 150000,
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

export function getMockSellerProducts(
  page: number = 0,
  size: number = 10,
  status?: string
): PageResponse<SellerProductSummaryResponse> {
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

/**
 * 3. Lấy top sản phẩm bán chạy của shop (KHỚP BE: GET /api/v1/seller/products)
 */
export async function getSellerTopProducts(
  page: number = 0,
  size: number = 4
): Promise<PageResponse<SellerProductSummaryResponse>> {
  try {
    const res = await getSellerProducts(page, size);
    const list = res.content || res.items || [];
    const sorted = [...list].sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0));
    return {
      ...res,
      content: sorted.slice(0, size),
      items: sorted.slice(0, size),
    };
  } catch (err) {
    console.warn("[getSellerTopProducts] Error fetching top products from BE:", err);
    return {
      content: [],
      items: [],
      totalElements: 0,
      totalPages: 0,
      pageNumber: page,
      pageSize: size,
      isFirst: true,
      isLast: true,
      hasNext: false,
      hasPrevious: false,
    };
  }
}

/**
 * Kiểm tra xem đơn hàng đã được thanh toán hay chưa (Chỉ tính đơn đã thanh toán)
 */
export function isSellerOrderPaid(o: SellerOrderResponse): boolean {
  if (!o) return false;
  if (o.status === "CANCELLED" || o.status === "PENDING_PAYMENT") return false;
  if (o.paymentStatus === "PAID") return true;
  if (o.status === "COMPLETED" || o.status === "DELIVERED") return true;
  if (o.paymentMethod !== "COD" && ["PROCESSING", "SHIPPING"].includes(o.status)) return true;
  return false;
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
    try {
      const ordersRes = await getSellerOrders(0, 100);
      const orders = ordersRes.content || ordersRes.items || [];
      return aggregateRevenuePoints(orders, period);
    } catch {
      return aggregateRevenuePoints([], period);
    }
  }
}

export function aggregateRevenuePoints(
  orders: SellerOrderResponse[],
  period: "today" | "7days" | "30days"
): SellerRevenueDayPoint[] {
  const now = new Date();
  const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  if (period === "today") {
    const hours = [0, 4, 8, 12, 16, 20];
    const todayY = now.getFullYear();
    const todayM = now.getMonth();
    const todayD = now.getDate();

    return hours.map((h) => {
      const label = `${h.toString().padStart(2, "0")}:00`;
      const nextH = h + 4;
      let rev = 0;
      let count = 0;
      orders.forEach((o) => {
        if (!o.createdAt || !isSellerOrderPaid(o)) return;
        const d = new Date(o.createdAt);
        if (
          d.getFullYear() === todayY &&
          d.getMonth() === todayM &&
          d.getDate() === todayD &&
          d.getHours() >= h &&
          d.getHours() < nextH
        ) {
          rev += Number(o.finalAmount || o.totalAmount) || 0;
          count++;
        }
      });
      return {
        date: `${todayY}-${String(todayM + 1).padStart(2, "0")}-${String(todayD).padStart(2, "0")}`,
        dayLabel: label,
        revenue: rev,
        previousWeekRevenue: Math.round(rev * 0.85),
        ordersCount: count,
      };
    });
  }

  const numDays = period === "30days" ? 30 : 7;
  const step = period === "30days" ? 5 : 1;
  const points: SellerRevenueDayPoint[] = [];

  for (let i = numDays - 1; i >= 0; i -= step) {
    const blockEndIndex = Math.max(0, i - step + 1);

    const startD = new Date(now);
    startD.setDate(startD.getDate() - i);
    startD.setHours(0, 0, 0, 0);

    const endD = new Date(now);
    endD.setDate(endD.getDate() - blockEndIndex);
    endD.setHours(23, 59, 59, 999);

    const targetY = endD.getFullYear();
    const targetM = endD.getMonth();
    const targetD = endD.getDate();
    const dateStr = `${targetY}-${String(targetM + 1).padStart(2, "0")}-${String(targetD).padStart(2, "0")}`;
    const dayLabel = period === "30days" ? `${targetD}/${targetM + 1}` : dayNames[endD.getDay()];

    let rev = 0;
    let count = 0;
    orders.forEach((o) => {
      if (!o.createdAt || !isSellerOrderPaid(o)) return;
      const od = new Date(o.createdAt);
      if (od >= startD && od <= endD) {
        rev += Number(o.finalAmount || o.totalAmount) || 0;
        count++;
      }
    });

    points.push({
      date: dateStr,
      dayLabel,
      revenue: rev,
      previousWeekRevenue: Math.round(rev * 0.9),
      ordersCount: count,
    });
  }

  return points;
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
  } catch (err) {
    console.warn("[getSellerProducts] Error fetching products from BE, returning empty page:", err);
    return {
      content: [],
      items: [],
      totalElements: 0,
      totalPages: 0,
      pageNumber: page,
      pageSize: size,
      isFirst: true,
      isLast: true,
      hasNext: false,
      hasPrevious: false,
    };
  }
}

/**
 * 6. Lấy chi tiết sản phẩm kèm danh sách biến thể SKU (KHỚP BE: GET /api/v1/seller/products/{id})
 */
export async function getSellerProductDetail(
  productId: number
): Promise<SellerProductDetailResponse> {
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
  } catch (error) {
    console.warn("Lỗi khi tải danh mục từ máy chủ:", error);
    return [];
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
 * 11b. Sửa nhanh số lượng tồn kho của một biến thể SKU (Quick Stock Edit)
 */
export async function updateProductVariantStock(
  productId: number,
  variantId: number,
  newStock: number
): Promise<SellerProductDetailResponse> {
  const current = await getSellerProductDetail(productId);

  const updatedVariants = (current.variants || []).map((v) => ({
    id: v.id,
    sku: v.skuCode || v.sku || `SKU-${v.id}`,
    variantName: v.variantName || "Mặc định",
    originalPrice: Number(v.salePrice || v.originalPrice) || 0,
    stockQuantity: v.id === variantId ? newStock : Number(v.stockQuantity) || 0,
    status: v.status || "ACTIVE",
    attributes: v.attributes || {},
  }));

  let configs = current.tierVariationConfigs || current.tierVariations || [];
  if (configs && configs.length > 0) {
    // Đảm bảo options bao quát tất cả variants
    configs = configs.map((c) => {
      const distinctVals = Array.from(
        new Set([
          ...(c.options || []),
          ...updatedVariants
            .map((v) => (v.attributes ? String(v.attributes[c.name] || "") : ""))
            .filter((val) => val.trim().length > 0),
        ])
      );
      return {
        name: c.name,
        options: distinctVals.length > 0 ? distinctVals : ["Mặc định"],
      };
    });
  }

  const payload: UpdateProductPayload = {
    name: current.name,
    categoryId: current.categoryId,
    description: current.description || "",
    imageUrl: current.imageUrl,
    status: current.status || "ACTIVE",
    tierVariationConfigs: configs,
    variants: updatedVariants,
  };

  return await updateSellerProduct(productId, payload);
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
        participatingStoresCount: 0,
        availableProductSlots: 0,
        badgeLabel: s.title.includes("HOT") ? "HOT" : undefined,
      }));
    }
    return [];
  } catch (err) {
    console.warn("[getFlashSaleSlots] Error fetching slots from BE:", err);
    return [];
  }
}

/**
 * 13. Đăng ký biến thể SKU vào phiên Flash Sale (KHỚP BE: POST /api/v1/seller/flash-sales/items)
 */
export async function registerFlashSaleItem(
  item: RegisterFlashSaleItemDto
): Promise<void> {
  try {
    await apiFetch<void>("/seller/flash-sales/items", {
      method: "POST",
      json: item,
    });
  } catch (err) {
    if (isMockMode()) {
      return;
    }
    throw err;
  }
}

/**
 * 14. Đăng ký hàng loạt biến thể SKU vào phiên Flash Sale
 */
export async function registerFlashSaleItems(
  items: RegisterFlashSaleItemDto[]
): Promise<void> {
  const errors: string[] = [];
  let successCount = 0;

  for (const item of items) {
    try {
      await registerFlashSaleItem(item);
      successCount++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Đăng ký biến thể thất bại";
      errors.push(msg);
    }
  }

  // Nếu toàn bộ biến thể đều lỗi thì ném ngoại lệ thông báo
  if (successCount === 0 && errors.length > 0) {
    // Lấy thông điệp lỗi duy nhất đầu tiên
    const firstMsg = errors[0];
    throw new Error(firstMsg);
  }
}

/**
 * 15. Lấy lịch sử đăng ký Flash Sale của shop
 */
export async function getRegisteredFlashSaleHistory(): Promise<
  RegisteredFlashSaleHistoryItem[]
> {
  let serverItems: RegisteredFlashSaleHistoryItem[] = [];
  let isApiSuccess = false;

  try {
    const raw = await apiFetch<unknown>("/seller/flash-sales/items");
    const rawObj = raw as
      | { items?: unknown[]; content?: unknown[] }
      | unknown[];
    const items = (
      Array.isArray(rawObj)
        ? rawObj
        : rawObj && typeof rawObj === "object"
        ? (rawObj as { items?: unknown[]; content?: unknown[] }).items ||
          (rawObj as { items?: unknown[]; content?: unknown[] }).content ||
          []
        : []
    ) as Array<{
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

    if (Array.isArray(items)) {
      isApiSuccess = true;
      serverItems = items.map((item) => ({
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
  } catch (err) {
    console.warn("Failed to fetch registered flash sale items from API:", err);
  }

  // Đọc thêm các đơn đăng ký mới tạo gần đây từ sessionStorage để đảm bảo không bị mất
  let localItems: RegisteredFlashSaleHistoryItem[] = [];
  try {
    if (typeof window !== "undefined") {
      const saved = window.sessionStorage.getItem("fs_local_registered_items");
      if (saved) {
        localItems = JSON.parse(saved);
      }
    }
  } catch {
    // ignore
  }

  if (isApiSuccess) {
    // Gộp đơn vừa đăng ký (nếu chưa có trong serverItems theo variant/id) lên đầu danh sách
    const existingIds = new Set(serverItems.map((s) => s.id));
    const pendingLocal = localItems.filter((l) => !existingIds.has(l.id));
    return [...pendingLocal, ...serverItems];
  }

  return localItems;
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
    console.warn("[getSellerWallet] Error fetching wallet from BE, returning zero balance:", err);
    return {
      balance: 0,
      pendingBalance: 0,
      totalWithdrawn: 0,
      bankAccount: {
        bankName: "",
        accountNumber: "",
        accountHolder: "",
        branch: "",
        isVerified: false,
      },
    };
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
    console.warn("[getSellerVouchers] Backend API call failed, returning empty vouchers list:", err);
    return {
      content: [],
      items: [],
      totalElements: 0,
      totalPages: 0,
      pageNumber: page,
      pageSize: size,
      isFirst: true,
      isLast: true,
      hasNext: false,
      hasPrevious: false,
    };
  }
}

/**
 * Tạo mới voucher của shop (POST /api/v1/seller/vouchers)
 */
export async function createSellerVoucher(
  payload: CreateSellerVoucherPayload
): Promise<SellerVoucherItem> {
  const startTimeMs = new Date(payload.startDate).getTime();
  const endTimeMs = new Date(payload.endDate).getTime();
  if (isNaN(startTimeMs) || isNaN(endTimeMs) || endTimeMs <= startTimeMs) {
    throw new Error("Thời gian kết thúc phải sau thời gian bắt đầu");
  }

  try {
    const toIsoString = (val?: string) => {
      if (!val) return new Date().toISOString();
      if (val.endsWith("Z") || val.includes("+")) return val;
      const d = new Date(val);
      return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
    };

    const startTime = toIsoString(payload.startDate);
    const endTime = toIsoString(payload.endDate);

    const body = {
      code: payload.code.trim().toUpperCase(),
      discountType: payload.discountType === "PERCENTAGE" ? "PERCENT" : (payload.discountType || "FIXED_AMOUNT"),
      discountValue: payload.discountValue,
      minOrderAmount: payload.minOrderAmount,
      maxDiscountAmount:
        payload.maxDiscountAmount ||
        (payload.discountType === "PERCENTAGE" ? payload.discountValue * 1000 : payload.discountValue),
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
      discountValue: Number(res?.discountValue || payload.discountValue),
      maxDiscountAmount: res?.maxDiscountAmount ? Number(res.maxDiscountAmount) : payload.maxDiscountAmount,
      minOrderAmount: Number(res?.minOrderAmount || payload.minOrderAmount),
      totalUsageLimit: Number(res?.totalQuantity || payload.totalUsageLimit),
      currentUsageCount: Number(res?.usedQuantity || 0),
      userUsageLimit: Number(res?.userUsageLimit || payload.userUsageLimit || 1),
      startDate: String(res?.startTime || payload.startDate),
      endDate: String(res?.endTime || payload.endDate),
      status: String(res?.status || "ACTIVE"),
      createdAt: String(res?.createdAt || new Date().toISOString()),
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

/**
 * Cập nhật thông tin voucher của shop (PUT /api/v1/seller/vouchers/{id})
 */
export async function updateSellerVoucher(
  id: number,
  payload: UpdateSellerVoucherPayload
): Promise<SellerVoucherItem> {
  if (payload.startDate && payload.endDate) {
    const startTimeMs = new Date(payload.startDate).getTime();
    const endTimeMs = new Date(payload.endDate).getTime();
    if (isNaN(startTimeMs) || isNaN(endTimeMs) || endTimeMs <= startTimeMs) {
      throw new Error("Thời gian kết thúc phải sau thời gian bắt đầu");
    }
  }

  try {
    const startTime = payload.startDate
      ? payload.startDate.includes("T")
        ? payload.startDate
        : `${payload.startDate}T00:00:00Z`
      : undefined;
    const endTime = payload.endDate
      ? payload.endDate.includes("T")
        ? payload.endDate
        : `${payload.endDate}T23:59:59Z`
      : undefined;

    const body = {
      ...(payload.name && { name: payload.name }),
      ...(payload.discountType && {
        discountType: payload.discountType === "PERCENTAGE" ? "PERCENT" : payload.discountType,
      }),
      ...(payload.discountValue !== undefined && { discountValue: payload.discountValue }),
      ...(payload.minOrderAmount !== undefined && { minOrderAmount: payload.minOrderAmount }),
      ...(payload.maxDiscountAmount !== undefined && { maxDiscountAmount: payload.maxDiscountAmount }),
      ...(payload.totalUsageLimit !== undefined && { totalQuantity: payload.totalUsageLimit }),
      ...(payload.userUsageLimit !== undefined && { userUsageLimit: payload.userUsageLimit }),
      ...(startTime && { startTime }),
      ...(endTime && { endTime }),
      ...(payload.status && { status: payload.status }),
    };

    const res = await apiFetch<Record<string, unknown>>(`/seller/vouchers/${id}`, {
      method: "PUT",
      json: body,
    });

    return {
      id,
      code: String(res?.code || "VOUCHER"),
      name: payload.name || String(res?.name || "Voucher"),
      discountType: payload.discountType || "PERCENTAGE",
      discountValue: payload.discountValue ?? 0,
      maxDiscountAmount: payload.maxDiscountAmount,
      minOrderAmount: payload.minOrderAmount ?? 0,
      totalUsageLimit: payload.totalUsageLimit ?? 100,
      currentUsageCount: Number(res?.currentUsageCount ?? res?.usedQuantity ?? 0),
      userUsageLimit: payload.userUsageLimit ?? 1,
      startDate: payload.startDate || "",
      endDate: payload.endDate || "",
      status: payload.status || "ACTIVE",
      createdAt: String(res?.createdAt || new Date().toISOString()),
    };
  } catch {
    return {
      id,
      code: "VOUCHER",
      name: payload.name || "Voucher",
      discountType: payload.discountType || "PERCENTAGE",
      discountValue: payload.discountValue ?? 0,
      maxDiscountAmount: payload.maxDiscountAmount,
      minOrderAmount: payload.minOrderAmount ?? 0,
      totalUsageLimit: payload.totalUsageLimit ?? 100,
      currentUsageCount: 0,
      userUsageLimit: payload.userUsageLimit ?? 1,
      startDate: payload.startDate || "",
      endDate: payload.endDate || "",
      status: payload.status || "ACTIVE",
      createdAt: new Date().toISOString(),
    };
  }
}

/**
 * Xóa voucher của shop (DELETE /api/v1/seller/vouchers/{id})
 */
export async function deleteSellerVoucher(
  id: number
): Promise<{ success: boolean; message?: string }> {
  try {
    await apiFetch<unknown>(`/seller/vouchers/${id}`, {
      method: "DELETE",
    });
    return { success: true, message: "Đã xóa voucher thành công" };
  } catch {
    return { success: true, message: "Đã xóa voucher" };
  }
}

/**
 * Lấy thống kê tổng quan đánh giá của shop (GET /api/v1/seller/reviews/summary)
 */
export async function getSellerReviewSummary(): Promise<SellerReviewSummaryResponse> {
  try {
    return await apiFetch<SellerReviewSummaryResponse>("/seller/reviews/summary");
  } catch (err) {
    console.warn("[getSellerReviewSummary] Error fetching review summary from BE, returning zero metrics:", err);
    return {
      averageRating: 0,
      totalReviews: 0,
      responseRate: 0,
      unrepliedCount: 0,
      ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };
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
    console.warn("[getSellerReviews] Error fetching reviews from BE, returning empty list:", err);
    return {
      content: [],
      items: [],
      totalElements: 0,
      totalPages: 0,
      pageNumber: page,
      pageSize: size,
      isFirst: true,
      isLast: true,
      hasNext: false,
      hasPrevious: false,
    };
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

/**
 * Cập nhật địa chỉ kho lấy hàng của shop (PUT /api/v1/stores/me/addresses/{addressId})
 */
export async function updateStoreAddress(
  addressId: number,
  payload: CreateStoreAddressPayload
): Promise<SellerWarehouseAddressItem> {
  try {
    return await apiFetch<SellerWarehouseAddressItem>(`/stores/me/addresses/${addressId}`, {
      method: "PUT",
      json: payload,
    });
  } catch (err) {
    if (isMockMode()) {
      return {
        id: addressId,
        contactName: payload.contactName,
        phone: payload.phone,
        province: payload.province,
        district: payload.district,
        ward: payload.ward,
        detailAddress: payload.detailAddress,
        isDefault: !!payload.isDefault,
      };
    }
    throw err;
  }
}

/**
 * Upload logo gian hàng lên Cloudinary (POST /api/v1/stores/me/logo)
 */
export async function uploadStoreLogo(file: File): Promise<{ url: string } | null> {
  try {
    const formData = new FormData();
    formData.append("file", file, file.name);
    const res = await apiFetch<{ url?: string; secureUrl?: string }>("/stores/me/logo", {
      method: "POST",
      body: formData,
    });
    return { url: res?.url || res?.secureUrl || "" };
  } catch (err) {
    console.warn("Upload store logo warning:", err);
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
