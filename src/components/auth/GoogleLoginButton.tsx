'use client';

import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useGoogleRedirect } from '@/features/auth/useGoogleRedirect';
import { sanitizeRedirectPath } from '@/lib/auth/require-auth';

/** Key sessionStorage mà callback page đọc để redirect sau login. */
const SESSION_STORAGE_POST_LOGIN_KEY = 'post_login_redirect';

interface GoogleLoginButtonProps {
  /**
   * Variant label: "login" (default, "Đăng nhập bằng Google") hoặc
   * "register" ("Đăng ký bằng Google"). Điều khiển aria-label cho a11y.
   */
  variant?: 'login' | 'register';

  /**
   * Callback khi authorizationUrl đã được set (FE sắp navigate sang Google).
   * Page dùng để chuẩn bị state nếu cần.
   *
   * Lưu ý: với flow same-window redirect, callback này được gọi TRƯỚC
   * khi browser navigate sang Google consent. Redirect thật sẽ do
   * `/auth/google/callback` page xử lý sau khi Google trả về.
   */
  onSuccess?: (state: string) => void;

  /**
   * Callback khi có lỗi. Default: hiển thị toast với message đã map i18n.
   */
  onError?: (error: Error) => void;
}

/**
 * GoogleLoginButton – icon-only 40x40 button (Stitch screen 203897a8).
 *
 * Wire với useGoogleRedirect hook (same-window redirect flow, KHÔNG popup):
 * 1. Bấm nút → hook gọi GET /api/v1/auth/google/url lấy authorizationUrl.
 * 2. window.location.href = authorizationUrl → browser navigate thẳng sang
 *    Google consent (cùng tab, top-level — không có trang trung gian).
 * 3. Google redirect về /auth/google/callback?code=... → callback page
 *    xử lý (đổi code lấy JWT, lưu token, redirect về returnTo).
 *
 * Chỉ dùng cho Google. Facebook/GitHub giữ nguyên stub trong
 * SocialLoginButtons (BE chỉ có Google endpoint).
 */
export function GoogleLoginButton({
  variant = 'login',
  onSuccess,
  onError,
}: GoogleLoginButtonProps = {}) {
  const t = useTranslations('auth.social');
  const tErr = useTranslations('auth.errors');

  /**
   * Preserve `?redirect=` query (vd /login?redirect=/cart) sang sessionStorage
   * để callback page `/auth/google/callback` đọc và redirect về đúng chỗ
   * user muốn, thay vì default "/".
   *
   * Lưu NGAY khi mount (không đợi click) — vì flow Google OAuth:
   *   1. User vào /login?redirect=/cart
   *   2. Bấm Google → consent → redirect đi (5-30s)
   *   3. Google redirect về /auth/google/callback?code=...
   *   4. Callback page xử lý xong, đọc sessionStorage → redirect về /cart
   *
   * Nếu chỉ save khi click → user click xong, page navigate đi → effect
   * unmount, save mất → callback không tìm thấy → redirect "/".
   *
   * Đọc `window.location.search` thay vì `useSearchParams` để tránh
   * Next.js hook overhead và dễ test (mock window.location trực tiếp).
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('redirect');
    const safe = sanitizeRedirectPath(raw);
    // sanitizeRedirectPath trả ROUTES.HOME ("/") khi invalid → KHÔNG lưu
    // vì sessionStorage đã có fallback "/" ở callback page rồi.
    if (safe !== '/') {
      window.sessionStorage.setItem(SESSION_STORAGE_POST_LOGIN_KEY, safe);
    }
  }, []);

  const { redirect, status, error } = useGoogleRedirect({
    onSuccess,
    onError,
  });

  // Map lỗi từ hook → toast bằng i18n key
  useEffect(() => {
    if (status === 'error' && error) {
      // Flow mới KHÔNG còn popup → chỉ dùng key "googleLoginFailed" chung
      // (kế thừa từ flow cũ; không còn "googlePopupBlocked" vì không có popup).
      toast.error(tErr('googleLoginFailed'));
    }
  }, [status, error, tErr]);

  const isLoading = status === 'redirecting';
  const labelKey = variant === 'register' ? 'googleRegister' : 'google';

  return (
    <button
      type="button"
      onClick={() => void redirect()}
      disabled={isLoading}
      aria-label={t(labelKey)}
      aria-busy={isLoading}
      data-testid="social-google"
      className="flex h-10 items-center justify-center rounded-lg bg-surface-container-lowest shadow-sm transition-colors hover:bg-surface-container-low focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
      style={{ boxShadow: 'inset 0 0 0 1px #bfc7d2' }}
    >
      {isLoading ? (
        <Loader2
          className="h-5 w-5 animate-spin text-on-surface"
          aria-hidden
        />
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          aria-hidden
          data-testid="google-icon"
        >
          <path
            fill="#EA4335"
            d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
          />
          <path
            fill="#4285F4"
            d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5.1 3.7-8.9z"
          />
          <path
            fill="#FBBC05"
            d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
          />
          <path
            fill="#34A853"
            d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
          />
        </svg>
      )}
    </button>
  );
}
