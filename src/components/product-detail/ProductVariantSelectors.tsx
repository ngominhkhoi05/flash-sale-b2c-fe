/**
 * ProductVariantSelectors – Section 12.
 * Color chip selector + Size chip selector + Vietnamese size guide link.
 */
"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export interface ProductVariantSelectorsProps {
  /** Available colors. */
  colors: Array<{ name: string; bgClass: string }>;
  /** Available sizes; entry can be disabled (out of stock). */
  sizes: Array<{ label: string; disabled?: boolean }>;
  /** Currently selected color name. */
  selectedColor?: string;
  /** Currently selected size label. */
  selectedSize?: string;
  /** Emit when user picks a color. */
  onColorChange: (color: string) => void;
  /** Emit when user picks a non-disabled size. */
  onSizeChange: (size: string) => void;
  className?: string;
}

export function ProductVariantSelectors({
  colors,
  sizes,
  selectedColor,
  selectedSize,
  onColorChange,
  onSizeChange,
  className,
}: ProductVariantSelectorsProps) {
  const t = useTranslations("productDetail.selectors");

  return (
    <div className={cn("flex flex-col gap-4", className)} data-testid="product-variant-selectors">
      {/* Color selector */}
      <div className="flex items-start gap-4">
        <span className="pt-2 text-[13px] font-medium text-ink-2 shrink-0 w-28">
          {t("color")}
        </span>
        <div className="flex flex-wrap gap-2.5">
          {colors.map((c) => {
            const active = selectedColor === c.name;
            return (
              <button
                key={c.name}
                type="button"
                onClick={() => onColorChange(c.name)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] transition-all",
                  active
                    ? "bg-surface-container-lowest font-semibold text-ink outline outline-2 outline-primary shadow-sm"
                    : "bg-surface-container font-medium text-ink hover:bg-surface-container-high"
                )}
                aria-pressed={active}
              >
                <span className={cn("h-4 w-4 rounded-full border border-slate-300", c.bgClass)} />
                <span>{c.name}</span>
                {active && <CheckIcon className="h-3.5 w-3.5 text-primary" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Size selector */}
      <div className="flex items-start gap-4">
        <div className="w-28 shrink-0 pt-1">
          <span className="text-[13px] font-medium text-ink-2">{t("size")}</span>
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2.5">
            {sizes.map((s) => {
              const active = selectedSize === s.label && !s.disabled;
              return (
                <button
                  key={s.label}
                  type="button"
                  disabled={s.disabled}
                  onClick={() => {
                    if (!s.disabled) onSizeChange(s.label);
                  }}
                  className={cn(
                    "min-w-12 rounded-lg px-3 py-1.5 text-[13px] transition-all",
                    s.disabled
                      ? "relative cursor-not-allowed bg-surface-container text-ink-3 opacity-40 line-through"
                      : active
                        ? "bg-surface-container-lowest font-bold text-primary outline outline-2 outline-primary shadow-sm"
                        : "bg-surface-container font-semibold text-ink hover:bg-surface-container-high"
                  )}
                  aria-pressed={active}
                  aria-disabled={s.disabled}
                >
                  {s.label}
                  {s.disabled && (
                    <span className="ml-1 text-[10px] font-medium text-ink-3 no-underline">
                      (Hết hàng)
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <a
            href="#size-guide"
            className="flex w-fit items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
          >
            <StraightenIcon className="h-3.5 w-3.5" />
            {t("sizeGuide")}
          </a>
        </div>
      </div>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
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
        d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function StraightenIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M2 8h2v8H2V8Zm3.5 0h2v8h-2V8Zm3 0h2v8h-2V8Zm3 0h2v8h-2V8Zm3 0h2v8h-2V8Zm3 0h2v8h-2V8Zm3 0h2v8h-2V8ZM1 6a1 1 0 0 1 1-1h20a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6Z" />
    </svg>
  );
}
