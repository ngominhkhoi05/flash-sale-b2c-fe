/**
 * Orders hooks – TanStack Query hooks cho orders module.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getOrders,
  getOrderById,
  cancelOrderById,
  getOrdersByCode,
  type GetOrdersParams,
  type BackendOrderDetail,
} from "./api";
import type { OrderSuccessView, OrderFailedView } from "./types";

// ─── Query keys ──────────────────────────────────────────────────────────────

export const orderKeys = {
  all: ["orders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  list: (params: GetOrdersParams) => [...orderKeys.lists(), params] as const,
  details: () => [...orderKeys.all, "detail"] as const,
  detail: (id: number) => [...orderKeys.details(), id] as const,
};

// ─── Query hooks ─────────────────────────────────────────────────────────────

/**
 * useOrders – Lấy danh sách đơn hàng của user hiện tại.
 *
 * @param params.page - trang (0-index, mặc định 0)
 * @param params.size - số item trên trang (mặc định 10)
 * @param params.status - lọc theo trạng thái (PENDING_PAYMENT, PAID, etc.)
 */
export function useOrders(params: GetOrdersParams = {}) {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => getOrders(params),
    staleTime: 1000 * 30, // 30s - orders thay đổi thường xuyên
  });
}

/**
 * useOrderById – Lấy chi tiết đơn hàng theo id (int64).
 *
 * Dùng cho trang order detail và trang QR payment.
 * NOTE: với orderCode string (hiển thị cho user), dùng order.id (numeric)
 * từ danh sách orders để gọi API này.
 */
export function useOrderById(orderId: number | undefined) {
  return useQuery<BackendOrderDetail>({
    queryKey: orderKeys.detail(orderId ?? 0),
    queryFn: () => {
      if (orderId === undefined || orderId === null) {
        throw new Error("orderId is required");
      }
      return getOrderById(orderId);
    },
    enabled: orderId !== undefined && orderId !== null,
    staleTime: 1000 * 30, // 30s
  });
}

/**
 * useOrderFailedByCode – fetch aggregate view cho trang `/checkout/failed`.
 *
 * Input: orderCode (string, có thể CSV: "FS-001,TZ-002")
 * Output: OrderFailedView (transactionId, grandTotal, heldUntil, rejectionReason, ...)
 *
 * Empty orderCode → query disabled, return undefined.
 * Error → query.isError (caller render ErrorState).
 */
export function useOrderFailedByCode(orderCode: string) {
  return useQuery<OrderFailedView>({
    queryKey: [...orderKeys.all, "failed", orderCode] as const,
    queryFn: () => getOrdersByCode(orderCode).then(async () => {
      // TODO(api): Khi BE có endpoint `GET /api/v1/orders/{code}/failed-detail`
      // thì thay bằng call riêng. Hiện tại dùng cùng getOrdersByCode + adapt
      // sang failed view tại PageContent layer.
      throw new Error(
        "useOrderFailedByCode: chưa wire BE — dùng mock tại FailedPageContent",
      );
    }),
    enabled: orderCode.length > 0,
    staleTime: 1000 * 30,
  });
}

/**
 * useOrderSuccessByCode – fetch aggregate view cho trang `/checkout/success`.
 *
 * Input: orderCode (string, có thể CSV: "FS-001,TZ-002")
 * Output: OrderSuccessView (orders + grandTotal + address + ...)
 *
 * Empty orderCode → query disabled, return undefined.
 * Error → query.isError (caller render ErrorState).
 */
export function useOrderSuccessByCode(orderCode: string) {
  return useQuery<OrderSuccessView>({
    queryKey: [...orderKeys.all, "success", orderCode] as const,
    queryFn: () => getOrdersByCode(orderCode),
    enabled: orderCode.length > 0,
    staleTime: 1000 * 30,
  });
}

// ─── Mutation hooks ─────────────────────────────────────────────────────────

/**
 * useCancelOrder – Hủy đơn hàng theo id (int64).
 *
 * Flow:
 * 1. User bấm "Hủy đơn" → gọi mutation
 * 2. Gọi PATCH /api/v1/orders/{id}/cancel
 * 3. Thành công → invalidate queries để refresh danh sách + detail
 * 4. Thất bại → hiển thị toast error
 */
export function useCancelOrder(options?: {
  onSuccess?: (data: { success: boolean; orderCode: string; message: string }) => void;
  onError?: (error: unknown, variables: { orderId: number; reason?: string }) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: number; reason?: string }) =>
      cancelOrderById(orderId, { reason }),
    onSuccess: (data, variables) => {
      // Invalidate orders list và detail
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: orderKeys.detail(variables.orderId),
      });
      options?.onSuccess?.(data);
    },
    onError: (error, variables) => {
      console.error("[orders.useCancelOrder]", {
        error,
        orderId: variables.orderId,
      });
      options?.onError?.(error, variables);
    },
  });
}

// ─── Type re-exports ─────────────────────────────────────────────────────────

export type {
  BackendOrderSummary,
  BackendOrderDetail,
  BackendOrderItem,
  BackendOrderAddress,
  BackendOrderPageResponse,
  GetOrdersParams,
} from "./api";

export type {
  OrderSuccessView,
  OrderSuccessRow,
  OrderSuccessAddress,
  OrderFailedView,
  OrderFailedVoucherWarning,
} from "./types";
