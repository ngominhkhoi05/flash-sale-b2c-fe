/**
 * Checkout hooks – TanStack Query wrappers (rule api-data + testing-required).
 *
 * Query keys: ["checkout", ...]
 *
 * Wired to real backend endpoints:
 *  - GET /api/v1/cart           → checkout snapshot
 *  - GET /api/v1/users/addresses
 *  - GET /api/v1/vouchers/platform, /vouchers/store/{id}
 *  - POST /api/v1/vouchers/apply
 *  - POST /api/v1/orders/checkout
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  applyVoucher as applyVoucherApi,
  getAddresses as getAddressesApi,
  getAvailableVouchers as getAvailableVouchersApi,
  getCheckout as getCheckoutApi,
  submitOrder as submitOrderApi,
} from "./api";
import type {
  Address,
  ApplyVoucherResponse,
  CheckoutData,
  SubmitOrderRequest,
  Voucher,
} from "./types";

export const checkoutKeys = {
  all: ["checkout"] as const,
  detail: () => [...checkoutKeys.all, "detail"] as const,
  addresses: () => [...checkoutKeys.all, "addresses"] as const,
  vouchers: (scope: "SHOP" | "PLATFORM", storeId?: number) =>
    [...checkoutKeys.all, "vouchers", scope, storeId] as const,
};

/**
 * useCheckout – lấy snapshot checkout (address, grouped items, totals).
 * TanStack Query cached 30s, invalidate khi có mutation.
 */
export function useCheckout(enabled = true) {
  return useQuery<CheckoutData>({
    queryKey: checkoutKeys.detail(),
    queryFn: () => getCheckoutApi(),
    enabled,
    staleTime: 30_000,
  });
}

/** useAddresses – danh sách địa chỉ đã lưu. */
export function useAddresses(enabled = true) {
  return useQuery<Address[]>({
    queryKey: checkoutKeys.addresses(),
    queryFn: () => getAddressesApi(),
    enabled,
    staleTime: 60_000,
  });
}

/** useAvailableVouchers – vouchers có thể chọn theo scope. */
export function useAvailableVouchers(
  scope: "SHOP" | "PLATFORM",
  storeId?: number,
) {
  return useQuery<Voucher[]>({
    queryKey: checkoutKeys.vouchers(scope, storeId),
    queryFn: () => getAvailableVouchersApi({ scope, storeId }),
    staleTime: 60_000,
  });
}

/**
 * useApplyVoucherMutation – áp dụng voucher (shop hoặc sàn) qua
 * POST /api/v1/vouchers/apply. Caller kiểm tra result.applied trước
 * khi update UI.
 */
export function useApplyVoucherMutation() {
  return useMutation({
    mutationFn: (input: {
      voucherCode: string;
      orderAmount: number;
      storeId?: number;
    }) => applyVoucherApi(input),
  });
}

/**
 * useSubmitOrderMutation – đặt đơn. Caller truyền idempotencyKey để
 * chống double-click (rule §7 + §8 mục 3).
 */
export function useSubmitOrderMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      payload,
      idempotencyKey,
    }: {
      payload: SubmitOrderRequest;
      idempotencyKey: string;
    }) => submitOrderApi(payload, idempotencyKey),
    onSuccess: () => {
      // Sau khi đặt đơn, cart & checkout snapshot stale → invalidate.
      qc.invalidateQueries({ queryKey: ["cart"] });
      qc.invalidateQueries({ queryKey: checkoutKeys.all });
    },
  });
}

// Re-export ApplyVoucherResponse for backwards compatibility
export type { ApplyVoucherResponse };
