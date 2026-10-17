"use client";

/**
 * Hook xử lý flow Google OAuth2 redirect (không popup).
 *
 * Flow:
 * 1. Click button -> gọi GET /api/v1/auth/google/url -> BE trả authorizationUrl + state.
 * 2. Save state vào sessionStorage để verify CSRF khi callback.
 * 3. window.location.href = authorizationUrl -> browser navigate sang Google consent.
 * 4. Google redirect về /auth/google/callback?code=...&state=...
 * 5. Callback page verify state + exchange code lấy JWT.
 *
 * @see docs/handoffs/google-oauth-fe-integration.md (v2, 2026-10-17)
 */

import { useCallback, useState } from "react";
import { ApiError } from "@/lib/api";
import { getGoogleConsentUrl } from "./google-api";

/** Key lưu state BE trả về (CSRF verification ở callback page). */
const SESSION_STORAGE_STATE_KEY = "google_oauth_state";

export type GoogleRedirectStatus = "idle" | "redirecting" | "error";

export interface UseGoogleRedirectOptions {
  /** Callback khi authorizationUrl đã được set (FE sắp navigate). */
  onSuccess?: (state: string) => void;
  /** Callback khi có lỗi (vd 500, network). */
  onError?: (error: Error) => void;
}

export interface UseGoogleRedirectReturn {
  /** Trigger OAuth redirect: gọi API + window.location.href = authorizationUrl. */
  redirect: () => Promise<void>;
  /** Trạng thái hiện tại. */
  status: GoogleRedirectStatus;
  /** Lỗi (nếu có). Reset khi gọi `redirect()` hoặc `reset()`. */
  error: Error | null;
  /** Reset state về idle. */
  reset: () => void;
}

/**
 * Hook đơn giản: redirect user sang Google consent screen.
 * Khác useGoogleLogin ở chỗ: KHÔNG dùng popup, KHÔNG postMessage,
 * KHÔNG polling — chỉ 1 lần `window.location.href = authorizationUrl`.
 *
 * Lưu state vào sessionStorage để callback page verify CSRF
 * (xem handoff v2 mục 6).
 */
export function useGoogleRedirect(
  options: UseGoogleRedirectOptions = {}
): UseGoogleRedirectReturn {
  const { onSuccess, onError } = options;
  const [status, setStatus] = useState<GoogleRedirectStatus>("idle");
  const [error, setError] = useState<Error | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
  }, []);

  const redirect = useCallback(async () => {
    // Guard: đang redirecting thì không gọi lại
    setStatus("redirecting");
    setError(null);

    try {
      const { authorizationUrl, state } = await getGoogleConsentUrl();

      // Save state for CSRF verification at callback page
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(SESSION_STORAGE_STATE_KEY, state ?? "");
        window.location.href = authorizationUrl;
      }

      setStatus("idle");
      if (state) onSuccess?.(state);
    } catch (err) {
      const apiErr =
        err instanceof ApiError
          ? err
          : err instanceof Error
            ? err
            : new Error("UNKNOWN");
      setError(apiErr);
      setStatus("error");
      onError?.(apiErr);
    }
  }, [onSuccess, onError]);

  return { redirect, status, error, reset };
}
