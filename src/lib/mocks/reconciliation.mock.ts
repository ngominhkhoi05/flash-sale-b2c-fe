import {
  ReconciliationKpis,
  ReconciliationOrder,
  ReconciliationRefund,
  ReconciliationFilterParams,
} from "@/types/reconciliation";

export const MOCK_RECONCILIATION_KPIS: ReconciliationKpis = {
  totalGmv: 32600000000,
  gmvGrowthPercent: 14.2,
  platformCommission: 1630000000,
  commissionPercent: 5.0,
  shopWalletSettled: 30970000000,
  shopWalletSettledPercent: 98.4,
  refundAmount: 84200000,
  refundRatePercent: 0.25,
  ordersCount: 24180,
  refundsCount: 142,
  walletTransCount: 318,
};

const MOCK_RECONCILIATION_ORDERS: ReconciliationOrder[] = [
  {
    id: "rec-01",
    orderCode: "FS-261001-A7K2",
    settlementDate: "28/09/2026",
    storeId: "store-01",
    storeName: "Coolmate Official",
    storeInitials: "CM",
    paymentMethod: "ZALOPAY",
    totalAmount: 447000,
    commissionRate: 4,
    isCustomRate: true,
    platformFee: 17880,
    shopEarnings: 429120,
    status: "SETTLED",
  },
  {
    id: "rec-02",
    orderCode: "FS-261002-B8M3",
    settlementDate: "28/09/2026",
    storeId: "store-02",
    storeName: "TechSound Global",
    storeInitials: "TS",
    paymentMethod: "COD",
    totalAmount: 890000,
    commissionRate: 5,
    isCustomRate: false,
    platformFee: 44500,
    shopEarnings: 845500,
    status: "SETTLED",
  },
  {
    id: "rec-03",
    orderCode: "FS-261003-C9N4",
    settlementDate: "29/09/2026",
    storeId: "store-03",
    storeName: "OralCare VN",
    storeInitials: "OC",
    paymentMethod: "ZALOPAY",
    totalAmount: 199000,
    commissionRate: 5,
    isCustomRate: false,
    platformFee: 9950,
    shopEarnings: 189050,
    status: "PENDING_DELIVERY",
  },
  {
    id: "rec-04",
    orderCode: "FS-261004-D1P5",
    settlementDate: "29/09/2026",
    storeId: "store-04",
    storeName: "Sunhouse Mall",
    storeInitials: "SH",
    paymentMethod: "ZALOPAY",
    totalAmount: 1250000,
    commissionRate: 5,
    isCustomRate: false,
    platformFee: 62500,
    shopEarnings: 1187500,
    status: "SETTLED",
  },
  {
    id: "rec-05",
    orderCode: "FS-261005-E2Q6",
    settlementDate: "30/09/2026",
    storeId: "store-05",
    storeName: "GUMAC Fashion",
    storeInitials: "GM",
    paymentMethod: "COD",
    totalAmount: 690000,
    commissionRate: 5,
    isCustomRate: false,
    platformFee: 34500,
    shopEarnings: 655500,
    status: "PENDING_DELIVERY",
  },
  {
    id: "rec-06",
    orderCode: "FS-261006-F3R7",
    settlementDate: "30/09/2026",
    storeId: "store-01",
    storeName: "Coolmate Official",
    storeInitials: "CM",
    paymentMethod: "ZALOPAY",
    totalAmount: 520000,
    commissionRate: 4,
    isCustomRate: true,
    platformFee: 20800,
    shopEarnings: 499200,
    status: "SETTLED",
  },
  {
    id: "rec-07",
    orderCode: "FS-261007-G4S8",
    settlementDate: "30/09/2026",
    storeId: "store-06",
    storeName: "Ananas Official",
    storeInitials: "AN",
    paymentMethod: "COD",
    totalAmount: 650000,
    commissionRate: 5,
    isCustomRate: false,
    platformFee: 32500,
    shopEarnings: 617500,
    status: "SETTLED",
  },
  {
    id: "rec-08",
    orderCode: "FS-261008-H5T9",
    settlementDate: "01/10/2026",
    storeId: "store-02",
    storeName: "TechSound Global",
    storeInitials: "TS",
    paymentMethod: "ZALOPAY",
    totalAmount: 1450000,
    commissionRate: 5,
    isCustomRate: false,
    platformFee: 72500,
    shopEarnings: 1377500,
    status: "SETTLED",
  },
  {
    id: "rec-09",
    orderCode: "FS-261009-J6U1",
    settlementDate: "01/10/2026",
    storeId: "store-07",
    storeName: "Lock&Lock Mall",
    storeInitials: "LL",
    paymentMethod: "ZALOPAY",
    totalAmount: 780000,
    commissionRate: 5,
    isCustomRate: false,
    platformFee: 39000,
    shopEarnings: 741000,
    status: "PENDING_DELIVERY",
  },
  {
    id: "rec-10",
    orderCode: "FS-261010-K7V2",
    settlementDate: "01/10/2026",
    storeId: "store-03",
    storeName: "OralCare VN",
    storeInitials: "OC",
    paymentMethod: "COD",
    totalAmount: 310000,
    commissionRate: 5,
    isCustomRate: false,
    platformFee: 15500,
    shopEarnings: 294500,
    status: "SETTLED",
  },
  {
    id: "rec-11",
    orderCode: "FS-261011-L8W3",
    settlementDate: "02/10/2026",
    storeId: "store-01",
    storeName: "Coolmate Official",
    storeInitials: "CM",
    paymentMethod: "ZALOPAY",
    totalAmount: 980000,
    commissionRate: 4,
    isCustomRate: true,
    platformFee: 39200,
    shopEarnings: 940800,
    status: "SETTLED",
  },
  {
    id: "rec-12",
    orderCode: "FS-261012-M9X4",
    settlementDate: "02/10/2026",
    storeId: "store-05",
    storeName: "GUMAC Fashion",
    storeInitials: "GM",
    paymentMethod: "ZALOPAY",
    totalAmount: 430000,
    commissionRate: 5,
    isCustomRate: false,
    platformFee: 21500,
    shopEarnings: 408500,
    status: "SETTLED",
  },
];

const MOCK_RECONCILIATION_REFUNDS: ReconciliationRefund[] = [
  {
    id: "ref-01",
    orderCode: "FS-260912-X901",
    customerName: "Nguyễn Thu Thảo",
    customerPhone: "0912***458",
    refundAmount: 540000,
    reason: "Shop hủy – hết hàng kho",
    transactionCode: "ZP-260928-8921804",
    refundedAt: "28/09/2026 14:22",
    status: "REFUNDED_WALLET",
  },
  {
    id: "ref-02",
    orderCode: "FS-260915-K412",
    customerName: "Lê Hoàng Nam",
    customerPhone: "0988***112",
    refundAmount: 1120000,
    reason: "Giao trễ hạn khách hủy",
    transactionCode: "ZP-260929-3301982",
    refundedAt: "29/09/2026 09:10",
    status: "REFUNDED_ATM",
  },
  {
    id: "ref-03",
    orderCode: "FS-260920-P882",
    customerName: "Đỗ Minh Quân",
    customerPhone: "0903***771",
    refundAmount: 350000,
    reason: "Sản phẩm lỗi khi nhận",
    transactionCode: "ZP-260930-9941014",
    refundedAt: "30/09/2026 16:45",
    status: "PROCESSING_BANK",
  },
  {
    id: "ref-04",
    orderCode: "FS-260922-Q719",
    customerName: "Vũ Khánh Linh",
    customerPhone: "0971***992",
    refundAmount: 890000,
    reason: "Sai kích thước đã đặt",
    transactionCode: "ZP-261001-4421098",
    refundedAt: "01/10/2026 11:30",
    status: "REFUNDED_WALLET",
  },
  {
    id: "ref-05",
    orderCode: "FS-260925-R554",
    customerName: "Bùi Tuấn Anh",
    customerPhone: "0934***331",
    refundAmount: 220000,
    reason: "Hàng vỡ trong quá trình vận chuyển",
    transactionCode: "ZP-261002-1188432",
    refundedAt: "02/10/2026 15:12",
    status: "REFUNDED_ATM",
  },
];

export const reconciliationMockService = {
  getKpis: (): ReconciliationKpis => {
    return { ...MOCK_RECONCILIATION_KPIS };
  },

  getOrders: (filter?: ReconciliationFilterParams) => {
    let list = [...MOCK_RECONCILIATION_ORDERS];

    if (filter?.storeId && filter.storeId !== "ALL") {
      list = list.filter((o) => o.storeId === filter.storeId);
    }

    if (filter?.storeName && filter.storeName !== "ALL") {
      list = list.filter((o) =>
        o.storeName.toLowerCase().includes(filter.storeName!.toLowerCase())
      );
    }

    if (filter?.paymentMethod && filter.paymentMethod !== "ALL") {
      list = list.filter((o) => o.paymentMethod === filter.paymentMethod);
    }

    if (filter?.status && filter.status !== "ALL") {
      list = list.filter((o) => o.status === filter.status);
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase().trim();
      list = list.filter(
        (o) =>
          o.orderCode.toLowerCase().includes(q) ||
          o.storeName.toLowerCase().includes(q)
      );
    }

    const total = list.length;
    const page = filter?.page ?? 0;
    const pageSize = filter?.pageSize ?? 10;
    const items = list.slice(page * pageSize, (page + 1) * pageSize);

    // Calculate dynamic totals for the current slice/view
    const totalAmountSum = items.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const platformFeeSum = items.reduce((acc, curr) => acc + curr.platformFee, 0);
    const shopEarningsSum = items.reduce((acc, curr) => acc + curr.shopEarnings, 0);
    const averageCommission =
      totalAmountSum > 0 ? (platformFeeSum / totalAmountSum) * 100 : 5.0;

    return {
      items,
      total,
      page,
      pageSize,
      totals: {
        totalAmountSum,
        platformFeeSum,
        shopEarningsSum,
        averageCommission: Number(averageCommission.toFixed(2)),
      },
    };
  },

  getRefunds: (filter?: { search?: string }) => {
    let list = [...MOCK_RECONCILIATION_REFUNDS];
    if (filter?.search) {
      const q = filter.search.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.orderCode.toLowerCase().includes(q) ||
          r.customerName.toLowerCase().includes(q) ||
          r.transactionCode.toLowerCase().includes(q)
      );
    }
    return list;
  },

  exportCsv: (orders: ReconciliationOrder[]): string => {
    const headers = [
      "Mã đơn hàng",
      "Ngày chốt",
      "Gian hàng",
      "Phương thức thanh toán",
      "Tổng tiền (VNĐ)",
      "Tỉ lệ hoa hồng (%)",
      "Phí sàn thu (VNĐ)",
      "Shop thực nhận (VNĐ)",
      "Trạng thái đối soát",
    ];

    const rows = orders.map((o) => [
      o.orderCode,
      o.settlementDate,
      `"${o.storeName}"`,
      o.paymentMethod === "ZALOPAY" ? "ZaloPay QR" : "COD Tiền mặt",
      o.totalAmount,
      `${o.commissionRate}%`,
      o.platformFee,
      o.shopEarnings,
      o.status === "SETTLED" ? "Đã ghi sổ ví" : "Chờ giao hàng",
    ]);

    // UTF-8 BOM \uFEFF to prevent Excel font issues in Vietnamese
    const csvContent =
      "\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

    return csvContent;
  },
};
