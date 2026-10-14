/**
 * Constants dùng chung – rule §11 "không số ma thuật".
 * Tất cả enum hiển thị nhãn tiếng Việt ở đây (rule §6).
 */

// =========================================================
// Pagination
// =========================================================
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

// =========================================================
// Thời gian (ms) – dùng cho timeout/interval client
// =========================================================
export const TOAST_DURATION_MS = 4000;
export const WS_RECONNECT_DELAY_MS = 3000;
export const POLLING_INTERVAL_MS = 3000; // ZaloPay polling (rule §8 mục 5)
export const HELD_ORDER_DURATION_MS = 5 * 60 * 1000; // 5 phút giữ chỗ (server xác nhận)
/** Alias cho trang QR – đồng bộ với HELD_ORDER_DURATION_MS. */
export const QR_HOLD_DURATION_MS = HELD_ORDER_DURATION_MS;

// =========================================================
// Local storage keys
// =========================================================
export const STORAGE_KEYS = {
  ACCESS_TOKEN: "fs_access_token",
  AUTH: "fs_auth",
  CART: "fs_cart",
} as const;

// =========================================================
// Cookie keys (cho SSR / middleware)
// =========================================================
export const COOKIE_KEYS = {
  ACCESS_TOKEN: "access_token",
  LOCALE: "fs_locale",
} as const;

// =========================================================
// Roles
// =========================================================
export const ROLES = {
  BUYER: "BUYER",
  SELLER: "SELLER",
  ADMIN: "ADMIN",
} as const;
export type Role = (typeof ROLES)[keyof typeof ROLES];

// =========================================================
// Order status enum (rule §6) – nhãn tiếng Việt
// =========================================================
export const ORDER_STATUS = {
  PENDING_PAYMENT: "PENDING_PAYMENT",
  PAID: "PAID",
  CONFIRMED: "CONFIRMED",
  SHIPPING: "SHIPPING",
  COMPLETED: "COMPLETED",
  CANCELLED_TIMEOUT: "CANCELLED_TIMEOUT",
  CANCELLED_USER: "CANCELLED_USER",
} as const;
export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  CONFIRMED: "Đã xác nhận",
  SHIPPING: "Đang giao",
  COMPLETED: "Hoàn thành",
  CANCELLED_TIMEOUT: "Đã huỷ – quá hạn thanh toán",
  CANCELLED_USER: "Đã huỷ",
};

export const ORDER_STATUS_BADGE: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "warning",
  PAID: "info",
  CONFIRMED: "info",
  SHIPPING: "info",
  COMPLETED: "success",
  CANCELLED_TIMEOUT: "neutral",
  CANCELLED_USER: "neutral",
};

// =========================================================
// Payment status enum
// =========================================================
export const PAYMENT_STATUS = {
  PENDING: "PENDING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  EXPIRED: "EXPIRED",
  REFUNDED: "REFUNDED",
} as const;
export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Đang chờ",
  SUCCESS: "Thành công",
  FAILED: "Thất bại",
  EXPIRED: "Hết hạn",
  REFUNDED: "Đã hoàn tiền",
};

export const PAYMENT_STATUS_BADGE: Record<PaymentStatus, string> = {
  PENDING: "warning",
  SUCCESS: "success",
  FAILED: "danger",
  EXPIRED: "neutral",
  REFUNDED: "info",
};

// =========================================================
// Flash-sale slot status
// =========================================================
export const SLOT_STATUS = {
  UPCOMING: "UPCOMING",
  ACTIVE: "ACTIVE",
  ENDED: "ENDED",
} as const;
export type SlotStatus = (typeof SLOT_STATUS)[keyof typeof SLOT_STATUS];

export const SLOT_STATUS_LABELS: Record<SlotStatus, string> = {
  UPCOMING: "Sắp diễn ra",
  ACTIVE: "Đang diễn ra",
  ENDED: "Đã kết thúc",
};

export const SLOT_STATUS_BADGE: Record<SlotStatus, string> = {
  UPCOMING: "info",
  ACTIVE: "sale",
  ENDED: "neutral",
};

// =========================================================
// FlashSaleItem status (seller side)
// =========================================================
export const FLASH_SALE_ITEM_STATUS = {
  PENDING_APPROVAL: "PENDING_APPROVAL",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  ENDED: "ENDED",
} as const;
export type FlashSaleItemStatus =
  (typeof FLASH_SALE_ITEM_STATUS)[keyof typeof FLASH_SALE_ITEM_STATUS];

export const FLASH_SALE_ITEM_STATUS_LABELS: Record<FlashSaleItemStatus, string> =
  {
    PENDING_APPROVAL: "Chờ duyệt",
    APPROVED: "Đã duyệt",
    REJECTED: "Từ chối",
    ENDED: "Đã kết thúc",
  };

export const FLASH_SALE_ITEM_STATUS_BADGE: Record<FlashSaleItemStatus, string> =
  {
    PENDING_APPROVAL: "warning",
    APPROVED: "success",
    REJECTED: "danger",
    ENDED: "neutral",
  };

// =========================================================
// Store status
// =========================================================
export const STORE_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  BANNED: "BANNED",
} as const;
export type StoreStatus = (typeof STORE_STATUS)[keyof typeof STORE_STATUS];

export const STORE_STATUS_LABELS: Record<StoreStatus, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  BANNED: "Đã cấm",
};

export const STORE_STATUS_BADGE: Record<StoreStatus, string> = {
  PENDING: "warning",
  APPROVED: "success",
  BANNED: "danger",
};

// =========================================================
// User status
// =========================================================
export const USER_STATUS = {
  ACTIVE: "ACTIVE",
  LOCKED: "LOCKED",
  SUSPENDED: "SUSPENDED",
} as const;
export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: "Hoạt động",
  LOCKED: "Đã khoá",
  SUSPENDED: "Tạm đình chỉ",
};

export const USER_STATUS_BADGE: Record<UserStatus, string> = {
  ACTIVE: "success",
  LOCKED: "danger",
  SUSPENDED: "warning",
};

// =========================================================
// Product status
// =========================================================
export const PRODUCT_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  OUT_OF_STOCK: "OUT_OF_STOCK",
} as const;
export type ProductStatus = (typeof PRODUCT_STATUS)[keyof typeof PRODUCT_STATUS];

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  ACTIVE: "Đang bán",
  INACTIVE: "Đã ẩn",
  OUT_OF_STOCK: "Hết hàng",
};

export const PRODUCT_STATUS_BADGE: Record<ProductStatus, string> = {
  ACTIVE: "success",
  INACTIVE: "neutral",
  OUT_OF_STOCK: "warning",
};

// =========================================================
// Voucher status
// =========================================================
export const VOUCHER_STATUS = {
  ACTIVE: "ACTIVE",
  EXPIRED: "EXPIRED",
  EXHAUSTED: "EXHAUSTED",
  DISABLED: "DISABLED",
} as const;
export type VoucherStatus = (typeof VOUCHER_STATUS)[keyof typeof VOUCHER_STATUS];

export const VOUCHER_STATUS_LABELS: Record<VoucherStatus, string> = {
  ACTIVE: "Đang diễn ra",
  EXPIRED: "Hết hạn",
  EXHAUSTED: "Hết lượt",
  DISABLED: "Đã tắt",
};

export const VOUCHER_STATUS_BADGE: Record<VoucherStatus, string> = {
  ACTIVE: "success",
  EXPIRED: "neutral",
  EXHAUSTED: "warning",
  DISABLED: "neutral",
};

// =========================================================
// Review status
// =========================================================
export const REVIEW_STATUS = {
  VISIBLE: "VISIBLE",
  HIDDEN: "HIDDEN",
} as const;
export type ReviewStatus = (typeof REVIEW_STATUS)[keyof typeof REVIEW_STATUS];

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  VISIBLE: "Hiển thị",
  HIDDEN: "Đã ẩn",
};

export const REVIEW_STATUS_BADGE: Record<ReviewStatus, string> = {
  VISIBLE: "success",
  HIDDEN: "neutral",
};

// =========================================================
// Feature toggles – ánh xạ 403 feature-toggle -> trang bảo trì
// =========================================================
export const FEATURE_CODES = {
  FLASH_SALE: "flash_sale",
  VOUCHER: "voucher",
  CHAT: "chat",
} as const;
export type FeatureCode = (typeof FEATURE_CODES)[keyof typeof FEATURE_CODES];

// =========================================================
// Maintenance feature codes – dùng cho /maintenance?feature=<code>
// Mỗi code ánh xạ 1 placeholder UI trong header/footer chưa có
// trang thật. Khi user bấm link href="#" hoặc route chưa implement,
// sẽ redirect về /maintenance?feature=<code> kèm nhãn tiếng Việt/Anh.
// =========================================================
export const MAINTENANCE_FEATURE_CODES = {
  DOWNLOAD_APP: "download-app",
  SOCIAL_FACEBOOK: "social-facebook",
  SOCIAL_ZALO: "social-zalo",
  LANGUAGE_SWITCH: "language-switch",
  NOTIFICATIONS: "notifications",
  CATEGORY: "category",
  FEATURED_BRANDS: "featured-brands",
  BEST_SELLERS: "best-sellers",
  ACCOUNT_DROPDOWN: "account-dropdown",
  SEARCH_SUBMIT: "search-submit",
  HELP_SHOPPING_GUIDE: "help-shopping-guide",
  HELP_SHIPPING_POLICY: "help-shipping-policy",
  HELP_RETURN_POLICY: "help-return-policy",
  APP_STORE: "app-store",
  GOOGLE_PLAY: "google-play",
  SELLER_REGISTER: "seller-register",
} as const;
export type MaintenanceFeatureCode =
  (typeof MAINTENANCE_FEATURE_CODES)[keyof typeof MAINTENANCE_FEATURE_CODES];

/** Type guard: kiểm tra string có phải maintenance feature code hợp lệ không. */
export function isMaintenanceFeatureCode(
  value: string | null | undefined,
): value is MaintenanceFeatureCode {
  if (!value) return false;
  return (Object.values(MAINTENANCE_FEATURE_CODES) as string[]).includes(value);
}

// =========================================================
// Routes (English path, rule §2 — đồng bộ với AGENTS.md + i18n.mdc)
// =========================================================
export const ROUTES = {
  HOME: "/",
  FLASH_SALE: "/flash-sale",
  PRODUCT_DETAIL: (slug: string) => `/products/${slug}`,
  CART: "/cart",
  CHECKOUT: "/checkout",
  ORDERS: "/orders",
  ACCOUNT: "/account",
  VOUCHERS: "/vouchers",
  SEARCH: "/search",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  VERIFY_EMAIL: "/verify-email",
  VERIFY_EMAIL_SUCCESS: "/verify-email/success",
  SELLER_REGISTER: "/seller/register",

  SELLER_HOME: "/seller",
  SELLER_PENDING: "/seller/pending-review",
  ADMIN_HOME: "/admin",

  // Static / info pages
  HELP: "/help",
  SUPPORT: "/support",
  ABOUT: "/about",
  TERMS: "/terms",
  PRIVACY: "/privacy",
  CONTACT: "/contact",

  MAINTENANCE: (feature?: string) =>
    feature ? `/maintenance?feature=${feature}` : "/maintenance",
} as const;
