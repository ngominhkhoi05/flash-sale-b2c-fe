"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { formatVND } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface CartSummaryProps {
  totalItems: number;
  grandTotal: number;
  storeCount: number;
  isSubmitting?: boolean;
  onCheckout: () => void;
}

/**
 * Sticky summary ở /cart: tong tien + nut "Tien hanh thanh toan".
 */
export function CartSummary({
  totalItems,
  grandTotal,
  storeCount,
  isSubmitting = false,
  onCheckout,
}: CartSummaryProps) {
  const t = useTranslations("storefront.cart");

  const canCheckout = totalItems > 0 && !isSubmitting;

  return (
    <div
      className={cn(
        "rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm",
        "sticky top-4 flex flex-col gap-3",
      )}
      data-testid="cart-summary"
    >
      <h2 className="font-headline-sm font-semibold text-on-surface">
        {t("summaryTitle")}
      </h2>
      <div className="flex flex-col gap-2 border-b border-outline-variant pb-3">
        <div className="flex items-center justify-between font-body-sm">
          <span className="text-outline">{t("totalItems", { count: totalItems })}</span>
          <span className="text-on-surface tabular-nums">{totalItems}</span>
        </div>
        <div className="flex items-center justify-between font-body-sm">
          <span className="text-outline">{t("shopCount", { count: storeCount })}</span>
          <span className="text-on-surface tabular-nums">{storeCount}</span>
        </div>
      </div>
      <div className="flex items-center justify-between font-headline-md">
        <span className="text-on-surface">{t("grandTotal")}</span>
        <span
          className="font-bold text-primary tabular-nums"
          data-testid="cart-summary-total"
        >
          {formatVND(grandTotal)}
        </span>
      </div>
      <Button
        onClick={onCheckout}
        disabled={!canCheckout}
        className="h-12 w-full"
        data-testid="cart-checkout-button"
      >
        {isSubmitting ? (
          <>
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>{t("processing")}</span>
          </>
        ) : (
          <span>{t("checkout")}</span>
        )}
      </Button>
    </div>
  );
}
