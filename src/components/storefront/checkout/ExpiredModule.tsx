/**
 * ExpiredModule – visual module cho trang `/checkout/expired`.
 *
 * Stitch reference: docs/superpowers/handoffs/don-hang-het-han.md
 *
 * Trang "dead-end" — kết thúc flow thanh toán sau khi hold timeout (5 phút).
 * Layout: 1 card responsive (Tailwind `md:`) giống SuccessModule / FailedModule.
 *  - Status pill (vàng) "Trạng thái: Đã hủy tự động"
 *  - Icon: vòng tròn vàng + hourglass_disabled
 *  - Title + subtitle (dynamic: {minutes} + {orderCount})
 *  - Box phục hồi quyền lợi (xanh emerald) — list benefits
 *  - Inventory restocked row + "Còn hàng tại shop" badge
 *  - 2 CTA: "Quay lại Flash Sale" (primary) + "Xem lại giỏ hàng" (ghost)
 *  - Help footer với CSKH link
 */
"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import type { OrderExpiredView } from "@/features/orders";

interface ExpiredModuleProps {
  order: OrderExpiredView;
}

export function ExpiredModule({ order }: ExpiredModuleProps) {
  const t = useTranslations("storefront.checkout.expired");

  return (
    <section
      className="flex flex-col w-full py-space-xl px-margin items-center justify-center"
      data-testid="expired-module"
    >
      <div
        className={cn(
          "w-full bg-surface-container-lowest rounded-2xl shadow-sm flex flex-col items-center text-center",
          // Mobile: full-width, padding nhỏ (p-4). Desktop (md+): 560px max, padding lớn (p-8).
          "max-w-full p-4 md:max-w-[560px] md:p-8",
        )}
      >
        {/* Status pill (vàng) */}
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-warning-soft text-on-warning-soft font-semibold text-label-sm tracking-wide uppercase mb-6"
          data-testid="expired-status-pill"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-warning" />
          <span>{t("statusBadge")}</span>
        </div>

        {/* Hourglass icon */}
        <div className="w-16 h-16 rounded-full bg-warning-soft flex items-center justify-center text-warning mb-6 shadow-inner">
          <MaterialSymbol
            name="hourglass_disabled"
            size="[36px]"
            fill
          />
        </div>

        {/* Title + subtitle */}
        <h1
          className="font-bold text-on-surface tracking-tight mb-2 text-headline-sm md:text-headline-lg"
          data-testid="expired-title"
        >
          {t("title")}
        </h1>
        <p className="text-on-surface-variant max-w-[440px] mb-6 text-body-sm md:text-body-md">
          {t("subtitle", {
            minutes: order.holdDurationMinutes,
            orderCount: order.orderCodes.length,
          })}
        </p>

        {/* Restored benefits box (xanh emerald) */}
        {order.restoredBenefits.length > 0 && (
          <div
            className="w-full bg-success-soft rounded-xl p-4 my-2 text-left space-y-2.5"
            data-testid="expired-restored-benefits"
          >
            <div className="flex items-center gap-1.5 text-on-success-soft font-semibold text-label-lg">
              <MaterialSymbol
                name="verified"
                size="lg"
                fill
                className="text-lg leading-none"
              />
              <span>{t("restoredBenefitsTitle")}</span>
            </div>
            {order.restoredBenefits.map((benefit, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 text-on-success-soft text-label-md"
              >
                <MaterialSymbol
                  name="check_circle"
                  size="base"
                  className="text-base leading-tight shrink-0 mt-0.5"
                />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        )}

        {/* Inventory restocked row */}
        <div
          className="w-full bg-surface-container-low rounded-[10px] p-3 text-left text-on-surface-variant flex items-center justify-between gap-2 mt-2 mb-6"
          data-testid="expired-inventory-row"
        >
          <div className="flex items-center gap-2 min-w-0">
            <MaterialSymbol
              name="inventory_2"
              size="base"
              className="text-outline"
            />
            <span className="truncate font-medium text-on-surface text-body-sm">
              {order.cartItemSummary}
            </span>
          </div>
          <span
            className="shrink-0 inline-flex items-center gap-1 text-secondary font-semibold text-label-sm bg-secondary-container/40 px-2 py-0.5 rounded-full"
            data-testid="expired-instock-badge"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
            {t("inStockBadge")}
          </span>
        </div>

        {/* Action buttons */}
        <div className="w-full flex flex-col gap-3">
          <Link
            href={ROUTES.FLASH_SALE}
            className="w-full h-12 bg-primary hover:bg-primary-container text-on-primary font-semibold text-label-lg rounded-[10px] flex items-center justify-center gap-2 transition-all active:scale-[0.99] shadow-sm"
            data-testid="expired-flashsale-cta"
          >
            <MaterialSymbol name="bolt" size="xl" fill className="text-xl" />
            <span>{t("flashSaleCta")}</span>
          </Link>
          <Link
            href={ROUTES.CART}
            className="w-full h-12 bg-surface-container hover:bg-surface-container-highest text-on-surface font-semibold text-label-lg rounded-[10px] flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            data-testid="expired-cart-cta"
          >
            <MaterialSymbol
              name="shopping_cart"
              size="xl"
              className="text-outline text-xl"
            />
            <span>{t("cartCta", { count: order.cartItemCount })}</span>
          </Link>
        </div>

        {/* Help footer */}
        <div
          className="mt-6 flex items-center justify-center gap-1.5 text-on-surface-variant text-body-sm"
          data-testid="expired-help-footer"
        >
          <span>{t("helpPrompt")}</span>
          <a
            href="#"
            className="text-primary hover:underline font-semibold text-label-md"
          >
            {t("helpCta")}
          </a>
        </div>
      </div>
    </section>
  );
}
