/**
 * Payment hooks – TanStack Query wrappers + WS integration.
 *
 * Source contracts:
 *  - REST: `docs/handoffs/fe-zalopay-integration-guide.md` §3
 *  - WS:   `docs/handoffs/fe-ws-integration-guide (1).md` §5.3
 *          (event `PAYMENT_STATUS_CHANGED` trên queue
 *           `/user/queue/flash-sale/orders/{orderCode}/status`)
 *
 * Quy ước:
 *  - `paymentKeys` factory để dễ invalidate (rule api-data §6).
 *  - `useOrderPayment` ưu tiên WS (realtime), dùng polling fallback 3s/lần
 *    khi `polling: true`. Tự cleanup subscription khi unmount.
 *  - Mutation hooks setQueryData cho optimistic cache giữa WS + REST.
 */
"use client";

import { useMemo } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createZaloPayPayment,
  getOrderPayment,
  queryZaloPayPayment,
  queryZaloPayPaymentByCode,
} from "./payment.api";
import { useFlashSaleWs } from "@/hooks/useFlashSaleWs";
import type { PaymentResponse, PaymentStatus } from "./payment.types";

// ─── Query keys (rule api-data §6) ────────────────────────────────────────

export const paymentKeys = {
  all: ["payment"] as const,
  detail: (orderId: number) =>
    [...paymentKeys.all, orderId, "detail"] as const,
  byCode: (orderCode: string) =>
    [...paymentKeys.all, "byCode", orderCode, "detail"] as const,
};

// ─── useCreateZaloPayPayment ──────────────────────────────────────────────

/**
 * Mutation: tạo yêu cầu thanh toán ZaloPay.
 * Optimistic cache: setQueryData detail(orderId) → UI hiển thị QR ngay.
 *
 * Caller (component) bắt lỗi qua `result.error` và map code → toast.
 */
export function useCreateZaloPayPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: number) => createZaloPayPayment(orderId),
    onSuccess: (data) => {
      qc.setQueryData(paymentKeys.detail(data.orderId), data);
      qc.setQueryData(paymentKeys.byCode(data.orderCode), data);
    },
  });
}

// ─── useOrderPayment ──────────────────────────────────────────────────────

export interface UseOrderPaymentOptions {
  /** Bật polling 3s/lần (dùng khi user ở trang thanh toán). */
  polling?: boolean;
  /**
   * Mã order hiển thị cho user (vd: "FS-261001-A7K2Q").
   * Khi có → subscribe WS `/user/queue/flash-sale/orders/{code}/status`
   * và invalidate query khi nhận event `PAYMENT_STATUS_CHANGED`.
   */
  orderCode?: string;
  /**
   * Status đích cần đạt tới. Khi WS event match → invalidate query +
   * gọi callback `onStatusReached`. Hữu ích để redirect sau khi SUCCESS.
   */
  onStatusReached?: (status: PaymentStatus) => void;
}

/**
 * useQuery: payment status của 1 order.
 *
 * Cache strategy:
 *  - Ưu tiên WS `PAYMENT_STATUS_CHANGED` (realtime, near-zero latency).
 *  - Fallback: polling 3s/lần (max 5 phút — order TTL).
 *  - Khi `orderCode` cung cấp + WS connected → invalidate query khi
 *    event đến → TanStack Query refetch REST 1 lần để đồng bộ source-of-truth.
 */
export function useOrderPayment(
  orderId: number,
  options: UseOrderPaymentOptions = {},
) {
  const { polling = false, orderCode, onStatusReached } = options;
  const qc = useQueryClient();
  const enabled = orderId > 0;

  // Subscribe WS khi có orderCode + enabled
  // useFlashSaleWs internal sẽ cleanup khi unmount.
  useFlashSaleWs(
    useMemo(
      () => ({
        enabled: enabled && !!orderCode,
        subscribeOrderCodes: orderCode ? [orderCode] : [],
        onMessage: (event) => {
          // Chỉ xử lý PAYMENT_STATUS_CHANGED cho orderCode khớp
          if (event?.eventType !== "PAYMENT_STATUS_CHANGED") return;
          // Hỗ trợ cả 2 schema BE: chỉ orderCode hoặc cả orderId + orderCode
          const evtOrderCode = (
            event as { orderCode?: string; orderId?: number }
          ).orderCode;
          const evtOrderId = (event as { orderId?: number }).orderId;
          if (
            evtOrderCode !== orderCode &&
            evtOrderId !== orderId
          ) {
            return;
          }
          // Invalidate để TanStack Query refetch REST (rule WS = notification only)
          qc.invalidateQueries({ queryKey: paymentKeys.detail(orderId) });
          qc.invalidateQueries({ queryKey: paymentKeys.byCode(orderCode ?? "") });
          const paymentStatus = (
            event as { paymentStatus?: PaymentStatus }
          ).paymentStatus;
          if (paymentStatus) onStatusReached?.(paymentStatus);
        },
      }),
      [enabled, orderCode, orderId, qc, onStatusReached],
    ),
  );

  return useQuery<PaymentResponse>({
    queryKey: paymentKeys.detail(orderId),
    queryFn: () => getOrderPayment(orderId),
    enabled,
    staleTime: 0,
    refetchInterval: polling ? 3000 : false,
    refetchIntervalInBackground: false,
  });
}

// ─── useQueryZaloPayPayment ───────────────────────────────────────────────

/**
 * Mutation: manual sync với ZaloPay gateway.
 * Dùng khi WS miss callback / user click "Tôi đã thanh toán".
 *
 * Rate-limit: caller phải debounce (khuyến nghị 1 lần / 5s).
 */
export function useQueryZaloPayPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: number) => queryZaloPayPayment(orderId),
    onSuccess: (data) => {
      qc.setQueryData(paymentKeys.detail(data.orderId), data);
      qc.setQueryData(paymentKeys.byCode(data.orderCode), data);
    },
  });
}

/**
 * Mutation: manual sync với ZaloPay gateway theo orderCode.
 * Dùng trên trang /checkout/qr khi user click "Tôi đã thanh toán" hoặc "Đã hoàn tất".
 */
export function useQueryZaloPayPaymentByCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderCode: string) => queryZaloPayPaymentByCode(orderCode),
    onSuccess: (data) => {
      qc.setQueryData(paymentKeys.detail(data.orderId), data);
      qc.setQueryData(paymentKeys.byCode(data.orderCode), data);
    },
  });
}

// ─── useByCodeOrderPayment ────────────────────────────────────────────────

/**
 * useQuery: lookup payment theo orderCode.
 * Dùng khi URL chỉ có orderCode (vd trang success redirect).
 *
 * Trả về cùng PaymentResponse — cùng cache key family `paymentKeys.byCode`.
 */
export function useOrderPaymentByCode(orderCode: string | undefined) {
  const enabled = !!orderCode && orderCode.length > 0;
  const qc = useQueryClient();

  // Subscribe WS khi có orderCode
  useFlashSaleWs(
    useMemo(
      () => ({
        enabled,
        subscribeOrderCodes: orderCode ? [orderCode] : [],
        onMessage: (event) => {
          if (event?.eventType !== "PAYMENT_STATUS_CHANGED") return;
          const evtOrderCode = (
            event as { orderCode?: string }
          ).orderCode;
          if (evtOrderCode !== orderCode) return;
          qc.invalidateQueries({
            queryKey: paymentKeys.byCode(orderCode ?? ""),
          });
        },
      }),
      [enabled, orderCode, qc],
    ),
  );

  // Lưu ý: backend hiện không có endpoint GET /payment?orderCode=...
  // → Hook này trả về query với queryFn trả về null; component tự dùng
  //   useOrderPayment(orderId) sau khi biết orderId.
  // Đây là placeholder — sẽ bổ sung khi BE có endpoint tương ứng.
  return useQuery<PaymentResponse | null>({
    queryKey: paymentKeys.byCode(orderCode ?? ""),
    queryFn: async () => null,
    enabled,
    staleTime: Infinity,
  });
}
