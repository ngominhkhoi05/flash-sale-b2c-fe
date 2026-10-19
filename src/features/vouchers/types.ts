/**
 * Vouchers (cá nhân) feature – types.
 * Voucher user đã lưu vào kho, có thể áp dụng ở checkout.
 */
import type { VoucherStatus } from "@/lib/constants";

export type VoucherType = "DISCOUNT" | "FREESHIP";
export type VoucherScope = "ORDER" | "SHIPPING";

export interface UserVoucher {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: VoucherType;
  scope: VoucherScope;
  /** Với DISCOUNT: số tiền giảm (VND) hoặc % (1-100). Với FREESHIP: max discount. */
  discountValue: number;
  /** Là % hay số tiền. */
  discountUnit: "PERCENT" | "FIXED_AMOUNT";
  minOrderAmount: number;
  maxDiscountAmount?: number;
  startTime: string; // ISO
  endTime: string; // ISO
  status: VoucherStatus;
  /** Số lần user này đã dùng voucher. */
  userUsageCount: number;
  /** Giới hạn mỗi user. */
  userUsageLimit: number;
  /** ID cửa hàng sở hữu voucher (null nếu là voucher toàn sàn). */
  storeId?: number | null;
}
