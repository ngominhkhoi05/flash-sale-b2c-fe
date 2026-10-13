/**
 * AddressPickerModal – Modal chọn địa chỉ giao hàng.
 * Stitch reference: ui-code-dump.md L584–654.
 */
"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import type { Address } from "@/features/checkout";

interface AddressPickerModalProps {
  open: boolean;
  addresses: Address[];
  selectedId?: number;
  onSelect: (address: Address) => void;
  onAddNew?: () => void;
  onClose: () => void;
  title?: string;
}

function buildFullAddress(addr: Address): string {
  return [addr.street, addr.ward, addr.district, addr.city]
    .filter(Boolean)
    .join(", ");
}

export function AddressPickerModal({
  open,
  addresses,
  selectedId,
  onSelect,
  onAddNew,
  onClose,
  title = "Chọn địa chỉ giao hàng",
}: AddressPickerModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/40"
      data-testid="address-picker-modal"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full md:max-w-[520px] bg-white md:rounded-2xl rounded-t-2xl shadow-xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-outline-variant">
          <h2 className="font-bold text-base text-on-surface">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface"
            aria-label="Đóng"
            data-testid="address-picker-close"
          >
            <MaterialSymbol name="close" size="xl" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {addresses.length === 0 && (
            <div className="text-center text-sm text-on-surface-variant py-10">
              Bạn chưa có địa chỉ nào. Hãy thêm địa chỉ mới.
            </div>
          )}

          {addresses.map((addr) => {
            const isSelected = addr.id === selectedId;
            return (
              <button
                key={addr.id}
                type="button"
                onClick={() => onSelect(addr)}
                data-testid={`address-option-${addr.id}`}
                data-active={isSelected}
                className={cn(
                  "text-left rounded-xl p-4 transition-colors",
                  isSelected
                    ? "ring-2 ring-primary bg-surface-container-low"
                    : "bg-white border border-outline-variant hover:bg-surface-container-low",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-on-surface">
                        {addr.recipientName}
                      </span>
                      <span className="text-xs text-on-surface-variant">
                        {addr.phone}
                      </span>
                      {addr.isDefault && (
                        <span className="bg-secondary-soft text-secondary text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                          Mặc định
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant">
                      {buildFullAddress(addr)}
                    </p>
                  </div>
                  {isSelected && (
                    <MaterialSymbol
                      name="check_circle"
                      size="xl"
                      className="text-primary"
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-outline-variant flex items-center gap-2">
          <button
            type="button"
            onClick={onAddNew}
            className="flex-1 h-11 rounded-lg border border-primary text-primary font-semibold text-sm hover:bg-primary-soft/30 transition-colors flex items-center justify-center gap-1"
            data-testid="address-picker-add"
          >
            <MaterialSymbol name="add" size="base" />
            <span>Thêm địa chỉ mới</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-5 rounded-lg bg-primary text-on-primary font-semibold text-sm hover:bg-primary-hover transition-colors"
            data-testid="address-picker-done"
          >
            Xong
          </button>
        </div>
      </div>
    </div>
  );
}
