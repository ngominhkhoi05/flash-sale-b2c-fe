/**
 * VoucherPickerModal – Modal chọn voucher VibeMart (đang dùng được / hết lượt).
 * Stitch reference: ui-code-dump.md L584–654.
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import type { Voucher } from "@/features/checkout";

interface VoucherPickerModalProps {
  open: boolean;
  vouchers: Voucher[];
  appliedCode?: string | null;
  onSelect: (voucher: Voucher) => void;
  onClose: () => void;
  loading?: boolean;
  title?: string;
}

function categorize(v: Voucher): "active" | "soon" | "used" {
  if (v.status === "ACTIVE" || v.status === "AVAILABLE") return "active";
  if (v.status === "EXPIRED" || v.status === "EXHAUSTED") return "used";
  return "soon";
}

export function VoucherPickerModal({
  open,
  vouchers,
  appliedCode,
  onSelect,
  onClose,
  loading = false,
  title = "Chọn mã giảm giá VibeMart",
}: VoucherPickerModalProps) {
  const [tab, setTab] = useState<"all" | "active" | "soon" | "used">("all");

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

  const grouped = useMemo(() => {
    return vouchers.reduce<Record<"active" | "soon" | "used", Voucher[]>>(
      (acc, v) => {
        acc[categorize(v)].push(v);
        return acc;
      },
      { active: [], soon: [], used: [] },
    );
  }, [vouchers]);

  const visible = useMemo(() => {
    if (tab === "all") return vouchers;
    return grouped[tab];
  }, [tab, grouped, vouchers]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/40"
      data-testid="voucher-picker-modal"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full md:max-w-[560px] bg-white md:rounded-2xl rounded-t-2xl shadow-xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-outline-variant">
          <h2 className="font-bold text-base text-on-surface">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface"
            aria-label="Đóng"
            data-testid="voucher-picker-close"
          >
            <MaterialSymbol name="close" size="xl" />
          </button>
        </div>

        <div className="px-4 pt-3 flex items-center gap-2 overflow-x-auto">
          {(
            [
              { id: "all", label: `Tất cả (${vouchers.length})` },
              { id: "active", label: `Có thể dùng (${grouped.active.length})` },
              { id: "soon", label: `Sắp tới (${grouped.soon.length})` },
              { id: "used", label: `Hết hạn (${grouped.used.length})` },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "h-9 px-3 rounded-full text-xs font-semibold whitespace-nowrap",
                tab === t.id
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high",
              )}
              data-testid={`voucher-tab-${t.id}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {loading && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 rounded-lg bg-surface-container animate-pulse"
                />
              ))}
            </div>
          )}

          {!loading && visible.length === 0 && (
            <div className="text-center text-sm text-on-surface-variant py-10">
              Không có mã nào trong mục này.
            </div>
          )}

          {visible.map((voucher) => {
            const isUsable = categorize(voucher) === "active";
            const isApplied = voucher.code === appliedCode;
            return (
              <div
                key={voucher.code}
                className={cn(
                  "rounded-xl p-4 flex items-start justify-between gap-3 border",
                  isUsable
                    ? "border-secondary-soft bg-secondary-soft/30"
                    : "border-outline-variant bg-surface-container-low",
                )}
                data-testid={`voucher-option-${voucher.code}`}
                data-state={categorize(voucher)}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-tertiary">
                      {voucher.code}
                    </span>
                    {isApplied && (
                      <span className="text-[10px] font-bold uppercase text-secondary">
                        Đang dùng
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-on-surface">
                    {voucher.shortDescription}
                  </span>
                  <span className="text-[11px] text-on-surface-variant">
                    HSD: {voucher.expiresAtLabel}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => isUsable && onSelect(voucher)}
                  disabled={!isUsable}
                  className={cn(
                    "h-9 px-4 rounded-lg text-sm font-semibold",
                    isUsable
                      ? "bg-primary text-on-primary hover:bg-primary-hover"
                      : "bg-surface-container-high text-on-surface-variant cursor-not-allowed",
                  )}
                  data-testid={`voucher-apply-${voucher.code}`}
                >
                  {isUsable
                    ? isApplied
                      ? "Đã áp dụng"
                      : "Áp dụng"
                    : "Không khả dụng"}
                </button>
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-outline-variant">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-11 rounded-lg bg-surface-container text-on-surface font-semibold text-sm hover:bg-surface-container-high"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
