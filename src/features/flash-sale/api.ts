/**
 * Flash Sale API layer.
 *
 * Backend endpoints (from http://180.93.137.28/swagger-ui):
 * - POST /api/v1/flash-sales/reserve   → Reserve item, create pending order
 * - DELETE /api/v1/flash-sales/reservations/{reservationId} → Cancel reservation
 *
 * Contract:
 * - Request body: { flashSaleItemId, addressId?, quantity }
 * - Response: ReservationResponse with orderCode, expiresAt, etc.
 * - Errors: FLASH_SALE_OUT_OF_STOCK, FLASH_SALE_PURCHASE_LIMIT_EXCEEDED, etc.
 */

import { apiFetch, ApiError } from "@/lib/api";

// ─── Request/Response Types ───────────────────────────────────────────────────

/** Request body cho reserve endpoint */
export interface ReserveFlashSaleRequest {
  /** ID của mục Flash Sale (từ /flash-sales/slots) */
  flashSaleItemId: number;
  /** ID địa chỉ nhận hàng (optional - BE tự lấy default) */
  addressId?: number;
  /** Số lượng muốn mua (default 1) */
  quantity?: number;
}

/** Response từ reserve endpoint (thành công) */
export interface ReservationResponse {
  /** ID đơn hàng (numeric) – thêm trong Swagger 2026-10-17. */
  orderId?: number;
  /** Mã đơn hàng */
  orderCode: string;
  /** ID item Flash Sale */
  flashSaleItemId: number;
  /** Số lượng đã đặt */
  quantity: number;
  /** Giá Flash Sale tại thời điểm đặt */
  flashSalePrice: number;
  /** Tổng tiền */
  totalAmount: number;
  /** Trạng thái đơn (vd: "PENDING_PAYMENT") – thêm trong Swagger 2026-10-17. */
  status?: string;
  /** Thời điểm hết hạn giữ chỗ (300 giây) */
  expiresAt: string;
  /** Message từ BE (vd: "Đặt hàng thành công, vui lòng thanh toán trong 5 phút") – thêm trong Swagger 2026-10-17. */
  message?: string;
  /** Mã reservation = orderCode (giữ để backward compat với code cũ). */
  reservationId?: string;
}

/** Response từ cancel endpoint */
export interface CancelReservationResponse {
  success: boolean;
  message: string;
}

/** Response từ GET /api/v1/flash-sales/items/active (Swagger 2026-10-17). */
export interface PublicFlashSaleItemResponse {
  id: number;
  slotId: number;
  variantId: number;
  sku: string;
  variantName: string;
  productName: string;
  imageUrl: string;
  originalPrice: number;
  flashSalePrice: number;
  allocatedStock: number;
  availableStock: number;
  userPurchaseLimit: number;
  status: string;
}

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * POST /api/v1/flash-sales/reserve
 *
 * Giữ chỗ Flash Sale trong 300 giây, tạo đơn PENDING_PAYMENT.
 *
 * Headers cần gửi:
 * - Authorization: Bearer <token>
 * - Idempotency-Key: <uuid> (khuyến nghị để chống double order)
 *
 * Error codes có thể xảy ra:
 * - 409 FLASH_SALE_OUT_OF_STOCK → Hết hàng
 * - 422 FLASH_SALE_PURCHASE_LIMIT_EXCEEDED → Vượt giới hạn mua
 * - 400 FLASH_SALE_SLOT_NOT_ACTIVE → Slot chưa mở
 * - 400 FLASH_SALE_SLOT_ALREADY_ENDED → Slot đã kết thúc
 * - 400 FLASH_SALE_ADDRESS_REQUIRED → Chưa có địa chỉ
 * - 400 FLASH_SALE_ADDRESS_NOT_FOUND_OR_NOT_OWNED → Địa chỉ không hợp lệ
 * - 500 FS_500_ORDER_FAILED → Lỗi hệ thống
 */
export async function reserveFlashSale(
  request: ReserveFlashSaleRequest,
  idempotencyKey?: string
): Promise<ReservationResponse> {
  const body: Record<string, unknown> = {
    flashSaleItemId: request.flashSaleItemId,
    quantity: request.quantity ?? 1,
  };

  // addressId là optional - BE sẽ tự lấy default nếu không truyền
  if (request.addressId !== undefined) {
    body.addressId = request.addressId;
  }

  const headers: Record<string, string> = {};

  // Gửi Idempotency-Key để chống double order khi retry
  if (idempotencyKey) {
    headers["Idempotency-Key"] = idempotencyKey;
  }

  return apiFetch<ReservationResponse>("/api/v1/flash-sales/reserve", {
    method: "POST",
    json: body,
    headers,
  });
}

/**
 * DELETE /api/v1/flash-sales/reservations/{reservationId}
 *
 * Hủy giữ chỗ Flash Sale, hoàn stock về Redis.
 *
 * reservationId = orderCode string (vd: "FS-1791963512929-3365")
 *
 * Error codes:
 * - 404 FLASH_SALE_RESERVATION_NOT_FOUND → Không tìm thấy reservation
 * - 400 FLASH_SALE_CANNOT_CANCEL_NON_PENDING_RESERVATION → Đơn không ở trạng thái hủy được
 */
export async function cancelReservation(
  reservationId: string
): Promise<CancelReservationResponse> {
  // reservationId có thể chứa special chars, encode it
  const encodedId = encodeURIComponent(reservationId);

  return apiFetch<CancelReservationResponse>(
    `/api/v1/flash-sales/reservations/${encodedId}`,
    { method: "DELETE" }
  );
}

// ─── Error type guards ───────────────────────────────────────────────────────

/**
 * Type guard để kiểm tra error code từ reserve endpoint.
 * Dùng trong component để hiển thị message phù hợp.
 */
export function isFlashSaleReserveError(
  error: unknown
): error is ApiError {
  if (error instanceof Error && "code" in error) {
    const apiError = error as ApiError;
    return [
      "FLASH_SALE_OUT_OF_STOCK",
      "FLASH_SALE_PURCHASE_LIMIT_EXCEEDED",
      "FLASH_SALE_SLOT_NOT_ACTIVE",
      "FLASH_SALE_SLOT_ALREADY_ENDED",
      "FLASH_SALE_ADDRESS_REQUIRED",
      "FLASH_SALE_ADDRESS_NOT_FOUND_OR_NOT_OWNED",
      "FS_500_ORDER_FAILED",
    ].includes(apiError.code);
  }
  return false;
}

/**
 * Error messages tiếng Việt cho Flash Sale reserve errors.
 * Map từ backend error code → message hiển thị.
 */
export const FLASH_SALE_ERROR_MESSAGES: Record<string, string> = {
  FLASH_SALE_OUT_OF_STOCK: "Sản phẩm đã hết hàng trong Flash Sale",
  FLASH_SALE_PURCHASE_LIMIT_EXCEEDED:
    "Bạn đã vượt quá số lượng mua tối đa cho sản phẩm này",
  FLASH_SALE_SLOT_NOT_ACTIVE: "Khung giờ Flash Sale chưa mở bán",
  FLASH_SALE_SLOT_ALREADY_ENDED: "Khung giờ Flash Sale đã kết thúc",
  FLASH_SALE_ADDRESS_REQUIRED: "Vui lòng thêm địa chỉ nhận hàng trước khi đặt",
  FLASH_SALE_ADDRESS_NOT_FOUND_OR_NOT_OWNED:
    "Địa chỉ giao hàng không hợp lệ",
  FS_500_ORDER_FAILED: "Hệ thống bận, vui lòng thử lại sau",
};

/**
 * GET /api/v1/flash-sales/items/active (M.7, Swagger 2026-10-17).
 *
 * Trả về danh sách sản phẩm Flash Sale đang ACTIVE cho trang chủ,
 * kèm tồn kho real-time.
 *
 * Endpoint public (không cần auth).
 * Response envelope: ApiResponse<List<PublicFlashSaleItemResponse>>
 * → apiFetch unwrap 1 lần → còn PublicFlashSaleItemResponse[].
 */
export async function getActiveFlashSaleItems(): Promise<
  PublicFlashSaleItemResponse[]
> {
  const res = await apiFetch<
    | { data: PublicFlashSaleItemResponse[] }
    | PublicFlashSaleItemResponse[]
  >("/api/v1/flash-sales/items/active");
  return Array.isArray(res) ? res : res.data;
}
