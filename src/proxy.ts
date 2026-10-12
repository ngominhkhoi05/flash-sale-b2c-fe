import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_KEYS, ROLES, type Role } from "@/lib/constants";

/**
 * Proxy phan quyen route (Next 16 doi tu middleware sang proxy) (rule routing-guards.mdc, auth-jwt.mdc).
 * - Đọc cookie "access_token" (đã được SessionCookieBridge đồng bộ từ localStorage).
 * - Giải mã nhẹ phần payload JWT (KHÔNG verify chữ ký – backend vẫn kiểm tra).
 * - Quyết định:
 *   + `/seller/**`      → cần ROLE_SELLER.
 *     - PENDING          → /seller/pending-review
 *     - BANNED           → /forbidden
 *     - chưa đăng nhập   → /login?redirect=...
 *   + `/admin/**`        → cần ROLE_ADMIN; khác → /forbidden.
 *   + `/login`, `/register` khi đã đăng nhập → về trang chủ portal tương ứng.
 */

interface JwtPayload {
  sub?: string;
  email?: string;
  role?: Role | string;
  storeStatus?: "PENDING" | "APPROVED" | "BANNED";
  exp?: number; // seconds
  [k: string]: unknown;
}

function decodeJwt(token: string): JwtPayload | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

function isExpired(payload: JwtPayload): boolean {
  if (typeof payload.exp !== "number") return false;
  return payload.exp * 1000 < Date.now();
}

interface GuardContext {
  req: NextRequest;
  role: Role | null;
  storeStatus: JwtPayload["storeStatus"];
  pathname: string;
}

function buildLoginRedirect(req: NextRequest): URL {
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = `?redirect=${encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)}`;
  // Xoá hash nếu có
  url.hash = "";
  return url;
}

function redirect(url: URL, req: NextRequest) {
  return NextResponse.redirect(url, { headers: req.headers });
}

/** Quyết định điều hướng cho Storefront & Auth pages khi đã đăng nhập. */
function handleAuthPages(ctx: GuardContext): NextResponse | null {
  const { req, role, pathname } = ctx;
  if (!role) return null;
  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
    const url = req.nextUrl.clone();
    url.pathname =
      role === ROLES.ADMIN
        ? "/admin"
        : role === ROLES.SELLER
          ? "/seller"
          : "/";
    url.search = "";
    return redirect(url, req);
  }
  return null;
}

/** Quyết định điều hướng cho Seller Center. */
function handleSeller(ctx: GuardContext): NextResponse | null {
  const { req, role, storeStatus, pathname } = ctx;
  if (!pathname.startsWith("/seller")) return null;
  // Cho phép trang "hồ sơ chờ duyệt" mà không cần role SELLER (vì chính nó là kết quả redirect).
  if (pathname.startsWith("/seller/pending-review")) {
    if (role === ROLES.SELLER && storeStatus === "PENDING") return null;
    if (!role) return redirect(buildLoginRedirect(req), req);
    // Role khác hoặc không còn PENDING → đẩy về portal tương ứng
    const url = req.nextUrl.clone();
    url.pathname = role === ROLES.ADMIN ? "/admin" : "/";
    url.search = "";
    return redirect(url, req);
  }
  if (!role) return redirect(buildLoginRedirect(req), req);
  if (role !== ROLES.SELLER) {
    const url = req.nextUrl.clone();
    url.pathname = "/forbidden";
    url.search = "";
    return redirect(url, req);
  }
  if (storeStatus === "PENDING") {
    const url = req.nextUrl.clone();
    url.pathname = "/seller/pending-review";
    url.search = "";
    return redirect(url, req);
  }
  if (storeStatus === "BANNED") {
    const url = req.nextUrl.clone();
    url.pathname = "/forbidden";
    url.search = "";
    return redirect(url, req);
  }
  return null;
}

/** Quyết định điều hướng cho Admin Console. */
function handleAdmin(ctx: GuardContext): NextResponse | null {
  const { req, role, pathname } = ctx;
  if (!pathname.startsWith("/admin")) return null;
  if (!role) return redirect(buildLoginRedirect(req), req);
  if (role !== ROLES.ADMIN) {
    const url = req.nextUrl.clone();
    url.pathname = "/forbidden";
    url.search = "";
    return redirect(url, req);
  }
  return null;
}

/**
 * Quyết định điều hướng cho Storefront protected routes (cần auth).
 *
 * Áp dụng cho:
 *  - /cart        (Giỏ hàng)
 *  - /vouchers     (Kho voucher cá nhân)
 *  - /account       (Tài khoản)
 *  - /orders        (Đơn hàng của tôi)
 *
 * Nếu CHƯA đăng nhập → /login?redirect=<path hiện tại>.
 * Nếu đã đăng nhập → cho qua (AuthGuard ở client sẽ check lại role nếu cần).
 *
 * Lý do cần kết hợp với AuthGuard (client):
 *  - Proxy: chặn ở edge, tránh render nội dung nhạy cảm qua URL trực tiếp.
 *  - AuthGuard: check lại sau khi hydration (phòng trường hợp token bị xoá
 *    sau khi page load xong).
 *
 * @see src/components/auth/AuthGuard.tsx – bảo vệ client-side
 * @see .cursor/rules/routing-guards.mdc – quy ước auth-guard
 */
const STOREFRONT_PROTECTED_PREFIXES = [
  "/cart",
  "/vouchers",
  "/account",
  "/orders",
] as const;

function isStorefrontProtected(pathname: string): boolean {
  return STOREFRONT_PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

function handleStorefrontProtected(ctx: GuardContext): NextResponse | null {
  const { req, role, pathname } = ctx;
  if (!isStorefrontProtected(pathname)) return null;
  if (!role) return redirect(buildLoginRedirect(req), req);
  // Đã đăng nhập → cho qua. AuthGuard ở client sẽ check lại role nếu cần.
  return null;
}

/**
 * Next 16 đã đổi tên `middleware` → `proxy` (function export phải tên `proxy`).
 * Xem https://nextjs.org/docs/messages/middleware-to-proxy
 */
export function proxy(req: NextRequest): NextResponse {
  const token = req.cookies.get(COOKIE_KEYS.ACCESS_TOKEN)?.value ?? null;
  const payload = token ? decodeJwt(token) : null;
  const valid = payload && !isExpired(payload) ? payload : null;

  const ctx: GuardContext = {
    req,
    role: (valid?.role as Role | undefined) ?? null,
    storeStatus: valid?.storeStatus,
    pathname: req.nextUrl.pathname,
  };

  return (
    handleAdmin(ctx) ??
    handleSeller(ctx) ??
    handleStorefrontProtected(ctx) ??
    handleAuthPages(ctx) ??
    NextResponse.next()
  );
}

/**
 * Matcher: bỏ qua asset tĩnh, _next, file API nội bộ, favicon.
 * Match mọi route khác để có thể redirect ở root.
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api/).*)",
  ],
};
