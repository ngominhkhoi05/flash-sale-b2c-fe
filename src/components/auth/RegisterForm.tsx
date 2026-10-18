"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  useRegisterMutation,
  registerSchema,
  type RegisterInput,
} from '@/features/auth';
import { ROUTES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GoogleLoginButton } from './GoogleLoginButton';

/**
 * RegisterForm – form đăng ký tài khoản (RHF + Zod).
 * Stitch screen 0f04994fa0a... (Đăng ký tài khoản - Vibe Mart).
 *
 * Layout Stitch:
 *  - Form card: max-w-[460px], bg-surface-container-lowest, rounded-2xl, p-6 sm:p-8
 *  - Social buttons 3-col ở ĐẦU form (khác login)
 *  - Divider "hoặc đăng ký bằng email"
 *  - Fields: fullName, email, phone (+84 prefix), password, confirmPassword
 *  - Password strength bar: 4-segment, color theo mức
 *  - Checkbox "Tôi đồng ý với Điều khoản..."
 *  - Primary button: bg-primary, full width, h-11
 *  - Link footer: "Đã có tài khoản? Đăng nhập"
 *
 * Password strength: client-side, 4 levels:
 *  - 0/4: empty  → no segments
 *  - 1/4: weak   → 1 seg, danger
 *  - 2/4: medium → 2 seg, warning
 *  - 3/4: strong → 3 seg, secondary
 *  - 4/4: very-strong → 4 seg, secondary
 */
export function RegisterForm() {
  const t = useTranslations('auth.register');
  const tErr = useTranslations('auth.errors');
  const tStrength = useTranslations('auth.password.strength');
  const tSocial = useTranslations('auth.social');
  const router = useRouter();

  const [apiError, setApiError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const registerMutation = useRegisterMutation();

  // eslint-disable-next-line react-hooks/incompatible-library -- RHF watch() pattern hợp lệ
  const passwordValue = watch('password', '');

  /** Tính strength score 0-4 dựa trên content */
  const strength = computePasswordStrength(passwordValue);
  const strengthLabel = getStrengthLabel(strength, tStrength);

  const hasErrors = Object.keys(errors).length > 0;

  const onSubmit = (data: RegisterInput) => {
    if (!agreedTerms) {
      toast.error(tErr('termsRequired'));
      return;
    }
    setApiError(null);
    registerMutation.mutate(
      { fullName: data.fullName, email: data.email, phone: data.phone, password: data.password },
      {
        onSuccess: (_, vars) => {
          toast.success(t('submitSuccess'));
          // Redirect sang trang xác thực email OTP
          router.push(`/verify-email?email=${encodeURIComponent(vars.email)}`);
        },
        onError: (err: Error) => {
          setApiError(err.message || tErr('registerFailed'));
        },
      }
    );
  };

  const providers: Array<{
    id: 'facebook' | 'github';
    labelKey: 'facebookRegister' | 'githubRegister';
    ariaKey: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'facebook',
      labelKey: 'facebookRegister',
      ariaKey: 'facebookRegister',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#1877F2" aria-hidden>
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      id: 'github',
      labelKey: 'githubRegister',
      ariaKey: 'githubRegister',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#131b2e" aria-hidden>
          <path clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" fillRule="evenodd" />
        </svg>
      ),
    },
  ];

  const handleSocialClick = (provider: string) => {
    toast.error(tErr('oauthNotImplemented'));
    console.warn(`[auth.social.register] OAuth ${provider} clicked – TODO`);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-3.5"
      noValidate
      data-testid="register-form"
    >
      {/* Title */}
      <div className="mb-1 text-left">
        <h2 className="text-2xl font-semibold text-on-surface">
          {t('title')}
        </h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          {t('subtitle')}
        </p>
      </div>

      {/* Social Register Buttons */}
      <div className="grid grid-cols-3 gap-2 mb-1" data-testid="social-register-buttons">
        <GoogleLoginButton
          variant="register"
          onSuccess={() => {
            toast.success(t('title'));
            router.push(ROUTES.HOME);
          }}
        />
        {providers.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => handleSocialClick(p.id)}
            aria-label={tSocial(p.labelKey)}
            data-testid={`social-register-${p.id}`}
            className="flex h-10 items-center justify-center rounded-lg bg-surface-container-lowest shadow-sm transition-colors hover:bg-surface-container-low focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            style={{ boxShadow: 'inset 0 0 0 1px #bfc7d2' }}
          >
            {p.icon}
          </button>
        ))}
      </div>

      {/* Divider "hoặc đăng ký bằng email" */}
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <div className="h-px w-full bg-surface-container-high" />
        </div>
        <span className="relative bg-surface-container-lowest px-3 text-xs font-semibold uppercase tracking-wider text-outline">
          {t('dividerEmail')}
        </span>
      </div>

      {/* Họ và tên */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fullName" className="text-sm font-semibold text-on-surface">
          {t('fullNameLabel')}
        </Label>
        <Input
          id="fullName"
          type="text"
          autoComplete="name"
          placeholder={t('fullNamePlaceholder')}
          aria-invalid={!!errors.fullName}
          className="h-[42px] rounded-lg bg-surface-container-lowest px-3.5 shadow-[inset_0_0_0_1px_#bfc7d2]"
          {...register('fullName')}
        />
        {errors.fullName && (
          <div className="mt-1 flex items-center gap-1.5 text-danger" role="alert">
            <ErrorIcon />
            <span className="text-xs font-medium">{errors.fullName.message}</span>
          </div>
        )}
      </div>

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email" className="text-sm font-semibold text-on-surface">
          {t('emailLabel')}
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder={t('emailPlaceholder')}
          aria-invalid={!!errors.email}
          className="h-[42px] rounded-lg bg-surface-container-lowest px-3.5 shadow-[inset_0_0_0_1px_#bfc7d2]"
          {...register('email')}
        />
        {errors.email && (
          <div className="mt-1 flex items-center gap-1.5 text-danger" role="alert">
            <ErrorIcon />
            <span className="text-xs font-medium">{errors.email.message}</span>
          </div>
        )}
      </div>

      {/* Số điện thoại */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone" className="text-sm font-semibold text-on-surface">
          {t('phoneLabel')}
        </Label>
        <Input
          id="phone"
          type="tel"
          autoComplete="tel-national"
          inputMode="tel"
          placeholder={t('phonePlaceholder')}
          aria-invalid={!!errors.phone}
          className="h-[42px] rounded-lg bg-surface-container-lowest px-3.5 shadow-[inset_0_0_0_1px_#bfc7d2]"
          {...register('phone')}
        />
        {errors.phone && (
          <div className="mt-1 flex items-center gap-1.5 text-danger" role="alert">
            <ErrorIcon />
            <span className="text-xs font-medium">{errors.phone.message}</span>
          </div>
        )}
      </div>

      {/* Mật khẩu */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password" className="text-sm font-semibold text-on-surface">
          {t('passwordLabel')}
        </Label>
        <div className="relative flex items-center">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder={t('passwordPlaceholder')}
            aria-invalid={!!errors.password}
            className="h-[42px] rounded-lg bg-surface-container-lowest px-3.5 pr-11 shadow-[inset_0_0_0_1px_#bfc7d2]"
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            className="absolute right-2.5 flex items-center justify-center rounded p-1 text-outline transition-colors hover:text-on-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46A11.804 11.804 0 0 0 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78 3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
              </svg>
            )}
          </button>
        </div>
        {errors.password && (
          <div className="mt-1 flex items-center gap-1.5 text-danger" role="alert">
            <ErrorIcon />
            <span className="text-xs font-medium">{errors.password.message}</span>
          </div>
        )}

        {/* Password strength bar */}
        <div className="pt-1.5 space-y-1">
          <div className="grid grid-cols-4 gap-1.5" data-testid="password-strength">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-colors ${
                  strength >= i
                    ? strengthToColor(strength)
                    : 'bg-surface-container-high'
                }`}
                data-testid={`strength-seg-${i}`}
              />
            ))}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-on-surface-variant">{t('passwordHint')}</p>
            {strength > 0 && (
              <span className={`text-xs font-semibold ${strengthToColor(strength)}`}>
                {strengthLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Nhập lại mật khẩu */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmPassword" className="text-sm font-semibold text-on-surface">
          {t('confirmPasswordLabel')}
        </Label>
        <div className="relative flex items-center">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder={t('confirmPasswordPlaceholder')}
            aria-invalid={!!errors.confirmPassword}
            className="h-[42px] rounded-lg bg-surface-container-lowest px-3.5 pr-11 shadow-[inset_0_0_0_1px_#bfc7d2]"
            {...register('confirmPassword')}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((v) => !v)}
            aria-label={showConfirmPassword ? 'Ẩn nhập lại mật khẩu' : 'Hiện nhập lại mật khẩu'}
            className="absolute right-2.5 flex items-center justify-center rounded p-1 text-outline transition-colors hover:text-on-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {showConfirmPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46A11.804 11.804 0 0 0 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78 3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
              </svg>
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <div className="mt-1 flex items-center gap-1.5 text-danger" role="alert">
            <ErrorIcon />
            <span className="text-xs font-medium">{errors.confirmPassword.message}</span>
          </div>
        )}
      </div>

      {/* Checkbox đồng ý điều khoản */}
      <div className="pt-1">
        <label className="flex items-start gap-2.5 cursor-pointer select-none">
          <div className="relative mt-0.5 flex shrink-0 items-center justify-center">
            <input
              type="checkbox"
              checked={agreedTerms}
              onChange={(e) => setAgreedTerms(e.target.checked)}
              className="peer h-[18px] w-[18px] cursor-pointer appearance-none rounded bg-surface-container-lowest shadow-sm transition-colors checked:bg-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              data-testid="terms-checkbox"
            />
            <span className="absolute text-sm font-bold text-on-primary pointer-events-none opacity-0 peer-checked:opacity-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
            </span>
          </div>
          <span className="text-sm leading-tight text-on-surface-variant">
            {t('termsLabel')}{' '}
            <a
              href="/terms"
              className="font-semibold text-primary hover:underline"
            >
              {t('termsLink')}
            </a>{' '}
            {t('andLabel')}{' '}
            <a
              href="/privacy"
              className="font-semibold text-primary hover:underline"
            >
              {t('privacyLink')}
            </a>
          </span>
        </label>
      </div>

      {/* API Error */}
      {apiError && !hasErrors && (
        <div className="mt-1 flex items-center gap-1.5 text-danger" role="alert">
          <ErrorIcon />
          <span className="text-xs font-medium">{apiError}</span>
        </div>
      )}

      {/* Primary submit */}
      <Button
        type="submit"
        className="mt-1 h-11 w-full gap-2 rounded-lg bg-primary font-semibold text-on-primary shadow-sm transition-all hover:bg-primary-container active:scale-[0.99]"
        disabled={registerMutation.isPending}
        data-testid="register-submit"
      >
        {t('submit')}
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
        </svg>
      </Button>

      {/* Link đăng nhập */}
      <p className="mt-1 text-center text-sm text-on-surface-variant">
        {t('hasAccount')}{' '}
        <Link
          href={ROUTES.LOGIN}
          className="font-semibold text-primary transition-colors hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
        >
          {t('loginCta')}
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

/** Password strength score 0-4 */
function computePasswordStrength(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Za-z]/.test(password) && /\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(4, score);
}

function strengthToColor(strength: number): string {
  if (strength <= 1) return 'bg-danger';
  if (strength === 2) return 'bg-warning';
  if (strength === 3) return 'bg-secondary';
  return 'bg-secondary';
}

function getStrengthLabel(
  strength: number,
  t: ReturnType<typeof useTranslations>
): string {
  if (strength === 0) return '';
  if (strength === 1) return t('weak');
  if (strength === 2) return t('medium');
  if (strength === 3) return t('strong');
  return t('veryStrong');
}
