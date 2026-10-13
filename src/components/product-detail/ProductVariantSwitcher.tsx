/**
 * ProductVariantSwitcher – Section 3.
 * Toggle A (Standard) ↔ B (Flash Sale) pill button group.
 * Stitch markup: `bg-surface-container rounded-lg shadow-sm` container,
 * selected state has `bg-surface-container-lowest text-primary` with shadow.
 * Default selected: B (Flash Sale).
 */
"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export type ProductVariantValue = "standard" | "flash";

export interface ProductVariantSwitcherProps {
  value: ProductVariantValue;
  onChange: (value: ProductVariantValue) => void;
  className?: string;
}

export function ProductVariantSwitcher({
  value,
  onChange,
  className,
}: ProductVariantSwitcherProps) {
  const t = useTranslations("productDetail.switcher");

  return (
    <div
      className={cn("inline-flex items-center gap-2", className)}
      role="group"
      aria-label={t("label")}
    >
      <span className="hidden text-xs font-medium text-on-surface-variant sm:inline-block">
        {t("label")}
      </span>
      <div className="inline-flex items-center gap-1 rounded-lg bg-surface-container p-1 shadow-sm">
        <SwitcherButton
          active={value === "standard"}
          dotClassName="bg-secondary"
          onClick={() => onChange("standard")}
        >
          {t("standard")}
        </SwitcherButton>
        <SwitcherButton
          active={value === "flash"}
          dotClassName="bg-tertiary"
          onClick={() => onChange("flash")}
        >
          {t("flash")}
        </SwitcherButton>
      </div>
    </div>
  );
}

function SwitcherButton({
  active,
  dotClassName,
  onClick,
  children,
}: {
  active: boolean;
  dotClassName: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-1 rounded-lg px-space-md py-1.5 transition-all",
        "font-label-md text-label-md",
        active
          ? "bg-surface-container-lowest text-primary shadow-sm"
          : "text-on-surface-variant hover:text-on-surface",
      )}
    >
      <span
        className={cn("h-2 w-2 rounded-full", dotClassName)}
        aria-hidden="true"
      />
      <span>{children}</span>
    </button>
  );
}