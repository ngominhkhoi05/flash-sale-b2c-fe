/**
 * PaymentZaloPayPanel — UI cho việc thanh toán ZaloPay.
 *
 * Đặc tả: `docs/handoffs/fe-zalopay-integration-guide.md` §6.4.
 * Stitch reference: `docs/stitch-catalog.md` (screen 203897a8 - thanh toán QR).
 *
 * Behavior:
 *  - Lấy payment status từ `useOrderPayment(orderId, { orderCode })`.
 *    Hook này tự combine WS event `PAYMENT_STATUS_CHANGED` + polling 3s.
 *  - Auto-create payment intent nếu `paymentMethod = UNPAID` vào mount.
 *  - Render 5 trạng thái (loading/skeleton, PENDING, SUCCESS, EXPIRED, FAILED).
 *  - QR dùng `next/image` với `unoptimized priority` (data URL, không CDN).
 *
 * Source of truth: `docs/CLAUDE.md` §8 mục 5 — "trạng thái thanh toán cuối
 * cùng chỉ tin theo backend", KHÔNG đoán từ URL param.
 */
"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Countdown } from "@/components/common/Countdown";
import {
  useCreateZaloPayPayment,
  useOrderPayment,
  useQueryZaloPayPayment,
} from "@/features/checkout";

export interface PaymentZaloPayPanelProps {
  orderId: number;
  orderCode: string;
  /** ISO timestamp khi order hết hạn giữ chỗ (optional). */
  expiresAt?: string;
  /** Click "Xem đơn hàng" sau khi SUCCESS — navigate hoặc custom. */
  onViewOrder?: () => void;
  /** Click "Thử lại" khi EXPIRED/FAILED. */
  onRetry?: () => void;
}

/**
 * Visual states:
 *  - skeleton: isLoading (chưa fetch xong)
 *  - pending: status = PENDING + có qrCodeUrl
 *  - pendingNoQr: status = PENDING nhưng chưa có qrCodeUrl
 *  - success: status = SUCCESS
 *  - expired/failed: status = EXPIRED/FAILED/CANCELLED/REFUNDED
 *
 * @see {@link ./payment.types.ts} cho payment status union.
 */
export function PaymentZaloPayPanel({
  orderId,
  orderCode,
  expiresAt,
  onViewOrder,
  onRetry,
}: PaymentZaloPayPanelProps) {
  const t = useTranslations("storefront.checkout.qrPayment");

  // Polling ON khi user ở trang payment → fallback khi WS miss
  // (BE guide §5.4 — 3s/lần, tối đa 5 phút = order TTL).
  const { data: payment, isLoading } = useOrderPayment(orderId, {
    polling: true,
    orderCode,
  });

  const { mutate: createPayment, isPending: isCreating } =
    useCreateZaloPayPayment();
  const { mutate: queryPayment, isPending: isQuerying } =
    useQueryZaloPayPayment();

  // Auto-create payment intent khi mount nếu chưa có (UNPAID).
  useEffect(() => {
    if (!payment) return;
    if (payment.paymentMethod === "UNPAID" && !isCreating) {
      createPayment(orderId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payment?.paymentMethod, orderId]);

  // 1. Loading state
  if (isLoading) {
    return (
      <div
        data-testid="payment-skeleton"
        className="flex flex-col items-center gap-4 p-6"
      >
        <Skeleton className="h-64 w-64 rounded-lg" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full max-w-sm" />
      </div>
    );
  }

  if (!payment) return null;

  const isSuccess = payment.status === "SUCCESS";
  const isFailed =
    payment.status === "EXPIRED" ||
    payment.status === "FAILED" ||
    payment.status === "CANCELLED" ||
    payment.status === "REFUNDED";

  // 2. Success state
  if (isSuccess) {
    return (
      <div
        data-testid="payment-success"
        className="flex flex-col items-center gap-4 p-6 text-success"
      >
        <CheckCircle2 className="h-16 w-16" aria-hidden="true" />
        <h2 className="text-xl font-semibold text-on-surface">
          {t("completedToast")}
        </h2>
        {onViewOrder && (
          <Button
            variant="primary"
            onClick={onViewOrder}
            aria-label={t("viewOrder")}
          >
            {t("viewOrder")}
          </Button>
        )}
      </div>
    );
  }

  // 3. Expired / failed state
  if (isFailed) {
    return (
      <div
        data-testid="payment-expired"
        className="flex flex-col items-center gap-4 p-6 text-warning"
      >
        <AlertTriangle className="h-16 w-16" aria-hidden="true" />
        <h2 className="text-xl font-semibold text-on-surface">
          {payment.status === "EXPIRED" ? t("countdownZero") : "Thanh toán thất bại"}
        </h2>
        {onRetry && (
          <Button variant="primary" onClick={onRetry}>
            {t("retry")}
          </Button>
        )}
      </div>
    );
  }

  // 4. PENDING — fallback khi qrCodeUrl null
  if (!payment.qrCodeUrl) {
    return (
      <div
        data-testid="payment-generating"
        className="flex flex-col items-center gap-4 p-6"
      >
        <div className="h-64 w-64 flex items-center justify-center border border-outline-variant rounded-lg bg-surface-container-lowest">
          <p className="text-on-surface-variant text-sm">{t("missingQr")}</p>
        </div>
      </div>
    );
  }

  // 5. PENDING — full QR + buttons
  return (
    <div
      data-testid="payment-pending"
      className="flex flex-col items-center gap-4 p-6"
    >
      <h2 className="text-xl font-semibold text-on-surface">{t("scanQr")}</h2>

      {expiresAt && (
        <div className="text-sm text-warning">
          <Countdown endsAt={expiresAt} />
        </div>
      )}

      {/* QR Code: next/image với unoptimized vì là data URL */}
      {/* rule component-pattern.mdc §10 — KHÔNG dùng <img> */}
      <Image
        src={payment.qrCodeUrl}
        alt={t("qrAlt")}
        width={256}
        height={256}
        unoptimized
        priority
        className="rounded-lg border border-outline-variant"
      />

      {/* Deeplink button mở ZaloPay app */}
      {payment.paymentUrl && (
        <Button asChild className="w-full max-w-sm" variant="primary">
          <a
            href={payment.paymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("openApp")}
          >
            <ExternalLink className="h-4 w-4 mr-2" aria-hidden="true" />
            {t("openApp")}
          </a>
        </Button>
      )}

      {/* Manual sync button */}
      <Button
        variant="secondary"
        onClick={() => queryPayment(orderId)}
        disabled={isQuerying}
        aria-label={isQuerying ? t("manualSyncing") : t("manualSync")}
        className="w-full max-w-sm"
      >
        <RefreshCw
          className={`h-4 w-4 mr-2 ${isQuerying ? "animate-spin" : ""}`}
          aria-hidden="true"
        />
        {isQuerying ? t("manualSyncing") : t("manualSync")}
      </Button>

      <p className="text-sm text-on-surface-variant text-center max-w-sm">
        {t("autoConfirmHint")}
      </p>
    </div>
  );
}
