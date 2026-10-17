"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  useLoginMutation,
  loginSchema,
  type LoginInput,
} from '@/features/auth';
import { mapGoogleErrorToI18nKey } from '@/features/auth/google-oauth-errors';
import { ROUTES } from '@/lib/constants';
import { sanitizeRedirectPath } from '@/lib/auth/require-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * LoginForm – form đăng nhập (RHF + Zod).
 * Stitch screen 203897a8:
 *  - Form card: max-w-[420px], bg-surface-container-lowest, rounded-xl, shadow-md
 *  - Inputs: h-42px, border-outline-variant
 *  - Error state: border-danger (1.5px) + icon "error" + message đỏ
 *  - Row tiện ích: "Ghi nhớ đăng nhập" + "Quên mật khẩu?"
 *  - Primary button: bg-primary, full width, h-42px
 */
export function LoginForm() {
  const t = useTranslations('auth.login');
  const tErr = useTranslations('auth.errors');
  const tErrorNs = useTranslations('error');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [apiError, setApiError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const login = useLoginMutation();

  // Đọc `?error=google_*` từ URL (callback page Google OAuth redirect về).
  // Chỉ handle error từ Google flow (prefix `google_`) — các error khác do
  // backend login trả về sẽ hiển thị qua `apiError` state ở dưới.
  // Map error code → i18n key trong namespace `error.*` rồi dịch qua tErrorNs.
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (!errorParam || !errorParam.startsWith('google_')) return;
    // Strip prefix `google_` → mapper sẽ lookup i18n key tương ứng.
    const rawCode = errorParam.slice('google_'.length);
    const i18nKey = mapGoogleErrorToI18nKey(rawCode);
    // i18nKey có dạng `error.google_cancelled` — strip prefix `error.`
    // vì useTranslations('error') đã scope sẵn vào namespace `error`.
    const relativeKey = i18nKey.startsWith('error.')
      ? i18nKey.slice('error.'.length)
      : i18nKey;
    toast.error(
      tErrorNs(relativeKey as Parameters<typeof tErrorNs>[0]),
    );
  }, [searchParams, tErrorNs]);

  const onSubmit = (data: LoginInput) => {
    setApiError(null);
    login.mutate(data, {
      onSuccess: () => {
        toast.success(t('title'));
        // Đọc ?redirect= từ URL (sanitize để chống open redirect attack)
        const redirect = sanitizeRedirectPath(searchParams.get('redirect'));
        router.push(redirect);
      },
      onError: () => {
        setApiError(tErr('invalidCredentials'));
      },
    });
  };

  const hasPasswordError = !!errors.password;
  const hasIdentifierError = !!errors.email;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
      noValidate
      data-testid="login-form"
    >
      <div className="mb-1 text-left">
        <h1 className="text-2xl font-semibold text-on-surface">
          {t('title')}
        </h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          {t('subtitle')}
        </p>
      </div>

      {/* Identifier (email/phone) */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email" className="text-sm font-semibold text-on-surface">
          {t('identifierLabel')}
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          placeholder={t('identifierPlaceholder')}
          aria-invalid={!!errors.email}
          className="h-[42px] rounded-lg border-outline-variant bg-surface-container-lowest px-3.5"
          {...register('email')}
        />
        {errors.email && (
          <div className="mt-1 flex items-center gap-1.5 text-danger" role="alert">
            <ErrorIcon />
            <span className="text-xs font-medium">{errors.email.message}</span>
          </div>
        )}
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password" className="text-sm font-semibold text-on-surface">
          {t('passwordLabel')}
        </Label>
        <div className="relative flex items-center">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder={t('passwordPlaceholder')}
            aria-invalid={hasPasswordError}
            className={`h-[42px] rounded-lg px-3.5 pr-11 ${
              hasPasswordError
                ? 'border-danger bg-surface-container-lowest shadow-[inset_0_0_0_1.5px_#ba1a1a]'
                : 'bg-surface-container-lowest shadow-[inset_0_0_0_1px_#bfc7d2]'
            }`}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            className="absolute right-2 flex items-center justify-center rounded p-1 text-outline transition-colors hover:text-on-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {showPassword ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
              >
                <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46A11.804 11.804 0 0 0 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78 3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
              >
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
              </svg>
            )}
          </button>
        </div>
        {hasPasswordError && (
          <div className="mt-1 flex items-center gap-1.5 text-danger" role="alert">
            <ErrorIcon />
            <span className="text-xs font-medium">{errors.password?.message}</span>
          </div>
        )}
        {apiError && !hasPasswordError && !hasIdentifierError && (
          <div className="mt-1 flex items-center gap-1.5 text-danger" role="alert">
            <ErrorIcon />
            <span className="text-xs font-medium">{apiError}</span>
          </div>
        )}
      </div>

      {/* Remember me + Quên mật khẩu */}
      <div className="flex items-center justify-between pt-1">
        <label className="flex cursor-pointer select-none items-center gap-2">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 cursor-pointer rounded text-primary accent-primary focus:ring-0"
          />
          <span className="text-sm text-on-surface">{t('rememberMe')}</span>
        </label>
        <Link
          href="/forgot-password"
          className="text-sm font-semibold text-primary transition-colors hover:text-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
        >
          {t('forgotPassword')}
        </Link>
      </div>

      {/* Primary submit */}
      <Button
        type="submit"
        className="mt-1 h-[42px] w-full rounded-lg bg-primary font-semibold text-on-primary shadow-sm transition-all hover:bg-primary-container active:scale-[0.99]"
        disabled={login.isPending}
        data-testid="login-submit"
      >
        {login.isPending ? t('submitPending') : t('submit')}
      </Button>

      {/* Đăng ký CTA (chuyển sang trang riêng) */}
      <p className="mt-4 text-center text-sm text-on-surface-variant">
        {t('noAccount')}{' '}
        <Link
          href={ROUTES.REGISTER}
          className="font-semibold text-primary transition-colors hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
        >
          {t('signupCta')}
        </Link>
      </p>
    </form>
  );
}

function ErrorIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
    </svg>
  );
}
