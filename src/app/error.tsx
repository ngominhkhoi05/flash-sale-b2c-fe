"use client";

import { useEffect } from "react";
import { ServerConnectionError } from "@/components/common/ServerConnectionError";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import Link from "next/link";
import { ROUTES } from "@/lib/constants";

/**
 * Root Error Boundary cấp ứng dụng.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  const errorMessage = error?.message || "";
  const isNetwork =
    errorMessage.includes("fetch failed") ||
    errorMessage.includes("Mất kết nối mạng") ||
    errorMessage.includes("NETWORK_ERROR") ||
    errorMessage.includes("Failed to fetch") ||
    error.name === "TypeError";

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6">
      {isNetwork ? (
        <ServerConnectionError
          onRetry={reset}
          title="Không thể kết nối đến máy chủ"
          message="Mất kết nối mạng hoặc máy chủ không phản hồi. Vui lòng kiểm tra lại kết nối internet của bạn và thử lại."
          details={process.env.NODE_ENV === "development" ? errorMessage : undefined}
        />
      ) : (
        <div className="mx-auto flex max-w-lg flex-col items-center justify-center rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-6 text-center shadow-xs md:p-10">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-600 ring-8 ring-rose-50/50">
            <MaterialSymbol name="error" size="3xl" />
          </div>
          <h2 className="text-xl font-bold text-on-surface md:text-2xl">
            Đã có sự cố xảy ra
          </h2>
          <p className="mt-2 text-sm text-on-surface-variant md:text-base">
            Hệ thống tạm thời gặp trục trặc khi tải trang này.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow-xs transition-all hover:bg-primary-hover active:scale-95"
            >
              <MaterialSymbol name="refresh" size="base" />
              <span>Thử lại</span>
            </button>
            <Link
              href={ROUTES.HOME}
              className="inline-flex items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest px-5 py-2.5 text-sm font-semibold text-on-surface transition-all hover:bg-surface-container active:scale-95"
            >
              <MaterialSymbol name="home" size="base" />
              <span>Về trang chủ</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
