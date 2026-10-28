/**
 * FlashSaleSlotNav – thanh điều hướng hiển thị 5 slot theo giờ.
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
        "mb-6 rounded-xl bg-surface-container-lowest p-2 shadow-md",
        className,
      )}
    >
      <div className="grid grid-cols-5 gap-2">
        {slots.slice(0, 5).map((slot) => {
          const isSelected = slot.id === activeSlotId;
          const isSlotActive = slot.status === "ACTIVE";
          const isSlotEnded = slot.status === "ENDED";
          const isSlotUpcoming = slot.status === "UPCOMING";
          const isTomorrow = isSlotUpcoming && isTomorrowSlot(slot.startTime);

          const statusLabel = isSlotActive
            ? "Đang diễn ra"
            : isSlotEnded
              ? "Đã kết thúc"
              : isTomorrow
                ? "Ngày mai"
                : "Sắp diễn ra";

          // Color/styling
          const containerCls = cn(
            "flex flex-col items-center justify-center rounded-lg py-2.5 px-1 text-center transition-all cursor-pointer",
            isSelected
              ? "relative bg-tertiary text-on-tertiary shadow-sm active:scale-[0.99] overflow-hidden"
              : isSlotActive
                ? "relative bg-tertiary/10 hover:bg-tertiary/20 text-tertiary border border-tertiary/30"
                : isSlotEnded
                  ? "bg-surface-container-low hover:bg-surface-container"
                  : !isTomorrow
                    ? "bg-primary-fixed/40 hover:bg-primary-fixed"
                    : "bg-surface-container-low hover:bg-surface-container",
          );

          const labelCls = cn(
            "text-headline-sm font-semibold transition-colors",
            isSelected
              ? "text-on-tertiary"
              : isSlotActive
                ? "text-tertiary font-bold"
                : isSlotEnded
                  ? "text-outline group-hover:text-on-surface"
                  : !isTomorrow
                    ? "text-primary"
                    : "text-on-surface-variant",
          );

          const subLabelCls = cn(
            "mt-0.5 text-label-sm font-medium",
            isSelected
              ? "font-bold uppercase tracking-wider text-on-tertiary/90"
              : isSlotActive
                ? "font-bold uppercase tracking-wider text-tertiary"
                : isSlotEnded
                  ? "text-outline"
                  : !isTomorrow
                    ? "text-primary"
                    : "text-on-surface-variant",
          );

          return (
            <button
              key={slot.id}
              type="button"
              data-testid={`slot-${slot.id}`}
              aria-current={isSelected ? "true" : undefined}
              onClick={() => onSelect?.(slot.id)}
              className={containerCls}
            >
              <div className="flex items-center gap-1.5">
                {isSlotActive && (
                  <span className="relative flex h-2 w-2">
                    <span
                      className={cn(
                        "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                        isSelected
                          ? "bg-surface-container-lowest"
                          : "bg-tertiary",
                      )}
                    />
                    <span
                      className={cn(
                        "relative inline-flex h-2 w-2 rounded-full",
                        isSelected
                          ? "bg-surface-container-lowest"
                          : "bg-tertiary",
                      )}
                    />
                  </span>
                )}
                <span className={labelCls}>{formatHHmm(slot.startTime)}</span>
              </div>
              <span className={subLabelCls}>{statusLabel}</span>
              {isSelected && (
                <div className="absolute bottom-0 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-surface-container-lowest" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
