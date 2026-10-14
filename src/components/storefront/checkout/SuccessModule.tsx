/**
 * SuccessModule – visual module cho trang `/checkout/success`.
 *
 * Stitch reference: docs/superpowers/handoffs/dat-hang-thanh-cong.md
 * (screen 203897a8, project 15206106541998912100).
 *
 * Layout: 1 card responsive (Tailwind `md:` breakpoint):
 *  - Desktop (≥768px): card 560px, padding `p-8`, title `text-headline-lg`,
 *    CTA h-12, text-label-lg.
 *  - Mobile (<768px): full-width, padding `p-4`, title `text-headline-sm`,
 *    CTA h-11, text-label-md.
 *
 * Note: Phiên bản Stitch dev dump có 2 mockup side-by-side (desktop + mobile)
 * để dev so sánh. Theo docs/CLAUDE.md mục 10 + handoff, production chỉ render
 * 1 layout responsive — mobile mockup đã được gộp vào layout chính bằng Tailwind
 * breakpoint. Xem plan `docs/superpowers/plans/2026-10-14-checkout-success-page.md`
 * mục 9 để biết lý do refactor.
 */
"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";
import { formatVND } from "@/lib/format";
import { ROUTES } from "@/lib/constants";
import type { OrderSuccessView } from "@/features/orders";

interface SuccessModuleProps {
  order: OrderSuccessView;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatStoreBadge(
  badge: OrderSuccessView["orders"][number]["storeBadge"],
  tMall: string,
  tOfficial: string,
): { label: string; className: string } | null {
  if (badge === "OfficialMall") {
    return { label: tOfficial, className: "bg-secondary text-on-secondary" };
  }
  if (badge === "Mall") {
    return { label: tMall, className: "bg-tertiary text-on-tertiary" };
  }
  return null;
}

// ─── Sub-components ──────────────────────────────────────────────────────

function OrderBreakdownRow({
  row,
  tCodeLabel,
  tPaidBadge,
  tZaloPayMethod,
  tMallBadge,
  tOfficialBadge,
}: {
  row: OrderSuccessView["orders"][number];
  tCodeLabel: string;
  tPaidBadge: string;
  tZaloPayMethod: string;
  tMallBadge: string;
  tOfficialBadge: string;
}) {
  const badge = formatStoreBadge(row.storeBadge, tMallBadge, tOfficialBadge);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <MaterialSymbol
            name="storefront"
            size="[18px]"
            className="text-primary shrink-0"
          />
          <span className="font-semibold text-on-surface text-label-lg truncate">
            {row.storeName}
          </span>
        </div>
        <span
          className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-medium text-label-sm shrink-0"
          data-testid={`success-paid-badge-${row.orderCode}`}
        >
          {tPaidBadge}
        </span>
      </div>
      <div className="flex items-center justify-between text-on-surface-variant pl-6 text-body-sm">
        <span className="font-mono text-label-md">
          {tCodeLabel} {row.orderCode}
        </span>
        <span className="font-bold text-on-surface text-price-md tabular-nums">
          {formatVND(row.amount)}
        </span>
      </div>
      <div className="flex items-center gap-1 pl-6 text-on-surface-variant opacity-80 text-body-sm">
        <MaterialSymbol name="qr_code_2" size="base" />
        <span>{tZaloPayMethod}</span>
        {badge && (
          <span
            className={cn(
              "px-1.5 py-0.5 rounded text-label-sm font-semibold",
              badge.className,
            )}
          >
            {badge.label}
          </span>
        )}
      </div>
    </div>
  );
}

function AddressBlock({
  address,
  etaLabel,
}: {
  address: OrderSuccessView["address"];
  etaLabel: string;
}) {
  return (
    <div
      className={cn(
        "w-full bg-surface-container-lowest rounded-xl text-left flex items-start gap-3",
        "shadow-[0_1px_4px_rgba(0,0,0,0.03)]",
        // Mobile p-3 mb-4 → desktop p-3.5 mb-6
        "p-3 mb-4 md:p-3.5 md:mb-6",
      )}
      data-testid="success-address-block"
    >
      <MaterialSymbol
        name="location_on"
        // Mobile lg (20px) → desktop xl (24px). Dùng Tailwind class để scale
        // thay vì responsive `size` prop (MaterialSymbol không hỗ trợ).
        size="lg"
        className="text-primary mt-0.5 shrink-0 md:text-[24px]"
        fill
      />
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="text-on-surface text-[12px] md:text-body-md">
          <span className="font-bold text-on-surface">{address.recipientName}</span>{" "}
          <span className="text-on-surface-variant">({address.phone})</span>
        </div>
        <p
          className={cn(
            "text-on-surface-variant leading-relaxed",
            // Mobile text-[12px] line-clamp-2 → desktop text-body-sm full
            "text-[12px] line-clamp-2 md:text-body-sm md:line-clamp-none",
          )}
        >
          {address.fullAddress}
        </p>
        <div
          className={cn(
            "flex items-center gap-1.5 mt-1 text-secondary font-semibold",
            "text-[11px] md:text-label-md",
          )}
        >
          <MaterialSymbol name="local_shipping" size="[16px]" />
          <span>{etaLabel}</span>
        </div>
      </div>
    </div>
  );
}

function CtaGroup({
  orderCode,
  tView,
  tContinue,
}: {
  orderCode: string;
  tView: string;
  tContinue: string;
}) {
  return (
    <div
      className={cn(
        "w-full flex flex-col",
        // Mobile gap-2 mt-auto pt-2 → desktop gap-3
        "gap-2 mt-auto pt-2 md:gap-3 md:pt-0",
      )}
    >
      <Link
        href={ROUTES.ORDER_DETAIL(orderCode)}
        className={cn(
          "w-full bg-primary text-on-primary font-semibold rounded-[10px] flex items-center justify-center gap-2 transition-all active:scale-[0.99] shadow-sm",
          // Mobile h-11 text-label-md → desktop h-12 text-label-lg
          "h-11 text-label-md md:h-12 md:text-label-lg",
        )}
        data-testid={`success-view-orders-${orderCode}`}
      >
        <MaterialSymbol name="receipt_long" size="base" className="md:text-[20px]" />
        <span>{tView}</span>
      </Link>
      <Link
        href={ROUTES.HOME}
        className={cn(
          "w-full font-semibold rounded-[10px] flex items-center justify-center gap-2 transition-all active:scale-[0.99]",
          "h-11 text-label-md bg-surface-container-high text-on-surface md:h-12 md:text-label-lg md:hover:bg-surface-container-highest md:shadow-sm",
        )}
        data-testid="success-continue-shopping"
      >
        <MaterialSymbol name="shopping_bag" size="base" className="md:text-[20px]" />
        <span>{tContinue}</span>
      </Link>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────

export function SuccessModule({ order }: SuccessModuleProps) {
  const t = useTranslations("storefront.checkout.success");
  const firstCode = order.orderCodes[0] ?? "";

  return (
    <section
      className="flex flex-col w-full items-center py-space-xl px-margin"
      data-testid="success-module"
    >
      <div
        className={cn(
          "w-full bg-surface-container-lowest rounded-2xl shadow-sm flex flex-col items-center text-center relative overflow-hidden transition-all duration-300",
          // Mobile: full-width, padding nhỏ (p-4). Desktop (md+): 560px max, padding lớn (p-8).
          "max-w-full p-4 md:max-w-[560px] md:p-8",
        )}
      >
        {/* Top pill badge */}
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container font-bold text-label-sm uppercase tracking-wide"
          data-testid="success-badge"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
          <span>{t("badge")}</span>
        </div>

        {/* Animated checkmark circle */}
        <div className="mt-6 mb-4 w-16 h-16 rounded-full bg-secondary-container flex items-center justify-center text-secondary relative">
          <div className="absolute inset-0 rounded-full bg-secondary-container animate-ping opacity-25" />
          <MaterialSymbol
            name="check"
            size="[36px]"
            fill
            className="font-bold"
          />
        </div>

        {/* Main title */}
        <h1
          className="font-bold tracking-tight text-on-surface mb-2 text-headline-sm md:text-headline-lg"
          data-testid="success-title"
        >
          {t("title")}
        </h1>

        {/* Subtitle */}
        <p className="text-on-surface-variant max-w-[420px] mb-6 text-body-sm md:text-body-md">
          {t("subtitle", { count: order.totalOrders })}
        </p>

        {/* Orders breakdown card */}
        <div className="w-full bg-surface-container-low rounded-xl p-4 text-left flex flex-col gap-3.5 mb-6">
          {order.orders.map((row, idx) => (
            <div key={row.orderCode} className="flex flex-col gap-3.5">
              {idx > 0 && <div className="w-full h-px bg-surface-container-highest" />}
              <OrderBreakdownRow
                row={row}
                tCodeLabel={t("codeLabel")}
                tPaidBadge={t("paidBadge")}
                tZaloPayMethod={t("paymentMethodZaloPay")}
                tMallBadge={t("mallBadge")}
                tOfficialBadge={t("officialBadge")}
              />
            </div>
          ))}
          <div className="w-full h-px bg-surface-container-highest" />
          {/* Total row */}
          <div
            className="flex items-center justify-between pt-1"
            data-testid="success-total"
          >
            <span className="font-semibold text-on-surface text-label-lg">
              {t("totalLabel")}
            </span>
            <span className="font-bold text-primary text-price-lg tracking-tight tabular-nums">
              {formatVND(order.grandTotal)}
            </span>
          </div>
        </div>

        {/* Shipping summary */}
        <AddressBlock
          address={order.address}
          etaLabel={order.estimatedDeliveryLabel}
        />

        {/* Action buttons */}
        <CtaGroup
          orderCode={firstCode}
          tView={t("viewOrdersCta")}
          tContinue={t("continueShoppingCta")}
        />
      </div>
    </section>
  );
}
