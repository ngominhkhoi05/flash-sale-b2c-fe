"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError, setAccessToken, setRefreshToken } from "@/lib/api";
import { loginWithGoogle } from "@/features/auth/google-api";
import { applyAuthResponse } from "@/features/auth/apply-auth-response";
import { useAuthStore } from "@/stores/auth.store";
import { sanitizeRedirectPath } from "@/lib/auth/require-auth";

const SESSION_STORAGE_STATE_KEY = "google_oauth_state";
const SESSION_STORAGE_PROCESSED_KEY = "google_oauth_callback_processed";
const SESSION_STORAGE_POST_LOGIN_KEY = "post_login_redirect";

/**
 * Trang callback OAuth2 — top-level (KHÔNG popup), theo handoff v2.
 *
 * Flow:
 * 1. Google redirect về `/auth/google/callback?code=...&state=...`
 *    hoặc `?error=access_denied&error_description=...`
 * 2. Parse params → verify CSRF state → gọi POST /api/v1/auth/google
 * 3. Lưu tokens + user + redirect theo returnUrl
 *
 * @see docs/handoffs/google-oauth-fe-integration.md mục 4 (bước 2)
 * @see docs/handoffs/google-oauth-fe-integration.md mục 7 (bảng lỗi)
 */
export function GoogleCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");
    const stateFromUrl = searchParams.get("state");
    const expectedState = window.sessionStorage.getItem(
      SESSION_STORAGE_STATE_KEY
    );
    const alreadyProcessed = window.sessionStorage.getItem(
      SESSION_STORAGE_PROCESSED_KEY
    );

    // 1. Idempotent guard: nếu đã xử lý rồi thì skip (reload protection)
    // Lý do: Google code chỉ dùng 1 lần. Reload page sẽ fail với
    // AUTH_401_GOOGLE_TOKEN (code đã used).
    if (alreadyProcessed) {
      window.sessionStorage.removeItem(SESSION_STORAGE_STATE_KEY);
      const returnTo =
        window.sessionStorage.getItem(SESSION_STORAGE_POST_LOGIN_KEY) || "/";
      window.sessionStorage.removeItem(SESSION_STORAGE_POST_LOGIN_KEY);
      router.replace(returnTo);
      return;
    }

    // 2. Error param (user cancel, access_denied, ...)
    if (errorParam) {
      window.sessionStorage.removeItem(SESSION_STORAGE_STATE_KEY);
      router.replace("/login?error=google_cancelled");
      return;
    }

    // 3. No code (Google redirect sai format)
    if (!code) {
      window.sessionStorage.removeItem(SESSION_STORAGE_STATE_KEY);
      router.replace("/login?error=google_no_code");
      return;
    }

    // 4. CSRF state check (optional nhưng recommended — handoff v2 mục 6)
    // Nếu expectedState rỗng (BE đã sinh state nhưng FE không lưu) thì
    // SKIP check. Nếu expectedState có mà không khớp → reject.
    if (expectedState && stateFromUrl !== expectedState) {
      window.sessionStorage.removeItem(SESSION_STORAGE_STATE_KEY);
      router.replace("/login?error=google_state_mismatch");
      return;
    }

    // 5. Đánh dấu đã xử lý (để reload protection hoạt động)
    window.sessionStorage.setItem(SESSION_STORAGE_PROCESSED_KEY, "true");

    // 6. Đổi code lấy JWT
    const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI ?? "";

    (async () => {
      try {
        const authRes = await loginWithGoogle({ code, redirectUri });
        await applyAuthResponse(authRes, qc, setUser);

        // Cleanup sessionStorage
        window.sessionStorage.removeItem(SESSION_STORAGE_STATE_KEY);
        window.sessionStorage.removeItem(SESSION_STORAGE_PROCESSED_KEY);

        // Bind session-cookie ngay (SessionCookieBridge sẽ pick up qua storage event)
        // applyAuthResponse đã set localStorage + sessionStorage token.
        // Cookie httpOnly cần call /api/v1/auth/session-cookie (BE tự handle khi
        // có Authorization header ở request tiếp theo).

        // Redirect
        const returnTo =
          window.sessionStorage.getItem(SESSION_STORAGE_POST_LOGIN_KEY) || "/";
        window.sessionStorage.removeItem(SESSION_STORAGE_POST_LOGIN_KEY);
        const safeReturnTo = sanitizeRedirectPath(returnTo);
        router.replace(safeReturnTo);
      } catch (err) {
        window.sessionStorage.removeItem(SESSION_STORAGE_STATE_KEY);
        window.sessionStorage.removeItem(SESSION_STORAGE_PROCESSED_KEY);

        if (err instanceof ApiError) {
          router.replace(`/login?error=google_${err.code}`);
        } else {
          router.replace("/login?error=google_unknown");
        }
      }
    })();
  }, [searchParams, router, qc, setUser]);

  // Render loading UI (server component sẽ wrap Suspense)
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background p-6"
      data-testid="google-callback-pending"
    >
      <div className="max-w-md text-center">
        <div
          className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary-fixed border-t-primary"
          data-testid="google-callback-spinner"
        />
        <p className="text-lg font-semibold text-on-surface">
          Đang hoàn tất đăng nhập
        </p>
        <p className="mt-2 text-sm text-on-surface-variant">
          Vui lòng đợi trong giây lát...
        </p>
      </div>
    </div>
  );
}
