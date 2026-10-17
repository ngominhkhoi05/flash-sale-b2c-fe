"use client";

/**
 * OrderDetailClient — Client component cho trang /orders/[id].
 *
 * Hiển thị trạng thái đơn hàng + payment panel. Theo handoff
 * `docs/handoffs/fe-zalopay-integration-guide.md`:
 *   - Mount `useOrderPayment(orderId, { polling: true })` → trả PaymentResponse.
 *   - `PaymentZaloPayPanel` xử lý 5 states (loading, pending, success, expired/failed, no-qr).
 *   - Real-time: WS event `PAYMENT_STATUS_CHANGED` đã được hook lắng nghe + invalidation.
 *
 * @see src/features/checkout/usePayment.ts — hook useOrderPayment.
 * @see src/features/checkout/components/PaymentZaloPayPanel.tsx — UI panel.
 */
import { useOrderPayment } from "@/features/checkout";
import { PaymentZaloPayPanel } from "@/features/checkout/components/PaymentZaloPayPanel";
import { useTranslations } from "next-intl";

interface OrderDetailClientProps {
  orderId: number;
}

export function OrderDetailClient({ orderId }: OrderDetailClientProps) {
  const t = useTranslations("orders");
  const { data: payment, isLoading, isError, error } = useOrderPayment(orderId, {
    polling: true,
  });

  if (isLoading) {
    return (
      <div
        data-testid="order-detail-loading"
        className="mx-auto max-w-2xl py-8"
      >
        <div className="h-8 w-1/2 animate-pulse rounded bg-surface-container" />
        <div className="mt-4 h-64 animate-pulse rounded-lg bg-surface-container" />
      </div>
    );
  }

  if (isError) {
    return (
      <div
        data-testid="order-detail-error"
        className="mx-auto max-w-2xl py-12 text-center"
      >
        <h2 className="text-lg font-semibold text-on-surface">
          {t("detail.loadErrorTitle")}
        </h2>
        <p className="mt-2 text-sm text-on-surface-variant">
          {error instanceof Error ? error.message : t("detail.loadErrorGeneric")}
        </p>
      </div>
    );
  }

  if (!payment) {
    return (
      <div
        data-testid="order-detail-empty"
        className="mx-auto max-w-2xl py-12 text-center"
      >
        <h2 className="text-lg font-semibold text-on-surface">
          {t("detail.notFoundTitle")}
        </h2>
        <p className="mt-2 text-sm text-on-surface-variant">
          {t("detail.notFoundMessage")}
        </p>
      </div>
    );
  }

  return (
    <section
      data-testid="order-detail"
      className="mx-auto max-w-2xl py-6"
      aria-labelledby="order-detail-title"
    >
      <header className="mb-6">
        <h1
          id="order-detail-title"
          className="text-2xl font-semibold text-on-surface"
        >
          {t("detail.title")}
        </h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          {t("detail.orderCode")}:{" "}
          <span className="font-mono">{payment.orderCode}</span>
        </p>
      </header>

      <PaymentZaloPayPanel
        orderId={payment.orderId}
        orderCode={payment.orderCode}
        onViewOrder={() => {
          // TODO: navigate đến trang đơn hàng chi tiết đầy đủ (khi có)
          window.location.reload();
        }}
        onRetry={() => {
          window.location.reload();
        }}
      />
    </section>
  );
}
