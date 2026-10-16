"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGoogleConsentUrl,
  loginWithGoogle,
} from "./google-api";
import { applyAuthResponse } from "./apply-auth-response";
import { useAuthStore } from "@/stores/auth.store";
import { ApiError } from "@/lib/api";
import type { AuthUser } from "@/stores/auth.store";

/**
 * Error code đặc biệt khi browser chặn popup (không phải từ BE).
 * Map sang i18n key auth.google.error.POPUP_BLOCKED.
 */
export const POPUP_BLOCKED_CODE = "POPUP_BLOCKED";

interface UseGoogleLoginOptions {
  /**
   * URL redirect về sau khi Google consent xong.
   * PHẢI khớp với Authorized redirect URI trong Google Cloud Console.
   * - Local:    'http://localhost:3000/oauth2/redirect'
   * - Prod:     'https://vibe-mart-utc2.canluaz.io.vn/oauth2/redirect'
   *
   * Mặc định: build từ NEXT_PUBLIC_SITE_URL + '/oauth2/redirect'.
   */
  redirectUri?: string;

  /**
   * Callback khi đăng nhập thành công. FE thường redirect về trang chủ
   * (hoặc returnUrl nếu có).
   */
  onSuccess?: (user: AuthUser) => void;

  /**
   * Callback khi có lỗi. Component sẽ tự map `err.code` → i18n key.
   */
  onError?: (error: Error) => void;
}

interface UseGoogleLoginReturn {
  /** Mở popup Google consent. */
  login: () => Promise<void>;

  /** Trạng thái hiện tại. */
  status: "idle" | "opening-popup" | "authenticating" | "error";

  /** Lỗi (nếu có). Reset khi gọi `login()` lần sau. */
  error: Error | null;

  /** Reset state về idle. */
  reset: () => void;
}

const POPUP_FEATURES = "width=500,height=600,left=200,top=100,scrollbars=yes";
const POLL_INTERVAL_MS = 500;
const POSTMESSAGE_TYPE = "google-oauth-callback";
const SESSION_STORAGE_KEY = "google_oauth_redirect_uri";

function defaultRedirectUri(): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/oauth2/redirect`;
}

/**
 * Hook xử lý toàn bộ flow Google OAuth2 (Authorization Code + popup).
 *
 * Flow:
 * 1. Mở popup với Google consent URL (lấy từ BE).
 * 2. User chọn tài khoản Google → Google redirect về /oauth2/redirect?code=...
 * 3. Trang callback đọc code, gọi POST /api/v1/auth/google, đóng popup + postMessage về parent.
 * 4. Hook nhận message, lưu token + user, gọi onSuccess callback.
 *
 * @see docs/handoffs/fe-google-login-integration-guide.md mục 6
 */
export function useGoogleLogin(
  options: UseGoogleLoginOptions = {}
): UseGoogleLoginReturn {
  const { redirectUri, onSuccess, onError } = options;
  const setUser = useAuthStore((s) => s.setUser);
  const qc = useQueryClient();

  const [status, setStatus] = useState<UseGoogleLoginReturn["status"]>("idle");
  const [error, setError] = useState<Error | null>(null);
  const popupRef = useRef<Window | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const statusRef = useRef<UseGoogleLoginReturn["status"]>("idle");
  statusRef.current = status;

  // Cleanup polling khi unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
  }, []);

  const login = useCallback(async () => {
    if (status !== "idle" && status !== "error") return;

    setStatus("opening-popup");
    setError(null);

    const finalRedirectUri = redirectUri ?? defaultRedirectUri();

    try {
      // Bước 1: Lấy consent URL từ BE
      const { authorizationUrl } = await getGoogleConsentUrl();

      // Bước 2: Lưu redirectUri vào sessionStorage để trang callback dùng
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(SESSION_STORAGE_KEY, finalRedirectUri);
      }

      // Bước 3: Mở popup Google consent
      const popup = window.open(authorizationUrl, "google-oauth", POPUP_FEATURES);
      if (!popup) {
        throw new Error(POPUP_BLOCKED_CODE);
      }
      popupRef.current = popup;

      // Bước 4: Lắng nghe message từ popup (callback page sẽ postMessage)
      const handleMessage = async (event: MessageEvent) => {
        // Security: chỉ nhận message từ chính origin của mình
        if (event.origin !== window.location.origin) return;

        const data = event.data as
          | { type?: string; code?: string; error?: string }
          | undefined;
        if (!data || data.type !== POSTMESSAGE_TYPE) return;

        // Cleanup listener + polling
        window.removeEventListener("message", handleMessage);
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }

        if (data.error) {
          const err = new Error(data.error);
          setError(err);
          setStatus("error");
          onError?.(err);
          return;
        }

        if (data.code) {
          try {
            setStatus("authenticating");

            // Bước 5: Đổi code lấy JWT
            const authRes = await loginWithGoogle({
              code: data.code,
              redirectUri: finalRedirectUri,
            });

            // Bước 6: Lưu token + user + invalidate query
            const user = await applyAuthResponse(authRes, qc, setUser);

            // Cleanup sessionStorage
            if (typeof window !== "undefined") {
              window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
            }

            setStatus("idle");
            onSuccess?.(user);
          } catch (err) {
            const apiErr = err instanceof ApiError ? err : new Error(
              err instanceof Error ? err.message : "UNKNOWN"
            );
            setError(apiErr);
            setStatus("error");
            onError?.(apiErr);
          }
        }
      };
      window.addEventListener("message", handleMessage);

      // Fallback: polling popup.closed (một số browser chặn postMessage)
      pollRef.current = setInterval(() => {
        if (popup.closed) {
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
          window.removeEventListener("message", handleMessage);

          // Nếu popup đóng mà chưa nhận message → user cancel
          if (statusRef.current === "opening-popup") {
            setStatus("idle");
          }
        }
      }, POLL_INTERVAL_MS);
    } catch (err) {
      const apiErr = err instanceof Error ? err : new Error("UNKNOWN");
      setError(apiErr);
      setStatus("error");
      onError?.(apiErr);
    }
  }, [status, redirectUri, qc, setUser, onSuccess, onError]);

  return { login, status, error, reset };
}
