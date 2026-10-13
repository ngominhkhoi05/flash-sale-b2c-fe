/**
 * FlashSaleSlotNav – sticky nav hiển thị 5 slot theo giờ.
 *
 * 4 trạng thái slot:
 * - ENDED (đã kết thúc) – bg surface-container-low, text outline
 * - ACTIVE (đang diễn ra) – bg tertiary, text white, có "live" dot
 * - UPCOMING same day (sắp diễn ra hôm nay) – bg primary-fixed/40, text primary
 * - UPCOMING next day (ngày mai) – bg surface-container-low, text on-surface-variant
 *
 * Stitch reference: trang-flash-sale.md L69-L96
 */

"use client";

import { cn } from "@/lib/utils";

export interface FlashSaleSlotNavSlot {
  id: number;
  startTime: string;
  endTime: string;
  status: "UPCOMING" | "ACTIVE" | "ENDED";
}

export interface FlashSaleSlotNavProps {
  slots: FlashSaleSlotNavSlot[];
  activeSlotId: number;
  onSelect?: (slotId: number) => void;
  className?: string;
}

/** Format HH:mm từ ISO. */
function formatHHmm(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Slot có phải "Ngày mai" (qua ngày hôm nay) không. */
function isTomorrowSlot(iso: string): boolean {
  const slotDate = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return slotDate >= tomorrow && slotDate < new Date(tomorrow.getTime() + 86400000);
}

export function FlashSaleSlotNav({
  slots,
  activeSlotId,
  onSelect,
  className,
}: FlashSaleSlotNavProps) {
  return (
    <nav
      aria-label="Khung giờ Flash Sale"
      data-testid="flash-sale-slot-nav"
      className={cn(
        "sticky top-40 z-30 mb-6 rounded-xl bg-surface-container-lowest p-2 shadow-md backdrop-blur-md",
        className,
      )}
    >
      <div className="grid grid-cols-5 gap-2">
        {slots.slice(0, 5).map((slot) => {
          const isActive = slot.id === activeSlotId;
          const isEnded = slot.status === "ENDED";
          const isUpcomingToday = slot.status === "UPCOMING" && !isTomorrowSlot(slot.startTime);
          const isUpcomingTomorrow = slot.status === "UPCOMING" && isTomorrowSlot(slot.startTime);

          // Color/styling
          const containerCls = cn(
            "flex flex-col items-center justify-center rounded-lg py-2.5 px-1 text-center transition-all",
            isActive
              ? "relative bg-tertiary text-on-tertiary shadow-sm active:scale-[0.99] overflow-hidden"
              : isEnded
                ? "bg-surface-container-low hover:bg-surface-container"
                : isUpcomingToday
                  ? "bg-primary-fixed/40 hover:bg-primary-fixed"
                  : isUpcomingTomorrow
                    ? "bg-surface-container-low hover:bg-surface-container"
                    : "bg-surface-container-low hover:bg-surface-container",
          );

          const labelCls = cn(
            "text-headline-sm font-semibold transition-colors",
            isActive
              ? "text-on-tertiary"
              : isEnded
                ? "text-outline group-hover:text-on-surface"
                : isUpcomingToday
                  ? "text-primary"
                  : "text-on-surface-variant",
          );

          const subLabelCls = cn(
            "mt-0.5 text-label-sm font-medium",
            isActive ? "font-bold uppercase tracking-wider text-on-tertiary/90" : "text-outline",
            !isActive && isUpcomingToday && "text-primary",
            !isActive && !isEnded && !isUpcomingToday && "text-on-surface-variant",
          );

          return (
            <button
              key={slot.id}
              type="button"
              data-testid={`slot-${slot.id}`}
              aria-current={isActive ? "true" : undefined}
              onClick={() => onSelect?.(slot.id)}
              className={containerCls}
            >
              <div className="flex items-center gap-1.5">
                {isActive && (
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-surface-container-lowest opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-surface-container-lowest" />
                  </span>
                )}
                <span className={labelCls}>{formatHHmm(slot.startTime)}</span>
              </div>
              <span className={subLabelCls}>
                {isActive
                  ? "Đang diễn ra"
                  : isEnded
                    ? "Đã kết thúc"
                    : isUpcomingTomorrow
                      ? "Ngày mai"
                      : "Sắp diễn ra"}
              </span>
              {isActive && (
                <div className="absolute bottom-0 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-surface-container-lowest" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
