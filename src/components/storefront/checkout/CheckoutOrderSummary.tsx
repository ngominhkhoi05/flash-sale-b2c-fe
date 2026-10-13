/**
 * CheckoutOrderSummary – Tóm tắt đơn hàng + nút Đặt hàng ngay.
 * Stitch reference: ui-code-dump.md L444–540.
 */
"use client";

import { cn } from "@/lib/utils";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import type { PaymentMethod } from "@/features/checkout";

export interface CheckoutOrderSummaryLine {
  label: string;
  value: string;
  emphasis?: boolean;
  strikethrough?: boolean;
  highlight?: "default" | "sale" | "secondary";
}

interface CheckoutOrderSummaryProps {
  lines: CheckoutOrderSummaryLine[];
  grandTotal: string;
  totalLabel?: string;
  paymentMethod: PaymentMethod;
  isSubmitting: boolean;
  hasError?: boolean;
  canSubmit: boolean;
  onSubmit: () => void;
  submitLabel?: string;
  termsText?: string;
  vatNoticeText?: string;
  guaranteeText?: string;
}

function highlightClass(h?: CheckoutOrderSummaryLine["highlight"]) {
  switch (h) {
    case "sale":
      return "text-tertiary";
    case "secondary":
      return "text-secondary";
    default:
      return "text-on-surface";
  }
}

export function CheckoutOrderSummary({
  lines,
  grandTotal,
  totalLabel = "Tổng thanh toán",
  paymentMethod,
  isSubmitting,
  hasError = false,
  canSubmit,
  onSubmit,
  submitLabel = "Đặt hàng ngay",
  termsText,
  vatNoticeText,
  guaranteeText,
}: CheckoutOrderSummaryProps) {
  return (
    <div
      className="w-full bg-white rounded-xl p-5 shadow-sm border border-slate-200/80 flex flex-col gap-4"
      data-testid="checkout-order-summary"
    >
      <div className="flex items-center gap-2">
        <MaterialSymbol name="receipt_long" size="xl" className="text-primary" />
        <h3 className="font-semibold text-base text-on-surface">
          Tóm tắt đơn hàng
        </h3>
      </div>

      <div className="flex flex-col gap-2 pb-2 border-b border-dashed border-outline-variant">
        {lines.map((line, idx) => (
          <div
            key={`${line.label}-${idx}`}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-on-surface-variant">{line.label}</span>
            <span
              className={cn(
                "font-medium tabular-nums",
                highlightClass(line.highlight),
                line.strikethrough && "line-through text-on-surface-variant",
                line.emphasis && "font-bold",
              )}
            >
              {line.value}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-end justify-between pt-1">
        <div className="flex flex-col">
          <span className="text-xs text-on-surface-variant">{totalLabel}</span>
          <span className="text-xs text-secondary">Đã bao gồm VAT</span>
        </div>
        <span
          className="text-2xl font-bold text-primary tabular-nums"
          data-testid="grand-total"
        >
          {grandTotal}
        </span>
      </div>

      {vatNoticeText && (
        <p className="text-xs text-on-surface-variant bg-surface-container-low p-2 rounded">
          {vatNoticeText}
        </p>
      )}

      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit || isSubmitting}
        data-testid="submit-order-button"
        className={cn(
          "w-full h-12 rounded-lg font-semibold text-base transition-colors",
          "bg-primary text-on-primary hover:bg-primary-hover",
          "flex items-center justify-center gap-2",
          (!canSubmit || isSubmitting) &&
            "opacity-60 cursor-not-allowed hover:bg-primary",
        )}
      >
        {isSubmitting ? (
          <>
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Đang xử lý...</span>
          </>
        ) : (
          <>
            <span>{submitLabel}</span>
            <span className="ml-1 text-on-primary/90 font-bold tabular-nums">
              ({grandTotal})
            </span>
          </>
        )}
      </button>

      {hasError && (
        <p
          className="text-xs text-danger flex items-center gap-1"
          data-testid="submit-error"
          role="alert"
        >
          <MaterialSymbol name="error" size="base" />
          <span>Đặt hàng thất bại. Vui lòng thử lại.</span>
        </p>
      )}

      {paymentMethod === "ZALOPAY" && (
        <p className="text-xs text-on-surface-variant text-center">
          Đơn hàng sẽ được giữ chỗ trong 5 phút. Vui lòng hoàn tất thanh toán
          trong thời gian này.
        </p>
      )}

      {termsText && (
        <p
          className="text-xs text-on-surface-variant text-center"
          dangerouslySetInnerHTML={{ __html: termsText }}
        />
      )}

      {guaranteeText && (
        <div className="flex items-center justify-center gap-2 pt-2 border-t border-dashed border-outline-variant">
          <MaterialSymbol name="verified" size="base" className="text-secondary" />
          <span className="text-xs text-on-surface-variant">{guaranteeText}</span>
        </div>
      )}
    </div>
  );
}
