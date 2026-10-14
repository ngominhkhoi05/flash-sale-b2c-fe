/**
 * SuccessModule – visual module cho trang `/checkout/success`.
 *
 * Stitch reference: docs/superpowers/handoffs/dat-hang-thanh-cong.md
 * (screen 203897a8, project 15206106541998912100).
 *
 * Layout: 2 mockup side-by-side
 *  - Desktop: card 560px (badge + title + orders breakdown + address + CTAs)
 *  - Mobile:  device frame 390px (compact version của cùng nội dung)
 *
 * Note: Khi production wire với route thật, chỉ render 1 layout
 * theo viewport (responsive), KHÔNG render cả 2 như Stitch dev showcase.
 * Hiện tại giữ nguyên Stitch dev design (cả 2 mockup) để dev kiểm tra.
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
  isMobile = false,
}: {
  address: OrderSuccessView["address"];
  etaLabel: string;
  isMobile?: boolean;
}) {
  return (
    <div
      className={cn(
        "w-full bg-surface-container-lowest rounded-xl text-left flex items-start gap-3",
        "shadow-[0_1px_4px_rgba(0,0,0,0.03)]",
        isMobile ? "p-3 mb-4" : "p-3.5 mb-6",
      )}
      data-testid="success-address-block"
    >
      <MaterialSymbol
        name="location_on"
        size={isMobile ? "lg" : "xl"}
        className="text-primary mt-0.5 shrink-0"
        fill
      />
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className={cn("text-on-surface", isMobile ? "text-[12px]" : "text-body-md")}>
          <span className="font-bold text-on-surface">{address.recipientName}</span>{" "}
          <span className="text-on-surface-variant">({address.phone})</span>
        </div>
        <p
          className={cn(
            "text-on-surface-variant leading-relaxed",
            isMobile ? "text-[12px] line-clamp-2" : "text-body-sm",
          )}
        >
          {address.fullAddress}
        </p>
        <div
          className={cn(
            "flex items-center gap-1.5 mt-1 text-secondary font-semibold",
            isMobile ? "text-[11px]" : "text-label-md",
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
  isMobile = false,
}: {
  orderCode: string;
  tView: string;
  tContinue: string;
  isMobile?: boolean;
}) {
  return (
    <div
      className={cn("w-full flex flex-col", isMobile ? "gap-2 mt-auto pt-2" : "gap-3")}
    >
      <Link
        href={ROUTES.ORDER_DETAIL(orderCode)}
        className={cn(
          "w-full bg-primary text-on-primary font-semibold rounded-[10px] flex items-center justify-center gap-2 transition-all active:scale-[0.99] shadow-sm",
          isMobile ? "h-11 text-label-md" : "h-12 text-label-lg",
        )}
        data-testid={`success-view-orders-${orderCode}`}
      >
        <MaterialSymbol name="receipt_long" size={isMobile ? "base" : "lg"} />
        <span>{tView}</span>
      </Link>
      <Link
        href={ROUTES.HOME}
        className={cn(
          "w-full font-semibold rounded-[10px] flex items-center justify-center gap-2 transition-all active:scale-[0.99]",
          isMobile
            ? "h-11 text-label-md bg-surface-container-high text-on-surface"
            : "h-12 text-label-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface shadow-sm",
        )}
        data-testid="success-continue-shopping"
      >
        <MaterialSymbol name="shopping_bag" size={isMobile ? "base" : "lg"} />
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
      {/* ── Desktop mockup (560px card) ──────────────── */}
      <div className="w-full max-w-[560px] bg-surface-container-lowest rounded-2xl shadow-sm p-8 flex flex-col items-center text-center relative overflow-hidden transition-all duration-300">
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
          className="font-bold tracking-tight text-headline-lg text-on-surface mb-2"
          data-testid="success-title"
        >
          {t("title")}
        </h1>

        {/* Subtitle */}
        <p className="text-body-md text-on-surface-variant max-w-[420px] mb-6">
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
            data-testid="success-total-desktop"
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

      {/* ── Decorative separator ──────────────────────── */}
      <div className="w-full max-w-[560px] flex items-center gap-4 my-10">
        <div className="h-px bg-surface-container-high flex-1" />
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-lowest shadow-sm text-on-surface-variant text-label-md">
          <MaterialSymbol name="smartphone" size="[18px]" className="text-primary" />
          <span>{t("mobilePreviewBadge")}</span>
        </div>
        <div className="h-px bg-surface-container-high flex-1" />
      </div>

      {/* ── Mobile device mockup (390px) ─────────────── */}
      <div
        className="w-[390px] bg-inverse-surface rounded-[44px] p-3 shadow-2xl relative"
        data-testid="success-mobile-mockup"
      >
        <div className="relative w-full bg-background rounded-[34px] overflow-hidden flex flex-col min-h-[740px]">
          {/* Status bar mock */}
          <div className="w-full pt-3 pb-2 px-6 flex items-center justify-between bg-surface-container-lowest shrink-0">
            <span className="font-bold text-on-surface text-label-sm">9:41</span>
            <div className="w-20 h-4 bg-inverse-surface rounded-full flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-inverse-surface mr-3" />
            </div>
            <div className="flex items-center gap-1 text-on-surface">
              <MaterialSymbol name="signal_cellular_alt" size="xs" />
              <MaterialSymbol name="wifi" size="xs" />
              <MaterialSymbol name="battery_full" size="xs" />
            </div>
          </div>

          {/* Mobile header */}
          <div className="h-12 bg-surface-container-lowest px-4 flex items-center justify-between shadow-sm shrink-0">
            <button
              type="button"
              className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container"
              aria-label="Đóng"
            >
              <MaterialSymbol name="close" size="xl" />
            </button>
            <span className="font-semibold text-on-surface text-headline-sm text-center truncate">
              {t("title")}
            </span>
            <button
              type="button"
              className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container"
              aria-label="Trợ giúp"
            >
              <MaterialSymbol name="help" size="xl" />
            </button>
          </div>

          {/* Mobile content */}
          <div className="p-4 flex-1 flex flex-col items-center overflow-y-auto">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-bold uppercase text-[10px] mt-1"
              data-testid="success-mobile-badge"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              <span>{t("badge")}</span>
            </div>

            {/* Checkmark */}
            <div className="mt-4 mb-3 w-14 h-14 rounded-full bg-secondary-container flex items-center justify-center text-secondary">
              <MaterialSymbol name="check" size="2xl" fill className="font-bold" />
            </div>

            {/* Title */}
            <h2 className="font-bold text-on-surface text-headline-sm text-center mb-1">
              {t("title")}
            </h2>
            <p className="text-on-surface-variant text-center max-w-[280px] mb-4 text-body-sm">
              {t("subtitleMobile", { count: order.totalOrders })}
            </p>

            {/* Orders breakdown */}
            <div className="w-full bg-surface-container-low rounded-xl p-3 flex flex-col gap-2.5 mb-3.5 text-left">
              {order.orders.map((row, idx) => (
                <div key={row.orderCode} className="flex flex-col gap-2.5">
                  {idx > 0 && <div className="w-full h-px bg-surface-container-highest" />}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-on-surface text-label-md truncate max-w-[170px]">
                        {row.storeName}
                      </span>
                      <span
                        className="px-1.5 py-0.5 rounded bg-secondary-container text-on-secondary-container text-label-sm font-medium"
                        style={{ fontSize: 9 }}
                      >
                        {t("paidBadge")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-on-surface-variant text-body-sm">
                      <span className="font-mono">{t("codeLabel")} {row.orderCode}</span>
                      <span className="font-bold text-on-surface">
                        {formatVND(row.amount)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              <div className="w-full h-px bg-surface-container-highest" />
              <div
                className="flex items-center justify-between pt-0.5"
                data-testid="success-total-mobile"
              >
                <span className="font-bold text-on-surface text-label-md">
                  {t("totalLabel")}
                </span>
                <span className="font-bold text-primary text-price-md tabular-nums">
                  {formatVND(order.grandTotal)}
                </span>
              </div>
            </div>

            {/* Address block (compact) */}
            <AddressBlock
              address={order.address}
              etaLabel={order.estimatedDeliveryLabel}
              isMobile
            />

            {/* CTAs (compact) */}
            <CtaGroup
              orderCode={firstCode}
              tView={t("viewOrdersCta")}
              tContinue={t("continueShoppingCta")}
              isMobile
            />
          </div>

          {/* Home indicator */}
          <div className="w-full pb-2 pt-1 flex justify-center bg-background shrink-0">
            <div className="w-32 h-1 bg-outline-variant rounded-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
