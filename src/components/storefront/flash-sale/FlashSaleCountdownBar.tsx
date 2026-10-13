/**
 * FlashSaleCountdownBar – thanh đếm ngược trên đầu phiên Flash Sale.
 *
 * - 4 ô: ngày / giờ / phút / giây (chỉ hiển thị ngày nếu > 24h).
 * - Chip "X.Xk đang xem" bên phải.
 * - Hết hạn → text "Kết thúc" + thay đổi tone.
 * - Server time offset: tự cộng offset nếu prop `serverOffsetMs` được truyền.
 *
 * Stitch reference: trang-flash-sale.md L100-L143
 */

"use client";

import { useEffect, useState } from "react";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";

export interface FlashSaleCountdownBarProps {
  endsAt: string;
  liveViewers: number;
  /** Độ lệch server time (ms) – Date.now() + serverOffsetMs = serverTime. */
  serverOffsetMs?: number;
  className?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

function calcTimeLeft(target: number, now: number): TimeLeft {
  const diff = target - now;
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }
  const seconds = Math.floor((diff / 1000) % 60);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  return { days, hours, minutes, seconds, expired: false };
}

function formatViewers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return n.toLocaleString("vi-VN");
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

export function FlashSaleCountdownBar({
  endsAt,
  liveViewers,
  serverOffsetMs = 0,
  className,
}: FlashSaleCountdownBarProps) {
  const target = Date.parse(endsAt);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
    calcTimeLeft(target, Date.now() + serverOffsetMs),
  );

  useEffect(() => {
    const tick = () => {
      setTimeLeft(calcTimeLeft(target, Date.now() + serverOffsetMs));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [target, serverOffsetMs]);

  return (
    <div
      data-testid="flash-sale-countdown"
      className={cn(
        "mb-6 flex items-center gap-3 rounded-xl border border-tertiary/20 bg-tertiary-fixed-dim p-4 shadow-sm",
        className,
      )}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-tertiary text-on-tertiary shadow-inner">
        <MaterialSymbol name="bolt" size="[24px]" fill aria-hidden />
      </div>

      <div className="flex-1">
        <h2 className="mb-1 text-label-lg font-bold uppercase tracking-wider text-tertiary">
          {timeLeft.expired ? "Phiên đã kết thúc" : "Kết thúc sau"}
        </h2>
        <div
          className="flex items-baseline gap-1.5 font-mono text-headline-md font-bold tabular-nums text-on-surface"
          role="timer"
          aria-live="polite"
        >
          {timeLeft.expired ? (
            <span className="text-on-surface-variant">Kết thúc</span>
          ) : (
            <>
              {timeLeft.days > 0 && (
                <>
                  <span>{pad(timeLeft.days)}</span>
                  <span className="text-sm font-semibold text-on-surface-variant">ngày</span>
                </>
              )}
              <span>{pad(timeLeft.hours)}</span>
              <span className="text-on-surface-variant">:</span>
              <span>{pad(timeLeft.minutes)}</span>
              <span className="text-on-surface-variant">:</span>
              <span>{pad(timeLeft.seconds)}</span>
            </>
          )}
        </div>
      </div>

      <div className="hidden h-10 w-px bg-outline-variant sm:block" />

      <div className="hidden shrink-0 items-center gap-1.5 rounded-full bg-tertiary/10 px-3 py-1.5 sm:flex">
        <MaterialSymbol name="remove_red_eye" size="[16px]" className="text-tertiary" aria-hidden />
        <span className="text-label-md font-bold text-tertiary">
          {formatViewers(liveViewers)} đang xem
        </span>
        <span className="relative ml-1 flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tertiary opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-tertiary" />
        </span>
      </div>
    </div>
  );
}
