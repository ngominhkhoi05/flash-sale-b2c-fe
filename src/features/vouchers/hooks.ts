/**
 * Vouchers hooks – TanStack Query wrappers.
 * Query keys: ["vouchers", "mine"] – refetch khi invalidate.
 */
import { useQuery } from "@tanstack/react-query";
import { getMyVouchers } from "./api";
import type { UserVoucher } from "./types";

/** Key cho voucher cá nhân (user đã lưu). */
export const voucherKeys = {
  all: ["vouchers"] as const,
  mine: () => [...voucherKeys.all, "mine"] as const,
};

/**
 * useMyVouchers – voucher user đã lưu vào kho.
 */
export function useMyVouchers(enabled = true) {
  return useQuery<UserVoucher[]>({
    queryKey: voucherKeys.mine(),
    queryFn: () => getMyVouchers(),
    enabled,
    staleTime: 60_000,
  });
}
