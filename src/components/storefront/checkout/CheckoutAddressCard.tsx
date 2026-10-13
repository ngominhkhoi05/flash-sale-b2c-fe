/**
 * CheckoutAddressCard – card hiển thị địa chỉ nhận hàng hiện tại.
 * Click "Thay đổi" mở AddressPickerModal.
 * Stitch reference: ui-code-dump.md L82–117.
 */
"use client";

import { MaterialSymbol } from "@/components/ui/material-symbol";
import { Button } from "@/components/ui/button";
import type { Address } from "@/features/checkout";

interface CheckoutAddressCardProps {
  address: Address;
  onChange: () => void;
  /** Optional: hide the change button (e.g. when modal already open). */
  hideChangeButton?: boolean;
}

export function CheckoutAddressCard({
  address,
  onChange,
  hideChangeButton = false,
}: CheckoutAddressCardProps) {
  return (
    <div
      className="relative bg-white rounded-xl p-5 shadow-sm border border-slate-200/80 overflow-hidden flex flex-col gap-2"
      data-testid="checkout-address-card"
    >
      {/* gradient accent bar */}
      <span
        aria-hidden
        className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary-container"
      />

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-primary">
          <MaterialSymbol name="location_on" size="xl" />
          <span className="font-semibold text-base text-on-surface">
            Địa chỉ nhận hàng
          </span>
        </div>
        {!hideChangeButton && (
          <Button
            variant="link"
            size="sm"
            onClick={onChange}
            className="font-semibold gap-0.5"
            data-testid="change-address-button"
          >
            <span>Thay đổi</span>
            <MaterialSymbol name="chevron_right" size="sm" />
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-0.5">
        <span className="font-semibold text-base text-on-surface">
          {address.recipientName}
        </span>
        <span className="text-outline-variant">|</span>
        <span className="font-medium text-sm text-on-surface-variant">
          {address.phone}
        </span>
        {address.isDefault && (
          <span className="bg-primary-fixed text-on-primary-fixed-variant font-semibold text-xs px-2 py-0.5 rounded-full">
            Mặc định
          </span>
        )}
      </div>

      <p className="font-normal text-sm text-on-surface-variant leading-relaxed">
        {address.street}, {address.ward}, {address.district}, {address.city}
      </p>
    </div>
  );
}
