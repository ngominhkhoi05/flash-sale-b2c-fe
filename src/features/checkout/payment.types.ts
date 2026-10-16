/**
 * Payment types — ZaloPay integration.
 * Source of truth: `docs/handoffs/fe-zalopay-integration-guide.md` (BE 2026-10-15).
 *
 * NOTE: Backend hiện KHÔNG có endpoint riêng cho payment page,
 * chỉ có 3 endpoint:
 *  - POST /api/v1/orders/{orderId}/payment/zalopay
 *  - GET  /api/v1/orders/{orderId}/payment
 *  - POST /api/v1/orders/{orderId}/payment/zalopay/query
 *
 * Vì vậy PaymentResponse được dùng cho cả 3 endpoint trên (response shape
 * giống nhau). Callback URL là server-to-server, FE không gọi.
 */

// ─── Enum: PaymentMethod ───────────────────────────────────────────────────

/**
 * Phương thức thanh toán user chọn.
 * Trùng với `PaymentMethod` trong `types.ts` của checkout (ZALOPAY | COD | UNPAID).
 */
export type PaymentMethod = "ZALOPAY" | "COD" | "UNPAID";

// ─── Enum: PaymentStatus ───────────────────────────────────────────────────

export type PaymentStatus =
  | "PENDING"
  | "SUCCESS"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED"
  | "REFUNDED";

/** Tập status đang chờ (chưa thanh toán). */
export const PENDING_PAYMENT_STATUSES: readonly PaymentStatus[] = [
  "PENDING",
] as const;

/** Tập status đã thanh toán (terminal success). */
export const SUCCEEDED_PAYMENT_STATUSES: readonly PaymentStatus[] = [
  "SUCCESS",
] as const;

/** Tập status thất bại / huỷ (terminal failure). */
export const FAILED_PAYMENT_STATUSES: readonly PaymentStatus[] = [
  "FAILED",
  "CANCELLED",
  "EXPIRED",
  "REFUNDED",
] as const;

/**
 * Type guard: status có phải "chờ thanh toán" (chưa terminal).
 */
export function isPendingPaymentStatus(
  status: string | null | undefined,
): status is "PENDING" {
  return status === "PENDING";
}

/**
 * Type guard: status đã SUCCESS (terminal + successful).
 * Dùng để redirect sang trang order detail sau khi thanh toán xong.
 */
export function isSucceededPaymentStatus(
  status: string | null | undefined,
): status is "SUCCESS" {
  return status === "SUCCESS";
}

/**
 * Type guard: status thất bại / huỷ (terminal + failure).
 * Dùng để hiển thị message + cho user chọn retry hoặc đổi method.
 */
export function isFailedPaymentStatus(
  status: string | null | undefined,
): status is "FAILED" | "CANCELLED" | "EXPIRED" | "REFUNDED" {
  return (
    status === "FAILED" ||
    status === "CANCELLED" ||
    status === "EXPIRED" ||
    status === "REFUNDED"
  );
}

// ─── PaymentResponse ──────────────────────────────────────────────────────

/**
 * Response duy nhất cho cả 3 endpoint ở trên.
 *
 * @property id              - Payment ID (null nếu chưa tạo)
 * @property orderId         - ID order (number)
 * @property orderCode       - Mã order hiển thị (vd: "ORD_2026_001234")
 * @property paymentMethod   - Phương thức (ZALOPAY | COD | UNPAID nếu chưa có payment)
 * @property transactionCode - Mã giao dịch ở gateway (vd: "ZP1697356800000_42")
 * @property amount          - VND, số nguyên (vd: 150000)
 * @property qrCodeUrl       - data URL PNG base64 (chỉ có khi ZALOPAY)
 * @property paymentUrl      - Deeplink ZaloPay (chỉ có khi ZALOPAY)
 * @property status          - Trạng thái payment
 * @property paidAt          - ISO 8601, null nếu chưa thanh toán
 * @property createdAt       - ISO 8601
 */
export interface PaymentResponse {
  id: number | null;
  orderId: number;
  orderCode: string;
  paymentMethod: PaymentMethod;
  transactionCode: string | null;
  amount: number;
  qrCodeUrl: string | null;
  paymentUrl: string | null;
  status: PaymentStatus;
  paidAt: string | null;
  createdAt: string;
}

// ─── ApiResponse envelope (BE chuẩn) ──────────────────────────────────────

/**
 * Wrapper mọi API trong project — unwrap ở `apiFetch`.
 * Tái sử dụng từ guide hướng dẫn.
 */
export interface ApiResponse<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
  timestamp: string;
}

// ─── WebSocket event ──────────────────────────────────────────────────────

/**
 * STOMP event type cho queue `/user/queue/orders/{orderCode}/payment-status`.
 *
 * BE guide ghi `orderCode` nhưng một số phiên bản BE có thể gửi
 * cả `orderId` + `orderCode`. Hook sẽ chấp nhận cả 2 trường — xem
 * `usePaymentStatusWs.ts`.
 */
export interface PaymentStatusEvent {
  /** Order code hiển thị cho user (vd: "FS-261001-A7K2Q") */
  orderCode: string;
  /** Order ID (number) — optional vì một số BE version chỉ gửi orderCode */
  orderId?: number;
  paymentMethod: "ZALOPAY" | "COD";
  status: PaymentStatus;
  /** ISO 8601 */
  occurredAt: string;
}
