/**
 * ProductVariantSwitcher – Section 3.
 * Toggle A (Standard) ↔ B (Flash Sale) mode.
 * Emits `onModeChange(mode: 'standard' | 'flash')`.
 */
"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export type ProductVariantMode = "standard" | "flash";

export interface ProductVariantSwitcherProps {
  mode: ProductVariantMode;
  onModeChange: (mode: ProductVariantMode) => void;
  className?: string;
}

export function ProductVariantSwitcher({
  mode,
  onModeChange,
  className,
}: ProductVariantSwitcherProps) {
  const t = useTranslations("productDetail.switcher");

  return (
    <div
      className={cn(
        "flex items-center gap-3 text-sm font-medium",
        className
      )}
      role="group"
      aria-label={t("label")}
    >
      <span className="text-ink-2">{t("label")}</span>

      {/* Option A: Standard */}
      <button
        type="button"
        onClick={() => onModeChange("standard")}
        className={cn(
          "relative rounded-full border px-4 py-1.5 text-sm font-medium transition-all",
          mode === "standard"
            ? "border-brand bg-brand/10 text-brand"
            : "border-line text-ink-2 hover:border-brand hover:text-brand"
        )}
        aria-pressed={mode === "standard"}
      >
        {t("standard")}
      </button>

      {/* Option B: Flash Sale */}
      <button
        type="button"
        onClick={() => onModeChange("flash")}
        className={cn(
          "relative rounded-full border px-4 py-1.5 text-sm font-medium transition-all",
          mode === "flash"
            ? "border-sale bg-sale/10 text-sale"
            : "border-line text-ink-2 hover:border-sale hover:text-sale"
        )}
        aria-pressed={mode === "flash"}
      >
        {t("flash")}
      </button>
    </div>
  );
}
