/**
 * Vouchers hooks – TanStack Query wrappers.
 * Query keys: ["vouchers", "mine"] – refetch khi invalidate.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyVouchers, saveVoucher } from "./api";
import type { UserVoucher } from "./types";
import { toast } from "sonner";

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

/**
 * useSaveVoucher – lưu mã voucher vào kho cá nhân.
 */
export function useSaveVoucher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => saveVoucher(code),
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: voucherKeys.mine() });
      toast.success(`Đã lưu voucher ${saved.code} vào kho thành công!`);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Mã voucher không hợp lệ hoặc đã hết lượt lưu.";
      toast.error(msg);
    },
  });
}
