/**
 * CheckoutVibeCareBanner – Banner quảng bá gói VibeCare (bảo hành 1 đổi 1).
 * Stitch reference: ui-code-dump.md L542–582.
 */
"use client";

import { MaterialSymbol } from "@/components/ui/material-symbol";

interface CheckoutVibeCareBannerProps {
  onToggle?: (next: boolean) => void;
  enabled?: boolean;
  pricePerOrder?: string;
}

export function CheckoutVibeCareBanner({
  onToggle,
  enabled = false,
  pricePerOrder = "15.000₫/đơn",
}: CheckoutVibeCareBannerProps) {
  return (
    <div
      className="w-full rounded-xl p-4 flex flex-col gap-2 border-2 border-secondary-soft bg-gradient-to-br from-secondary-soft/40 to-primary-soft/40"
      data-testid="checkout-vibecare-banner"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-secondary-soft flex items-center justify-center shrink-0">
          <MaterialSymbol
            name="health_and_safety"
            size="xl"
            className="text-secondary"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm text-on-surface">
              VibeCare – Bảo hành 1 đổi 1
            </span>
            <span className="bg-tertiary-soft text-tertiary text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
              30 ngày
            </span>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">
            Đổi mới miễn phí trong 30 ngày nếu có lỗi từ nhà sản xuất, không
            cần hoá đơn. Áp dụng cho sản phẩm Mall &amp; Official Mall.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-on-surface">
          Thêm chỉ với{" "}
          <span className="font-bold text-tertiary">{pricePerOrder}</span>
        </span>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <span className="text-xs font-semibold text-on-surface">
            {enabled ? "Đã thêm" : "Thêm gói"}
          </span>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onToggle?.(e.target.checked)}
            className="sr-only peer"
            data-testid="vibecare-toggle"
          />
          <span
            aria-hidden
            className="w-9 h-5 bg-surface-container-high rounded-full relative transition-colors peer-checked:bg-secondary"
          >
            <span
              className={`absolute top-0.5 ${
                enabled ? "left-[18px]" : "left-0.5"
              } w-4 h-4 rounded-full bg-white transition-all shadow-sm`}
            />
          </span>
        </label>
      </div>
    </div>
  );
}
