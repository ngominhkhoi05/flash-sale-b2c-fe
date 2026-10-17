/**
 * Payment API layer — ZaloPay (rule api-data §5, BE integration guide §3).
 *
 * 3 endpoints từ BE guide 2026-10-15:
 *   POST /api/v1/orders/{orderId}/payment/zalopay     — tạo yêu cầu thanh toán
 *   GET  /api/v1/orders/{orderId}/payment             — xem trạng thái (luôn 200)
 *   POST /api/v1/orders/{orderId}/payment/zalopay/query — query fallback sync
 *
 * Lưu ý:
 *  - apiFetch đã unwrap envelope `{ data: T }` và throw ApiError (rule §2).
 *  - KHÔNG gọi callback URL từ FE — đó là server-to-server.
 *  - KHÔNG tự verify payment — chờ WS PAYMENT_STATUS_CHANGED hoặc polling.
 */
import { apiFetch } from "@/lib/api/client";
import type { ApiResponse, PaymentResponse } from "./payment.types";

// ─── Endpoint helpers (rule api-data §4) ───────────────────────────────────

/**
 * Endpoint path factories cho payment.
 * Tránh hard-code URL trong component/hook.
 */
export const paymentEndpoints = {
  paymentBase: (orderId: number) => `/api/v1/orders/${orderId}/payment`,
  createZalopay: (orderId: number) =>
    `/api/v1/orders/${orderId}/payment/zalopay`,
  queryZalopay: (orderId: number) =>
    `/api/v1/orders/${orderId}/payment/zalopay/query`,
} as const;

// ─── API functions ─────────────────────────────────────────────────────────

/**
 * POST /api/v1/orders/{orderId}/payment/zalopay
 *
 * Tạo yêu cầu thanh toán ZaloPay cho order đang ở PENDING_PAYMENT.
 * Idempotent ở backend (gọi 2 lần trả về cùng payment).
 *
 * @throws {ApiError}
 *   - 401 AUTH_INVALID_TOKEN / AUTH_TOKEN_EXPIRED
 *   - 403 ORDER_NOT_OWNER (order không thuộc user)
 *   - 409 ORDER_INVALID_STATUS_TRANSITION (order không ở PENDING_PAYMENT)
 *   - 500 INTERNAL_SERVER_ERROR (ZaloPay gateway error)
 */
export async function createZaloPayPayment(
  orderId: number,
): Promise<PaymentResponse> {
  return apiFetch<ApiResponse<PaymentResponse>>(
    paymentEndpoints.createZalopay(orderId),
    { method: "POST" },
  ).then((envelope) => envelope.data);
}

/**
 * GET /api/v1/orders/{orderId}/payment
 *
 * Lấy trạng thái thanh toán. **Luôn trả 200** kể cả khi chưa có
 * payment (paymentMethod = UNPAID, id = null).
 *
 * Không nên gọi liên tục — dùng kết hợp WS subscription + polling
 * fallback 3s/lần (xem `useOrderPayment`).
 *
 * @throws {ApiError}
 *   - 401 token invalid/expired
 *   - 404 ORDER_NOT_FOUND
 */
export async function getOrderPayment(
  orderId: number,
): Promise<PaymentResponse> {
  return apiFetch<ApiResponse<PaymentResponse>>(
    paymentEndpoints.paymentBase(orderId),
    { method: "GET" },
  ).then((envelope) => envelope.data);
}

/**
 * POST /api/v1/orders/{orderId}/payment/zalopay/query
 *
 * Manually sync với ZaloPay gateway — dùng khi WS miss callback
 * hoặc user click "Tôi đã thanh toán". BE gọi ZaloPay /v2/query
 * rồi update Payment(Order) nếu amount khớp.
 *
 * Rate-limit: KHÔNG gọi liên tục — khuyến nghị 1 lần / 5s.
 *
 * @throws {ApiError} tương tự createZaloPayPayment
 */
export async function queryZaloPayPayment(
  orderId: number,
): Promise<PaymentResponse> {
  return apiFetch<ApiResponse<PaymentResponse>>(
    paymentEndpoints.queryZalopay(orderId),
    { method: "POST" },
  ).then((envelope) => envelope.data);
}
