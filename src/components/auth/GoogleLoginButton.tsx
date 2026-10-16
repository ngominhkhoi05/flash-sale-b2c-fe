'use client';

import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { useGoogleLogin, POPUP_BLOCKED_CODE } from '@/features/auth/useGoogleLogin';
import type { AuthUser } from '@/stores/auth.store';

interface GoogleLoginButtonProps {
  /**
   * Variant label: "login" (default, "Đăng nhập bằng Google") hoặc
   * "register" ("Đăng ký bằng Google"). Điều khiển aria-label cho a11y.
   */
  variant?: 'login' | 'register';

  /**
   * URL redirect về sau khi Google consent xong. Thường để default
   * (build từ NEXT_PUBLIC_SITE_URL + '/oauth2/redirect') — chỉ override
   * khi test E2E với custom origin.
   */
  redirectUri?: string;

  /**
   * Callback khi đăng nhập/đăng ký thành công. Page dùng để redirect.
   */
  onSuccess?: (user: AuthUser) => void;

  /**
   * Callback khi có lỗi. Default: hiển thị toast với message đã map i18n.
   */
  onError?: (error: Error) => void;
}

/**
 * GoogleLoginButton – icon-only 40x40 button (Stitch screen 203897a8).
 * Wire với useGoogleLogin hook: mở popup Google consent, đợi message
 * từ /oauth2/redirect page, lưu token + user qua applyAuthResponse.
 *
 * Chỉ dùng cho Google. Facebook/GitHub giữ nguyên stub trong
 * SocialLoginButtons (BE chỉ có Google endpoint).
 */
export function GoogleLoginButton({
  variant = 'login',
  redirectUri,
  onSuccess,
  onError,
}: GoogleLoginButtonProps = {}) {
  const t = useTranslations('auth.social');
  const tErr = useTranslations('auth.errors');

  const { login, status, error } = useGoogleLogin({
    redirectUri,
    onSuccess,
    onError,
  });

  // Map lỗi từ hook → toast bằng i18n key
  useEffect(() => {
    if (status === 'error' && error) {
      const key =
        error.message === POPUP_BLOCKED_CODE
          ? 'googlePopupBlocked'
          : 'googleLoginFailed';
      toast.error(tErr(key));
    }
  }, [status, error, tErr]);

  const isLoading = status === 'opening-popup' || status === 'authenticating';
  const labelKey = variant === 'register' ? 'googleRegister' : 'google';

  return (
    <button
      type="button"
      onClick={() => void login()}
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
