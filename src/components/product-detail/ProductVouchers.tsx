/**
 * ProductVouchers – Section 10 (Stitch `31bc6af5`).
 *
 * Layout (pixel-perfect từ Stitch):
 *   - Label "Mã Giảm Giá:" bên trái (`font-label-md text-outline w-28 shrink-0 pt-1`).
 *   - Voucher chips (`flex items-center gap-2 px-3 py-1 rounded-lg bg-surface-container
 *     text-tertiary font-label-sm font-semibold border-2 border-dashed border-tertiary/30`).
 *   - Mỗi chip có label + nút "Lưu" / "Đã Lưu" (toggle state).
 *
 * Sử dụng i18n namespace `productDetail.vouchers.*` (xem `messages/vi.json` & `en.json`).
 */
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { ShopVoucher } from "@/features/products";

export interface ProductVouchersProps {
  vouchers: ShopVoucher[] | null;
  className?: string;
}

export function ProductVouchers({ vouchers, className }: ProductVouchersProps) {
  const t = useTranslations("productDetail.vouchers");
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());

  // BE có thể trả null khi store chưa cấu hình voucher.
  if (!vouchers || vouchers.length === 0) return null;

  function toggleSave(id: number) {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div
      className={cn("flex items-start gap-4", className)}
      data-testid="product-vouchers"
    >
      <span className="font-label-md text-outline w-28 shrink-0 pt-1">
        {t("label")}
      </span>
      <div className="flex flex-wrap items-center gap-2">
        {vouchers.map((v) => {
          const isSaved = savedIds.has(v.id);
          return (
            <div
              key={v.id}
              className={cn(
                "flex items-center gap-2 px-3 py-1 rounded-lg bg-surface-container text-tertiary",
                "font-label-sm font-semibold border-2 border-dashed border-tertiary/30"
              )}
            >
              <span>{v.label}</span>
              <button
                type="button"
                onClick={() => toggleSave(v.id)}
                aria-pressed={isSaved}
                className={cn(
                  "px-2 py-0.5 rounded transition-colors",
                  isSaved
                    ? "bg-tertiary text-on-tertiary"
                    : "bg-tertiary/10 hover:bg-tertiary hover:text-on-tertiary"
                )}
              >
                {isSaved ? t("saved") : t("save")}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
