/**
 * require-auth – helper thuần (pure) cho AuthGuard và useAuthRedirect hook.
 * Tách logic ra để dễ test (không cần mock next/navigation).
 *
 * Rule auth-jwt + routing-guards: link yêu cầu auth (giỏ hàng, voucher, tài khoản)
 * phải redirect về /dang-nhap?redirect=<path> khi user chưa đăng nhập.
 */
import { ROUTES } from "@/lib/constants";

/**
 * Chuẩn hoá redirect path từ query string.
 * - Trim whitespace
 * - Path hợp lệ: bắt đầu bằng "/" và KHÔNG bắt đầu bằng "//" (open redirect)
 * - Path không hợp lệ → trả về ROUTES.HOME (mặc định an toàn)
 *
 * Tránh open redirect attack: nếu user truyền `?redirect=https://evil.com` hoặc
 * `?redirect=//evil.com`, vẫn redirect về trang chủ thay vì domain ngoài.
 */
export function sanitizeRedirectPath(input: string | null | undefined): string {
  if (!input || typeof input !== "string") return ROUTES.HOME;
  const trimmed = input.trim();
  if (!trimmed) return ROUTES.HOME;
  if (!trimmed.startsWith("/")) return ROUTES.HOME;
  // Ngăn protocol-relative URL: //evil.com → path ngoài domain
  if (trimmed.startsWith("//")) return ROUTES.HOME;
  return trimmed;
}

/**
 * Tính URL đăng nhập kèm redirect query.
 * - Nếu `currentPath` hợp lệ → /dang-nhap?redirect=<encoded path>
 * - Nếu không → /dang-nhap (không có redirect)
 */
export function buildLoginUrl(currentPath: string | null | undefined): string {
  const safe = sanitizeRedirectPath(currentPath);
  if (safe === ROUTES.HOME) {
    return ROUTES.LOGIN;
  }
  return `${ROUTES.LOGIN}?redirect=${encodeURIComponent(safe)}`;
}

/**
 * Quyết định xem user có cần redirect về trang login không.
 * Pure function – dùng cho AuthGuard và useAuthRedirect.
 *
 * @param isAuthenticated – useAuth().isAuthenticated
 * @param isHydrated – useAuth().isHydrated (chờ store rehydrate xong)
 * @param currentPath – pathname hiện tại
 * @returns { shouldRedirect: boolean, loginUrl: string }
 *   - shouldRedirect = true khi đã hydrated + chưa auth
 *   - loginUrl = URL đăng nhập kèm ?redirect=
 */
export function shouldRequireAuth(
  isAuthenticated: boolean,
  isHydrated: boolean,
  currentPath: string | null | undefined,
): { shouldRedirect: boolean; loginUrl: string } {
  const loginUrl = buildLoginUrl(currentPath);
  if (!isHydrated) {
    return { shouldRedirect: false, loginUrl };
  }
  return {
    shouldRedirect: !isAuthenticated,
    loginUrl,
  };
}
