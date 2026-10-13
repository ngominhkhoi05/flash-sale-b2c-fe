/**
 * CartShopGroup – hiển thị nhóm sản phẩm theo shop.
 * Gồm: shop header + danh sách CartItemCard + voucher row.
 * Dựa trên Stitch design (docs/superpowers/plans/2026-10-13-cart-page-ui-stitch.md).
 */
"use client";

import Link from "next/link";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { CartItemCard } from "./CartItemCard";
import type { CartItem } from "@/features/cart/types";

interface CartShopGroupProps {
  shopId: string;
  shopName: string;
  isMall?: boolean;
  items: CartItem[];
  checkedItems: Set<string>;
  onCheckedChange: (itemId: string, checked: boolean) => void;
  onQuantityChange: (itemId: string, quantity: number) => void;
  onDeleteItem: (itemId: string) => void;
  onChatShop?: () => void;
  onViewShop?: () => void;
  onSelectVoucher?: () => void;
  shopVoucher?: {
    code: string;
    discountLabel: string;
  };
}

export function CartShopGroup({
  shopId,
  shopName,
  isMall = false,
  items,
  checkedItems,
  onCheckedChange,
  onQuantityChange,
  onDeleteItem,
  onChatShop,
  onViewShop,
  onSelectVoucher,
  shopVoucher,
}: CartShopGroupProps) {
  const allChecked = items.every((item) => checkedItems.has(item.id));
  const someChecked = items.some((item) => checkedItems.has(item.id));

  const handleShopCheckboxChange = (checked: boolean) => {
    items.forEach((item) => onCheckedChange(item.id, checked));
  };

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* ── Shop Header ───────────────────────────────────────── */}
      <div className="p-4 sm:px-6 border-b border-slate-100 bg-slate-50/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Shop checkbox */}
          <input
            type="checkbox"
            checked={allChecked}
            ref={(el) => {
              if (el) el.indeterminate = !allChecked && someChecked;
            }}
            onChange={(e) => handleShopCheckboxChange(e.target.checked)}
            className="w-4 h-4 rounded text-primary focus:ring-primary border-slate-300 cursor-pointer"
          />
          {/* Mall badge */}
          {isMall && (
            <span className="bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
              Mall
            </span>
          )}
          {/* Shop name */}
          <Link
            href={`/shop/${shopId}`}
            className="font-bold text-slate-900 text-sm hover:text-primary transition-colors flex items-center gap-1"
          >
            {shopName}
            <MaterialSymbol name="chevron_right" size="sm" />
          </Link>
        </div>

        {/* Shop actions */}
        <div className="flex items-center gap-2">
          {onChatShop && (
            <button
              onClick={onChatShop}
              className="px-2.5 py-1 text-xs font-medium rounded border border-slate-200 bg-white hover:border-primary hover:text-primary text-slate-600 transition-colors flex items-center gap-1"
            >
              <MaterialSymbol name="chat" size="sm" className="text-primary" />
              Chat ngay
            </button>
          )}
          {onViewShop && (
            <Link
              href={`/shop/${shopId}`}
              className="px-2.5 py-1 text-xs font-medium rounded border border-slate-200 bg-white hover:border-slate-400 text-slate-700 transition-colors"
            >
              Xem shop
            </Link>
          )}
        </div>
      </div>

      {/* ── Items List ───────────────────────────────────────── */}
      <div className="divide-y divide-slate-100">
        {items.map((item) => (
          <CartItemCard
            key={item.id}
            item={item}
            checked={checkedItems.has(item.id)}
            onCheckedChange={(checked) => onCheckedChange(item.id, checked)}
            onQuantityChange={(qty) => onQuantityChange(item.id, qty)}
            onDelete={() => onDeleteItem(item.id)}
            dimmed={!checkedItems.has(item.id)}
          />
        ))}
      </div>

      {/* ── Shop Voucher Row ────────────────────────────────── */}
      {shopVoucher && (
        <div className="p-3.5 sm:px-6 bg-slate-50/70 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <MaterialSymbol name="loyalty" size="sm" className="text-rose-500" />
            <span>
              Voucher của Shop:{" "}
              <strong className="text-rose-600 font-semibold">
                {shopVoucher.discountLabel}
              </strong>
            </span>
          </div>
          <button
            onClick={onSelectVoucher}
            className="text-primary font-semibold hover:underline flex items-center gap-0.5"
          >
            Chọn hoặc nhập mã{" "}
            <MaterialSymbol name="chevron_right" size="sm" />
          </button>
        </div>
      )}
    </div>
  );
}
