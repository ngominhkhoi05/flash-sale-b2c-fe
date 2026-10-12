/**
 * ProductPricingBox – Section 8 (Standard) & 9 (Flash Sale).
 * - variant="standard": price + original + discount
 * - variant="flash": flash banner + countdown + price + progress bar
 */
"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Countdown } from "@/components/common/Countdown";
import { formatVND, formatShortNumber } from "@/lib/format";
import type { FlashSaleInfo } from "@/features/products";

export interface ProductPricingBoxProps {
  /** Variant: standard A hoặc flash sale B */
  variant: "standard" | "flash";
  /** Min price (standard) */
  minPrice: number;
  /** Max price (standard) — dùng cho range */
  maxPrice: number;
  /** Flash sale info (chỉ cần khi variant="flash") */
  flashSale?: FlashSaleInfo | null;
  /** Server now (optional) — truyền để Countdown chính xác */
  serverNow?: string;
  className?: string;
}

export function ProductPricingBox({
  variant,
  minPrice,
  maxPrice,
  flashSale = null,
  serverNow,
  className,
}: ProductPricingBoxProps) {
  const t = useTranslations("productDetail.pricing");

  if (variant === "flash" && flashSale) {
    const pct = flashSale.discountPercent;
    const remaining = Math.max(0, flashSale.totalStock - flashSale.soldStock);
    const progressPct = Math.round(
      (flashSale.soldStock / flashSale.totalStock) * 100
    );
    return (
      <div
        className={cn(
          "overflow-hidden rounded-xl border border-sale/30 bg-sale-soft/50",
          className
        )}
        data-testid="pricing-box-flash"
      >
        {/* Flash banner */}
        <div className="flex items-center justify-between bg-sale px-4 py-2 text-white">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide">
            <FlashIcon className="w-4 h-4" />
            {t("flashBanner")}
          </span>
          <span className="text-xs font-medium">
            {t("endsIn")}:{" "}
            <Countdown
              endsAt={flashSale.endsAt}
              serverNow={serverNow}
              variant="compact"
              className="text-white"
              labels={{
                day: "d",
                hour: "h",
                minute: "m",
                second: "s",
                finished: t("ended"),
              }}
            />
          </span>
        </div>

        {/* Price + discount */}
        <div className="flex flex-wrap items-baseline gap-2 px-4 pt-3">
          <span
            className="text-3xl font-bold tabular-nums text-sale"
            data-testid="flash-price"
          >
            {formatVND(flashSale.price)}
          </span>
          {flashSale.originalPrice && (
            <span className="text-sm tabular-nums text-ink-3 line-through">
              {formatVND(flashSale.originalPrice)}
            </span>
          )}
          {pct > 0 && (
            <span className="rounded-md bg-sale px-1.5 py-0.5 text-[11px] font-bold text-white">
              -{pct}%
            </span>
          )}
        </div>

        {/* Deal label */}
        <p className="px-4 pt-1 text-xs text-sale">
          {t("flashDeal", { remaining: formatShortNumber(remaining) })}
        </p>

        {/* Progress bar */}
        <div className="px-4 py-3">
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-white/60"
            aria-label="Stock progress"
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full bg-sale transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-ink-2">
            {t("soldProgress", {
              sold: formatShortNumber(flashSale.soldStock),
              total: formatShortNumber(flashSale.totalStock),
            })}
            {" · "}
            <span className="font-medium text-sale">
              {t("remaining", { count: remaining })}
            </span>
          </p>
        </div>

        {/* Max qty + guarantee */}
        <div className="space-y-1 border-t border-sale/20 bg-white/40 px-4 py-2 text-[11px] text-ink-3">
          <p>{t("maxQtyNote", { max: flashSale.maxQtyPerUser })}</p>
          <p>{t("trustGuarantee")}</p>
        </div>
      </div>
    );
  }

  // Standard variant
  return (
    <div
      className={cn(
        "rounded-xl border border-line bg-card p-4",
        className
      )}
      data-testid="pricing-box-standard"
    >
      <div className="flex flex-wrap items-baseline gap-2">
        <span
          className="text-3xl font-bold tabular-nums text-sale"
          data-testid="standard-price"
        >
          {formatVND(minPrice)}
        </span>
        {minPrice < maxPrice && (
          <span className="text-sm text-ink-3">– {formatVND(maxPrice)}</span>
        )}
      </div>
      <p className="mt-1 text-xs text-ink-3">{t("goodPriceDaily")}</p>
    </div>
  );
}

function FlashIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M14.615 1.598a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.301H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.141Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
