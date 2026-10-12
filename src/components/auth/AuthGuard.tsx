"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { shouldRequireAuth } from "@/lib/auth/require-auth";

/**
 * AuthGuard – bảo vệ client-side cho các trang yêu cầu đăng nhập.
 *
 * Flow:
 *  1. Mount → check useAuth() (state từ Zustand persisted store)
 *  2. Nếu chưa hydrated → render `fallback` (mặc định null) để tránh flash redirect
 *  3. Nếu hydrated + chưa auth → router.replace('/login?redirect=<currentPath>')
 *  4. Nếu hydrated + đã auth → render `children`
 *
 * CÁCH DÙNG:
 * ```tsx
 * export default function GioHangPage() {
 *   return (
 *     <AuthGuard>
 *       <CartContent />
 *     </AuthGuard>
 *   );
 * }
 * ```
 *
 * SERVER-SIDE: Vẫn cần kết hợp với `proxy.ts` để chặn ở edge (defense-in-depth,
 * tránh render nội dung nhạy cảm cho user chưa login qua URL trực tiếp).
 *
 * @see src/proxy.ts – middleware Next 16 chặn storefront protected routes
 * @see src/lib/auth/require-auth.ts – helper thuần test được
 * @see .cursor/rules/routing-guards.mdc – quy ước auth-guard
 */
export interface AuthGuardProps {
  children: React.ReactNode;
  /** Render khi đang chờ hydration (mặc định: null). */
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, fallback = null }: AuthGuardProps) {
  const { isAuthenticated, isHydrated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // useMemo tránh tính toán lại khi re-render không cần thiết
  const decision = useMemo(
    () => shouldRequireAuth(isAuthenticated, isHydrated, pathname),
    [isAuthenticated, isHydrated, pathname],
  );

  useEffect(() => {
    if (decision.shouldRedirect) {
      router.replace(decision.loginUrl);
    }
  }, [decision.shouldRedirect, decision.loginUrl, router]);

  if (!isHydrated) {
    return <>{fallback}</>;
  }

  if (decision.shouldRedirect) {
    // Tránh flash nội dung trong khi effect chạy
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
