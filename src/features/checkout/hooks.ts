/**
 * Checkout hooks – TanStack Query wrappers (rule api-data + testing-required).
 * Query keys: ["checkout", ...]
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  applyVoucher as applyVoucherApi,
  getAddresses as getAddressesApi,
  getAvailableVouchers as getAvailableVouchersApi,
  getCheckout as getCheckoutApi,
  removeVoucher as removeVoucherApi,
  selectAddress as selectAddressApi,
  setPaymentMethod as setPaymentMethodApi,
  submitOrder as submitOrderApi,
  updateBuyerNote as updateBuyerNoteApi,
} from "./api";
import type {
  Address,
  ApplyVoucherResponse,
  CheckoutData,
  CheckoutShopGroup,
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
 * useSelectAddressMutation – đổi địa chỉ giao hàng.
 * Trả về CheckoutData mới (totals có thể đổi vì phí ship).
 */
export function useSelectAddressMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (addressId: number) => selectAddressApi(addressId),
    onSuccess: (data) => {
      qc.setQueryData(checkoutKeys.detail(), data);
    },
  });
}

/**
 * useApplyVoucherMutation – áp dụng voucher (shop hoặc sàn).
 * Caller kiểm tra result.applied trước khi update UI.
 */
export function useApplyVoucherMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      voucherId: number;
      scope: "SHOP" | "PLATFORM";
      storeId?: number;
    }) => applyVoucherApi(input),
    onSuccess: (data: ApplyVoucherResponse) => {
      // API contract: nếu áp thành công, BE trả về CheckoutData mới trong details.
      // Tạm thời invalidate để refresh.
      if (data.applied) {
        qc.invalidateQueries({ queryKey: checkoutKeys.detail() });
      }
    },
  });
}

/** useRemoveVoucherMutation – gỡ voucher. */
export function useRemoveVoucherMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      scope: "SHOP" | "PLATFORM";
      storeId?: number;
    }) => removeVoucherApi(input),
    onSuccess: (data) => {
      qc.setQueryData(checkoutKeys.detail(), data);
    },
  });
}

/** usePaymentMethodMutation – đổi ZaloPay ↔ COD. */
export function usePaymentMethodMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (paymentMethod: "ZALOPAY" | "COD") =>
      setPaymentMethodApi(paymentMethod),
    onSuccess: (data) => {
      qc.setQueryData(checkoutKeys.detail(), data);
    },
  });
}

/** useBuyerNoteMutation – cập nhật lời nhắn cho shop. */
export function useBuyerNoteMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { storeId: number; note: string }) =>
      updateBuyerNoteApi(input),
    onSuccess: (group: CheckoutShopGroup) => {
      // Patch cache: thay nhóm tương ứng.
      qc.setQueryData(checkoutKeys.detail(), (prev: unknown) => {
        const data = prev as CheckoutData | undefined;
        if (!data) return prev;
        return {
          ...data,
          shopGroups: data.shopGroups.map((g) =>
            g.storeId === group.storeId ? { ...g, buyerNote: group.buyerNote } : g,
          ),
        };
      });
    },
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
