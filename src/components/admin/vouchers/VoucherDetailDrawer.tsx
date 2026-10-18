"use client";

import React from "react";
import Image from "next/image";
import { AdminVoucher, VoucherUsageHistoryItem } from "@/types/voucher";
import { VoucherCardPreview } from "./VoucherCardPreview";

interface VoucherDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  voucher: AdminVoucher | null;
  usageHistory: VoucherUsageHistoryItem[];
  onEdit?: (voucher: AdminVoucher) => void;
}

export function VoucherDetailDrawer({
  isOpen,
  onClose,
  voucher,
  usageHistory,
  onEdit,
}: VoucherDetailDrawerProps) {
  if (!isOpen || !voucher) return null;

  const usedPercent = Math.min(
    100,
    Math.round((voucher.usedCount / voucher.totalCount) * 100)
  );

  const diffDays = Math.max(
    0,
    Math.round(
      (new Date(voucher.endDate).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-on-surface/40 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Body */}
      <div className="relative w-full max-w-xl bg-surface-container-lowest h-screen flex flex-col justify-between shadow-2xl z-10 overflow-y-auto">
        {/* Header */}
        <div className="p-space-lg flex items-center justify-between bg-surface-container-lowest border-b border-outline-variant/30 sticky top-0 z-20">
          <div className="flex items-center gap-space-xs">
            <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">
                confirmation_number
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-headline-lg text-lg font-bold text-on-surface leading-tight font-mono">
                  {voucher.code}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    voucher.status === "ACTIVE"
                      ? "bg-primary/10 text-primary"
                      : voucher.status === "UPCOMING"
                      ? "bg-secondary-container text-secondary"
                      : voucher.status === "OUT_OF_STOCK"
                      ? "bg-error-container text-error"
                      : "bg-surface-container text-secondary"
                  }`}
                >
                  {voucher.status === "ACTIVE"
                    ? "Đang diễn ra"
                    : voucher.status === "UPCOMING"
                    ? "Sắp diễn ra"
                    : voucher.status === "OUT_OF_STOCK"
                    ? "Đã hết lượt"
                    : voucher.status === "EXPIRED"
                    ? "Đã kết thúc"
                    : "Đã tắt"}
                </span>
              </div>
              <p className="font-body-sm text-xs text-secondary mt-0.5">
                {voucher.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onEdit && (
              <button
                className="p-1.5 rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container transition-colors"
                onClick={() => {
                  onClose();
                  onEdit(voucher);
                }}
                title="Chỉnh sửa voucher"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">edit</span>
              </button>
            )}
            <button
              className="p-1.5 rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container transition-colors"
              onClick={onClose}
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-space-lg flex flex-col gap-space-lg flex-1">
          {/* Card Preview */}
          <VoucherCardPreview
            code={voucher.code}
            daysRemaining={diffDays}
            discountType={voucher.discountType}
            discountValue={voucher.discountValue}
            maxDiscountAmount={voucher.maxDiscountAmount}
            minOrderAmount={voucher.minOrderAmount}
            scope={voucher.scope}
          />

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-space-sm bg-surface-container-low/60 p-space-md rounded-xl">
            <div className="flex flex-col">
              <span className="text-label-sm text-[11px] text-secondary">
                Đã sử dụng
              </span>
              <span className="font-data-tabular font-bold text-base text-on-surface mt-0.5">
                {voucher.usedCount.toLocaleString("vi-VN")}{" "}
                <span className="text-secondary font-normal text-xs">
                  / {voucher.totalCount.toLocaleString("vi-VN")}
                </span>
              </span>
              <span className="text-[11px] text-primary font-semibold mt-0.5">
                {usedPercent}% hoàn thành
              </span>
            </div>

            <div className="flex flex-col border-x border-outline-variant/30 px-3">
              <span className="text-label-sm text-[11px] text-secondary">
                Đơn tối thiểu
              </span>
              <span className="font-data-tabular font-bold text-base text-on-surface mt-0.5">
                {voucher.minOrderAmount.toLocaleString("vi-VN")}₫
              </span>
              <span className="text-[11px] text-secondary mt-0.5">
                {voucher.limitPerCustomer} lượt / khách
              </span>
            </div>

            <div className="flex flex-col pl-2">
              <span className="text-label-sm text-[11px] text-secondary">
                Ước tính trợ giá
              </span>
              <span className="font-data-tabular font-bold text-base text-tertiary mt-0.5">
                {(
                  voucher.usedCount *
                  (voucher.discountType === "FIXED"
                    ? voucher.discountValue
                    : voucher.maxDiscountAmount || 30000)
                ).toLocaleString("vi-VN")}
                ₫
              </span>
              <span className="text-[11px] text-secondary mt-0.5">
                Giải ngân sàn
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-secondary">Tiến độ phân bổ ngân sách</span>
              <span className="font-data-tabular font-bold text-on-surface">
                {voucher.usedCount} / {voucher.totalCount} ({usedPercent}%)
              </span>
            </div>
            <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  usedPercent >= 90 ? "bg-tertiary" : "bg-primary"
                }`}
                style={{ width: `${usedPercent}%` }}
              />
            </div>
          </div>

          {/* Usage History for this voucher */}
          <div className="flex flex-col gap-space-sm pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[18px]">
                  history
                </span>
                <h4 className="font-headline-md text-sm font-bold text-on-surface">
                  Lịch sử áp dụng ({usageHistory.length})
                </h4>
              </div>
              <span className="text-label-sm text-[11px] text-secondary">
                Cập nhật tự động
              </span>
            </div>

            {usageHistory.length === 0 ? (
              <div className="p-8 text-center bg-surface-container-low/40 rounded-xl flex flex-col items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-outline mb-1">
                  receipt_long
                </span>
                <span className="text-xs text-secondary font-medium">
                  Chưa có khách hàng nào sử dụng mã này
                </span>
              </div>
            ) : (
              <div className="border border-outline-variant/30 rounded-xl overflow-hidden divide-y divide-outline-variant/20">
                {usageHistory.map((item) => (
                  <div
                    className="p-3 bg-surface-container-lowest hover:bg-surface-container-low/40 transition-colors flex items-center justify-between text-xs"
                    key={item.id}
                  >
                    <div className="flex items-center gap-2.5">
                      <Image
                        alt={item.customerName}
                        width={28}
                        height={28}
                        className="w-7 h-7 rounded-full object-cover ring-1 ring-outline-variant/30"
                        src={item.customerAvatar}
                      />
                      <div className="flex flex-col">
                        <span className="font-semibold text-on-surface">
                          {item.customerName}
                        </span>
                        <span className="text-[11px] text-primary font-mono font-medium">
                          {item.orderCode}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span
                        className={`font-data-tabular font-bold ${
                          item.status === "REFUNDED"
                            ? "text-secondary"
                            : "text-tertiary"
                        }`}
                      >
                        {item.status === "REFUNDED" ? "+" : "-"}
                        {item.discountAmount.toLocaleString("vi-VN")}₫
                      </span>
                      <span className="text-[10px] text-secondary">
                        {item.usedAt}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-space-lg flex items-center justify-end border-t border-outline-variant/30 bg-surface-container-lowest sticky bottom-0 z-20">
          <button
            className="px-5 py-2 rounded-lg bg-surface-container text-on-surface font-label-md text-sm font-semibold hover:bg-surface-container-high transition-colors"
            onClick={onClose}
            type="button"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
