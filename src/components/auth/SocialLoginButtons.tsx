"use client";

import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { GoogleLoginButton } from './GoogleLoginButton';
import type { AuthUser } from '@/stores/auth.store';

type Provider = 'google' | 'facebook' | 'github';

const STUB_PROVIDERS: Array<{
  id: Provider;
  labelKey: 'facebook' | 'github';
  icon: React.ReactNode;
}> = [
  {
    id: 'facebook',
    labelKey: 'facebook',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="#1877F2"
        aria-hidden
      >
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    id: 'github',
    labelKey: 'github',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="#131b2e"
        aria-hidden
      >
        <path
          clipRule="evenodd"
          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"
          fillRule="evenodd"
        />
      </svg>
    ),
  },
];

interface SocialLoginButtonsProps {
  /**
   * Callback khi Google OAuth2 thành công. Thường dùng để redirect
   * theo role hoặc returnUrl.
   */
  onGoogleSuccess?: (user: AuthUser) => void;

  /**
   * Callback khi Google OAuth2 lỗi (không tính các lỗi Facebook/GitHub).
   * Default: GoogleLoginButton tự hiển thị toast.
   */
  onGoogleError?: (error: Error) => void;
}

/**
 * SocialLoginButtons – 3 nút OAuth (Google thật, Facebook/GitHub stub).
 * Stitch screen 203897a8: 3-col grid, h-10.
 *
 * - Google: dùng GoogleLoginButton (OAuth2 popup flow thật qua BE).
 * - Facebook/GitHub: hiển thị icon nhưng click → toast "Chức năng đang phát triển"
 *   vì BE chưa có endpoint cho 2 provider này.
 */
export function SocialLoginButtons({
  onGoogleSuccess,
  onGoogleError,
}: SocialLoginButtonsProps = {}) {
  const tErr = useTranslations('auth.errors');
  const tLogin = useTranslations('auth.login');
  const tSocial = useTranslations('auth.social');

  const handleStubClick = (provider: Provider) => {
    toast.error(tErr('oauthNotImplemented'));
    console.warn(`[auth.social] OAuth ${provider} clicked – TODO`);
  };

  return (
    <div className="space-y-4" data-testid="social-login-buttons">
      {/* Divider "hoặc tiếp tục với" */}
      <div className="relative my-4 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <div className="h-px w-full bg-surface-container-high" />
        </div>
        <span className="relative bg-surface-container-lowest px-3 text-[10px] font-semibold uppercase tracking-wider text-outline">
          {tLogin('dividerOr')}
        </span>
      </div>

      {/* 3-col grid: Google (real) + Facebook stub + GitHub stub */}
      <div className="grid grid-cols-3 gap-2">
        <GoogleLoginButton
          variant="login"
          onSuccess={onGoogleSuccess}
          onError={onGoogleError}
        />
        {STUB_PROVIDERS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => handleStubClick(p.id)}
            aria-label={tSocial(p.labelKey)}
            data-testid={`social-${p.id}`}
            className="flex h-10 items-center justify-center rounded-lg bg-surface-container-lowest shadow-sm transition-colors hover:bg-surface-container-low focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            style={{ boxShadow: 'inset 0 0 0 1px #bfc7d2' }}
          >
            {p.icon}
          </button>
        ))}
      </div>
    </div>
  );
}
