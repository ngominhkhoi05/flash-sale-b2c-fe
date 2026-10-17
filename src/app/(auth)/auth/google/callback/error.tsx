"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

/**
 * Error boundary cho route /auth/google/callback.
 * Next 16 dùng file `error.tsx` để catch error thrown từ Server
 * Component hoặc trong render tree. Mọi lỗi render ở đây thường
 * là do code trong page.tsx/page-client.tsx — không phải lỗi nghiệp vụ
 * (CSRF/no-code/API error đã được handle inline trong page-client).
 *
 * @see docs/handoffs/google-oauth-fe-integration.md mục 7
 */
export default function GoogleCallbackError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("error");

  useEffect(() => {
    console.error("[auth.google.callback.error]", error);
  }, [error]);

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background p-6"
      data-testid="google-callback-error"
    >
      <div className="max-w-md text-center">
        <h2 className="mb-2 text-xl font-semibold text-on-surface">
          {t("pageError")}
        </h2>
        <p className="mb-6 text-sm text-on-surface-variant">
          {error.message || t("unknownError")}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:opacity-90"
          >
            {t("retry")}
          </button>
          <a
            href="/login"
            className="rounded-md border border-outline px-4 py-2 text-sm font-medium text-on-surface hover:bg-surface-variant"
          >
            {t("backToLogin")}
          </a>
        </div>
      </div>
    </div>
  );
}
