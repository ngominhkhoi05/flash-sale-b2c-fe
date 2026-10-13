/**
 * CartStickyFooter – sticky footer với tổng tiền và nút Mua hàng.
 * Dựa trên Stitch design (docs/superpowers/plans/2026-10-13-cart-page-ui-stitch.md).
 */
"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatVND } from "@/lib/format";
import { ROUTES } from "@/lib/constants";
import { MaterialSymbol } from "@/components/ui/material-symbol";

interface CartStickyFooterProps {
  totalItems?: number;
  subtotal: number;
  discount: number;
  selectedCount: number;
  totalCount: number;
  hasVoucherApplied?: boolean;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  onDeleteSelected?: () => void;
  onSelectVoucher?: () => void;
}

export function CartStickyFooter({
  subtotal,
  discount,
  selectedCount,
  totalCount,
  hasVoucherApplied = false,
  onSelectAll,
  onDeselectAll,
  onDeleteSelected,
  onSelectVoucher,
}: CartStickyFooterProps) {
  const hasSelectedItems = selectedCount > 0;
  const allSelected = selectedCount === totalCount && totalCount > 0;

  return (
    <aside className="sticky bottom-0 z-40 bg-white/95 backdrop-blur-md border-y border-slate-200/90 shadow-[0_-6px_25px_rgba(0,0,0,0.08)] transition-all">
      <div className="max-w-[1240px] mx-auto px-4 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
        {/* ── Left: Checkbox + Actions ───────────────────────── */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
          {/* Select all checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="check-all-cart"
              checked={allSelected}
              onChange={() => (allSelected ? onDeselectAll?.() : onSelectAll?.())}
              className="w-4 h-4 rounded text-primary focus:ring-primary border-slate-300 cursor-pointer"
            />
            <label
              htmlFor="check-all-cart"
              className="text-xs sm:text-sm font-bold text-slate-800 cursor-pointer select-none"
            >
              Chọn tất cả ({selectedCount})
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            {hasSelectedItems && (
              <button
                onClick={onDeleteSelected}
                className="text-xs text-slate-500 hover:text-rose-600 transition-colors font-medium"
              >
                Xóa
              </button>
            )}
            {selectedCount > 0 && <span className="text-slate-300">|</span>}
            {selectedCount > 0 && (
              <button
                onClick={onDeselectAll}
                className="text-xs text-slate-500 hover:text-primary transition-colors font-medium"
              >
                Bỏ chọn tất cả
              </button>
            )}
          </div>
        </div>

        {/* ── Middle: Voucher ──────────────────────────────── */}
        <div className="flex items-center gap-2 text-xs text-slate-700 w-full md:w-auto justify-between md:justify-center border-y md:border-y-0 border-slate-100 py-1.5 md:py-0">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-1 font-semibold px-2.5 py-1 rounded-md border",
                hasVoucherApplied
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-sky-50 text-primary border-sky-100"
              )}
            >
              <MaterialSymbol
                name={hasVoucherApplied ? "check_circle" : "sell"}
                size="[16px]"
                fill={hasVoucherApplied}
              />
              <span>
                {hasVoucherApplied ? "Đã áp dụng Freeship" : "Giảm 25.000₫ Freeship Xtra"}
              </span>
            </div>
          </div>
          <button
            onClick={onSelectVoucher}
            className="text-primary font-semibold hover:underline flex items-center gap-0.5 ml-1"
          >
            Chọn mã <MaterialSymbol name="chevron_right" size="sm" />
          </button>
        </div>

        {/* ── Right: Total + Buy Button ────────────────────── */}
        <div className="flex items-center justify-between md:justify-end gap-5 w-full md:w-auto">
          {/* Total */}
          <div className="text-left md:text-right">
            <div className="text-xs text-slate-600 flex items-baseline gap-1 md:justify-end flex-wrap">
              <span>Tổng thanh toán ({selectedCount} sản phẩm):</span>
              <span className="text-lg sm:text-2xl font-bold text-primary leading-none tracking-tight">
                {formatVND(subtotal)}
              </span>
            </div>
            {discount > 0 && (
              <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                Tiết kiệm {formatVND(discount)}{" "}
                <span className="text-slate-400 font-normal hidden sm:inline">
                  (Đã kèm voucher & Freeship)
                </span>
              </div>
            )}
          </div>

          {/* Buy button */}
          <Link
            href={hasSelectedItems ? ROUTES.CHECKOUT : "#"}
            className={cn(
              "px-8 py-3 rounded-xl font-bold text-sm shadow-md transition-all transform flex items-center gap-2 shrink-0",
              hasSelectedItems
                ? "bg-primary hover:bg-primary-hover text-on-primary hover:shadow-lg active:scale-95"
                : "bg-slate-300 text-slate-500 cursor-not-allowed"
            )}
            aria-disabled={!hasSelectedItems}
            onClick={(e) => !hasSelectedItems && e.preventDefault()}
          >
            <span>Mua hàng</span>
            <MaterialSymbol name="arrow_forward" size="lg" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
