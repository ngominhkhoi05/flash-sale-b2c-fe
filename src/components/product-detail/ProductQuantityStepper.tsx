/**
 * ProductQuantityStepper – Section 13.
 * −/+/quantity input + stock text. min/max enforced, disabled at boundaries.
 */
"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export interface ProductQuantityStepperProps {
  /** Current quantity (controlled). */
  value: number;
  /** Minimum allowed quantity. Default 1. */
  min?: number;
  /** Maximum allowed quantity (stock for standard, max-per-user for flash). */
  max: number;
  /** Stock count shown next to stepper (display only). */
  stockCount: number;
  /** Emit when user changes quantity (clamped to [min, max]). */
  onChange: (qty: number) => void;
  className?: string;
}

export function ProductQuantityStepper({
  value,
  min = 1,
  max,
  stockCount,
  onChange,
  className,
}: ProductQuantityStepperProps) {
  const t = useTranslations("productDetail.quantity");

  const atMin = value <= min;
  const atMax = value >= max;

  function step(delta: number) {
    const next = Math.max(min, Math.min(max, value + delta));
    if (next !== value) onChange(next);
  }

  return (
    <div
      className={cn("flex items-center gap-4", className)}
      data-testid="product-quantity-stepper"
    >
      <span className="w-28 shrink-0 text-[13px] font-medium text-ink-2">
        {t("label")}
      </span>
      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-lg bg-surface-container p-0.5">
          <button
            type="button"
            onClick={() => step(-1)}
            disabled={atMin}
            aria-label="Decrease quantity (minus)"
            className="flex h-8 w-8 items-center justify-center rounded bg-surface-container-lowest text-ink transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RemoveIcon className="h-4 w-4" />
          </button>
          <input
            type="text"
            inputMode="numeric"
            readOnly
            value={value}
            aria-label="Quantity"
            className="w-12 bg-transparent text-center text-[13px] font-bold text-ink focus:outline-none"
          />
          <button
            type="button"
            onClick={() => step(1)}
            disabled={atMax}
            aria-label="Increase quantity (plus)"
            className="flex h-8 w-8 items-center justify-center rounded bg-surface-container-lowest text-ink transition-colors hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-50"
          >
            <AddIcon className="h-4 w-4" />
          </button>
        </div>
        <span className="text-[13px] text-ink-3">
          {t.rich("inStock", {
            count: stockCount,
            bold: (chunks: React.ReactNode) => (
              <strong className="font-semibold text-ink">{chunks}</strong>
            ),
          })}
        </span>
      </div>
    </div>
  );
}

function RemoveIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M3.75 12a.75.75 0 0 1 .75-.75h15a.75.75 0 0 1 0 1.5h-15a.75.75 0 0 1-.75-.75Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function AddIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
