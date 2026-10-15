export type SettlementPaymentMethod = "ZALOPAY" | "COD";

export type SettlementStatus = "SETTLED" | "PENDING_DELIVERY";

export type RefundStatus =
  | "REFUNDED_WALLET"
  | "REFUNDED_ATM"
  | "PROCESSING_BANK";

export interface ReconciliationOrder {
  id: string;
  orderCode: string;
  settlementDate: string;
  storeId: string;
  storeName: string;
  storeInitials: string;
  paymentMethod: SettlementPaymentMethod;
  totalAmount: number;
  commissionRate: number; // e.g. 4 or 5
  isCustomRate: boolean;
  platformFee: number;
  shopEarnings: number;
  status: SettlementStatus;
}

export interface ReconciliationRefund {
  id: string;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  refundAmount: number;
  reason: string;
  transactionCode: string;
  refundedAt: string;
  status: RefundStatus;
}

export interface ReconciliationKpis {
  totalGmv: number; // e.g. 32600000000
  gmvGrowthPercent: number; // 14.2
  platformCommission: number; // 1630000000
  commissionPercent: number; // 5.0
  shopWalletSettled: number; // 30970000000
  shopWalletSettledPercent: number; // 98.4
  refundAmount: number; // 84200000
  refundRatePercent: number; // 0.25
  ordersCount: number; // 24180
  refundsCount: number; // 142
  walletTransCount: number; // 318
}

export interface ReconciliationFilterParams {
  period?: string; // e.g. "2026-09"
  storeId?: string;
  storeName?: string;
  paymentMethod?: string;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}
