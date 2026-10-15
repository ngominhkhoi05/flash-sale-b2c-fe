import { AdminVoucher, VoucherKpis, VoucherUsageHistoryItem } from "@/types/voucher";

// Initial KPI data based on Stitch screen 38
export const MOCK_VOUCHER_KPIS: VoucherKpis = {
  activeCount: 12,
  newThisWeekCount: 2,
  shippingVoucherCount: 4,
  discountVoucherCount: 8,
  usedCountThisMonth: 18420,
  utilizationRate: 76.5,
  totalPlatformSubsidized: 412000000,
  budgetCap: 600000000,
  budgetUtilizationRate: 68.7,
};

// Initial vouchers list (Total 28: 12 Active, 4 Upcoming, 6 Out of Stock, 4 Expired, 2 Disabled)
let MOCK_VOUCHERS: AdminVoucher[] = [
  // 12 ACTIVE VOUCHERS
  {
    id: "v-01",
    code: "VIBEMART50",
    name: "Đại hội Sale Giữa Tháng",
    discountType: "PERCENT",
    discountValue: 15,
    maxDiscountAmount: 50000,
    minOrderAmount: 250000,
    usedCount: 1840,
    totalCount: 2000,
    limitPerCustomer: 1,
    startDate: "2026-10-01T00:00:00Z",
    endDate: "2026-10-25T23:59:59Z",
    status: "ACTIVE",
    isActive: true,
    scope: "ALL",
    isPublic: true,
    createdAt: "2026-09-30T10:00:00Z",
  },
  {
    id: "v-02",
    code: "FREESHIPMAX",
    name: "Miễn phí vận chuyển toàn quốc",
    discountType: "SHIPPING",
    discountValue: 25000,
    maxDiscountAmount: 25000,
    minOrderAmount: 99000,
    usedCount: 8520,
    totalCount: 10000,
    limitPerCustomer: 2,
    startDate: "2026-10-01T00:00:00Z",
    endDate: "2026-10-31T23:59:59Z",
    status: "ACTIVE",
    isActive: true,
    scope: "ALL",
    isPublic: true,
    createdAt: "2026-09-28T08:00:00Z",
  },
  {
    id: "v-03",
    code: "CHAOBANMOI",
    name: "Quà chào mừng thành viên mới",
    discountType: "FIXED",
    discountValue: 30000,
    minOrderAmount: 0,
    usedCount: 3120,
    totalCount: 5000,
    limitPerCustomer: 1,
    startDate: "2026-09-01T00:00:00Z",
    endDate: "2026-12-31T23:59:59Z",
    status: "ACTIVE",
    isActive: true,
    scope: "NEW_USER",
    isPublic: true,
    createdAt: "2026-08-30T09:00:00Z",
  },
  {
    id: "v-04",
    code: "MALLSUPER10",
    name: "Siêu ưu đãi gian hàng chính hãng Vibe Mall",
    discountType: "PERCENT",
    discountValue: 10,
    maxDiscountAmount: 100000,
    minOrderAmount: 500000,
    usedCount: 1200,
    totalCount: 2000,
    limitPerCustomer: 2,
    startDate: "2026-10-05T00:00:00Z",
    endDate: "2026-10-28T23:59:59Z",
    status: "ACTIVE",
    isActive: true,
    scope: "MALL",
    isPublic: true,
    createdAt: "2026-10-04T11:00:00Z",
  },
  {
    id: "v-05",
    code: "TECHFEST15",
    name: "Tuần lễ công nghệ Vibe Tech",
    discountType: "PERCENT",
    discountValue: 15,
    maxDiscountAmount: 150000,
    minOrderAmount: 800000,
    usedCount: 840,
    totalCount: 1500,
    limitPerCustomer: 1,
    startDate: "2026-10-08T00:00:00Z",
    endDate: "2026-10-22T23:59:59Z",
    status: "ACTIVE",
    isActive: true,
    scope: "ALL",
    isPublic: true,
    createdAt: "2026-10-07T14:00:00Z",
  },
  {
    id: "v-06",
    code: "FASHION20",
    name: "Thu Đông Rực Rỡ cùng thời trang Vibe",
    discountType: "PERCENT",
    discountValue: 20,
    maxDiscountAmount: 70000,
    minOrderAmount: 350000,
    usedCount: 650,
    totalCount: 1200,
    limitPerCustomer: 1,
    startDate: "2026-10-10T00:00:00Z",
    endDate: "2026-10-25T23:59:59Z",
    status: "ACTIVE",
    isActive: true,
    scope: "ALL",
    isPublic: true,
    createdAt: "2026-10-09T16:00:00Z",
  },
  {
    id: "v-07",
    code: "BEAUTY50K",
    name: "Sắc đẹp toàn diện - Giảm thẳng 50K",
    discountType: "FIXED",
    discountValue: 50000,
    minOrderAmount: 300000,
    usedCount: 780,
    totalCount: 1000,
    limitPerCustomer: 1,
    startDate: "2026-10-11T00:00:00Z",
    endDate: "2026-10-26T23:59:59Z",
    status: "ACTIVE",
    isActive: true,
    scope: "ALL",
    isPublic: true,
    createdAt: "2026-10-10T10:00:00Z",
  },
  {
    id: "v-08",
    code: "SHIPXTRAMART",
    name: "Trợ giá ship đơn siêu thị tươi sống",
    discountType: "SHIPPING",
    discountValue: 15000,
    maxDiscountAmount: 15000,
    minOrderAmount: 150000,
    usedCount: 420,
    totalCount: 800,
    limitPerCustomer: 3,
    startDate: "2026-10-12T00:00:00Z",
    endDate: "2026-10-31T23:59:59Z",
    status: "ACTIVE",
    isActive: true,
    scope: "ALL",
    isPublic: true,
    createdAt: "2026-10-11T08:00:00Z",
  },
  {
    id: "v-09",
    code: "WEEKENDPARTY",
    name: "Cuối tuần mua sắm thả ga",
    discountType: "PERCENT",
    discountValue: 12,
    maxDiscountAmount: 40000,
    minOrderAmount: 200000,
    usedCount: 310,
    totalCount: 600,
    limitPerCustomer: 1,
    startDate: "2026-10-13T00:00:00Z",
    endDate: "2026-10-20T23:59:59Z",
    status: "ACTIVE",
    isActive: true,
    scope: "ALL",
    isPublic: true,
    createdAt: "2026-10-12T15:00:00Z",
  },
  {
    id: "v-10",
    code: "HOMECOMFORT",
    name: "Nhà cửa & Đời sống ấm cúng",
    discountType: "FIXED",
    discountValue: 40000,
    minOrderAmount: 350000,
    usedCount: 220,
    totalCount: 500,
    limitPerCustomer: 1,
    startDate: "2026-10-14T00:00:00Z",
    endDate: "2026-10-27T23:59:59Z",
    status: "ACTIVE",
    isActive: true,
    scope: "ALL",
    isPublic: true,
    createdAt: "2026-10-13T10:00:00Z",
  },
  {
    id: "v-11",
    code: "VIBEPAY25",
    name: "Thanh toán ZaloPay nhận ưu đãi",
    discountType: "PERCENT",
    discountValue: 8,
    maxDiscountAmount: 25000,
    minOrderAmount: 180000,
    usedCount: 190,
    totalCount: 400,
    limitPerCustomer: 2,
    startDate: "2026-10-14T00:00:00Z",
    endDate: "2026-10-28T23:59:59Z",
    status: "ACTIVE",
    isActive: true,
    scope: "ALL",
    isPublic: true,
    createdAt: "2026-10-13T16:00:00Z",
  },
  {
    id: "v-12",
    code: "VIPMEMBER",
    name: "Đặc quyền thành viên Vibe Gold",
    discountType: "FIXED",
    discountValue: 80000,
    minOrderAmount: 600000,
    usedCount: 140,
    totalCount: 300,
    limitPerCustomer: 1,
    startDate: "2026-10-15T00:00:00Z",
    endDate: "2026-10-31T23:59:59Z",
    status: "ACTIVE",
    isActive: true,
    scope: "MALL",
    isPublic: false,
    createdAt: "2026-10-14T11:00:00Z",
  },

  // 4 UPCOMING VOUCHERS
  {
    id: "v-13",
    code: "HOANXU20",
    name: "Siêu hoàn xu Vibe Mall",
    discountType: "COIN",
    discountValue: 20,
    maxDiscountAmount: 40000,
    minOrderAmount: 150000,
    usedCount: 0,
    totalCount: 1000,
    limitPerCustomer: 1,
    startDate: "2026-10-20T00:00:00Z",
    endDate: "2026-10-30T23:59:59Z",
    status: "UPCOMING",
    isActive: true,
    scope: "MALL",
    isPublic: true,
    createdAt: "2026-10-14T08:00:00Z",
  },
  {
    id: "v-14",
    code: "PAYDAY25",
    name: "Lương về sắm thả ga 25.10",
    discountType: "PERCENT",
    discountValue: 15,
    maxDiscountAmount: 80000,
    minOrderAmount: 400000,
    usedCount: 0,
    totalCount: 1500,
    limitPerCustomer: 1,
    startDate: "2026-10-25T00:00:00Z",
    endDate: "2026-10-27T23:59:59Z",
    status: "UPCOMING",
    isActive: true,
    scope: "ALL",
    isPublic: true,
    createdAt: "2026-10-14T14:00:00Z",
  },
  {
    id: "v-15",
    code: "HALLOWEEN31",
    name: "Lễ hội hóa trang Halloween vui nhộn",
    discountType: "FIXED",
    discountValue: 31000,
    minOrderAmount: 200000,
    usedCount: 0,
    totalCount: 800,
    limitPerCustomer: 1,
    startDate: "2026-10-28T00:00:00Z",
    endDate: "2026-10-31T23:59:59Z",
    status: "UPCOMING",
    isActive: true,
    scope: "ALL",
    isPublic: true,
    createdAt: "2026-10-14T15:00:00Z",
  },
  {
    id: "v-16",
    code: "FREESHIP1111",
    name: "Khởi động Siêu đại tiệc 11.11",
    discountType: "SHIPPING",
    discountValue: 30000,
    maxDiscountAmount: 30000,
    minOrderAmount: 0,
    usedCount: 0,
    totalCount: 3000,
    limitPerCustomer: 2,
    startDate: "2026-11-01T00:00:00Z",
    endDate: "2026-11-12T23:59:59Z",
    status: "UPCOMING",
    isActive: true,
    scope: "ALL",
    isPublic: true,
    createdAt: "2026-10-14T16:00:00Z",
  },

  // 6 OUT OF STOCK VOUCHERS
  {
    id: "v-17",
    code: "FLASHSALE100",
    name: "Độc quyền khung 12h-14h",
    discountType: "FIXED",
    discountValue: 100000,
    minOrderAmount: 600000,
    usedCount: 500,
    totalCount: 500,
    limitPerCustomer: 1,
    startDate: "2026-10-05T12:00:00Z",
    endDate: "2026-10-20T14:00:00Z",
    status: "OUT_OF_STOCK",
    isActive: true,
    scope: "ALL",
    isPublic: true,
    createdAt: "2026-10-04T09:00:00Z",
  },
  {
    id: "v-18",
    code: "EARLYBIRD50",
    name: "Giờ vàng săn sale 0h",
    discountType: "PERCENT",
    discountValue: 50,
    maxDiscountAmount: 50000,
    minOrderAmount: 100000,
    usedCount: 300,
    totalCount: 300,
    limitPerCustomer: 1,
    startDate: "2026-10-10T00:00:00Z",
    endDate: "2026-10-20T02:00:00Z",
    status: "OUT_OF_STOCK",
    isActive: true,
    scope: "ALL",
    isPublic: true,
    createdAt: "2026-10-09T18:00:00Z",
  },
  {
    id: "v-19",
    code: "HOTMALL70",
    name: "Bùng nổ phụ kiện chính hãng",
    discountType: "FIXED",
    discountValue: 70000,
    minOrderAmount: 400000,
    usedCount: 400,
    totalCount: 400,
    limitPerCustomer: 1,
    startDate: "2026-10-10T00:00:00Z",
    endDate: "2026-10-25T23:59:59Z",
    status: "OUT_OF_STOCK",
    isActive: true,
    scope: "MALL",
    isPublic: true,
    createdAt: "2026-10-09T10:00:00Z",
  },
  {
    id: "v-20",
    code: "SHIP0DONG",
    name: "Freeship đơn 0 đồng toàn sàn",
    discountType: "SHIPPING",
    discountValue: 20000,
    maxDiscountAmount: 20000,
    minOrderAmount: 0,
    usedCount: 2000,
    totalCount: 2000,
    limitPerCustomer: 1,
    startDate: "2026-10-10T00:00:00Z",
    endDate: "2026-10-15T23:59:59Z",
    status: "OUT_OF_STOCK",
    isActive: true,
    scope: "ALL",
    isPublic: true,
    createdAt: "2026-10-08T11:00:00Z",
  },
  {
    id: "v-21",
    code: "SUPERCOIN50",
    name: "Hoàn xu 50% cho khách thân thiết",
    discountType: "COIN",
    discountValue: 50,
    maxDiscountAmount: 30000,
    minOrderAmount: 100000,
    usedCount: 600,
    totalCount: 600,
    limitPerCustomer: 1,
    startDate: "2026-10-06T00:00:00Z",
    endDate: "2026-10-20T23:59:59Z",
    status: "OUT_OF_STOCK",
    isActive: true,
    scope: "ALL",
    isPublic: false,
    createdAt: "2026-10-05T14:00:00Z",
  },
  {
    id: "v-22",
    code: "VIBEXU100",
    name: "Thưởng xu đặc biệt ngày hội sốc",
    discountType: "COIN",
    discountValue: 100,
    maxDiscountAmount: 20000,
    minOrderAmount: 50000,
    usedCount: 1000,
    totalCount: 1000,
    limitPerCustomer: 1,
    startDate: "2026-10-07T00:00:00Z",
    endDate: "2026-10-22T23:59:59Z",
    status: "OUT_OF_STOCK",
    isActive: true,
    scope: "ALL",
    isPublic: true,
    createdAt: "2026-10-06T09:00:00Z",
  },

  // 4 EXPIRED VOUCHERS
  {
    id: "v-23",
    code: "BACK2SCHOOL",
    name: "Mùa tựu trường rộn ràng niềm vui",
    discountType: "PERCENT",
    discountValue: 10,
    maxDiscountAmount: 40000,
    minOrderAmount: 200000,
    usedCount: 1820,
    totalCount: 2000,
    limitPerCustomer: 1,
    startDate: "2026-09-01T00:00:00Z",
    endDate: "2026-09-30T23:59:59Z",
    status: "EXPIRED",
    isActive: false,
    scope: "ALL",
    isPublic: true,
    createdAt: "2026-08-25T10:00:00Z",
  },
  {
    id: "v-24",
    code: "MIDAUTUMN26",
    name: "Trung thu ấm áp trao gửi yêu thương",
    discountType: "FIXED",
    discountValue: 60000,
    minOrderAmount: 400000,
    usedCount: 1450,
    totalCount: 1500,
    limitPerCustomer: 1,
    startDate: "2026-09-15T00:00:00Z",
    endDate: "2026-10-01T23:59:59Z",
    status: "EXPIRED",
    isActive: false,
    scope: "ALL",
    isPublic: true,
    createdAt: "2026-09-10T12:00:00Z",
  },
  {
    id: "v-25",
    code: "DOUBLE09",
    name: "Đại tiệc siêu sale kép 9.9",
    discountType: "PERCENT",
    discountValue: 20,
    maxDiscountAmount: 90000,
    minOrderAmount: 300000,
    usedCount: 2900,
    totalCount: 3000,
    limitPerCustomer: 1,
    startDate: "2026-09-09T00:00:00Z",
    endDate: "2026-09-12T23:59:59Z",
    status: "EXPIRED",
    isActive: false,
    scope: "ALL",
    isPublic: true,
    createdAt: "2026-09-05T08:00:00Z",
  },
  {
    id: "v-26",
    code: "SHIPSEP",
    name: "Freeship tháng 9 kết nối mọi miền",
    discountType: "SHIPPING",
    discountValue: 25000,
    maxDiscountAmount: 25000,
    minOrderAmount: 150000,
    usedCount: 4800,
    totalCount: 5000,
    limitPerCustomer: 2,
    startDate: "2026-09-01T00:00:00Z",
    endDate: "2026-09-30T23:59:59Z",
    status: "EXPIRED",
    isActive: false,
    scope: "ALL",
    isPublic: true,
    createdAt: "2026-08-28T09:00:00Z",
  },

  // 2 DISABLED VOUCHERS
  {
    id: "v-27",
    code: "SECRETDISCOUNT",
    name: "Chương trình thử nghiệm nội bộ sàn",
    discountType: "PERCENT",
    discountValue: 30,
    maxDiscountAmount: 100000,
    minOrderAmount: 200000,
    usedCount: 15,
    totalCount: 100,
    limitPerCustomer: 1,
    startDate: "2026-10-01T00:00:00Z",
    endDate: "2026-10-31T23:59:59Z",
    status: "DISABLED",
    isActive: false,
    scope: "ALL",
    isPublic: false,
    createdAt: "2026-09-29T14:00:00Z",
  },
  {
    id: "v-28",
    code: "TESTPARTNER",
    name: "Thử nghiệm cổng đối tác liên kết",
    discountType: "FIXED",
    discountValue: 20000,
    minOrderAmount: 100000,
    usedCount: 8,
    totalCount: 50,
    limitPerCustomer: 1,
    startDate: "2026-10-05T00:00:00Z",
    endDate: "2026-10-25T23:59:59Z",
    status: "DISABLED",
    isActive: false,
    scope: "ALL",
    isPublic: false,
    createdAt: "2026-10-04T16:00:00Z",
  },
];

// Initial usage history based on Stitch screen 38
const MOCK_VOUCHER_USAGE_HISTORY: VoucherUsageHistoryItem[] = [
  {
    id: "vh-01",
    voucherId: "v-01",
    voucherCode: "VIBEMART50",
    customerName: "Lê Thị Mai Hương",
    customerEmail: "maihuong.le@gmail.com",
    customerAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCUKu2mEGcQjvcD3hwFeSialUcqeYug264qtmn9BLwetWEszF07m8XVsMpa4gS40_CC-xzY6RP8bWbDxSKTGdxtkmK73pi-b5brjQxYgEiNBq1QAsmZ0bIlJpEQV7Gi0bBINkT47BedXNvmKQlt4Vyc6ycEau7d4kfIZ4PDRBfkpiBQYC7saErgTHCMlDJA1sWFk7SvlvBUxZffoeMM8JxOu2v0R_JQ59hzs0-48ZO0RKXtoKpr9jXXSQ",
    orderCode: "FS-20261005-9921",
    discountAmount: 37500,
    usedAt: "14:28:12 · Hôm nay",
    status: "SUCCESS",
  },
  {
    id: "vh-02",
    voucherId: "v-02",
    voucherCode: "FREESHIPMAX",
    customerName: "Nguyễn Quốc Thái",
    customerEmail: "quocthai.dev@outlook.com",
    customerAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCh70AEq-1qEm04va2z_mqyLcGGCs6N3gGvCPhf2x97-ug3MQtTIz9d-VX9-Ac-WRvuW3-qr4ANeysLlK3PEuf5Rl-wR_1FHBJLyFNxPp4rWN5T0s0TcBp_8qYLsFf5qkNF38pBMR8U8dEIU2HJhuniEUU9sY8xBImLAXw0srRcgkV3oZB1ja--mUGDhxe01LwF6McVYSm133JAwA1koXaikFva32F8F5pgyh6UiDTJs95wFJ5DoHDHLw",
    orderCode: "FS-20261005-9918",
    discountAmount: 25000,
    usedAt: "14:22:45 · Hôm nay",
    status: "SUCCESS",
  },
  {
    id: "vh-03",
    voucherId: "v-17",
    voucherCode: "FLASHSALE100",
    customerName: "Phạm Hoàng Yến",
    customerEmail: "hoangyen.pham@corp.vn",
    customerAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuC9aLKJhzHZ23p6zMGvmtY13CsB4Wc-GYhxYEPo5vpUxDf8388o-WQ_J9IKW_1wAhK-v3J62ceIVbc0s6f_u9di9vw9IacE7I2Th9urK7KGhODpdO1Nys1lCsb1QlOM3vq-NyfxMWxYttRIJF5LNP-6uaQ5OQL7v80n--h3KO_3kWsiEHD4Nd5siC5Ye4U-3I5GPbVS_uAURl2Ype5dO2vfYHshpdZMewCaUjBiNSnDyUA4SeWIchp5rg",
    orderCode: "FS-20261005-9890",
    discountAmount: 100000,
    usedAt: "13:50:03 · Hôm nay",
    status: "REFUNDED",
  },
  {
    id: "vh-04",
    voucherId: "v-03",
    voucherCode: "CHAOBANMOI",
    customerName: "Trần Minh Đăng",
    customerEmail: "dang.tran@fpt.com.vn",
    customerAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDK0gXbrsJHPE1l4J0FZ8M71kGSL8L_OHFGLNCRatickcS_crjibyNnwFNbvgINeJBnL6eMT1GLLrUtL_71bgti9vuRU6VhzIxcB6lVwjr1298mTmxI0-u5gVlY0urDs_K_RjyVgmbvBgKABkqgyq7HQdqpEignxAr3-T860UfH-DGo2Bd14jK6jTpxtDsU4ggD0rcf-rJaW-uOSON7VilbcwixF_LjGVOW10KI6YwQx-iJ2ZAOOHkQtw",
    orderCode: "FS-20261005-9872",
    discountAmount: 30000,
    usedAt: "12:15:30 · Hôm nay",
    status: "SUCCESS",
  },
  {
    id: "vh-05",
    voucherId: "v-01",
    voucherCode: "VIBEMART50",
    customerName: "Hoàng Thúy Vy",
    customerEmail: "thuyvy.hoang@gmail.com",
    customerAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCUKu2mEGcQjvcD3hwFeSialUcqeYug264qtmn9BLwetWEszF07m8XVsMpa4gS40_CC-xzY6RP8bWbDxSKTGdxtkmK73pi-b5brjQxYgEiNBq1QAsmZ0bIlJpEQV7Gi0bBINkT47BedXNvmKQlt4Vyc6ycEau7d4kfIZ4PDRBfkpiBQYC7saErgTHCMlDJA1sWFk7SvlvBUxZffoeMM8JxOu2v0R_JQ59hzs0-48ZO0RKXtoKpr9jXXSQ",
    orderCode: "FS-20261005-9855",
    discountAmount: 50000,
    usedAt: "11:04:18 · Hôm nay",
    status: "SUCCESS",
  },
];

export const voucherMockService = {
  getKpis: (): VoucherKpis => {
    return { ...MOCK_VOUCHER_KPIS };
  },

  getAll: (filter?: {
    search?: string;
    status?: string;
    discountType?: string;
    scope?: string;
    page?: number;
    pageSize?: number;
  }) => {
    let list = [...MOCK_VOUCHERS];

    if (filter?.status && filter.status !== "ALL") {
      list = list.filter((v) => v.status === filter.status);
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase().trim();
      list = list.filter(
        (v) =>
          v.code.toLowerCase().includes(q) || v.name.toLowerCase().includes(q)
      );
    }

    if (filter?.discountType) {
      list = list.filter((v) => v.discountType === filter.discountType);
    }

    if (filter?.scope) {
      list = list.filter((v) => v.scope === filter.scope);
    }

    const total = list.length;
    const page = filter?.page ?? 0;
    const pageSize = filter?.pageSize ?? 10;
    const items = list.slice(page * pageSize, (page + 1) * pageSize);

    // Tab counts
    const counts = {
      ALL: MOCK_VOUCHERS.length,
      ACTIVE: MOCK_VOUCHERS.filter((v) => v.status === "ACTIVE").length,
      UPCOMING: MOCK_VOUCHERS.filter((v) => v.status === "UPCOMING").length,
      OUT_OF_STOCK: MOCK_VOUCHERS.filter((v) => v.status === "OUT_OF_STOCK").length,
      EXPIRED: MOCK_VOUCHERS.filter((v) => v.status === "EXPIRED").length,
      DISABLED: MOCK_VOUCHERS.filter((v) => v.status === "DISABLED").length,
    };

    return {
      items,
      total,
      page,
      pageSize,
      counts,
    };
  },

  getById: (id: string): AdminVoucher | undefined => {
    return MOCK_VOUCHERS.find((v) => v.id === id);
  },

  toggleStatus: (id: string): AdminVoucher => {
    const idx = MOCK_VOUCHERS.findIndex((v) => v.id === id);
    if (idx === -1) throw new Error("Voucher không tồn tại");

    const item = MOCK_VOUCHERS[idx];
    const newActive = !item.isActive;
    let newStatus = item.status;

    if (!newActive) {
      newStatus = "DISABLED";
    } else {
      // Recompute status
      const now = new Date();
      const start = new Date(item.startDate);
      const end = new Date(item.endDate);

      if (now < start) newStatus = "UPCOMING";
      else if (now > end) newStatus = "EXPIRED";
      else if (item.usedCount >= item.totalCount) newStatus = "OUT_OF_STOCK";
      else newStatus = "ACTIVE";
    }

    MOCK_VOUCHERS[idx] = {
      ...item,
      isActive: newActive,
      status: newStatus,
    };

    return MOCK_VOUCHERS[idx];
  },

  create: (data: Omit<AdminVoucher, "id" | "usedCount" | "status" | "isActive" | "createdAt">): AdminVoucher => {
    // Check duplicate code
    const existing = MOCK_VOUCHERS.find(
      (v) => v.code.toUpperCase() === data.code.toUpperCase()
    );
    if (existing) {
      throw new Error(`Mã voucher "${data.code}" đã tồn tại trên hệ thống.`);
    }

    const now = new Date();
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    let status: AdminVoucher["status"] = "ACTIVE";
    if (now < start) status = "UPCOMING";
    else if (now > end) status = "EXPIRED";

    const newVoucher: AdminVoucher = {
      ...data,
      id: `v-${Date.now()}`,
      code: data.code.toUpperCase(),
      usedCount: 0,
      isActive: true,
      status,
      createdAt: now.toISOString(),
    };

    MOCK_VOUCHERS = [newVoucher, ...MOCK_VOUCHERS];
    return newVoucher;
  },

  update: (id: string, data: Partial<AdminVoucher>): AdminVoucher => {
    const idx = MOCK_VOUCHERS.findIndex((v) => v.id === id);
    if (idx === -1) throw new Error("Voucher không tồn tại");

    if (data.code) {
      const duplicate = MOCK_VOUCHERS.find(
        (v) => v.id !== id && v.code.toUpperCase() === data.code?.toUpperCase()
      );
      if (duplicate) {
        throw new Error(`Mã voucher "${data.code}" đã tồn tại.`);
      }
    }

    MOCK_VOUCHERS[idx] = {
      ...MOCK_VOUCHERS[idx],
      ...data,
      code: data.code ? data.code.toUpperCase() : MOCK_VOUCHERS[idx].code,
    };

    return MOCK_VOUCHERS[idx];
  },

  delete: (id: string): void => {
    const item = MOCK_VOUCHERS.find((v) => v.id === id);
    if (!item) throw new Error("Voucher không tồn tại");
    if (item.usedCount > 0) {
      throw new Error("Không thể xóa voucher đã có lượt sử dụng thực tế.");
    }
    MOCK_VOUCHERS = MOCK_VOUCHERS.filter((v) => v.id !== id);
  },

  getUsageHistory: (voucherId?: string): VoucherUsageHistoryItem[] => {
    if (!voucherId) return [...MOCK_VOUCHER_USAGE_HISTORY];
    return MOCK_VOUCHER_USAGE_HISTORY.filter((h) => h.voucherId === voucherId);
  },
};
