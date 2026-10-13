"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/**
 * ResendCountdown – đếm ngược thời gian cho phép gửi lại mã.
 *
 * Pattern:
 *  - Bắt đầu với `seconds` (mặc định 60).
 *  - Đếm ngược 1 giây/lần.
 *  - Khi về 0: hiển thị button "Gửi lại mã" (onClick → gọi onResend).
 *  - Component cha quyết định khi nào gọi onResend (qua state lift).
 *  - Khi prop `resetKey` thay đổi → React reset toàn bộ state nhờ `key` prop.
 *
 * Stitch spec:
 *  - Trước countdown: text-xs, màu slate-500
 *  - Khi về 0: link xanh dạng button, màu primary
 */
export interface ResendCountdownProps {
  /** Số giây ban đầu (mặc định 60). */
  seconds?: number;
  /** Callback khi user click "Gửi lại mã". */
  onResend?: () => void;
  /** Khi đang gọi API resend. */
  isPending?: boolean;
  /** Reset countdown (vd sau khi resend thành công) – thay đổi giá trị sẽ reset state. */
  resetKey?: string | number;
  className?: string;
}

const DEFAULT_SECONDS = 60;

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${pad(m)}:${pad(s)}`;
}

interface InnerProps {
  initialSeconds: number;
  onResend?: () => void;
  isPending: boolean;
  className?: string;
}

/**
 * Phần thân countdown – state sống ở đây. Component cha sẽ thay đổi `key`
 * để remount khi cần reset, tránh setState trong effect.
 */
function ResendCountdownInner({
  initialSeconds,
  onResend,
  isPending,
  className,
}: InnerProps) {
  const t = useTranslations("auth.verifyEmail");
  const [remaining, setRemaining] = useState<number>(initialSeconds);

  useEffect(() => {
    if (remaining <= 0) return undefined;
    const id = setInterval(() => {
      setRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [remaining]);

  if (remaining > 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center gap-1 text-xs text-on-surface-variant",
          className
        )}
        data-testid="resend-countdown"
      >
        <span>{t("resendHint")}</span>
        <span
          className="font-medium text-outline"
          data-testid="resend-countdown-timer"
        >
          {t("resendCountdown", { seconds: formatTime(remaining) })}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-1 text-xs",
        className
      )}
      data-testid="resend-button-group"
    >
      <span className="text-on-surface-variant">{t("resendHint")}</span>
      <button
        type="button"
        onClick={onResend}
        disabled={isPending}
        className="font-semibold text-primary transition-colors hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded disabled:opacity-50 disabled:cursor-not-allowed"
        data-testid="resend-button"
      >
        {t("resendNow")}
      </button>
    </div>
  );
}

export function ResendCountdown({
  seconds = DEFAULT_SECONDS,
  onResend,
  isPending = false,
  resetKey,
  className,
}: ResendCountdownProps) {
  return (
    <ResendCountdownInner
      key={String(resetKey ?? "initial")}
      initialSeconds={seconds}
      onResend={onResend}
      isPending={isPending}
      className={className}
    />
  );
}
