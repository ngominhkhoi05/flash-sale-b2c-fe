/**
 * ProductVouchers – Section 10.
 * Renders "Mã Giảm Giá:" label + list of vouchers với "Lưu" toggle.
 */
"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ShopVoucher } from "@/features/products";

export interface ProductVouchersProps {
  vouchers: ShopVoucher[];
  className?: string;
}

export function ProductVouchers({ vouchers, className }: ProductVouchersProps) {
  const t = useTranslations("productDetail.vouchers");
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());

  function toggleSave(id: number) {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (vouchers.length === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-xl border border-line bg-card px-3 py-2.5",
        className
      )}
      data-testid="product-vouchers"
    >
      <span className="text-sm font-medium text-ink-2">{t("label")}</span>

      {vouchers.map((v) => {
        const isSaved = savedIds.has(v.id);
        return (
          <div
            key={v.id}
            className="flex items-center gap-1.5 rounded-md border border-dashed border-sale/40 bg-sale-soft/40 px-2 py-1"
          >
            <TicketIcon className="h-3.5 w-3.5 text-sale" />
            <span className="text-xs font-medium text-ink">{v.label}</span>
            <Button
              type="button"
              size="sm"
              variant={isSaved ? "secondary" : "primary"}
              onClick={() => toggleSave(v.id)}
              className="h-6 px-2 text-[11px]"
              aria-label={isSaved ? t("saved") : t("save")}
            >
              {isSaved ? t("saved") : t("save")}
            </Button>
          </div>
        );
      })}
    </div>
  );
}

function TicketIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M1.5 6.375c0-1.036.84-1.875 1.875-1.875h17.25c1.035 0 1.875.84 1.875 1.875v3.026a.75.75 0 0 1-.375.652A1.5 1.5 0 0 0 21 11.32v1.36a1.5 1.5 0 0 0 1.125 1.466.75.75 0 0 1 .375.652v3.026c0 1.035-.84 1.875-1.875 1.875H3.375c-1.035 0-1.875-.84-1.875-1.875v-3.026a.75.75 0 0 1 .375-.652A1.5 1.5 0 0 0 3 12.68v-1.36a1.5 1.5 0 0 0-1.125-1.466.75.75 0 0 1-.375-.652V6.375Zm15-2.625a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-1.5 0v-.75a.75.75 0 0 1 .75-.75Zm-4.5 0a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-1.5 0v-.75a.75.75 0 0 1 .75-.75ZM9 4.5a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-1.5 0v-.75A.75.75 0 0 1 9 4.5Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
