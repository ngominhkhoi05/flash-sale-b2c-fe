/**
 * QrPaymentModule – main 2-column module for `/checkout/qr` page.
 *
 * Stitch reference: docs/superpowers/handoffs/thanh-toan-QR-zalo.md
 * (screen 203897a8, project 15206106541998912100).
 *
 * Layout (desktop md+):
 *  ┌──────────────────┬──────────────────┐
 *  │ QR + countdown   │ Mã GD            │
 *  │ + 3 steps        │ + Tổng tiền      │
 *  │ + pulse          │ + 2 đơn shop     │
 *  │                  │ + alert + CTA    │
 *  └──────────────────┴──────────────────┘
 *
 * Mobile: stacks to single column.
 *
 * Real-time: countdown ticks down from `order.expiresAt` (server time,
 * rule §8 mục 1). Polling for payment status is OUT OF SCOPE here —
 * the parent page owns that (and will be added in the next phase).
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";
import { formatVND } from "@/lib/format";
import { QR_HOLD_DURATION_MS } from "@/lib/constants";
import type { QrOrderDetail } from "@/features/checkout";

interface QrPaymentModuleProps {
  order: QrOrderDetail;
  /** Called khi user click "Tôi đã hoàn tất thanh toán". */
  onComplete: () => void;
  /** Called khi user click "Thanh toán khi nhận hàng (COD)". */
  onSelectCod?: () => void;
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

const RING_CIRCUMFERENCE = 2 * Math.PI * 42; // r=42, matches mockup SVG
const RING_TOTAL_MS = QR_HOLD_DURATION_MS;

function ringOffset(percentLeft: number): number {
  const clamped = Math.max(0, Math.min(1, percentLeft));
  return RING_CIRCUMFERENCE * (1 - clamped);
}

// ─── Sub-components ──────────────────────────────────────────────────────

function QrCodeFrame({
  qrCodeUrl,
  expired,
}: {
  qrCodeUrl: string;
  expired: boolean;
}) {
  return (
    <div className="relative w-[240px] h-[240px] bg-surface-container-lowest p-3 rounded-xl shadow-md flex items-center justify-center">
      {/* Tech corner markers */}
      <span className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-primary rounded-tl" />
      <span className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-primary rounded-tr" />
      <span className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-primary rounded-bl" />
      <span className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-primary rounded-br" />

      {/* QR image or expired overlay */}
      {expired ? (
        <div
          data-testid="qr-expired-overlay"
          className="absolute inset-3 flex flex-col items-center justify-center rounded-lg bg-surface-container-lowest/90 backdrop-blur-sm text-center gap-1"
        >
          <MaterialSymbol name="alarm_off" size="[40px]" className="text-error" />
          <span className="font-semibold text-sm text-error">Hết hạn</span>
        </div>
      ) : (
        <>
          <Image
            src={qrCodeUrl}
            alt="Mã QR ZaloPay"
            width={216}
            height={216}
            className="w-full h-full rounded-lg object-contain bg-white"
            data-testid="qr-image"
            unoptimized
          />
          {/* Central ZaloPay badge */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-11 h-11 rounded-lg bg-surface-container-lowest shadow-md flex items-center justify-center p-1">
              <div className="w-full h-full rounded bg-primary flex items-center justify-center text-on-primary font-bold text-[10px] tracking-tighter">
                ZaloPay
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function CircularCountdown({
  msLeft,
  t,
}: {
  msLeft: number;
  t: ReturnType<typeof useTranslations>;
}) {
  const percentLeft = msLeft / RING_TOTAL_MS;
  const offset = ringOffset(percentLeft);
  const display = formatCountdown(msLeft);
  return (
    <div className="relative flex items-center justify-center mb-5">
      <svg
        className="w-24 h-24 transform -rotate-90"
        viewBox="0 0 96 96"
        aria-hidden
      >
        <circle
          cx="48"
          cy="48"
          r="42"
          fill="transparent"
          stroke="currentColor"
          strokeWidth={6}
          className="text-surface-dim"
        />
        <circle
          cx="48"
          cy="48"
          r="42"
          fill="transparent"
          stroke="currentColor"
          strokeWidth={6}
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-tertiary transition-all duration-1000"
          suppressHydrationWarning
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span
          className="font-bold text-tertiary text-headline-sm tabular-nums"
          data-testid="countdown-timer"
          suppressHydrationWarning
        >
          {display}
        </span>
        <span className="font-semibold text-on-surface-variant text-label-sm">
          {t("heldOrder")}
        </span>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────

export function QrPaymentModule({ order, onComplete, onSelectCod }: QrPaymentModuleProps) {
  const t = useTranslations("storefront.checkout.qrPayment");

  // Tính msLeft dựa trên expiresAt (server time) – rule §8 mục 1.
  const targetMs = useMemo(
    () => new Date(order.expiresAt).getTime(),
    [order.expiresAt],
  );
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const msLeft = targetMs - now;
  // Tránh hydration mismatch: chỉ render expired overlay sau khi đã mounted trên client
  const expired = mounted && msLeft <= 0;

  useEffect(() => {
    setMounted(true);
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const handleCopyOrderCode = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(order.orderCode);
      } else {
        // Fallback cho trình duyệt cũ / môi trường không có clipboard API.
        const ta = document.createElement("textarea");
        ta.value = order.orderCode;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      toast.success("Đã sao chép mã giao dịch");
    } catch (err) {
      console.error("[qr] copy order code failed", err);
      toast.error("Không thể sao chép mã");
    }
  };

  const totalLabel = t("totalLabel", { count: order.shopOrders.length });

  return (
    <section
      className="max-w-[1240px] w-full mx-auto px-4 lg:px-8 pt-6 pb-16"
      data-testid="qr-payment-module"
    >
      <div className="bg-surface-container-lowest rounded-xl shadow-md overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* ── Cột trái: QR + countdown + hướng dẫn ─────────── */}
        <div className="p-6 md:p-8 bg-surface-container-low flex flex-col items-center justify-between gap-4">
          <div className="w-full flex flex-col items-center">
            {/* Header info */}
            <div className="flex items-center justify-between w-full mb-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-primary-container text-on-primary-container font-semibold text-label-sm uppercase tracking-wider flex items-center gap-1">
                  <MaterialSymbol name="qr_code_2" size="[14px]" />
                  {t("zaloPayBadge")} QR
                </span>
              </div>
              <div className="flex items-center gap-1 text-on-surface-variant">
                <MaterialSymbol name="verified" size="[16px]" />
                <span className="font-semibold text-label-sm">
                  {t("pciBadge")}
                </span>
              </div>
            </div>

            <h1 className="font-semibold text-on-surface text-center mb-4 text-headline-md">
              {t("title")}
            </h1>

            <CircularCountdown msLeft={msLeft} t={t} />

            <p
              className="text-on-surface-variant text-center mb-5 text-body-sm"
              suppressHydrationWarning
            >
              {t("heldFor", { time: formatCountdown(msLeft) })}
            </p>

            <QrCodeFrame qrCodeUrl={order.qrCodeUrl} expired={expired} />

            <p className="text-on-surface-variant text-center mt-3 mb-4 text-body-sm">
              {t("bankSupport")}
            </p>

            {/* 3 steps instruction */}
            <div className="w-full space-y-2 mb-4">
              {[
                { n: 1, body: t("step1") },
                { n: 2, body: t("step2") },
                {
                  n: 3,
                  body: t("step3", { amount: formatVND(order.amount) }),
                },
              ].map(({ n, body }) => (
                <div
                  key={n}
                  className="flex items-center gap-3 p-2 rounded-lg bg-surface-container-lowest text-on-surface shadow-sm"
                >
                  <span className="w-5 h-5 rounded-full bg-primary-fixed text-on-primary-fixed font-semibold text-label-sm flex items-center justify-center shrink-0">
                    {n}
                  </span>
                  <span className="text-body-sm">{body}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Real-time pulse indicator */}
          <div className="w-full py-2 px-3 rounded-lg bg-surface-container flex items-center justify-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
            </span>
            <span className="text-on-surface-variant text-body-sm">
              {t("waiting")}
            </span>
          </div>
        </div>

        {/* ── Cột phải: thông tin giao dịch + CTA ─────────── */}
        <div className="p-6 md:p-8 flex flex-col justify-between">
          <div>
            {/* Header: Brand + order code */}
            <div className="flex items-center justify-between pb-4">
              <div className="flex items-center gap-1.5">
                <Image
                  alt="Vibe Mart"
                  src="/images/vibe-mart-logo-mark-light.png"
                  width={20}
                  height={20}
                  className="h-5 w-5 object-contain"
                />
                <span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-semibold text-label-sm">
                  {t("vibeMartCheckout")}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-on-surface-variant text-body-sm">
                <span>{t("orderCodeLabel")}</span>
                <span className="font-semibold text-on-surface text-label-md">
                  {order.orderCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyOrderCode}
                  className="hover:text-primary transition-colors flex items-center"
                  aria-label={t("copyOrderCode")}
                  data-testid="qr-copy-order-code"
                >
                  <MaterialSymbol name="content_copy" size="[16px]" />
                </button>
              </div>
            </div>

            {/* Total Amount Block */}
            <div className="bg-surface-container-low rounded-xl p-4 mb-5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-on-surface-variant text-body-md">
                  {totalLabel}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-secondary-fixed/50 text-secondary font-semibold text-label-sm">
                  {t("savingsLabel")}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-primary text-display-lg tabular-nums">
                  {formatVND(order.amount)}
                </span>
                <span className="text-on-surface-variant text-body-sm line-through">
                  {formatVND(order.amount + 50_000)}
                </span>
              </div>
            </div>

            {/* Combined order details */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2.5">
                <span className="font-semibold text-on-surface text-label-lg">
                  {t("detailsTitle", { count: order.shopOrders.length })}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary-fixed/40 text-primary font-semibold text-label-sm">
                  <MaterialSymbol name="bolt" size="[14px]" />
                  {t("scanOnce")}
                </span>
              </div>
              <div className="space-y-3">
                {order.shopOrders.map((s) => (
                  <div
                    key={s.storeId}
                    className="p-3 rounded-lg bg-surface-container-lowest shadow-sm"
                    data-testid={`qr-shop-row-${s.storeId}`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "px-1 py-px rounded font-semibold text-[10px]",
                            s.storeBadge === "OfficialMall"
                              ? "bg-secondary text-on-secondary"
                              : "bg-tertiary text-on-tertiary",
                          )}
                        >
                          {s.storeBadge === "OfficialMall"
                            ? t("official")
                            : t("mall")}
                        </span>
                        <span className="font-semibold text-on-surface text-label-md">
                          {s.storeName}
                        </span>
                      </div>
                      <span className="font-bold text-on-surface text-price-md tabular-nums">
                        {formatVND(s.amount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-on-surface-variant text-body-sm">
                      <span className="truncate max-w-[210px]">
                        {s.itemSummary}
                      </span>
                      <span className="text-on-surface-variant text-label-sm">
                        {t("codeLabel")} {s.orderCode}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alert */}
            <div
              className="p-3 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed flex items-start gap-2.5 mb-6"
              role="alert"
            >
              <MaterialSymbol
                name="warning"
                size="[18px]"
                className="text-tertiary shrink-0 mt-0.5"
              />
              <p className="leading-relaxed text-body-sm">
                {t("expiryAlert", {
                  count: order.shopOrders.length,
                })}
              </p>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="space-y-2">
            {order.paymentUrl && (
              <a
                href={order.paymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-lg font-semibold text-label-lg transition-all shadow-sm flex items-center justify-center gap-2 bg-[#0284C7] text-white hover:bg-sky-700 active:scale-[0.98]"
              >
                <MaterialSymbol name="open_in_new" size="[20px]" />
                <span>Mở ứng dụng ZaloPay</span>
              </a>
            )}
            <button
              type="button"
              onClick={onComplete}
              disabled={expired}
              data-testid="qr-completed-button"
              className={cn(
                "w-full py-3 px-4 rounded-lg font-semibold text-label-lg transition-all shadow-sm flex items-center justify-center gap-2",
                "bg-primary text-on-primary hover:bg-primary-container",
                "active:scale-[0.98]",
                expired && "opacity-60 cursor-not-allowed hover:bg-primary",
              )}
            >
              <MaterialSymbol name="task_alt" size="[20px]" />
              <span>{t("completedCta")}</span>
            </button>
            {onSelectCod && (
              <button
                type="button"
                onClick={onSelectCod}
                disabled={expired}
                data-testid="qr-cod-button"
                className={cn(
                  "w-full py-2.5 px-4 rounded-lg font-semibold text-label-md transition-all border border-outline-variant flex items-center justify-center gap-2",
                  "text-on-surface hover:bg-surface-container active:scale-[0.98]",
                  expired && "opacity-60 cursor-not-allowed hover:bg-transparent",
                )}
              >
                <MaterialSymbol name="local_shipping" size="[18px]" />
                <span>Thanh toán khi nhận hàng (COD)</span>
              </button>
            )}
            <a
              href="/checkout"
              className="w-full py-2 block text-center font-semibold text-primary hover:underline transition-colors text-label-md"
              data-testid="qr-change-method"
            >
              {t("changeMethod")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
