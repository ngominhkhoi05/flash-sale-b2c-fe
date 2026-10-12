/**
 * ProductShipping – Section 11.
 * Renders: FREESHIP badge, ship-to address, estimated delivery time.
 */
"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { ShippingInfo } from "@/features/products";

export interface ProductShippingProps {
  shipping: ShippingInfo;
  className?: string;
}

export function ProductShipping({
  shipping,
  className,
}: ProductShippingProps) {
  const t = useTranslations("productDetail.shipping");

  return (
    <div
      className={cn(
        "rounded-xl border border-line bg-card p-3",
        className
      )}
      data-testid="product-shipping"
    >
      {/* Freeship badge row */}
      <div className="flex items-center gap-2">
        <span className="rounded-md bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">
          {shipping.freeshipBadge}
        </span>
        <span className="text-xs text-ink-2">{shipping.freeshipText}</span>
      </div>

      {/* Ship to */}
      <div className="mt-2 flex items-start gap-2">
        <span className="text-xs text-ink-3">{t("shipTo")}</span>
        <div className="flex-1">
          <p className="text-sm font-medium text-ink">{shipping.shipTo}</p>
          <p className="mt-0.5 text-xs text-ink-3">
            {t("estimatedTime")}{" "}
            <span className="font-medium text-success">
              {shipping.estimatedDays}
            </span>
          </p>
        </div>
        <button
          type="button"
          className="text-xs font-medium text-brand hover:underline"
        >
          {t("changeAddress")}
        </button>
      </div>
    </div>
  );
}
