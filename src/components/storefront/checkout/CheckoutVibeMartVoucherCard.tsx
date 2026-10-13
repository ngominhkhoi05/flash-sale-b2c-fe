/**
 * CheckoutVibeMartVoucherCard – card nhập mã giảm giá & chọn voucher VibeMart.
 * Stitch reference: ui-code-dump.md L362–442.
 */
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import type { Voucher } from "@/features/checkout";

interface CheckoutVibeMartVoucherCardProps {
  appliedVoucher?: Voucher | null;
  onApply: (code: string) => void;
  onRemove: () => void;
  onOpenPicker: () => void;
  disabled?: boolean;
  savingLabel?: string;
  /**
   * Thông báo lỗi inline khi mã không hợp lệ hoặc backend trả lỗi.
   */
  errorMessage?: string;
  onClearError?: () => void;
}

export function CheckoutVibeMartVoucherCard({
  appliedVoucher,
  onApply,
  onRemove,
  onOpenPicker,
  disabled = false,
  savingLabel,
  errorMessage,
  onClearError,
}: CheckoutVibeMartVoucherCardProps) {
  const [draftCode, setDraftCode] = useState("");

  const handleApply = () => {
    const code = draftCode.trim();
    if (!code) return;
    onApply(code);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleApply();
    }
  };

  return (
    <div
      className="w-full bg-white rounded-xl p-5 shadow-sm border border-slate-200/80 flex flex-col gap-3"
      data-testid="checkout-vibemart-voucher-card"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MaterialSymbol
            name="local_offer"
            size="xl"
            className="text-tertiary"
          />
          <h3 className="font-semibold text-base text-on-surface">
            Mã giảm giá VibeMart
          </h3>
        </div>
        <button
          type="button"
          onClick={onOpenPicker}
          disabled={disabled}
          className={cn(
            "text-sm font-semibold text-primary hover:underline",
            disabled && "opacity-50 pointer-events-none",
          )}
          data-testid="voucher-picker-trigger"
        >
          Xem thêm mã
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-on-surface-variant">
            <MaterialSymbol name="confirmation_number" size="base" />
          </span>
          <input
            type="text"
            value={draftCode}
            onChange={(e) => {
              setDraftCode(e.target.value.toUpperCase());
              if (errorMessage) onClearError?.();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Nhập mã giảm giá (vd: VIBE30K)"
            disabled={disabled}
            data-testid="voucher-code-input"
            className={cn(
              "w-full h-11 pl-10 pr-3 rounded-lg border bg-white text-sm font-medium uppercase tracking-wide",
              "placeholder:text-on-surface-variant/70 placeholder:font-normal placeholder:normal-case placeholder:tracking-normal",
              "focus:outline-none focus:ring-2 focus:ring-primary/40",
              errorMessage
                ? "border-danger"
                : "border-outline-variant",
            )}
          />
        </div>
        <button
          type="button"
          onClick={handleApply}
          disabled={disabled || !draftCode.trim()}
          data-testid="voucher-apply-button"
          className={cn(
            "h-11 px-5 rounded-lg font-semibold text-sm transition-colors",
            "bg-primary text-on-primary hover:bg-primary-hover",
            (!draftCode.trim() || disabled) &&
              "opacity-50 cursor-not-allowed hover:bg-primary",
          )}
        >
          Áp dụng
        </button>
      </div>

      {errorMessage && (
        <p
          className="text-xs text-danger flex items-center gap-1"
          data-testid="voucher-error"
          role="alert"
        >
          <MaterialSymbol name="error" size="base" />
          <span>{errorMessage}</span>
        </p>
      )}

      {appliedVoucher && (
        <div
          className="mt-1 flex items-center justify-between rounded-lg bg-secondary-soft p-3"
          data-testid="voucher-applied"
        >
          <div className="flex items-center gap-2">
            <MaterialSymbol
              name="check_circle"
              size="base"
              className="text-secondary"
            />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-secondary">
                {appliedVoucher.code}
              </span>
              <span className="text-xs text-on-surface-variant">
                {appliedVoucher.shortDescription}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-tertiary">
              −{appliedVoucher.discountLabel}
            </span>
            <button
              type="button"
              onClick={onRemove}
              disabled={disabled}
              className="text-on-surface-variant hover:text-danger"
              aria-label="Gỡ mã giảm giá"
              data-testid="voucher-remove-button"
            >
              <MaterialSymbol name="close" size="base" />
            </button>
          </div>
        </div>
      )}

      {savingLabel && (
        <p className="text-xs text-on-surface-variant italic">{savingLabel}</p>
      )}
    </div>
  );
}
