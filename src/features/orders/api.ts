/**
 * Orders API layer.
 *
 * Backend endpoints (from http://180.93.137.28/swagger-ui):
 * - GET    /api/v1/orders                    → Danh sách đơn hàng của user (query: page, size, status)
 * - GET    /api/v1/orders/{id}              → Chi tiết đơn hàng (dùng id int64)
 * - PATCH  /api/v1/orders/{id}/cancel      → Hủy đơn hàng (dùng id int64)
 *
 * Convention:
 * - Pure function, throw ApiError
 * - Trả về DTO khớp với backend
 */

import { apiFetch } from "@/lib/api";

// ─── Backend Response Types ────────────────────────────────────────────────────

/** Order item trong response (khớp Swagger OrderItemResponse) */
export interface BackendOrderItem {
  id: number;
  variantId: number;
  flashSaleItemId: number | null;
  productName: string;
  variantName: string;
  priceAtPurchase: number;
  quantity: number;
  itemSubtotal: number;
}

/** Shipping address snapshot trong đơn */
export interface BackendOrderAddress {
  recipientName: string;
  phone: string;
  fullAddress: string;
  province: string;
  district: string;
  ward: string;
  detailAddress: string;
}

/** Order detail từ backend */
export interface BackendOrderDetail {
  id: number;
  orderCode: string;
  buyerId: number;
  storeId: number;
  storeName: string;
  status: string;
  paymentStatus: string;
  paymentMethod: "ZALOPAY" | "COD";
  shippingAddress: BackendOrderAddress;
  items: BackendOrderItem[];
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  voucherCode: string | null;
  totalAmount: number;
  paymentUrl: string | null;
  qrCodeUrl: string | null;
  /** Thời điểm hết hạn giữ chỗ / thanh toán (từ backend, BE dùng field `expiresAt`) */
  expiresAt: string | null;
  createdAt: string;
  confirmedAt: string | null;
  shippedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
}

/** Order summary (danh sách) */
export interface BackendOrderSummary {
  id: number;
  orderCode: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  totalItems: number;
  storeName: string;
  thumbnail: string | null;
  createdAt: string;
  /** Thời điểm hết hạn (từ backend field `expiresAt`) */
  expiresAt: string | null;
}

/** Page response cho orders list */
export interface BackendOrderPageResponse {
  items: BackendOrderSummary[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
}

/** Cancel order response */
export interface BackendCancelOrderResponse {
  success: boolean;
  orderCode: string;
  message: string;
}

// ─── Request Types ────────────────────────────────────────────────────────────

/** Query params cho GET /api/v1/orders */
export interface GetOrdersParams {
  page?: number;
  size?: number;
  status?: string;
}

/** Request body cho cancel order */
export interface CancelOrderRequest {
  reason?: string;
}

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * GET /api/v1/orders
 *
 * Lấy danh sách đơn hàng của user hiện tại.
 *
 * Query params:
 * - page: trang (0-index, mặc định 0)
 * - size: số item trên trang (mặc định 10)
 * - status: lọc theo trạng thái (PENDING_PAYMENT, PAID, etc.)
 */
export async function getOrders(
  params: GetOrdersParams = {}
): Promise<BackendOrderPageResponse> {
  return apiFetch<BackendOrderPageResponse>("/api/v1/orders", {
    method: "GET",
    query: {
      page: params.page ?? 0,
      size: params.size ?? 10,
      ...(params.status ? { status: params.status } : {}),
    },
  });
}

/**
 * GET /api/v1/orders/{id}
 *
 * Lấy chi tiết đơn hàng theo id (int64).
 *
 * Error codes:
 * - 404 ORDER_404 → Không tìm thấy đơn hàng
 * - 403 ORDER_403 → Không có quyền truy cập đơn hàng này
 */
export async function getOrderById(
  orderId: number
): Promise<BackendOrderDetail> {
  return apiFetch<BackendOrderDetail>(
    `/api/v1/orders/${orderId}`,
    { method: "GET" }
  );
}

/**
 * PATCH /api/v1/orders/{id}/cancel
 *
 * Hủy đơn hàng (chỉ áp dụng cho đơn chưa thanh toán).
 * Dùng id int64 thay vì orderCode.
 *
 * Request:
 * - reason: lý do hủy (optional)
 *
 * Error codes:
 * - 404 ORDER_404 → Không tìm thấy đơn hàng
 * - 403 ORDER_403 → Không có quyền hủy đơn này
 * - 400 ORDER_400_3 (INVALID_STATUS_TRANSITION) → Đơn không thể hủy ở trạng thái hiện tại
 */
export async function cancelOrderById(
  orderId: number,
  request: CancelOrderRequest = {}
): Promise<BackendCancelOrderResponse> {
  return apiFetch<BackendCancelOrderResponse>(
    `/api/v1/orders/${orderId}/cancel`,
    {
      method: "PATCH",
      json: request,
    }
  );
}

/**
 * GET nhiều order detail theo orderCode.
 *
 * BE hiện không có endpoint `GET /api/v1/orders?code=...`,
 * nên ta dùng flow:
 *   1. Lấy danh sách orders (page=0, size=20) — lọc client side
 *   2. Với mỗi orderCode match → gọi `getOrderById(id)`
 *   3. Aggregate thành OrderSuccessView qua `adaptOrdersToSuccessView`
 *
 * Lưu ý:
 *  - orderCode có thể là CSV ("FS-001,TZ-002") khi user đặt nhiều shop.
 *  - Nếu không tìm thấy order nào → trả về view rỗng (không throw).
 *
 * TODO(api): Khi BE có `GET /api/v1/orders/by-codes?codes=...` thì
 * thay bằng 1 call duy nhất.
 */
import { adaptOrdersToSuccessView, type OrderSuccessView } from "./types";

export async function getOrdersByCode(
  orderCode: string
): Promise<OrderSuccessView> {
  const codes = orderCode
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
  if (codes.length === 0) {
    return adaptOrdersToSuccessView([]);
  }

  // 1. Lấy danh sách orders (page=0, size lớn để chắc chắn tìm thấy).
  const list = await apiFetch<BackendOrderPageResponse>("/api/v1/orders", {
    method: "GET",
    query: { page: 0, size: 50 },
  });

  // 2. Lọc ra các order có orderCode khớp.
  const matched = list.items.filter((o) => codes.includes(o.orderCode));

  // 3. Fetch detail từng order (parallel).
  const details = await Promise.all(
    matched.map((o) => getOrderById(o.id))
  );

  return adaptOrdersToSuccessView(details);
}
