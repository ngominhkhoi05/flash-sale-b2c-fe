"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import {
  verifyOtpSchema,
  type VerifyOtpInput,
  MOCK_OTP_TTL_MS,
  useVerifyOtpMutation,
  useResendOtpMutation,
} from "@/features/auth";
import { OtpInput } from "./OtpInput";
import { OtpStepper } from "./OtpStepper";
import { ResendCountdown } from "./ResendCountdown";
import { cn } from "@/lib/utils";

/**
 * VerifyEmailForm – form xác thực email 6 số (Stitch screen 26dbd4cd7e7f47c68d509c58a44cb083).
 *
 * Flow:
 *  1. Mount → bắt đầu countdown 60s cho resend + validity timer 10 phút
 *  2. User nhập 6 số → submit
 *  3. Thành công: invalidate + redirect về /login
 *  4. Sai mã: inline banner đỏ + shake animation + đếm số lần còn lại
 *  5. Hết hạn: banner cảnh báo + nút gửi mã mới
 *  6. Click "Gửi lại mã": reset countdown + reset validity
 *
 * @see docs/superpowers/plans/2026-10-13-verify-email-otp-form.md
 */
export interface VerifyEmailFormProps {
  /** Email đang cần xác thực. */
  email: string;
  /** Đường dẫn redirect sau khi xác thực thành công (mặc định /login). */
  redirectTo?: string;
  /** Thời gian countdown resend (giây, mặc định 60). */
  resendSeconds?: number;
}

const MAIL_ICON = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden
  >
    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
  </svg>
);

const CHECK_SMALL_ICON = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M5 13l4 4L19 7" />
  </svg>
);

const X_SMALL_ICON = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const REFRESH_ICON = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const SCHEDULE_ICON = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden
  >
    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
  </svg>
);

const ALERT_ICON = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const SECURITY_ICON = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden
  >
    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
  </svg>
);

const WARNING_ICON = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden
  >
    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
  </svg>
);

const LOCK_SMALL_ICON = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden
  >
    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
  </svg>
);

const ARROW_BACK_ICON = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden
  >
    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
  </svg>
);

/** Mask email hiển thị cho user (2 ký tự đầu + *** + domain). */
function maskEmail(raw: string): string {
  if (!raw) return "";
  const atIdx = raw.indexOf("@");
  if (atIdx <= 0) return raw;
  const local = raw.slice(0, Math.min(2, atIdx));
  const domain = raw.slice(atIdx);
  return `${local}***${domain}`;
}

export function VerifyEmailForm({
  email,
  redirectTo = ROUTES.LOGIN,
  resendSeconds = 60,
}: VerifyEmailFormProps) {
  const t = useTranslations("auth.verifyEmail");
  const tErr = useTranslations("auth.errors");
  const router = useRouter();

  const {
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<VerifyOtpInput>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { code: "" },
    mode: "onChange",
  });

  const code = useWatch({ control, name: "code" });

  // State cho UX (inline error, attempts, shake animation, expired)
  const [inlineError, setInlineError] = useState<{
    type: "invalid" | "expired" | "tooMany";
    attemptsLeft?: number;
    cooldownMinutes?: number;
    shakeKey: number; // tăng mỗi lần lỗi để trigger shake
  } | null>(null);

  const [shake, setShake] = useState(false);

  const verifyMutation = useVerifyOtpMutation();
  const resendMutation = useResendOtpMutation();

  // Validity timer (10 phút mặc định theo design, dùng MOCK_OTP_TTL_MS = 60s cho mock)
  // Hiển thị "Mã có hiệu lực trong X phút" → đếm ngược đơn giản
  const [validityRemaining, setValidityRemaining] = useState<number>(() =>
    Math.floor(MOCK_OTP_TTL_MS / 1000)
  );
  const [resendKey, setResendKey] = useState<string>("init");

  useEffect(() => {
    const id = setInterval(() => {
      setValidityRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  function triggerShake() {
    setShake(false);
    requestAnimationFrame(() => setShake(true));
    setTimeout(() => setShake(false), 600);
  }

  const onSubmit = (data: VerifyOtpInput) => {
    setInlineError(null);
    verifyMutation.mutate(
      { email, code: data.code },
      {
        onSuccess: () => {
          toast.success(t("submit"));
          // Redirect sang trang success với email để hiển thị thông báo thành công
          // (auto-redirect 5s về redirectTo mặc định = /login)
          const target = `${ROUTES.VERIFY_EMAIL_SUCCESS}?email=${encodeURIComponent(email)}`;
          // Pass redirectTo qua query param để SuccessCard auto-redirect đúng
          const finalTarget = redirectTo !== ROUTES.LOGIN
            ? `${target}&redirectTo=${encodeURIComponent(redirectTo)}`
            : target;
          router.push(finalTarget);
        },
        onError: (err) => {
          if (err instanceof ApiError) {
            if (err.code === "OTP_INVALID") {
              const attemptsLeft = (err.details as { attemptsLeft?: number })
                ?.attemptsLeft;
              setInlineError({
                type: "invalid",
                attemptsLeft,
                shakeKey: Date.now(),
              });
              setResendKey(`err-${Date.now()}`);
              triggerShake();
            } else if (err.code === "OTP_EXPIRED") {
              setInlineError({ type: "expired", shakeKey: Date.now() });
              triggerShake();
            } else if (err.code === "OTP_TOO_MANY_ATTEMPTS") {
              setInlineError({
                type: "tooMany",
                cooldownMinutes: 5,
                shakeKey: Date.now(),
              });
              triggerShake();
            } else {
              toast.error(tErr("identifierInvalid") || err.message);
            }
          } else {
            toast.error(err.message);
          }
        },
      }
    );
  };

  function handleResend() {
    resendMutation.mutate(
      { email },
      {
        onSuccess: () => {
          toast.success(t("resendSuccess"));
          setInlineError(null);
          setValue("code", "");
          setValidityRemaining(Math.floor(MOCK_OTP_TTL_MS / 1000));
          setResendKey(`resend-${Date.now()}`);
        },
      }
    );
  }

  const validityMinutes = Math.floor(validityRemaining / 60);

  // State machine cho visual (Stitch state B – sai mã)
  const isInvalid = inlineError?.type === "invalid";
  const isExpired = inlineError?.type === "expired";
  const isTooMany = inlineError?.type === "tooMany";
  const hasError = isInvalid || isExpired || isTooMany;

  // Step state: khi có lỗi thì bước 2 hiển thị "error" (vòng tròn đỏ)
  const stepperState: ["done", "active" | "error", "pending"] = [
    "done",
    isInvalid || isExpired || isTooMany ? "error" : "active",
    "pending",
  ];

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-full flex-col gap-0"
      noValidate
      data-testid="verify-email-form"
    >
      {/* Stepper */}
      <div className="mb-7">
        <OtpStepper steps={stepperState} />
      </div>

      {/* ========== State C (tooMany) – trang riêng ========== */}
      {isTooMany ? (
        <div
          className="rounded-2xl bg-surface-container-lowest p-8 shadow-sm border border-outline-variant text-center sm:p-9"
          data-testid="too-many-card"
        >
          {/* Icon phong bì có ổ khoá đỏ */}
          <div className="mb-5 flex items-center justify-center">
            <div
              className="relative flex h-14 w-14 items-center justify-center rounded-full bg-warning-soft text-warning shadow-sm"
              data-testid="otp-icon-mail"
              data-state="locked"
            >
              {MAIL_ICON}
              <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-on-primary ring-2 ring-surface-container-lowest">
                {LOCK_SMALL_ICON}
              </div>
            </div>
          </div>

          {/* Title */}
          <h1
            className="mb-2 text-2xl font-bold tracking-tight text-on-surface"
            data-testid="too-many-title"
          >
            {t("tooMany.title")}
          </h1>

          {/* Description */}
          <p
            className="mb-5 text-sm leading-relaxed text-on-surface-variant"
            data-testid="too-many-description"
          >
            {t("tooMany.description")}
          </p>

          {/* Banner vàng cảnh báo bảo mật */}
          <div
            className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left"
            data-testid="too-many-security-banner"
            role="alert"
          >
            <span className="text-warning shrink-0 mt-0.5">
              {WARNING_ICON}
            </span>
            <p className="text-xs font-semibold text-amber-900 leading-snug">
              {t("tooMany.securityTitle")}{" "}
              <span className="font-normal text-amber-800">
                {t("tooMany.securityDesc")}
              </span>
            </p>
          </div>

          {/* 6 ô OTP bị khoá */}
          <div className="mb-6 flex justify-center">
            <OtpInput
              value=""
              onChange={() => {
                /* locked: no-op */
              }}
              disabledState="locked"
            />
          </div>

          {/* Nút primary "Gửi mã mới" */}
          <button
            type="button"
            onClick={handleResend}
            disabled={resendMutation.isPending}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            data-testid="resend-new-code-button"
          >
            {REFRESH_ICON}
            <span>
              {resendMutation.isPending
                ? t("submitting")
                : t("tooMany.sendNew")}
            </span>
          </button>

          {/* Link phụ */}
          <div className="mt-4 flex flex-col items-center gap-2">
            <p className="text-xs text-on-surface-variant">
              {t("tooMany.orSignUpDifferent")}{" "}
              <a
                href={ROUTES.REGISTER}
                className="font-medium text-primary hover:underline"
                data-testid="sign-up-different-link"
              >
                {t("tooMany.signUpDifferentLink")}
              </a>
            </p>
            <a
              href={ROUTES.REGISTER}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-on-surface-variant transition-colors hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
              data-testid="back-to-register"
            >
              {ARROW_BACK_ICON}
              {t("backToRegister")}
            </a>
          </div>
        </div>
      ) : (
      <>
      {/* Card wrapper (relative để chứa line đỏ top khi error) */}
      <div className="relative overflow-hidden rounded-2xl bg-surface-container-lowest p-8 shadow-sm border border-outline-variant sm:p-9">
        {/* Line đỏ trên top card khi state B */}
        {hasError && (
          <div
            className="absolute inset-x-0 top-0 h-1 bg-danger"
            data-testid="card-error-line"
            aria-hidden
          />
        )}

        {/* Icon phong bì (state A: xanh + check; state B: đỏ + X) */}
        <div className="mb-5 flex items-center justify-center">
          <div
            className={cn(
              "relative flex h-14 w-14 items-center justify-center rounded-full shadow-sm",
              hasError ? "bg-danger-soft text-danger" : "bg-primary-soft text-primary"
            )}
            data-testid="otp-icon-mail"
            data-state={hasError ? "error" : "default"}
          >
            {MAIL_ICON}
            <div
              className={cn(
                "absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-surface-container-lowest",
                hasError ? "bg-danger text-on-primary" : "bg-success text-on-primary"
              )}
            >
              {hasError ? X_SMALL_ICON : CHECK_SMALL_ICON}
            </div>
          </div>
        </div>

        {/* Title (state A: "Xác thực email của bạn"; state B: "Mã chưa đúng") */}
        <h1
          className="mb-2 text-center text-2xl font-bold tracking-tight text-on-surface"
          data-testid={isInvalid ? "error-title" : "page-title"}
        >
          {isInvalid ? t("error.title") : t("title")}
        </h1>

        {/* Description (state A: hướng dẫn + email; state B: mô tả + email masked) */}
        {isInvalid ? (
          <p
            className="mb-5 text-center text-sm leading-relaxed text-on-surface-variant"
            data-testid="error-description"
          >
            {t("error.description")}
            <br />
            <span className="font-semibold text-on-surface">
              {email ? maskEmail(email) : t("placeholderEmail")}
            </span>
          </p>
        ) : (
          <p className="mb-5 text-center text-sm leading-relaxed text-on-surface-variant">
            {t("description")}
            <br />
            <span className="font-semibold text-on-surface" data-testid="masked-email">
              {email ? maskEmail(email) : t("placeholderEmail")}
            </span>
            <a
              href={ROUTES.REGISTER}
              className="ml-1.5 text-xs font-normal text-primary hover:underline"
            >
              ({t("changeEmail")})
            </a>
          </p>
        )}

      {/* OTP Input */}
      <div
        className={`my-5 ${shake ? "animate-[shake_0.5s_cubic-bezier(.36,.07,.19,.97)_both]" : ""}`}
        data-testid="otp-shake-wrapper"
        data-shake={shake ? "true" : "false"}
      >
        <OtpInput
          value={code}
          onChange={(v) => {
            setValue("code", v, { shouldValidate: true });
            // Clear inline error khi user bắt đầu sửa
            if (inlineError) setInlineError(null);
          }}
          hasError={!!inlineError || !!errors.code}
          disabled={verifyMutation.isPending}
        />
      </div>

      {/* Zod error (hiếm khi vì OtpInput filter chỉ cho phép số) */}
      {errors.code && (
        <p
          className="mb-3 flex items-center justify-center gap-1.5 text-xs font-medium text-danger"
          role="alert"
          data-testid="otp-zod-error"
        >
          {ALERT_ICON}
          {errors.code.message}
        </p>
      )}

      {/* Validity timer */}
      <div
        className="mb-5 flex items-center justify-center gap-1.5 text-xs text-on-surface-variant"
        data-testid="validity-timer"
      >
        {SCHEDULE_ICON}
        <span>
          {t("validity", { minutes: Math.max(1, validityMinutes) })}
        </span>
      </div>

      {/* Inline error banner */}
      {inlineError && (
        <div
          className="mb-5 flex items-center justify-center gap-1.5 rounded-lg border border-danger-soft bg-danger-soft/50 px-3 py-2 text-xs font-medium text-danger"
          role="alert"
          data-testid="otp-error-banner"
          data-error-type={inlineError.type}
        >
          {ALERT_ICON}
          <span>
            {inlineError.type === "invalid" &&
              t("error.banner", { attempts: inlineError.attemptsLeft ?? 0 })}
            {inlineError.type === "expired" && t("error.expired")}
            {inlineError.type === "tooMany" &&
              t("error.tooManyAttempts", {
                minutes: inlineError.cooldownMinutes ?? 5,
              })}
          </span>
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={
          code.length !== 6 ||
          verifyMutation.isPending ||
          inlineError?.type === "tooMany"
        }
        className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-on-primary shadow-sm transition-colors hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        data-testid="verify-submit"
        data-mode={isInvalid ? "retry" : "verify"}
      >
        {isInvalid && REFRESH_ICON}
        {verifyMutation.isPending
          ? t("submitting")
          : isInvalid
            ? t("error.retry")
            : t("submit")}
      </button>

      {/* Resend countdown */}
      <div className="mt-4">
        <ResendCountdown
          seconds={resendSeconds}
          onResend={handleResend}
          isPending={resendMutation.isPending}
          resetKey={resendKey}
        />
      </div>

      {/* Divider */}
      <div className="mt-6 border-t border-outline-variant pt-5">
        <a
          href={ROUTES.REGISTER}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-on-surface-variant transition-colors hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
          data-testid="back-to-register"
        >
          {ARROW_BACK_ICON}
          {t("backToRegister")}
        </a>
      </div>

      {/* Security note */}
      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-on-surface-variant">
        <span className="text-success">{SECURITY_ICON}</span>
        <span>{t("securityNote")}</span>
      </div>
      </div>
      </>
      )}
    </form>
  );
}
