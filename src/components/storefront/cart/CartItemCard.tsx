/**
 * CartItemCard – hiển thị 1 sản phẩm trong giỏ hàng.
 * Dựa trên Stitch design (docs/superpowers/plans/2026-10-13-cart-page-ui-stitch.md).
 */
"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { formatVND } from "@/lib/format";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import type { CartItem } from "@/features/cart/types";

interface CartItemCardProps {
  item: CartItem;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onQuantityChange?: (quantity: number) => void;
  onDelete?: () => void;
  onVariantChange?: () => void;
  /** True khi item bị out-of-stock hoặc không được chọn */
  dimmed?: boolean;
}

export function CartItemCard({
  item,
  checked = true,
  onCheckedChange,
  onQuantityChange,
  onDelete,
  onVariantChange,
  dimmed = false,
}: CartItemCardProps) {
  const [localQty, setLocalQty] = useState(item.quantity);

  const handleDecrement = () => {
    if (localQty <= 1) return;
    const newQty = localQty - 1;
    setLocalQty(newQty);
    onQuantityChange?.(newQty);
  };

  const handleIncrement = () => {
    const newQty = localQty + 1;
    setLocalQty(newQty);
    onQuantityChange?.(newQty);
  };

  const totalPrice = item.unitPrice * localQty;

  return (
    <div
      className={cn(
        "p-4 sm:px-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center transition-colors",
        dimmed
          ? "bg-slate-50/20 opacity-85"
          : "hover:bg-slate-50/40"
      )}
    >
      {/* Checkbox + Image + Info */}
      <div className="md:col-span-5 flex items-start gap-3">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          className="w-4 h-4 rounded text-primary focus:ring-primary border-slate-300 mt-2 cursor-pointer shrink-0"
        />

        {/* Image */}
        <div className="relative shrink-0">
          <Image
            src={item.imageUrl}
            alt={item.productName}
            width={80}
            height={80}
            className={cn(
              "w-18 h-18 sm:w-20 sm:h-20 rounded-lg object-cover border border-slate-200",
              dimmed && "grayscale opacity-60"
            )}
          />
          {/* Flash deal badge */}
          {!dimmed && item.originalPrice && item.originalPrice > item.unitPrice && (
            <span className="absolute top-1 left-1 bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
              -{Math.round((1 - item.unitPrice / item.originalPrice) * 100)}%
            </span>
          )}
        </div>

        {/* Product info */}
        <div className="space-y-1.5 flex-1 min-w-0">
          <h3
            className={cn(
              "text-xs sm:text-sm font-semibold leading-snug line-clamp-2 cursor-pointer",
              dimmed ? "text-slate-600" : "text-slate-900 hover:text-primary"
            )}
          >
            {item.productName}
          </h3>

          {/* Variant selector */}
          <button
            onClick={onVariantChange}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200/70 px-2 py-0.5 rounded transition-colors"
          >
            <span>{item.variantLabel || "Phân loại: Mặc định"}</span>
            <MaterialSymbol name="arrow_drop_down" size="[14px]" />
          </button>

          {/* Low stock warning */}
          {!dimmed && item.quantity > 10 && (
            <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-300 px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5">
              ⚠️ Còn {item.quantity} sản phẩm
            </span>
          )}
        </div>
      </div>

      {/* Đơn giá */}
      <div className="md:col-span-2 text-left md:text-center">
        <span className="md:hidden text-xs text-slate-400 mr-2">Đơn giá:</span>
        {item.originalPrice && item.originalPrice > item.unitPrice && (
          <span className="text-xs text-slate-400 line-through mr-1 block md:inline">
            {formatVND(item.originalPrice)}
          </span>
        )}
        <span
          className={cn(
            "text-xs sm:text-sm font-bold",
            dimmed ? "text-slate-500" : "text-slate-800"
          )}
        >
          {formatVND(item.unitPrice)}
        </span>
      </div>

      {/* Số lượng */}
      <div className="md:col-span-2 flex items-center md:justify-center">
        <span className="md:hidden text-xs text-slate-400 mr-3">Số lượng:</span>
        <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden shadow-2xs">
          <button
            onClick={handleDecrement}
            disabled={localQty <= 1 || dimmed}
            className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Giảm số lượng"
          >
            −
          </button>
          <input
            type="text"
            value={localQty}
            readOnly
            className="w-10 h-7 text-center text-xs font-semibold text-slate-800 border-x border-slate-200 focus:outline-none"
            aria-label="Số lượng"
          />
          <button
            onClick={handleIncrement}
            disabled={dimmed}
            className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Tăng số lượng"
          >
            +
          </button>
        </div>
      </div>

      {/* Thành tiền */}
      <div className="md:col-span-2 text-left md:text-right">
        <span className="md:hidden text-xs text-slate-400 mr-2">Thành tiền:</span>
        <span
          className={cn(
            "text-sm sm:text-base font-bold",
            dimmed ? "text-slate-500" : "text-primary"
          )}
        >
          {formatVND(totalPrice)}
        </span>
      </div>

      {/* Thao tác */}
      <div className="md:col-span-1 flex items-center md:justify-center">
        <button
          onClick={onDelete}
          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
          aria-label="Xóa sản phẩm"
        >
          <MaterialSymbol name="delete" size="[19px]" />
        </button>
      </div>
    </div>
  );
}
