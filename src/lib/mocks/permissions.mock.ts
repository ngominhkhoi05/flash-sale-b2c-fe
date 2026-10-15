import {
  SystemRole,
  InternalRoleGroup,
  AclPermission,
  FeatureFlag,
  ReportedReview,
} from "@/types/permissions";

export const MOCK_SYSTEM_ROLES: SystemRole[] = [
  {
    id: "role-admin",
    code: "ROLE_ADMIN",
    name: "Quản trị viên hệ thống",
    description:
      "Toàn quyền quản trị hệ thống sàn, đối soát tài chính, can thiệp quy trình vận hành và cấu hình tham số bảo mật.",
    userCount: 12,
    level: "Sàn Thương Mại",
    icon: "admin_panel_settings",
  },
  {
    id: "role-seller",
    code: "ROLE_SELLER",
    name: "Đối tác Người bán",
    description:
      "Quản lý gian hàng cá nhân, đăng bán sản phẩm, tham gia Flash Sale, thiết lập khuyến mãi shop và rút tiền từ ví doanh thu.",
    userCount: 8420,
    level: "Vendor Portal",
    icon: "storefront",
  },
  {
    id: "role-buyer",
    code: "ROLE_BUYER",
    name: "Khách hàng Người mua",
    description:
      "Tìm kiếm, xem catalogue, áp dụng voucher sàn/shop, thanh toán giỏ hàng, theo dõi đơn vận chuyển và đăng tải đánh giá sản phẩm.",
    userCount: 48215,
    level: "Storefront App/Web",
    icon: "shopping_bag",
  },
];

export const MOCK_ROLE_GROUPS: InternalRoleGroup[] = [
  {
    id: "group-finance",
    name: "Kế toán đối soát",
    code: "ROLE_FINANCE_ADMIN",
    description:
      "Kiểm tra phiên đối soát, tạo kỳ thanh toán, phê duyệt payout cho người bán và xuất báo cáo doanh thu thuế.",
    memberCount: 4,
    hasMfa: true,
    icon: "account_balance_wallet",
    permissions: [
      "order:view",
      "voucher:create_platform",
      "system:audit_log",
    ],
  },
  {
    id: "group-fs-operator",
    name: "Vận hành Flash Sale",
    code: "ROLE_FS_OPERATOR",
    description:
      "Thiết lập khung giờ Flash Sale, xét duyệt sản phẩm giá sốc, phân bổ slot hiển thị và giám sát phiên bán realtime.",
    memberCount: 6,
    hasMfa: true,
    icon: "bolt",
    permissions: [
      "product:view",
      "flashsale:view",
      "flashsale:create_slot",
      "flashsale:approve_sku",
      "flashsale:realtime_monitor",
      "order:view",
    ],
  },
  {
    id: "group-content-mod",
    name: "Kiểm duyệt nội dung",
    code: "ROLE_CONTENT_MODERATOR",
    description:
      "Kiểm tra hình ảnh sản phẩm vi phạm, duyệt đánh giá phản cảm, xử lý báo cáo từ người dùng và gắn nhãn khiếu nại.",
    memberCount: 5,
    hasMfa: false,
    icon: "rate_review",
    permissions: [
      "product:view",
      "product:moderate",
      "system:audit_log",
    ],
  },
  {
    id: "group-logistics",
    name: "Quản lý kho & vận chuyển",
    code: "ROLE_LOGISTICS_ADMIN",
    description:
      "Giám sát điều phối đơn vị vận chuyển (GHN, GHTK, Viettel Post), theo dõi tỷ lệ giao hàng thành công và xử lý hoàn hàng.",
    memberCount: 3,
    hasMfa: false,
    icon: "local_shipping",
    permissions: [
      "order:view",
      "product:view",
    ],
  },
];

export const MOCK_ACL_PERMISSIONS: AclPermission[] = [
  // Phân hệ PRODUCT
  {
    code: "product:view",
    name: "Xem danh sách sản phẩm toàn sàn",
    module: "PRODUCT",
    isReadOnly: true,
  },
  {
    code: "product:moderate",
    name: "Kiểm duyệt & Khóa sản phẩm vi phạm",
    module: "PRODUCT",
    isSensitive: true,
  },
  {
    code: "product:category_manage",
    name: "Quản lý cây danh mục & biểu phí hoa hồng",
    module: "PRODUCT",
    isSensitive: true,
  },

  // Phân hệ FLASH_SALE
  {
    code: "flashsale:view",
    name: "Xem khung giờ & danh sách đăng ký",
    module: "FLASH_SALE",
    isReadOnly: true,
  },
  {
    code: "flashsale:create_slot",
    name: "Tạo & Cấu hình khung giờ Flash Sale",
    module: "FLASH_SALE",
  },
  {
    code: "flashsale:approve_sku",
    name: "Duyệt SKU sản phẩm & định mức giá sốc",
    module: "FLASH_SALE",
    isSensitive: true,
  },
  {
    code: "flashsale:realtime_monitor",
    name: "Giám sát realtime & ngắt tồn kho khẩn cấp",
    module: "FLASH_SALE",
    isSensitive: true,
  },

  // Phân hệ ORDER & VOUCHER
  {
    code: "order:view",
    name: "Xem luồng đơn hàng & trạng thái vận chuyển",
    module: "ORDER_VOUCHER",
    isReadOnly: true,
  },
  {
    code: "voucher:apply",
    name: "Liên kết và kích hoạt mã giảm sàn",
    module: "ORDER_VOUCHER",
  },
  {
    code: "voucher:create_platform",
    name: "Tạo voucher toàn sàn ngân sách lớn",
    module: "ORDER_VOUCHER",
    isSensitive: true,
  },
  {
    code: "order:cancel_admin",
    name: "Hủy đơn hàng can thiệp quản trị",
    module: "ORDER_VOUCHER",
    isSensitive: true,
  },

  // Phân hệ SYSTEM
  {
    code: "system:audit_log",
    name: "Tra cứu nhật ký truy vết hệ thống",
    module: "SYSTEM",
    isReadOnly: true,
  },
  {
    code: "system:feature_toggle",
    name: "Bật / Tắt cờ tính năng (Feature Flags)",
    module: "SYSTEM",
    isSensitive: true,
  },
  {
    code: "system:user_manage",
    name: "Khóa / Mở khóa tài khoản người dùng",
    module: "SYSTEM",
    isSensitive: true,
  },
];

export const MOCK_FEATURE_FLAGS: FeatureFlag[] = [
  {
    code: "flashsale:checkout",
    name: "Chốt đơn Flash Sale 5 phút",
    description: "Cơ chế khóa tồn kho tốc độ cao trên Redis và hàng đợi thanh toán",
    module: "Flash Sale",
    groupCount: 3,
    isEnabled: true,
    lastModifiedBy: "Trần Quản Trị",
    lastModifiedAt: "Hôm nay, 08:30",
  },
  {
    code: "review:create",
    name: "Đăng đánh giá & bình luận sản phẩm",
    description: "Bao gồm tải hình ảnh và video feedback từ phía khách hàng",
    module: "Storefront",
    groupCount: 2,
    isEnabled: false,
    maintenanceMessage: "Đang bảo trì nâng cấp bộ lọc từ ngữ phản cảm",
    lastModifiedBy: "Hệ thống tự động",
    lastModifiedAt: "Hôm qua, 22:15",
  },
  {
    code: "zalopay:qr_payment",
    name: "Cổng thanh toán ZaloPay QR",
    description: "Tích hợp thanh toán quét mã tức thì qua ZaloPay Gateway",
    module: "Checkout",
    groupCount: 4,
    isEnabled: true,
    lastModifiedBy: "Nguyễn Kế Toán",
    lastModifiedAt: "01/10/2026",
  },
  {
    code: "voucher:collect",
    name: "Lưu voucher vào ví cá nhân",
    description: "Tích điểm và giữ chỗ mã ưu đãi sàn cho người dùng",
    module: "Marketing",
    groupCount: 3,
    isEnabled: true,
    lastModifiedBy: "Trần Quản Trị",
    lastModifiedAt: "28/09/2026",
  },
  {
    code: "store:registration",
    name: "Đăng ký mở gian hàng mới",
    description: "Cho phép người bán mới nộp hồ sơ và định danh KYC điện tử",
    module: "Store",
    groupCount: 2,
    isEnabled: true,
    lastModifiedBy: "Trần Quản Trị",
    lastModifiedAt: "15/09/2026",
  },
  {
    code: "system:maintenance_global",
    name: "Chế độ bảo trì hệ thống toàn sàn",
    description: "Khóa toàn bộ giao dịch mua sắm, hiển thị trang bảo trì định kỳ cho người mua",
    module: "System Core",
    groupCount: 1,
    isEnabled: false,
    maintenanceMessage: "Hệ thống đang bảo trì máy chủ định kỳ.",
    lastModifiedBy: "Super Admin",
    lastModifiedAt: "20/08/2026",
  },
];

export const MOCK_REPORTED_REVIEWS: ReportedReview[] = [
  {
    id: "rev-01",
    reviewerName: "Trần Văn T***",
    reviewerId: "8129",
    reviewerInitials: "TT",
    rating: 1,
    createdAt: "10:45 Hôm nay",
    reportCount: 4,
    reportReason: "Nghi ngờ spam / chơi xấu cạnh tranh không lành mạnh",
    commentText: "Hàng giả nhái thương hiệu, shop lừa đảo không giao hàng đúng mẫu",
    productName: "Áo thun nam Cotton Compact Extra",
    storeName: "Coolmate Official Store",
    isMall: true,
    productImageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDt7O6Zlg2rM9ue7n-8qvEdoJXM_cUzLSnulx-0aeXGq9eeAxFG-IdBSJjZq7YEvVjpcL_tdbcf9xNzwDyD9IP1ezctfRgYoQxPFzM2pO7Xr4JusIcFu9Hq3L4FRefpJ22qDthWukLqmNpfxUdEBQI42zD1Stg0Q1Gz_AIYXfennPvCcFk2Ij_rTggtyJrDb3x42Qi9LFij7bJN6JJWuB4elWyp7nPRcDI2K8gGTG_bYH0Vg9jO5wJm5w",
    status: "PENDING",
  },
  {
    id: "rev-02",
    reviewerName: "Nguyễn V. ***",
    reviewerId: "3910",
    reviewerInitials: "NV",
    rating: 1,
    createdAt: "08:30 Hôm qua",
    reportCount: 6,
    reportReason: "Ngôn từ thô tục, công kích xúc phạm người giao hàng",
    commentText:
      "Nội dung đánh giá chứa từ ngữ thô tục, công kích người giao hàng đã bị thuật toán tự động ngăn chặn hiển thị.",
    productName: "Giày thể thao Sneaker Dynamic v2",
    storeName: "Ananas Footwear",
    isMall: false,
    status: "HIDDEN",
    moderatedBy: "System Auto-Filter",
  },
  {
    id: "rev-03",
    reviewerName: "Lê Thị H***",
    reviewerId: "5512",
    reviewerInitials: "LH",
    rating: 1,
    createdAt: "15:20 Ngày 28/09",
    reportCount: 2,
    reportReason: "Đăng ảnh không liên quan đến sản phẩm (kèm link cờ bạc)",
    commentText: "Chất lượng bình thường nhưng bấm vào link này nhận quà khủng...",
    productName: "Tai nghe không dây TWS Bluetooth 5.3 Pro",
    storeName: "TechSound Global",
    isMall: true,
    status: "PENDING",
  },
];

// In-memory state storage
const roleGroupsState = [...MOCK_ROLE_GROUPS];
const featureFlagsState = [...MOCK_FEATURE_FLAGS];
const reportedReviewsState = [...MOCK_REPORTED_REVIEWS];

export const permissionsMockService = {
  getSystemRoles: (): SystemRole[] => {
    return [...MOCK_SYSTEM_ROLES];
  },

  getRoleGroups: (): InternalRoleGroup[] => {
    return [...roleGroupsState];
  },

  getAclPermissions: (): AclPermission[] => {
    return [...MOCK_ACL_PERMISSIONS];
  },

  saveRoleGroupPermissions: (
    groupId: string,
    permissions: string[]
  ): InternalRoleGroup => {
    const idx = roleGroupsState.findIndex((g) => g.id === groupId);
    if (idx === -1) {
      throw new Error(`Không tìm thấy nhóm quyền ${groupId}`);
    }
    const updated = {
      ...roleGroupsState[idx],
      permissions: [...permissions],
    };
    roleGroupsState[idx] = updated;
    return updated;
  },

  getFeatureFlags: (): FeatureFlag[] => {
    return [...featureFlagsState];
  },

  toggleFeatureFlag: (
    code: string,
    isEnabled: boolean,
    maintenanceReason?: string
  ): FeatureFlag => {
    const idx = featureFlagsState.findIndex((f) => f.code === code);
    if (idx === -1) {
      throw new Error(`Không tìm thấy cờ tính năng ${code}`);
    }
    const updated: FeatureFlag = {
      ...featureFlagsState[idx],
      isEnabled,
      maintenanceMessage: isEnabled
        ? undefined
        : maintenanceReason || "Đang bảo trì nâng cấp định kỳ",
      lastModifiedBy: "Trần Quản Trị",
      lastModifiedAt: "Vừa xong",
    };
    featureFlagsState[idx] = updated;
    return updated;
  },

  getReportedReviews: (): ReportedReview[] => {
    return [...reportedReviewsState];
  },

  moderateReview: (
    reviewId: string,
    action: "keep" | "hide" | "restore"
  ): ReportedReview => {
    const idx = reportedReviewsState.findIndex((r) => r.id === reviewId);
    if (idx === -1) {
      throw new Error(`Không tìm thấy đánh giá ${reviewId}`);
    }
    const current = reportedReviewsState[idx];
    let nextStatus = current.status;
    let modBy = "Trần Quản Trị";

    if (action === "keep") {
      nextStatus = "RESOLVED";
      modBy = "Trần Quản Trị (Giữ lại)";
    } else if (action === "hide") {
      nextStatus = "HIDDEN";
      modBy = "Trần Quản Trị (Đã ẩn)";
    } else if (action === "restore") {
      nextStatus = "PENDING";
      modBy = "Trần Quản Trị (Khôi phục chờ)";
    }

    const updated: ReportedReview = {
      ...current,
      status: nextStatus,
      moderatedBy: modBy,
    };
    reportedReviewsState[idx] = updated;
    return updated;
  },
};
