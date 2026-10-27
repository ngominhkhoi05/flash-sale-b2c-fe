"use client";

import Link from "next/link";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export interface ServerConnectionErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showHomeButton?: boolean;
  className?: string;
  details?: string;
}

/**
 * Component hiển thị khi mất kết nối mạng hoặc không kết nối được tới backend server.
 * Thiết kế theo chuẩn Material 3 / Stitch tokens của Vibe Mart.
 */
export function ServerConnectionError({
  title = "Không thể kết nối đến máy chủ",
  message = "Mất kết nối mạng hoặc máy chủ không phản hồi. Vui lòng kiểm tra lại kết nối internet của bạn và thử lại.",
  onRetry,
  showHomeButton = true,
  className,
  details,
}: ServerConnectionErrorProps) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <div
      data-testid="server-connection-error"
      className={cn(
        "mx-auto flex max-w-lg flex-col items-center justify-center rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-6 text-center shadow-xs md:p-10",
        className
      )}
    >
      {/* Icon halo */}
      <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-rose-50 text-rose-600 ring-8 ring-rose-50/50">
        <MaterialSymbol name="wifi_off" size="[40px]" />
      </div>

      <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
        <MaterialSymbol name="cloud_off" size="[14px]" />
        Mất kết nối máy chủ
      </span>

      <h2 className="text-xl font-bold text-on-surface md:text-2xl">{title}</h2>

      <p className="mt-2.5 text-sm text-on-surface-variant md:text-base">
        {message}
      </p>

      {details && (
        <details className="mt-4 w-full text-left">
          <summary className="cursor-pointer text-xs font-medium text-on-surface-variant hover:text-on-surface">
            Chi tiết kỹ thuật
          </summary>
          <pre className="mt-2 max-h-32 overflow-auto rounded-lg bg-surface-container-low p-3 text-xs text-on-surface-variant">
            {details}
          </pre>
        </details>
      )}

      {/* Action buttons */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleRetry}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow-xs transition-all hover:bg-primary-hover active:scale-95"
        >
          <MaterialSymbol name="refresh" size="base" />
          <span>Thử lại</span>
        </button>

        {showHomeButton && (
          <Link
            href={ROUTES.HOME}
            className="inline-flex items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest px-5 py-2.5 text-sm font-semibold text-on-surface transition-all hover:bg-surface-container active:scale-95"
          >
            <MaterialSymbol name="home" size="base" />
            <span>Về trang chủ</span>
          </Link>
        )}
      </div>
    </div>
  );
}
