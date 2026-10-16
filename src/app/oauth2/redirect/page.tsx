'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { loginWithGoogle } from '@/features/auth/google-api';
import { applyAuthResponse } from '@/features/auth/apply-auth-response';
import { useAuthStore } from '@/stores/auth.store';

const SESSION_STORAGE_KEY = 'google_oauth_redirect_uri';
const POSTMESSAGE_TYPE = 'google-oauth-callback';
const CLOSE_DELAY_SUCCESS_MS = 200;
const CLOSE_DELAY_ERROR_MS = 1500;

type CallbackState =
  | { kind: 'pending' }
  | { kind: 'error'; message: string };

/**
 * OAuth2 callback page (chạy trong popup window).
 *
 * Flow:
 * 1. Google redirect về đây sau khi user consent xong: `?code=AUTH_CODE[&error=...]`
 * 2. Trang đọc `code`, lấy `redirectUri` từ sessionStorage (đã lưu bởi `useGoogleLogin`).
 * 3. Gọi `POST /api/v1/auth/google` qua `loginWithGoogle` → `AuthResponse`.
 * 4. `applyAuthResponse`: lưu tokens (localStorage + sessionStorage), cập nhật store, invalidate queries.
 * 5. `window.opener.postMessage({ type, code }, origin)` để hook ở parent biết.
 * 6. `window.close()` sau 200ms (success) / 1500ms (error).
 *
 * @see docs/handoffs/fe-google-login-integration-guide.md mục 8.3
 */
export default function OAuth2RedirectPage() {
  return (
    <Suspense fallback={null}>
      <OAuth2RedirectContent />
    </Suspense>
  );
}

function OAuth2RedirectContent() {
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const t = useTranslations('auth.google.callback');

  const [state, setState] = useState<CallbackState>(() => {
    // Compute initial state synchronously từ URL để tránh setState trong effect.
    const errorParam = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    if (errorParam) {
      return { kind: 'error', message: errorDescription || errorParam };
    }
    if (!searchParams.get('code')) {
      return { kind: 'error', message: t('missingCode') };
    }
    return { kind: 'pending' };
  });

  useEffect(() => {
    const code = searchParams.get('code');
    const errorParam = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    const redirectUri =
      window.sessionStorage.getItem(SESSION_STORAGE_KEY) ?? '';
    const origin = window.location.origin;

    // Trường hợp 1: Google trả về error (user cancel, access_denied, ...)
    if (errorParam) {
      const msg = errorDescription || errorParam;
      window.opener?.postMessage(
        { type: POSTMESSAGE_TYPE, error: msg },
        origin
      );
      const timer = setTimeout(() => window.close(), CLOSE_DELAY_ERROR_MS);
      return () => clearTimeout(timer);
    }

    // Trường hợp 2: Không có code
    if (!code) {
      const msg = t('missingCode');
      window.opener?.postMessage(
        { type: POSTMESSAGE_TYPE, error: msg },
        origin
      );
      const timer = setTimeout(() => window.close(), CLOSE_DELAY_ERROR_MS);
      return () => clearTimeout(timer);
    }

    // Trường hợp 3: Có code → đổi lấy JWT qua BE
    let cancelled = false;
    (async () => {
      try {
        const authRes = await loginWithGoogle({ code, redirectUri });
        if (cancelled) return;
        await applyAuthResponse(authRes, qc, setUser);
        if (cancelled) return;

        // Cleanup sessionStorage key
        window.sessionStorage.removeItem(SESSION_STORAGE_KEY);

        // Gửi message về parent window
        window.opener?.postMessage(
          { type: POSTMESSAGE_TYPE, code },
          origin
        );

        // Đóng popup sau 200ms
        setTimeout(() => window.close(), CLOSE_DELAY_SUCCESS_MS);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : t('errorUNKNOWN');
        window.opener?.postMessage(
          { type: POSTMESSAGE_TYPE, error: msg },
          origin
        );
        setState({ kind: 'error', message: msg });
        setTimeout(() => window.close(), CLOSE_DELAY_ERROR_MS);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, qc, setUser, t]);

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-white p-6"
      data-testid="oauth2-redirect-page"
    >
      <div className="max-w-md text-center">
        {state.kind === 'error' ? (
          <>
            <div
              className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-2xl text-red-600"
              data-testid="oauth2-error-icon"
            >
              !
            </div>
            <p
              className="text-lg font-semibold text-gray-900"
              data-testid="oauth2-error-title"
            >
              {t('error')}
            </p>
            <p
              className="mt-2 text-sm text-red-600"
              data-testid="oauth2-error-message"
            >
              {state.message}
            </p>
            <p className="mt-4 text-xs text-gray-500">{t('closing')}</p>
          </>
        ) : (
          <>
            <div
              className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"
              data-testid="oauth2-loading-spinner"
            />
            <p
              className="text-lg font-semibold text-gray-900"
              data-testid="oauth2-loading-title"
            >
              {t('processing')}
            </p>
            <p className="mt-2 text-sm text-gray-600">{t('pleaseWait')}</p>
          </>
        )}
      </div>
    </div>
  );
}
