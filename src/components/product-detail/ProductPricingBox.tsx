/**
 * ProductPricingBox – Sections 8 (Standard) & 9 (Flash Sale) (Stitch `31bc6af5`).
 *
 * Standard mode (variant="standard"):
 *   - Body: price row with main price (text-primary), original (line-through),
 *     discount badge. Optional trust-guarantee note (hidden by default).
 *
 * Flash mode (variant="flash"):
 *   - Banner (tertiary bg, full width): bolt icon + "FLASH SALE GIỜ VÀNG" + countdown.
 *   - Body: price row (text-tertiary main + line-through original + -N% badge +
 *     "⚡ FLASH DEAL CHỈ CÒN 28 SUẤT" badge) + progress bar (sold/total) +
 *     max qty note.
 *
 * Sử dụng i18n namespace `productDetail.pricing.*` + `<Countdown>` cho phần
 * đếm ngược (endsAt + serverNow).
 */
"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { formatVND } from "@/lib/format";
import { Countdown } from "@/components/common/Countdown";

export interface FlashSaleSummary {
  endsAt: string;
  soldStock: number;
  totalStock: number;
  maxQtyPerUser: number;
}

export interface ProductPricingBoxProps {
  variant: "standard" | "flash";
  /** Standard price (used as main price in standard mode, and flash price in flash mode).
   *  null = BE chưa set giá → render "Liên hệ". */
  minPrice: number | null;
  /** Original price before discount (shown line-through). null = ẩn. */
  originalPrice: number | null;
  /** Discount percent (e.g. 44 → "-44%" badge). */
  discountPercent: number;
  /** Required when variant="flash" (provides endsAt, sold/total stock, max qty/user). */
  flashSale?: FlashSaleSummary | null;
  /** Optional server time (ISO) to seed Countdown. */
  serverNow?: string;
  className?: string;
}

export function ProductPricingBox({
  variant,
  minPrice,
  originalPrice,
  discountPercent,
  flashSale = null,
  serverNow,
  className,
}: ProductPricingBoxProps) {
  const t = useTranslations("productDetail.pricing");
  const hasPrice = minPrice !== null && minPrice !== undefined;

  // ── Flash variant ──────────────────────────────────────────────────────
  if (variant === "flash" && flashSale) {
    const remaining = Math.max(0, flashSale.totalStock - flashSale.soldStock);
    const progressPct = Math.min(
      100,
      Math.round((flashSale.soldStock / flashSale.totalStock) * 100)
    );

    return (
      <div
        className={cn(
          "rounded-xl overflow-hidden shadow-sm border border-tertiary/30",
          className
        )}
        data-testid="pricing-box-flash"
      >
        {/* Flash banner */}
        <div
          className="bg-tertiary text-on-tertiary px-4 py-2.5 flex items-center justify-between"
          data-testid="flash-banner"
        >
          <div className="flex items-center gap-2">
            <BoltIcon className="h-5 w-5 text-xl" />
            <span className="font-headline-sm font-bold tracking-wide uppercase">
              {t("flashBanner")}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[13px]">
            <span className="opacity-90">{t("endsIn")}</span>
            <Countdown
              endsAt={flashSale.endsAt}
              serverNow={serverNow}
              variant="compact"
              className="text-on-tertiary"
              labels={{
                day: "d",
                hour: "h",
                minute: "m",
                second: "s",
                finished: t("endsIn"),
              }}
            />
          </div>
        </div>

        {/* Price body */}
        <div className="bg-surface-container-low p-4 flex flex-col gap-3">
          {/* Price row */}
          {hasPrice ? (
            <div className="flex items-baseline flex-wrap gap-3">
              <span
                className="font-display-lg font-bold tracking-tight text-tertiary"
                data-testid="flash-price"
              >
                {formatVND(minPrice as number)}
              </span>
              {originalPrice !== null && originalPrice !== undefined && originalPrice > (minPrice ?? 0) && (
                <span
                  className="font-body-lg text-outline line-through"
                  data-testid="flash-original"
                >
                  {formatVND(originalPrice)}
                </span>
              )}
              {discountPercent > 0 && (
                <span
                  className="px-2 py-0.5 rounded text-[13px] font-bold bg-tertiary text-on-tertiary"
                  data-testid="flash-discount"
                >
                  -{discountPercent}%
                </span>
              )}
            </div>
          ) : (
            // Flash variant vẫn fallback "Liên hệ" khi null (cùng pattern với standard).
            <span
              className="font-headline-sm font-semibold text-outline"
              data-testid="flash-price-contact"
            >
              {t("contactForPrice")}
            </span>
          )}

          <span
            className="px-2.5 py-0.5 rounded text-[13px] font-bold bg-tertiary/10 text-tertiary self-start"
            data-testid="flash-deal-badge"
          >
            ⚡ {t("flashDeal")}
          </span>

          {/* Progress bar + sold/remaining */}
          <div className="flex flex-col gap-1.5 pt-1" data-testid="flash-progress">
            <div className="flex items-center justify-between font-label-sm">
              <span className="text-tertiary font-semibold flex items-center gap-1">
                <FireIcon className="h-3 w-3 text-xs" />
                {t("soldProgress", {
                  sold: flashSale.soldStock,
                  total: flashSale.totalStock,
                })}
              </span>
              <span className="text-outline">
                {t("remaining", { count: remaining })}
              </span>
            </div>
            <div
              className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden"
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Stock progress"
            >
              <div
                className="h-full bg-tertiary rounded-full"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="font-body-sm text-tertiary flex items-center gap-1 mt-0.5">
              <InfoIcon className="h-3 w-3 text-xs" />
              {t("maxQtyNote", { max: flashSale.maxQtyPerUser })}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Standard variant ──────────────────────────────────────────────────
  return (
    <div
      className={cn(
        "rounded-xl border border-line bg-surface-container-low p-4",
        "flex flex-col gap-3",
        className
      )}
      data-testid="pricing-box-standard"
    >
      <div className="flex items-baseline flex-wrap gap-3">
        {hasPrice ? (
          <>
            <span
              className="font-display-lg font-bold tracking-tight text-primary"
              data-testid="standard-price"
            >
              {formatVND(minPrice as number)}
            </span>
            {originalPrice !== null && originalPrice !== undefined && originalPrice > (minPrice ?? 0) && (
              <span
                className="font-body-lg text-outline line-through"
                data-testid="standard-original"
              >
                {formatVND(originalPrice)}
              </span>
            )}
            {discountPercent > 0 && (
              <span
                className="px-2 py-0.5 rounded font-label-sm font-bold bg-error-container text-on-error-container"
                data-testid="standard-discount"
              >
                -{discountPercent}%
              </span>
            )}
          </>
        ) : (
          // BE trả null → hiển thị "Liên hệ" (quyết định user 2026-10-18 hide-cta).
          <span
            className="font-headline-sm font-semibold text-outline"
            data-testid="standard-price-contact"
          >
            {t("contactForPrice")}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Inline SVG icons (Material Symbols outline-style) ────────────────────

function BoltIcon({ className }: { className?: string }) {
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

function FireIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M12.963 2.286a.75.75 0 0 0-1.092-.657l-1.45.725a.75.75 0 0 0-.4.55l-.27 1.69a4.5 4.5 0 0 1-1.313 2.476l-1.7 1.7A6 6 0 0 0 5 12a7 7 0 1 0 14 0c0-1.91-.74-3.66-2.004-4.96l-1.7-1.7a4.5 4.5 0 0 1-1.314-2.476l-.27-1.69a.75.75 0 0 0-.064-.247l-.685-1.64ZM9 17a3 3 0 1 0 6 0 3 3 0 0 0-6 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm10.5-4.5a.75.75 0 0 0-1.5 0v.75c0 .414.336.75.75.75h.75a.75.75 0 0 0 0-1.5h-.75V7.5Zm-.75 3.75a.75.75 0 0 1 1.5 0v4.5a.75.75 0 0 1-1.5 0v-4.5Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
