/**
 * Vouchers API – voucher cá nhân (user đã lưu vào kho).
 * Tương lai: thêm `getPlatformVouchers()` cho voucher chưa lưu (xem handoff).
 */
import { apiFetch } from "@/lib/api";
import type { UserVoucher } from "./types";

/**
 * GET /api/v1/vouchers/mine – voucher user đã lưu.
 * 401 nếu chưa đăng nhập.
 */
export async function getMyVouchers(): Promise<UserVoucher[]> {
  return apiFetch<UserVoucher[]>("/vouchers/mine");
}

/**
 * POST /api/v1/vouchers/mine – lưu voucher mới vào kho.
 */
export async function saveVoucher(code: string): Promise<UserVoucher> {
  return apiFetch<UserVoucher>("/vouchers/mine", {
    method: "POST",
    json: { code },
  });
}
