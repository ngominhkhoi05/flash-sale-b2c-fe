export type VoucherDiscountType = "PERCENT" | "FIXED" | "SHIPPING" | "COIN";

export type VoucherScope = "ALL" | "MALL" | "NEW_USER";

export type VoucherStatus =
  | "ACTIVE"
  | "UPCOMING"
  | "OUT_OF_STOCK"
  | "EXPIRED"
  | "DISABLED";

export interface AdminVoucher {
  id: string;
  code: string;
  name: string;
  discountType: VoucherDiscountType;
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderAmount: number;
  usedCount: number;
  totalCount: number;
  limitPerCustomer: number;
  startDate: string; // ISO string
  endDate: string; // ISO string
  status: VoucherStatus;
  isActive: boolean;
  scope: VoucherScope;
  isPublic: boolean;
  createdAt: string;
}

export interface VoucherUsageHistoryItem {
  id: string;
  voucherId: string;
  voucherCode: string;
  customerName: string;
  customerEmail: string;
  customerAvatar: string;
  orderCode: string;
  discountAmount: number;
  usedAt: string;
  status: "SUCCESS" | "REFUNDED";
}

export interface VoucherKpis {
  activeCount: number;
  newThisWeekCount: number;
  shippingVoucherCount: number;
  discountVoucherCount: number;
  usedCountThisMonth: number;
  utilizationRate: number; // e.g. 76.5
  totalPlatformSubsidized: number; // e.g. 412000000
  budgetCap: number; // e.g. 600000000
  budgetUtilizationRate: number; // e.g. 68.7
}

export interface VoucherFilterParams {
  search?: string;
  status?: string; // ALL, ACTIVE, UPCOMING, OUT_OF_STOCK, EXPIRED, DISABLED
  discountType?: string;
  scope?: string;
  page?: number;
  pageSize?: number;
}
