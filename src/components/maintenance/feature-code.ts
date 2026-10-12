/**
 * Helper đọc feature code từ URL `?feature=` cho trang /bao-tri.
 *
 * Pattern:
 *   const code = useMaintenanceFeatureFromUrl(); // "download-app" | null
 *   const label = code ? getMaintenanceFeatureLabel(code, "vi") : null;
 *
 * Type guard: `isMaintenanceFeatureCode(value)` đã có trong `constants.ts`.
 */
import {
  isMaintenanceFeatureCode,
  type MaintenanceFeatureCode,
} from "@/lib/constants";

/** Localized label cho mỗi maintenance feature code. */
const LABELS: Record<MaintenanceFeatureCode, { vi: string; en: string }> = {
  "download-app": {
    vi: "Tính năng tải ứng dụng",
    en: "Download app feature",
  },
  "social-facebook": {
    vi: "Tính năng kết nối Facebook",
    en: "Facebook connect feature",
  },
  "social-zalo": {
    vi: "Tính năng kết nối Zalo",
    en: "Zalo connect feature",
  },
  "language-switch": {
    vi: "Tính năng chuyển ngôn ngữ",
    en: "Language switcher feature",
  },
  notifications: {
    vi: "Trung tâm thông báo",
    en: "Notifications center",
  },
  category: {
    vi: "Danh mục sản phẩm",
    en: "Product categories",
  },
  "featured-brands": {
    vi: "Trang Hãng nổi bật",
    en: "Featured brands",
  },
  "best-sellers": {
    vi: "Trang Sản phẩm bán chạy",
    en: "Best sellers",
  },
  "account-dropdown": {
    vi: "Tuỳ chỉnh tài khoản",
    en: "Account customizations",
  },
  "search-submit": {
    vi: "Tìm kiếm nâng cao",
    en: "Advanced search",
  },
  "help-shopping-guide": {
    vi: "Hướng dẫn mua hàng",
    en: "Shopping guide",
  },
  "help-shipping-policy": {
    vi: "Chính sách vận chuyển",
    en: "Shipping policy",
  },
  "help-return-policy": {
    vi: "Chính sách đổi trả",
    en: "Return policy",
  },
  "app-store": {
    vi: "Tải ứng dụng iOS",
    en: "iOS app download",
  },
  "google-play": {
    vi: "Tải ứng dụng Android",
    en: "Android app download",
  },
  "seller-register": {
    vi: "Đăng ký bán hàng",
    en: "Seller registration",
  },
};

/** Locale hỗ trợ. Mặc định `vi`. */
export type SupportedLocale = "vi" | "en";

/**
 * Lấy nhãn tiếng Việt/Anh cho feature code.
 * - Trả về `null` nếu code không hợp lệ (defensive).
 * - Locale không hỗ trợ → fallback `vi`.
 */
export function getMaintenanceFeatureLabel(
  code: string | null | undefined,
  locale: SupportedLocale = "vi",
): string | null {
  if (!code || !isMaintenanceFeatureCode(code)) return null;
  const labels = LABELS[code];
  return labels[locale] ?? labels.vi;
}
