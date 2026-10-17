import { useTranslations } from "next-intl";

/**
 * Loading skeleton cho Google OAuth callback — match UI design từ
 * page-client.tsx (Stitch `dang-xac-thuc.md`, Commit F 2026-10-17).
 * Next 16 tự động dùng khi Suspense fallback.
 */
export function LoadingSkeleton() {
  const t = useTranslations("auth.google.callback");
  return (
    <div
      className="flex w-full items-center justify-center p-4 sm:p-6"
      data-testid="google-callback-loading"
    >
      <div
        className="flex w-full max-w-[420px] flex-col items-center rounded-2xl border border-outline-variant bg-surface-container-lowest p-8 text-center shadow-lg shadow-outline-variant/30 sm:p-10"
        data-testid="google-callback-card"
      >
        <div
          className="relative mb-6 flex h-16 w-16 items-center justify-center"
          data-testid="google-callback-spinner-wrapper"
        >
          <div
            className="absolute inset-0 rounded-full bg-primary-fixed/30 opacity-25"
            style={{ animation: "google-callback-ping 1.5s cubic-bezier(0,0,0.2,1) infinite" }}
            aria-hidden
          />
          <svg
            className="h-16 w-16"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ animation: "google-callback-spin 1s linear infinite" }}
            aria-hidden
            data-testid="google-callback-spinner"
          >
            <circle
              cx="32"
              cy="32"
              r="26"
              stroke="currentColor"
              strokeOpacity="0.2"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <circle
              cx="32"
              cy="32"
              r="26"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray="163"
              strokeDashoffset="118"
              className="text-primary"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="material-symbols-outlined text-[22px] text-primary"
              style={{ animation: "google-callback-pulse 2s ease-in-out infinite" }}
              aria-hidden
              data-testid="google-callback-email-icon"
            >
              mark_email_read
            </span>
          </div>
        </div>

        <h1
          className="mb-2.5 text-xl font-bold tracking-tight text-on-surface sm:text-2xl"
          data-testid="google-callback-title"
        >
          {t("verifyingEmail")}
        </h1>
        <p
          className="max-w-[340px] text-sm font-normal leading-relaxed text-on-surface-variant"
          data-testid="google-callback-subtitle"
        >
          {t("verifyingSubtitle")}
        </p>

        <div
          className="mt-8 flex w-full items-center justify-center gap-2 border-t border-outline-variant pt-6 text-xs text-on-surface-variant"
          data-testid="google-callback-tls-badge"
        >
          <span
            className="material-symbols-outlined text-[16px] text-on-surface-variant"
            aria-hidden
          >
            lock
          </span>
          <span>{t("tlsBadge")}</span>
        </div>
      </div>
    </div>
  );
}

export default LoadingSkeleton;
