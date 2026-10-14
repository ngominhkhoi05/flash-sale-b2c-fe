/**
 * FailedModule – visual module cho trang `/checkout/failed`.
 *
 * Stitch reference: docs/superpowers/handoffs/thanh-toan-chua-thanh-cong.md
 *
 * Layout: 1 card responsive (Tailwind `md:` breakpoint):
 *  - Status pill (đỏ) + countdown inline (đếm ngược từ `heldUntil`)
 *  - Error icon (vòng tròn đỏ + dấu X)
 *  - Title "Thanh toán chưa thành công" + subtitle "...đơn vẫn giữ đến HH:MM"
 *  - Transaction card: mã GD (copy) + tổng tiền (đỏ) + lý do từ chối + 2 mã đơn + voucher warning
 *  - CTA primary: "Thử thanh toán lại" (link `/checkout/qr?orderCode=...`)
 *  - CTA secondary: "Chọn COD" (button → onSelectCod callback)
 *  - Support links: "Hướng dẫn thanh toán" + "1900 8888"
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";
import { formatVND } from "@/lib/format";
import type { OrderFailedView } from "@/features/orders";

interface FailedModuleProps {
  order: OrderFailedView;
  /** Called khi user click "Chọn COD". */
  onSelectCod: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Convert ms → "mm:ss". Negative input → "00:00". */
function formatCountdown(msLeft: number): string {
  if (msLeft <= 0) return "00:00";
  const total = Math.floor(msLeft / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

/** Format ISO datetime → "HH:MM" (giờ local). */
function formatTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Sub-components ──────────────────────────────────────────────────────

function CountdownPill({
  heldUntil,
  expired,
  tLabel,
  tExpired,
}: {
  heldUntil: string;
  expired: boolean;
  tLabel: string;
  tExpired: string;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const target = new Date(heldUntil).getTime();
  const isPast = expired || now >= target;
  const msLeft = Math.max(0, target - now);
  const countdownText = isPast ? tExpired : `${tLabel} ${formatCountdown(msLeft)}`;

  return (
    <div className="flex items-center gap-1 font-bold" data-testid="failed-countdown">
      <MaterialSymbol name="hourglass_top" size="sm" />
      <span data-testid="failed-countdown-text">{countdownText}</span>
    </div>
  );
}

function CopyButton({
  value,
  tSuccess,
  tError,
}: {
  value: string;
  tSuccess: string;
  tError: string;
}) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(tSuccess);
    } catch {
      toast.error(tError);
    }
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="text-primary hover:text-primary-hover inline-flex items-center transition-colors"
      aria-label={tSuccess}
      data-testid="failed-copy-button"
    >
      <MaterialSymbol name="content_copy" size="base" className="text-[15px]" />
    </button>
  );
}

// ─── Main component ──────────────────────────────────────────────────────

export function FailedModule({ order, onSelectCod }: FailedModuleProps) {
  const t = useTranslations("storefront.checkout.failed");

  // CSV orderCodes cho link retry
  const csvOrderCode = order.orderCodes.join(",");

  return (
    <section
      className="flex flex-col w-full items-center py-space-xl px-margin"
      data-testid="failed-module"
    >
      <div
        className={cn(
          "w-full bg-surface-container-lowest rounded-2xl shadow-sm flex flex-col items-center",
          // Mobile: full-width, padding nhỏ (p-4). Desktop (md+): 560px max, padding lớn (p-8).
          "max-w-full p-4 md:max-w-[560px] md:p-8",
        )}
      >
        {/* Status pill (đỏ) + countdown inline */}
        <div
          className="inline-flex items-center gap-1.5 bg-error-container text-tertiary px-3 py-1 rounded-full font-semibold text-label-md tracking-wide"
          data-testid="failed-status-pill"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-ping shrink-0" />
          <span>{t("statusBadge")}</span>
          <span className="text-outline-variant font-normal">|</span>
          <CountdownPill
            heldUntil={order.heldUntil}
            expired={false}
            tLabel={t("countdownLabel")}
            tExpired={t("expiredLabel")}
          />
        </div>

        {/* Error icon */}
        <div className="mt-space-lg mb-space-md w-16 h-16 rounded-full bg-error-container flex items-center justify-center text-error">
          <MaterialSymbol
            name="close"
            size="[36px]"
            className="font-bold"
            fill
          />
        </div>

        {/* Title + subtitle */}
        <div className="text-center w-full">
          <h1
            className="font-bold text-on-surface text-headline-sm md:text-headline-lg"
            data-testid="failed-title"
          >
            {t("title")}
          </h1>
          <p className="text-on-surface-variant mt-1.5 text-body-sm md:text-body-md">
            {t("subtitle", { time: formatTime(order.heldUntil) })}
          </p>
        </div>

        {/* Transaction card */}
        <div
          className="w-full bg-surface-container-low rounded-xl p-4 mt-6 mb-6 flex flex-col gap-3 text-left"
          data-testid="failed-transaction-card"
        >
          {/* Transaction ID + grand total */}
          <div className="flex items-start justify-between gap-2 pb-2">
            <div className="flex flex-col min-w-0">
              <span className="text-label-sm uppercase text-on-surface-variant tracking-wider font-label-sm">
                {t("transactionIdLabel")}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-mono text-label-lg text-on-surface truncate">
                  {order.transactionId}
                </span>
                <CopyButton
                  value={order.transactionId}
                  tSuccess={t("copySuccess")}
                  tError={t("copyError")}
                />
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-label-sm uppercase text-on-surface-variant tracking-wider font-label-sm block">
                {t("totalLabel")}
              </span>
              <span
                className="font-bold text-error text-price-lg tracking-tight"
                data-testid="failed-grand-total"
              >
                {formatVND(order.grandTotal)}
              </span>
            </div>
          </div>

          {/* Rejection reason callout */}
          <div
            className="bg-surface-bright rounded-lg p-3 flex items-start gap-2.5 shadow-sm"
            data-testid="failed-rejection"
          >
            <MaterialSymbol
              name="error"
              size="base"
              className="text-error text-[18px] shrink-0 mt-0.5"
            />
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-label-sm text-error">
                {t("rejectionTitle")}
              </span>
              <p className="text-body-sm text-on-surface mt-0.5 leading-snug">
                {order.rejectionReason}
              </p>
            </div>
          </div>

          {/* Reserved orders */}
          <div className="bg-surface-container-lowest rounded-lg p-3">
            <div className="flex items-center gap-1 text-label-md text-on-surface-variant">
              <MaterialSymbol
                name="inventory_2"
                size="base"
                className="text-secondary text-[16px]"
              />
              <span>
                {t("reservedOrdersLabel", { count: order.orderCodes.length })}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {order.orderCodes.map((code) => (
                <span
                  key={code}
                  className="text-label-sm bg-surface-container px-2 py-0.5 rounded text-on-surface font-mono"
                >
                  {code}
                </span>
              ))}
            </div>
          </div>

          {/* Voucher warning */}
          {order.voucherWarning && (
            <div
              className="bg-surface-container rounded-lg p-3 flex items-start gap-2.5"
              data-testid="failed-voucher-warning"
            >
              <MaterialSymbol
                name="timer"
                size="base"
                className="text-primary text-[18px] shrink-0 mt-0.5"
                fill
              />
              <p className="text-body-sm text-on-surface leading-snug">
                {t("voucherWarning", {
                  time: formatTime(order.voucherWarning.expiresAt),
                  voucher: order.voucherWarning.description,
                }).split(order.voucherWarning.description).map((part, i, arr) => (
                  <span key={i}>
                    {part}
                    {i < arr.length - 1 && (
                      <span className="text-tertiary font-bold">
                        {order.voucherWarning!.description}
                      </span>
                    )}
                  </span>
                ))}
              </p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="w-full flex flex-col gap-3">
          <Link
            href={`/checkout/qr?orderCode=${encodeURIComponent(csvOrderCode)}`}
            className="w-full h-12 bg-primary hover:bg-primary-container active:scale-[0.99] text-on-primary font-semibold text-label-lg rounded-[10px] flex items-center justify-center gap-2 shadow-sm transition-all duration-150"
            data-testid="failed-retry-cta"
          >
            <MaterialSymbol name="refresh" size="lg" />
            <span>{t("retryCta")}</span>
          </Link>
          <button
            type="button"
            onClick={onSelectCod}
            className="w-full h-12 bg-surface-container-lowest hover:bg-surface-container-low active:scale-[0.99] text-on-surface font-semibold text-label-lg rounded-[10px] flex items-center justify-center gap-2 shadow-sm transition-all duration-150"
            data-testid="failed-cod-cta"
          >
            <MaterialSymbol
              name="local_shipping"
              size="lg"
              className="text-on-surface-variant"
            />
            <span>{t("codCta")}</span>
          </button>
        </div>

        {/* Support links */}
        <div
          className="mt-space-lg flex items-center justify-center gap-4 text-center"
          data-testid="failed-support"
        >
          <a
            href="#"
            className="font-label-md text-primary hover:underline flex items-center gap-1"
          >
            <MaterialSymbol name="help" size="base" />
            <span>{t("supportGuide")}</span>
          </a>
          <span className="text-outline-variant text-xs">•</span>
          <a
            href="tel:19008888"
            className="font-label-md text-on-surface-variant hover:text-on-surface flex items-center gap-1"
          >
            <MaterialSymbol name="support_agent" size="base" />
            <span>{t("supportHotline")}</span>
          </a>
        </div>
      </div>
    </section>
  );
}
