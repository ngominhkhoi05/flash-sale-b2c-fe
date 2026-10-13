/**
 * FlashSaleLiveIndicator – pill nổi góc dưới phải.
 *
 * Dùng khi user scroll xuống cuối trang nhưng phiên vẫn ACTIVE. Nhắc user
 * rằng đang có phiên Flash Sale đang chạy với số người xem hiện tại.
 *
 * Stitch reference: trang-flash-sale.md L640-L700
 */

"use client";

import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";

export interface FlashSaleLiveIndicatorProps {
  activeSlotId: number;
  liveViewers?: number;
  className?: string;
}

function formatViewers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return n.toLocaleString("vi-VN");
}

export function FlashSaleLiveIndicator({
  activeSlotId,
  liveViewers,
  className,
}: FlashSaleLiveIndicatorProps) {
  if (!activeSlotId) return null;
  return (
    <div
      data-testid="flash-sale-live-indicator"
      className={cn(
        "pointer-events-auto fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full border border-tertiary bg-tertiary px-4 py-2 text-on-tertiary shadow-lg",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-on-tertiary opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-on-tertiary" />
      </span>
      <MaterialSymbol name="bolt" size="[16px]" fill aria-hidden />
      <span className="text-label-md font-bold uppercase tracking-wider">Đang diễn ra</span>
      {liveViewers !== undefined && (
        <span className="flex items-center gap-1 border-l border-on-tertiary/30 pl-2 text-label-md font-semibold">
          <MaterialSymbol name="remove_red_eye" size="[14px]" aria-hidden />
          {formatViewers(liveViewers)}
        </span>
      )}
    </div>
  );
}
