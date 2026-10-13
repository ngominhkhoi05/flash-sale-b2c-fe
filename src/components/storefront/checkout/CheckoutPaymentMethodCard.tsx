/**
 * CheckoutPaymentMethodCard – card chọn phương thức thanh toán (ZaloPay vs COD).
 * Stitch reference: ui-code-dump.md L302–360.
 */
"use client";

import { cn } from "@/lib/utils";
import { MaterialSymbol, type MaterialSymbolName } from "@/components/ui/material-symbol";
import type { PaymentMethod } from "@/features/checkout";

interface CheckoutPaymentMethodCardProps {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  disabled?: boolean;
}

const OPTIONS: Array<{
  value: PaymentMethod;
  label: string;
  icon: MaterialSymbolName;
  iconClassName: string;
  description: string;
  highlight?: string;
  hint?: string;
}> = [
  {
    value: "ZALOPAY",
    label: "ZaloPay – Quét mã QR",
    icon: "qr_code_2",
    iconClassName: "text-primary",
    description:
      "Quét 1 mã QR duy nhất để thanh toán tất cả các đơn hàng nhanh chóng, hoàn tiền tức thì nếu hủy.",
    highlight: "Khuyên dùng",
    hint: "Hỗ trợ Napas / Visa / MasterCard",
  },
  {
    value: "COD",
    label: "Thanh toán khi nhận hàng (COD)",
    icon: "payments",
    iconClassName: "text-on-surface-variant",
    description:
      "Thanh toán tiền mặt cho nhân viên giao hàng khi nhận từng kiện. Vui lòng chuẩn bị đúng số tiền.",
    hint: "Phí thu hộ: 0₫",
  },
];

export function CheckoutPaymentMethodCard({
  value,
  onChange,
  disabled = false,
}: CheckoutPaymentMethodCardProps) {
  return (
    <div
      className="w-full bg-white rounded-xl p-5 shadow-sm border border-slate-200/80 flex flex-col gap-4"
      data-testid="checkout-payment-method-card"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MaterialSymbol
            name="credit_card"
            size="xl"
            className="text-primary"
          />
          <h3 className="font-semibold text-base text-on-surface">
            Phương thức thanh toán
          </h3>
        </div>
        <div className="hidden sm:flex items-center gap-1 text-xs text-secondary">
          <MaterialSymbol name="security" size="base" />
          <span>Bảo mật 100% qua ZaloPay & PCI-DSS</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {OPTIONS.map((option) => {
          const isActive = value === option.value;
          return (
            <label
              key={option.value}
              className={cn(
                "relative rounded-xl p-4 cursor-pointer flex flex-col justify-between gap-2 transition-all",
                isActive
                  ? "bg-surface-container-low shadow-sm ring-2 ring-primary"
                  : "bg-white shadow-sm border border-slate-200 hover:bg-surface-container-low",
                disabled && "opacity-60 cursor-not-allowed",
              )}
              data-testid={`payment-option-${option.value}`}
              data-active={isActive}
            >
              <input
                type="radio"
                name="payment_method"
                value={option.value}
                checked={isActive}
                disabled={disabled}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
                      isActive
                        ? "bg-primary"
                        : "bg-surface-container-high",
                    )}
                  >
                    <span
                      className={cn(
                        "w-2.5 h-2.5 rounded-full",
                        isActive
                          ? "bg-on-primary"
                          : "bg-transparent",
                      )}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <MaterialSymbol
                      name={option.icon}
                      size="2xl"
                      className={option.iconClassName}
                    />
                    <span
                      className={cn(
                        "font-bold text-sm text-on-surface",
                        !isActive && "font-semibold",
                      )}
                    >
                      {option.label}
                    </span>
                  </div>
                </div>
                {option.highlight && (
                  <span className="bg-secondary text-on-secondary font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full">
                    {option.highlight}
                  </span>
                )}
              </div>

              <p className="font-normal text-xs text-on-surface-variant pl-8">
                {option.description}
              </p>

              {option.hint && (
                <div className="pl-8 pt-1 flex items-center gap-2">
                  <span
                    className={cn(
                      "font-medium text-xs px-2 py-0.5 rounded",
                      isActive
                        ? "bg-surface-container-high text-primary"
                        : "text-on-surface-variant",
                    )}
                  >
                    {option.hint}
                  </span>
                </div>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}
