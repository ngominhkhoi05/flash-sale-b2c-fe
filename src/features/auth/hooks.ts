"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore, type AuthUser } from "@/stores/auth.store";
import {
  setAccessToken,
  setRefreshToken,
  clearAccessToken,
  clearRefreshToken,
} from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import {
  loginRequest,
  registerRequest,
  fetchMe,
  logoutRequest,
  type LoginRequest,
  type RegisterRequest,
  type UserResponse,
  type AuthResponse,
} from "./api";
import { decodeJwtPrimaryRole } from "./jwt";

/** Key theo mảng (rule api-data). */
const KEYS = {
  me: ["auth", "me"] as const,
  cart: ["cart"] as const,
  myVouchers: ["vouchers", "mine"] as const,
  recommended: ["products", "recommended"] as const,
};

/**
 * Query keys cần invalidate sau khi đăng nhập/đăng ký thành công.
 * Mục đích: trang chủ (cart count, voucher cá nhân, recommended) tự refetch
 * với data của user mới.
 *
 * @see docs/superpowers/plans/2026-10-10-auth-guard-and-post-login-refresh.md
 */
const POST_LOGIN_INVALIDATE_KEYS = [KEYS.me, KEYS.cart, KEYS.myVouchers, KEYS.recommended] as const;

/**
 * Map UserResponse (backend) + JWT authorities → AuthUser (FE store).
 * Backend không trả role trong user DTO — role lấy từ JWT `authorities`.
 * avatarUrl: chỉ truyền xuống store khi backend trả non-null, để header
 * dùng `undefined` làm tín hiệu fallback về default avatar.
 */
function toAuthUser(u: UserResponse, accessToken: string): AuthUser {
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

/** useLoginMutation – lưu token + user, điều hướng theo role. */
export function useLoginMutation() {
  const setUser = useAuthStore((s) => s.setUser);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginRequest) => loginRequest(input),
    onSuccess: async (res: AuthResponse) => {
      setAccessToken(res.accessToken);
      setRefreshToken(res.refreshToken);
      const user = toAuthUser(res.user, res.accessToken);
      setUser(user);
      toast.success("Đăng nhập thành công");
      // Invalidate auth + 3 nhóm data trên trang chủ (cart, voucher cá nhân, recommended)
      await Promise.all(
        POST_LOGIN_INVALIDATE_KEYS.map((key) =>
          qc.invalidateQueries({ queryKey: key }),
        ),
      );
      // Component chủ động router.push theo role.
    },
    onError: (err: Error) => {
      toast.error(err.message || "Đăng nhập thất bại");
    },
  });
}

/**
 * useRegisterMutation – đăng ký tài khoản mới.
 *
 * Flow:
 *  1. POST /api/v1/auth/register
 *  2. Lưu token + user
 *  3. Toast "Đăng ký thành công"
 *  4. Component chủ động router.push('/xac-thuc-email?email=<...>')
 *     (OTP verification page – TODO task riêng khi backend sẵn sàng)
 *
 * KHÔNG auto-redirect ở hook để RegisterForm quyết định UX flow.
 */
export function useRegisterMutation() {
  const setUser = useAuthStore((s) => s.setUser);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RegisterRequest) => registerRequest(input),
    onSuccess: async (res: AuthResponse) => {
      setAccessToken(res.accessToken);
      setRefreshToken(res.refreshToken);
      const user = toAuthUser(res.user, res.accessToken);
      setUser(user);
      toast.success("Đăng ký thành công");
      // Invalidate auth + 3 nhóm data trên trang chủ
      await Promise.all(
        POST_LOGIN_INVALIDATE_KEYS.map((key) =>
          qc.invalidateQueries({ queryKey: key }),
        ),
      );
    },
    onError: (err: Error) => {
      toast.error(err.message || "Đăng ký thất bại");
    },
  });
}

/** useLogoutMutation – gọi backend /auth/logout với refreshToken. */
export function useLogoutMutation() {
  const reset = useAuthStore((s) => s.reset);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => {
      // Lấy refreshToken từ sessionStorage để gửi cho backend
      const rt =
        typeof window !== "undefined"
          ? window.sessionStorage.getItem("fs_refresh_token")
          : null;
      return logoutRequest(rt ?? "");
    },
    onSettled: () => {
      clearAccessToken();
      clearRefreshToken();
      reset();
      qc.clear();
      if (typeof window !== "undefined") {
        window.location.href = ROUTES.LOGIN;
      }
    },
  });
}

/** useMeQuery – lấy user hiện tại (dùng cho guard phía client). */
export function useMeQuery(enabled = true) {
  return useQuery<UserResponse>({
    queryKey: KEYS.me,
    queryFn: () => fetchMe(),
    enabled,
    staleTime: 60_000,
  });
}
