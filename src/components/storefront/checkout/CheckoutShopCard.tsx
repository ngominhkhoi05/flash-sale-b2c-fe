/**
 * CheckoutShopCard – 1 card cho 1 shop (kiện hàng).
 * Header (badge + tên shop + giao dự kiến) + list items + voucher shop +
 * lời nhắn + tạm tính.
 * Stitch reference: ui-code-dump.md L141–297 (UTC Fashion + TechZone).
 */
"use client";

import { useState } from "react";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatVND } from "@/lib/format";
import type { CheckoutShopGroup } from "@/features/checkout";
import { CheckoutShopItem } from "./CheckoutShopItem";

interface CheckoutShopCardProps {
  group: CheckoutShopGroup;
  onChangeVoucher?: (group: CheckoutShopGroup) => void;
  onChangeNote?: (storeId: number, note: string) => void;
}

const BADGE_LABEL: Record<string, string> = {
  Mall: "Mall",
  OfficialMall: "Official Mall",
};

export function CheckoutShopCard({
  group,
  onChangeVoucher,
  onChangeNote,
}: CheckoutShopCardProps) {
  const [note, setNote] = useState(group.buyerNote ?? "");

  const handleNoteBlur = () => {
    if (note !== group.buyerNote) {
      onChangeNote?.(group.storeId, note);
    }
  };

  return (
    <div
      className="w-full bg-white rounded-xl p-5 shadow-sm border border-slate-200/80 flex flex-col gap-4"
      data-testid={`checkout-shop-card-${group.storeId}`}
    >
      {/* ── Header shop ──────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          {group.storeBadge && (
            <span
              className={cn(
                "font-semibold text-label-sm uppercase tracking-wider px-1.5 py-0.5 rounded",
                group.storeBadge === "OfficialMall"
                  ? "bg-primary text-on-primary"
                  : "bg-tertiary-container text-on-tertiary-container",
              )}
            >
              {BADGE_LABEL[group.storeBadge] ?? group.storeBadge}
            </span>
          )}
          <span className="font-semibold text-base text-on-surface">
            Đơn {group.shopSubtotal > 0 ? "1" : ""} – {group.storeName}
          </span>
        </div>
        <div className="flex items-center gap-1 text-secondary text-xs font-medium">
          <MaterialSymbol name="local_shipping" size="sm" />
          <span>Giao dự kiến: {group.estimatedDeliveryLabel}</span>
        </div>
      </div>

      {/* ── Danh sách sản phẩm ───────────────────────────────── */}
      <div className="flex flex-col gap-4">
        {group.items.map((item) => (
          <CheckoutShopItem key={item.id} item={item} />
        ))}
      </div>

      {/* ── Voucher shop + đổi mã ───────────────────────────── */}
      {group.appliedShopVoucher && (
        <div className="bg-surface-container-low rounded-lg p-3 flex flex-wrap items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-2">
            <MaterialSymbol
              name="sell"
              size="base"
              className="text-secondary"
            />
            <span className="font-medium text-on-surface">
              Voucher của shop:
            </span>
            <span className="bg-secondary-container text-on-secondary-container font-semibold text-xs px-2 py-0.5 rounded">
              {group.appliedShopVoucher.label}
            </span>
          </div>
          {onChangeVoucher && (
            <Button
              variant="link"
              size="sm"
              onClick={() => onChangeVoucher(group)}
              className="font-semibold text-xs"
              data-testid={`change-shop-voucher-${group.storeId}`}
            >
              Đổi mã
            </Button>
          )}
        </div>
      )}

      {/* ── Lời nhắn cho shop ────────────────────────────────── */}
      <div>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={handleNoteBlur}
          placeholder="Lời nhắn cho shop (ví dụ: giao giờ hành chính, gọi trước khi giao)..."
          type="text"
          className="w-full h-10 px-4 rounded-lg bg-white text-on-surface placeholder:text-outline-variant text-sm border border-slate-200 shadow-xs focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label={`Lời nhắn cho ${group.storeName}`}
          data-testid={`buyer-note-${group.storeId}`}
        />
      </div>

      {/* ── Phí ship + tạm tính ──────────────────────────────── */}
      <div className="flex items-center justify-between pt-1 text-sm text-on-surface-variant">
        <span>
          Phí giao hàng:{" "}
          <strong className="text-on-surface font-semibold">
            {formatVND(group.shippingFee ?? 0)}
          </strong>{" "}
          ({group.shippingMethodLabel ?? 'Tiêu chuẩn'})
        </span>
        <div>
          Tạm tính đơn này:{" "}
          <strong className="font-bold text-base text-primary ml-1">
            {formatVND(group.shopSubtotal)}
          </strong>
        </div>
      </div>
    </div>
  );
}
