"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { maskEmail } from "@/lib/format/mask-email";
import { OtpStepper } from "./OtpStepper";

/**
 * VerifyEmailSuccessCard – card thành công sau khi xác thực email.
 *
 * Flow:
 *  - User vừa submit OTP thành công → redirect tới `/verify-email/success?email=...`
 *  - Hiển thị thông báo thành công + countdown 5s
 *  - Auto redirect về `/login` (mặc định) sau khi countdown về 0
 *  - User có thể click nút "Bắt đầu mua sắm" để đi ngay (cũng về /login)
 *
 * Stitch spec (`docs/superpowers/handoffs/xac-thu-email-thanh-cong.md`):
 *  - Stepper: bước 1 ✓ xanh, bước 2 ✓ xanh, bước 3 = "3" nền primary xanh dương
 *  - Top accent line: gradient `from-success via-primary to-success`
 *  - Icon: vòng tròn emerald-50 + check xanh đậm + pulse ring animation
 *  - Title: "Email đã được xác thực"
 *  - Box tài khoản: icon person + email masked + badge "Đã kích hoạt"
 *  - Nút primary: "Bắt đầu mua sắm" → /login
 *  - Auto-redirect: "Tự chuyển trang sau **5** giây." (spinner + countdown)
 */
export interface VerifyEmailSuccessCardProps {
  /** Email đã xác thực thành công. */
  email: string;
  /** Đường dẫn redirect (mặc định `/login`). */
  redirectTo?: string;
  /** Số giây đếm ngược trước khi auto-redirect (mặc định 5). */
  redirectSeconds?: number;
}

const CHECK_ICON = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    style={{ fontVariationSettings: "'wght' 600" }}
  >
    <path d="M5 13l4 4L19 7" />
  </svg>
);

const PERSON_ICON = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden
  >
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

const SHOPPING_BAG_ICON = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden
  >
    <path d="M18 6h-2c0-2.21-1.79-4-4-4S8 3.79 8 6H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6-2c1.1 0 2 .9 2 2h-4c0-1.1.9-2 2-2zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" />
  </svg>
);

const SMALL_CHECK_ICON = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden
  >
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
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

export function VerifyEmailSuccessCard({
  email,
  redirectTo = "/login",
  redirectSeconds = 5,
}: VerifyEmailSuccessCardProps) {
  const t = useTranslations("auth.verifyEmail");
  const router = useRouter();
  const [remaining, setRemaining] = useState<number>(redirectSeconds);

  useEffect(() => {
    if (remaining <= 0) {
      router.push(redirectTo);
      return undefined;
    }
    const id = setInterval(() => {
      setRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [remaining, redirectTo, router]);

  const maskedEmail = email ? maskEmail(email) : t("placeholderEmail");

  return (
    <div
      className="flex w-full flex-col gap-0"
      data-testid="verify-email-success-card"
    >
      {/* Stepper */}
      <div className="mb-7">
        <OtpStepper steps={["done", "done", "active"]} />
      </div>

      {/* Card chính */}
      <div
        className="relative overflow-hidden rounded-2xl bg-surface-container-lowest p-8 shadow-sm border border-outline-variant text-center sm:p-9"
        data-testid="success-card-inner"
      >
        {/* Top accent line gradient */}
        <div
          className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-success via-primary to-success"
          aria-hidden
        />

        {/* Icon check trong vòng tròn với pulse ring */}
        <div className="relative mx-auto mt-1 flex h-16 w-16 items-center justify-center">
          <div
            className="absolute inset-0 rounded-full bg-success-soft opacity-60"
            style={{ animation: "subtle-pulse 2.4s ease-in-out infinite" }}
            aria-hidden
          />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-success-soft bg-success-soft shadow-sm">
            <span className="text-success font-bold">{CHECK_ICON}</span>
          </div>
        </div>

        {/* Tiêu đề */}
        <h1
          className="mt-5 mb-2 text-2xl font-bold tracking-tight text-on-surface"
          data-testid="success-title"
        >
          {t("success.title")}
        </h1>

        {/* Mô tả + email masked */}
        <p
          className="mb-6 text-sm leading-relaxed text-on-surface-variant"
          data-testid="success-description"
        >
          {t("success.description")}
          <br />
          <span className="font-semibold text-on-surface">{maskedEmail}</span>{" "}
          {t("success.descriptionWithEmail", { email: "" }).trim()}
        </p>

        {/* Hộp thông tin tài khoản */}
        <div
          className="mb-6 flex items-center justify-between rounded-xl border border-outline-variant bg-surface-container p-4 text-left"
          data-testid="success-account-box"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
              {PERSON_ICON}
            </div>
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-on-surface-variant">
                {t("success.accountLabel")}
              </div>
              <div className="font-mono text-sm font-semibold text-on-surface">
                {maskedEmail}
              </div>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-success-soft bg-success-soft px-2.5 py-1 text-xs font-semibold text-success">
            <span className="font-bold">{SMALL_CHECK_ICON}</span>
            {t("success.activatedBadge")}
          </span>
        </div>

        {/* Nút primary "Bắt đầu mua sắm" */}
        <Link
          href={redirectTo}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-on-primary shadow-sm shadow-primary/20 transition-all hover:bg-primary-hover active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          data-testid="success-shop-now-button"
        >
          {SHOPPING_BAG_ICON}
          <span>{t("success.shopNow")}</span>
        </Link>

        {/* Auto-redirect countdown */}
        <div
          className="mt-4 flex items-center justify-center gap-2 text-xs text-on-surface-variant"
          data-testid="success-countdown"
        >
          <svg
            className="h-3.5 w-3.5 animate-spin text-on-surface-variant"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>
            {t("success.autoRedirect")}{" "}
            <strong className="font-semibold text-on-surface">
              {remaining}
            </strong>{" "}
            {t("success.autoRedirectUnit")}
          </span>
        </div>
      </div>

      {/* Security note */}
      <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-on-surface-variant">
        <span className="text-success">{SECURITY_ICON}</span>
        <span>{t("securityNote")}</span>
      </div>

      {/* Inline style for pulse animation (matches Stitch) */}
      <style jsx>{`
        @keyframes subtle-pulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.08);
            opacity: 0.4;
          }
        }
      `}</style>
    </div>
  );
}
