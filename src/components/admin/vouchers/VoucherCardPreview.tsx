"use client";

import React from "react";
import { VoucherDiscountType, VoucherScope } from "@/types/voucher";

interface VoucherCardPreviewProps {
  code?: string;
  name?: string;
  discountType?: VoucherDiscountType;
  discountValue?: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  scope?: VoucherScope;
  daysRemaining?: number;
}

export function VoucherCardPreview({
  code = "VIBEMART50",
  discountType = "PERCENT",
  discountValue = 20,
  maxDiscountAmount = 60000,
  minOrderAmount = 300000,
  scope = "ALL",
  daysRemaining = 30,
}: VoucherCardPreviewProps) {
  // Format discount headline
  const discountHeadline =
    discountType === "PERCENT"
      ? `Giảm ${discountValue || 0}%`
      : discountType === "SHIPPING"
      ? `Freeship ${((discountValue || 0) / 1000).toLocaleString("vi-VN")}K`
      : discountType === "COIN"
      ? `Hoàn ${discountValue || 0}% xu`
      : `Giảm ${(discountValue || 0).toLocaleString("vi-VN")}₫`;

  // Format condition
  const minOrderStr = `Đơn tối thiểu ${(minOrderAmount || 0).toLocaleString("vi-VN")}₫`;
  const maxDiscountStr =
    discountType === "PERCENT" && maxDiscountAmount && maxDiscountAmount > 0
      ? ` · Giảm tối đa ${(maxDiscountAmount || 0).toLocaleString("vi-VN")}₫`
      : "";
  const conditionStr = `${minOrderStr}${maxDiscountStr}`;

  const scopeLabel =
    scope === "MALL"
      ? "Chỉ Vibe Mall"
      : scope === "NEW_USER"
      ? "Khách hàng mới"
      : "Áp dụng toàn sàn";

  return (
    <div className="relative w-full rounded-2xl bg-gradient-to-r from-primary to-primary-container text-on-primary p-4 shadow-md overflow-hidden flex items-stretch select-none">
      {/* Decorative background glow */}
      <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />

      {/* Left Details */}
      <div className="flex-1 flex flex-col justify-between pr-3 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="font-headline-md font-bold tracking-tight text-white text-[15px]">
              Vibe Mart
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-white/20 text-white tracking-widest leading-none">
              Sàn tài trợ
            </span>
          </div>
          <span className={`font-label-sm text-xs ${daysRemaining < 0 ? "text-error font-semibold bg-white px-1.5 py-0.5 rounded shadow-sm" : "text-white/80"}`}>
            {daysRemaining < 0
              ? "HSD không hợp lệ"
              : daysRemaining > 0
              ? `HSD: ${daysRemaining} ngày`
              : "HSD: Trong ngày"}
          </span>
        </div>

        <div className="my-2.5">
          <div className="font-display-sm text-2xl font-bold text-white tracking-tight leading-none">
            {discountHeadline}
          </div>
          <div className="font-body-sm text-xs text-white/90 mt-1 line-clamp-1">
            {conditionStr}
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="font-data-tabular font-bold text-[14px] tracking-wider bg-white/15 px-2.5 py-0.5 rounded-md text-white font-mono uppercase">
            {code || "MAVOUCHER"}
          </span>
          <span className="font-label-sm text-[11px] text-white/80">
            {scopeLabel}
          </span>
        </div>
      </div>

      {/* Ticket Divider Cutouts with dashed line */}
      <div className="relative flex flex-col justify-between items-center w-5 shrink-0 py-1">
        <div className="w-3.5 h-3.5 rounded-full bg-surface-container-lowest -mt-4 shadow-inner" />
        <div className="h-full border-r border-dashed border-white/50 my-1" />
        <div className="w-3.5 h-3.5 rounded-full bg-surface-container-lowest -mb-4 shadow-inner" />
      </div>

      {/* Right Stamp */}
      <div className="w-18 flex flex-col items-center justify-center pl-2 shrink-0 text-center">
        <div className="w-9 h-9 rounded-full bg-white text-primary flex items-center justify-center font-bold shadow-sm">
          <span className="material-symbols-outlined text-[18px]">sell</span>
        </div>
        <span className="font-label-sm text-[10px] text-white font-bold tracking-wider mt-1.5 uppercase">
          LƯU MÃ
        </span>
      </div>
    </div>
  );
}
