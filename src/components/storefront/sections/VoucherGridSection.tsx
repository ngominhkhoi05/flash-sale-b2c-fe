"use client";

/**
 * VoucherGridSection – Stitch "MÃ GIẢM GIÁ CHO BẠN" (Section #5).
 *
 * Gồm 4 voucher ticket dạng "vé xé" (left badge + right content + dashed border).
 * Mỗi voucher có button "Lưu" toggle sang "Đã lưu" khi click.
 *
 * Data: API /api/v1/vouchers/platform
 * Lấy tối đa 4 vouchers có status ACTIVE.
 */
import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";
import { usePlatformVouchers } from "@/features/homepage/hooks";
import type { VoucherResponse } from "@/features/homepage/api";

function formatVND(value: number): string {
  if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(0).replace(/\.0$/, "") + " triệu";
  }
  if (value >= 1_000) {
    return Math.round(value / 1_000) + "K";
  }
  return value.toString();
}

function formatVoucherBadge(v: VoucherResponse): string {
  if (v.discountType === "PERCENTAGE") {
    return `${v.discountValue}%`;
  }
  // FIXED_AMOUNT: hiển thị theo K
  if (v.discountValue >= 1000) {
    return `${Math.round(v.discountValue / 1000)}K`;
  }
  return formatVND(v.discountValue);
}

function formatExpiryDate(endTime: string): string {
  const date = new Date(endTime);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
}

export function VoucherGridSection() {
  const t = useTranslations("storefront.home");
  const { data: vouchers, isLoading } = usePlatformVouchers();
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set());

  const toggleSaved = (id: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Lấy tối đa 4 voucher ACTIVE
  const displayVouchers = (vouchers ?? [])
    .filter((v) => v.status === "ACTIVE")
    .slice(0, 4);

  // Loading skeleton
  if (isLoading) {
    return (
      <section className="bg-surface-container-lowest rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between pb-5 border-b border-surface-container">
          <div className="flex items-center gap-2">
            <MaterialSymbol name="confirmation_number" size="2xl" className="text-primary" />
            <h2 className="text-headline-md text-on-surface font-bold">
              {t("voucher.title")}
            </h2>
          </div>
          <Link
            href="/vouchers"
            className="text-label-md text-primary hover:underline flex items-center gap-1"
          >
            {t("voucher.seeAll")}
            <MaterialSymbol name="chevron_right" size="sm" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-surface-container rounded-xl animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  // Empty state
  if (displayVouchers.length === 0) {
    return (
      <section className="bg-surface-container-lowest rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between pb-5 border-b border-surface-container">
          <div className="flex items-center gap-2">
            <MaterialSymbol name="confirmation_number" size="2xl" className="text-primary" />
            <h2 className="text-headline-md text-on-surface font-bold">
              {t("voucher.title")}
            </h2>
          </div>
          <Link
            href="/vouchers"
            className="text-label-md text-primary hover:underline flex items-center gap-1"
          >
            {t("voucher.seeAll")}
            <MaterialSymbol name="chevron_right" size="sm" />
          </Link>
        </div>
        <div className="py-12 text-center text-on-surface-variant">
          <p>{t("voucher.empty")}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-surface-container-lowest rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-5 border-b border-surface-container">
        <div className="flex items-center gap-2">
          <MaterialSymbol name="confirmation_number" size="2xl" className="text-primary" />
          <h2 className="text-headline-md text-on-surface font-bold">
            {t("voucher.title")}
          </h2>
        </div>
        <Link
          href="/vouchers"
          className="text-label-md text-primary hover:underline flex items-center gap-1"
        >
          {t("voucher.seeAll")}
          <MaterialSymbol name="chevron_right" size="sm" />
        </Link>
      </div>

      {/* Grid tickets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-5">
        {displayVouchers.map((voucher) => {
          const isSaved = savedIds.has(voucher.id.toString());
          const amount = formatVoucherBadge(voucher);
          const isPercentage = voucher.discountType === "PERCENTAGE";
          const isLargeDiscount = voucher.discountValue >= 50000;

          const getBadgeStyle = () => {
            if (isLargeDiscount && !isPercentage) {
              return "bg-primary text-on-primary";
            }
            if (isPercentage) {
              return "bg-tertiary text-on-tertiary";
            }
            if (amount.endsWith("K")) {
              return "bg-primary text-on-primary";
            }
            return "bg-secondary text-on-secondary";
          };

          return (
            <div
              key={voucher.id}
              className="relative flex bg-surface-container-low rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Left badge */}
              <div
                className={cn(
                  "w-24 flex flex-col items-center justify-center p-2 text-center relative border-r-2 border-dashed border-surface-container-lowest",
                  getBadgeStyle()
                )}
              >
                <span className="text-headline-sm font-bold leading-none">
                  {amount}
                </span>
                <span className="text-[10px] mt-1 font-medium">
                  {voucher.discountType === "PERCENTAGE" ? "Giảm %" : "Giảm"}
                </span>
                {/* Notches */}
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-surface-container-lowest rounded-full" />
                <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-surface-container-lowest rounded-full" />
              </div>
              {/* Right content */}
              <div className="flex-1 p-3 flex flex-col justify-between">
                <div>
                  <h4 className="text-label-lg text-on-surface font-bold line-clamp-1">
                    {voucher.code}
                  </h4>
                  <p className="text-body-sm text-on-surface-variant line-clamp-1">
                    {voucher.minOrderAmount > 0
                      ? `Đơn tối thiểu ${formatVND(voucher.minOrderAmount)}`
                      : "Áp dụng mọi đơn"}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-surface-container">
                  <span className="text-[11px] text-outline">
                    {t("voucher.expiresAt")}: {formatExpiryDate(voucher.endTime)}
                  </span>
                  <button
                    onClick={() => toggleSaved(voucher.id.toString())}
                    className={cn(
                      "px-3 py-1 rounded text-label-sm transition-colors",
                      isSaved
                        ? "bg-surface-container-high text-outline"
                        : "text-on-primary hover:opacity-90 bg-primary hover:bg-primary-container"
                    )}
                    aria-pressed={isSaved}
                    data-testid={`save-${voucher.id}`}
                  >
                    {isSaved ? t("voucher.savedAction") : t("voucher.saveAction")}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
