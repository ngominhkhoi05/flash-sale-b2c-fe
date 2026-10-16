/**
 * Helper dùng chung cho mọi flow đăng nhập thành công (Google, ...).
 * Lưu token + user, invalidate query cần refetch.
 *
 * Lưu ý: dùng pattern nhận `setUser` qua parameter thay vì
 * `useAuthStore.getState().setUser` để dễ test và match với pattern
 * hiện tại của `useLoginMutation` trong hooks.ts.
 *
 * @see docs/superpowers/plans/2026-10-10-auth-guard-and-post-login-refresh.md
 */
import type { QueryClient } from "@tanstack/react-query";
import {
  setAccessToken,
  setRefreshToken,
} from "@/lib/api";
import { decodeJwtPrimaryRole } from "./jwt";
import type { AuthUser } from "@/stores/auth.store";
import type { UserResponse, AuthResponse } from "./api";
import { POST_LOGIN_INVALIDATE_KEYS as _POST_LOGIN_INVALIDATE_KEYS } from "./hooks";

/** Query keys cần invalidate sau khi đăng nhập/đăng ký thành công. */
export const POST_LOGIN_INVALIDATE_KEYS = _POST_LOGIN_INVALIDATE_KEYS;

/**
 * Map UserResponse (backend) + JWT authorities → AuthUser (FE store).
 * Backend không trả role trong user DTO — role lấy từ JWT `authorities`.
 * avatarUrl: chỉ truyền xuống store khi backend trả non-null.
 */
export function toAuthUser(u: UserResponse, accessToken: string): AuthUser {
  const base: AuthUser = {
    id: String(u.id),
    email: u.email,
    fullName: u.fullName,
    role: decodeJwtPrimaryRole(accessToken),
  };
  if (u.avatarUrl) {
    base.avatarUrl = u.avatarUrl;
  }
  return base;
}

/**
 * Apply AuthResponse sau khi đăng nhập thành công (mọi provider).
 * - Lưu accessToken (localStorage + cookie) + refreshToken (sessionStorage).
 * - Gọi `setUser` callback để cập nhật Zustand store.
 * - Invalidate các query cần refetch với data của user mới.
 * - Trả về AuthUser để component caller xử lý (vd: redirect theo role).
 */
export async function applyAuthResponse(
  res: AuthResponse,
  qc: QueryClient,
  setUser: (user: AuthUser) => void
): Promise<AuthUser> {
  setAccessToken(res.accessToken);
  setRefreshToken(res.refreshToken);
  const user = toAuthUser(res.user, res.accessToken);
  setUser(user);
  await Promise.all(
    POST_LOGIN_INVALIDATE_KEYS.map((key) =>
      qc.invalidateQueries({ queryKey: key as readonly unknown[] })
    )
  );
  return user;
}
