/**
 * ProductShipping – Section 11 (Stitch `31bc6af5`).
 *
 * Layout (pixel-perfect từ Stitch):
 *   - Label "Vận Chuyển:" bên trái (`font-label-md text-outline w-28 shrink-0 pt-1`).
 *   - FREESHIP XTRA badge + "Miễn phí vận chuyển đơn từ 150K" text.
 *   - Row "Vận chuyển tới: <address>" với location_on icon + "Đổi địa chỉ" link (primary).
 *   - Row "Thời gian nhận dự kiến: 1 - 2 ngày làm việc" với schedule icon.
 *
 * Sử dụng i18n namespace `productDetail.shipping.*`.
 */
"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { ShippingInfo } from "@/features/products";

export interface ProductShippingProps {
  /** BE có thể trả null khi product không có shipping info. Defensive null (2026-10-18). */
  shipping: ShippingInfo | null | undefined;
  className?: string;
}

export function ProductShipping({ shipping, className }: ProductShippingProps) {
  const t = useTranslations("productDetail.shipping");

  // Defensive: BE runtime có thể trả shipping = null. Tránh crash page.
  if (!shipping) return null;

  return (
    <div
      className={cn("flex items-start gap-4", className)}
      data-testid="product-shipping"
    >
      <span className="font-label-md text-outline w-28 shrink-0 pt-1">
        {t("label")}
      </span>
      <div className="flex flex-col gap-1.5 flex-1 font-body-sm">
        {/* Row 1: FREESHIP badge + freeship text */}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "px-2 py-0.5 rounded font-label-sm font-bold flex items-center gap-1",
              "bg-secondary-container text-on-secondary-container"
            )}
          >
            <ShippingIcon className="h-3 w-3" />
            {shipping.freeshipBadge}
          </span>
          <span className="text-on-surface font-medium">
            {shipping.freeshipText}
          </span>
        </div>

        {/* Row 2: Ship-to with location icon + change address link */}
        <div className="flex items-center gap-1 text-on-surface-variant flex-wrap">
          <LocationIcon className="h-3.5 w-3.5 text-outline" />
          <span>
            {t("shipTo")}{" "}
            <strong className="text-on-surface">{shipping.shipTo}</strong>
          </span>
          <button
            type="button"
            className="font-label-sm font-semibold text-primary hover:underline ml-1"
          >
            {t("changeAddress")}
          </button>
        </div>

        {/* Row 3: Estimated delivery time */}
        <div className="text-outline flex items-center gap-1">
          <ScheduleIcon className="h-3.5 w-3.5" />
          <span>
            {t("estimatedTime")}{" "}
            <strong className="text-on-surface">{shipping.estimatedDays}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Inline SVG icons (Material Symbols outline-style) ─────────────────────

function ShippingIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M3 4.5A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5V15a3 3 0 1 1-6 0H4.5A1.5 1.5 0 0 1 3 13.5v-9Zm12 1.5h2.69a1.5 1.5 0 0 1 1.06.44l2.81 2.81a1.5 1.5 0 0 1 .44 1.06V13.5a1.5 1.5 0 0 1-1.5 1.5h-1.5a3 3 0 1 1-6 0V6h2v9a1 1 0 1 0 2 0V6Z" />
    </svg>
  );
}

function LocationIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M11.54 22.35a.75.75 0 0 0 .92 0C16.79 18.85 20 14.62 20 10.75A8.25 8.25 0 0 0 3.5 10.75c0 3.87 3.21 8.1 7.54 11.6ZM12 12.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ScheduleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M12 2.25a9.75 9.75 0 1 0 0 19.5 9.75 9.75 0 0 0 0-19.5Zm.75 5a.75.75 0 0 0-1.5 0V12c0 .2.08.39.22.53l3 3a.75.75 0 1 0 1.06-1.06l-2.78-2.78V7.25Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
