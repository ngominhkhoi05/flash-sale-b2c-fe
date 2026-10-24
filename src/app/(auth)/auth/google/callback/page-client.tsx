"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { loginWithGoogle } from "@/features/auth/google-api";
import { applyAuthResponse } from "@/features/auth/apply-auth-response";
import { useAuthStore } from "@/stores/auth.store";
import { useTranslations } from "next-intl";
import { sanitizeRedirectPath } from "@/lib/auth/require-auth";
import {
  GOOGLE_CONSENT_REDIRECT_URI_KEY,
  resolveGoogleRedirectUri,
} from "@/features/auth/google-redirect-uri";

const SESSION_STORAGE_STATE_KEY = "google_oauth_state";
const SESSION_STORAGE_PROCESSED_KEY = "google_oauth_callback_processed";
const SESSION_STORAGE_POST_LOGIN_KEY = "post_login_redirect";

/**
 * Trang callback OAuth2 — top-level (KHÔNG popup), theo handoff v2.
 *
 * UI redesign (Commit F — 2026-10-17): align với Stitch `dang-xac-thuc.md`.
 * Layout:
 * - Card 420px, rounded-2xl, shadow, border, p-8/10, white
 * - Spinner 64px SVG: vòng hào quang + spinner + mark_email_read icon ở tâm
 * - Title: "Đang xác thực email của bạn..."
 * - Subtitle: "Hệ thống đang kiểm tra mã token kích hoạt. Vui lòng đợi trong giây lát."
 * - Trust badge (border-top): lock icon + "Bảo mật chuẩn TLS 256-bit • Vibe Mart"
 *
 * Flow logic (5 nhánh):
 * 1. Google redirect về `/auth/google/callback?code=...&state=...`
 *    hoặc `?error=access_denied&error_description=...`
 * 2. Parse params → gọi POST /api/v1/auth/google
 *    (CSRF state check DISABLED — xem handoff mục 6, BE không verify state)
 * 3. Lưu tokens + user + redirect theo returnUrl
 *
 * @see docs/handoffs/google-oauth-fe-integration.md mục 4 (bước 2)
 * @see docs/handoffs/google-oauth-fe-integration.md mục 7 (bảng lỗi)
 * @see docs/superpowers/handoffs/dang-xac-thuc.md (Stitch design)
 */
export function GoogleCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const t = useTranslations("auth.google.callback");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");
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

    // 4. CSRF state check (DISABLED — xem handoff mục 6)
    // Lý do: BE hiện tại KHÔNG verify state khi callback. `data.state` từ
    // `GET /api/v1/auth/google/url` chỉ là random UUID vô nghĩa. State Google
    // echo về (`?state=...`) CÓ THỂ khác `data.state` (BE tự build URL với
    // state riêng) → so sánh là vô nghĩa và trigger sai state_mismatch.
    // Nếu muốn CSRF thật trong tương lai: FE tự generate state bằng
    // crypto.randomUUID(), override `state=` trong authorizationUrl trước
    // khi navigate, rồi verify ở đây. (handoff mục 6 có hướng dẫn.)

    // 5. Đánh dấu đã xử lý (để reload protection hoạt động)
    window.sessionStorage.setItem(SESSION_STORAGE_PROCESSED_KEY, "true");

    // 6. Đổi code lấy JWT
    //
    // `redirectUri` PHẢI khớp 100% với `redirect_uri` đã dùng trong consent
    // URL, nếu không Google trả `invalid_grant`.
    //
    // Không dùng `process.env.OAUTH2_REDIRECT_URI` ở đây: đó là env phía
    // SERVER (BE đọc `${OAUTH2_REDIRECT_URI:}`), không có prefix
    // `NEXT_PUBLIC_` nên Next.js KHÔNG inline vào browser bundle → giá trị
    // luôn là `undefined` trong client component → Zod reject `url("")` →
    // throw ZodError → redirect `/login?error=google_unknown` mà không hề
    // gọi lên BE.
    //
    // Thứ tự ưu tiên: sessionStorage (giá trị lấy từ consent URL thật) →
    // `NEXT_PUBLIC_GOOGLE_REDIRECT_URI` (env public) → origin + pathname.
    const redirectUri = resolveGoogleRedirectUri({
      storedValue: window.sessionStorage.getItem(
        GOOGLE_CONSENT_REDIRECT_URI_KEY
      ),
      envValue: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI,
      origin: window.location.origin,
      pathname: window.location.pathname,
    });

    (async () => {
      try {
        const authRes = await loginWithGoogle({ code, redirectUri });
        await applyAuthResponse(authRes, qc, setUser);

        // Cleanup sessionStorage
        window.sessionStorage.removeItem(SESSION_STORAGE_STATE_KEY);
        window.sessionStorage.removeItem(SESSION_STORAGE_PROCESSED_KEY);

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

  return (
    <div
      className="flex w-full items-center justify-center p-4 sm:p-6"
      data-testid="google-callback-pending"
    >
      <div
        className="flex w-full max-w-[420px] flex-col items-center rounded-2xl border border-outline-variant bg-surface-container-lowest p-8 text-center shadow-lg shadow-outline-variant/30 transition-all sm:p-10"
        data-testid="google-callback-card"
      >
        {/* Spinner 64px — vòng hào quang + spinner + icon email ở tâm */}
        <div
          className="relative mb-6 flex h-16 w-16 items-center justify-center"
          data-testid="google-callback-spinner-wrapper"
        >
          {/* Vòng hào quang mờ nhẹ */}
          <div
            className="absolute inset-0 rounded-full bg-primary-fixed/30 opacity-25"
            style={{ animation: "google-callback-ping 1.5s cubic-bezier(0,0,0.2,1) infinite" }}
            aria-hidden
          />

          {/* Spinner chính — 2 vòng tròn SVG (nền + xoay brand color) */}
          <svg
            className="h-16 w-16"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ animation: "google-callback-spin 1s linear infinite" }}
            aria-hidden
            data-testid="google-callback-spinner"
          >
            <circle
              cx="32"
              cy="32"
              r="26"
              stroke="currentColor"
              strokeOpacity="0.2"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <circle
              cx="32"
              cy="32"
              r="26"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray="163"
              strokeDashoffset="118"
              className="text-primary"
            />
          </svg>

          {/* Icon email ở tâm */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="material-symbols-outlined text-[22px] text-primary"
              style={{ animation: "google-callback-pulse 2s ease-in-out infinite" }}
              aria-hidden
              data-testid="google-callback-email-icon"
            >
              mark_email_read
            </span>
          </div>
        </div>

        {/* Title bold */}
        <h1
          className="mb-2.5 text-xl font-bold tracking-tight text-on-surface sm:text-2xl"
          data-testid="google-callback-title"
        >
          {t("verifyingEmail")}
        </h1>

        {/* Subtitle xám */}
        <p
          className="max-w-[340px] text-sm font-normal leading-relaxed text-on-surface-variant"
          data-testid="google-callback-subtitle"
        >
          {t("verifyingSubtitle")}
        </p>

        {/* Trust badge — bảo mật TLS 256-bit */}
        <div
          className="mt-8 flex w-full items-center justify-center gap-2 border-t border-outline-variant pt-6 text-xs text-on-surface-variant"
          data-testid="google-callback-tls-badge"
        >
          <span
            className="material-symbols-outlined text-[16px] text-on-surface-variant"
            aria-hidden
          >
            lock
          </span>
          <span>{t("tlsBadge")}</span>
        </div>
      </div>
    </div>
  );
}
