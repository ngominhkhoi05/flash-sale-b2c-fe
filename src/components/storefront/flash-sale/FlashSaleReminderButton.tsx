/**
 * FlashSaleReminderButton – nút "Nhắc tôi" cho slot UPCOMING.
 *
 * Toggle state khi click. Trạng thái "đã nhắc" hiển thị "Đã đặt nhắc hẹn"
 * với icon check + bg secondary.
 *
 * Stitch reference: trang-flash-sale.md L470-L503
 */

"use client";

import { useState } from "react";
import { Bell, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FlashSaleReminderButtonProps {
  /** Initial state (mặc định false). */
  initialReminded?: boolean;
  /** Callback khi user toggle state. */
  onToggle?: (reminded: boolean) => void;
  className?: string;
}

export function FlashSaleReminderButton({
  initialReminded = false,
  onToggle,
  className,
}: FlashSaleReminderButtonProps) {
  const [reminded, setReminded] = useState(initialReminded);

  const handleClick = () => {
    const next = !reminded;
    setReminded(next);
    onToggle?.(next);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      data-testid="reminder-button"
      data-reminded={reminded ? "true" : "false"}
      aria-pressed={reminded}
      className={cn(
        "flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border text-[13px] font-semibold shadow-sm transition-all active:scale-[0.98]",
        reminded
          ? "border-secondary bg-secondary text-on-secondary"
          : "border-tertiary bg-transparent text-tertiary hover:bg-tertiary-fixed-dim",
        className,
      )}
    >
      {reminded ? (
        <Check className="h-4 w-4" aria-hidden />
      ) : (
        <Bell className="h-4 w-4" aria-hidden />
      )}
      <span>{reminded ? "Đã đặt nhắc hẹn" : "Nhắc tôi"}</span>
    </button>
  );
}
