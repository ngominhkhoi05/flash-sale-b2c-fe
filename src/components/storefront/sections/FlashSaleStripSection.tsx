"use client";

/**
 * FlashSaleStripSection – Stitch "SECTION FLASH SALE" (Section #4).
 *
 * Header: badge FLASH SALE + countdown + "Xem tất cả"
 * Body: grid 5 deal flash sale (2 cols mobile, 3 tablet, 5 desktop)
 * Mỗi deal có: ảnh + badge "FLASH SALE" + giá + % giảm + stock bar + limit.
 *
 * Countdown endsAt được tính trong useState initializer để chỉ chạy 1 lần
 * khi component mount (tránh "impure function during render" – Next 16).
 *
 * Pixel-match reference:
 * Stitch HTML lines 234-455
 */
import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { Countdown } from "@/components/common/Countdown";
import { FLASH_SALE_DEALS } from "./home-mocks";

function defaultEndsAt(): string {
  return new Date(Date.now() + 1000 * 60 * 60 + 1000 * 60 * 24 + 1000 * 42).toISOString();
}

export function FlashSaleStripSection() {
  const t = useTranslations("storefront.home");
  // Tính 1 lần khi mount để countdown ổn định cho cả session
  const [endsAt] = useState<string>(defaultEndsAt);

  return (
    <section className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border-l-4 border-tertiary">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-surface-container">
        <div className="flex items-center gap-4">
          <h2 className="flex items-center gap-1.5 text-tertiary text-headline-lg font-bold">
            <MaterialSymbol name="bolt" size="3xl" fill />
            FLASH SALE
          </h2>
          <div className="flex items-center gap-1.5 text-on-surface text-label-md">
            <span className="text-on-surface-variant hidden sm:inline">{t("flashSale.endsIn")}</span>
            <Countdown endsAt={endsAt} variant="compact" />
          </div>
        </div>
        <Link
          href="/flash-sale"
          className="text-label-md text-tertiary hover:underline flex items-center gap-1"
        >
          {t("flashSale.seeAll")}
          <MaterialSymbol name="chevron_right" size="sm" />
        </Link>
      </div>
      {/* Grid deals */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 pt-5">
        {FLASH_SALE_DEALS.map((deal) => {
          const soldPercent = Math.round((deal.soldCount / deal.maxStock) * 100);
          return (
            <Link
              key={deal.id}
              href={deal.href}
              className="flex flex-col bg-white border border-surface-container rounded-xl overflow-hidden justify-between hover:border-tertiary hover:-translate-y-0.5 hover:shadow-md transition-all group h-full"
            >
              <div>
                {/* Image + badges */}
                <div className="relative w-full aspect-square bg-surface-container overflow-hidden">
                  <img
                    alt={deal.imageAlt}
                    src={deal.imageUrl}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Badge FLASH SALE */}
                  <div className="absolute top-2 left-2 bg-tertiary text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-sm">
                    <MaterialSymbol name="bolt" size="[12px]" fill />
                    <span>{t("flashSale.soldBadge")}</span>
                  </div>
                  {/* % discount */}
                  <div className="absolute top-2 right-2 bg-tertiary-soft text-tertiary text-[12px] font-semibold px-2 py-0.5 rounded-md shadow-sm">
                    -{deal.discountPercent}%
                  </div>
                </div>
                {/* Info */}
                <div className="p-3 space-y-2">
                  <h3
                    className="text-[14px] font-normal text-on-surface line-clamp-2 min-h-[40px] leading-tight text-clip group-hover:text-primary transition-colors"
                    title={deal.name}
                  >
                    {deal.name}
                  </h3>
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-[18px] font-semibold text-tertiary leading-none">
                      {deal.flashPrice}
                    </span>
                    <span className="text-[12px] text-on-surface-variant line-through leading-none">
                      {deal.originalPrice}
                    </span>
                  </div>
                  {/* Stock progress bar */}
                  <div className="space-y-1 pt-0.5">
                    <div className="relative w-full h-4 bg-tertiary-soft rounded-full overflow-hidden flex items-center justify-center">
                      <div
                        className="absolute left-0 top-0 bottom-0 bg-tertiary rounded-full transition-all"
                        style={{ width: `${Math.min(soldPercent, 100)}%` }}
                      />
                      <span className="relative z-10 text-white text-[10px] font-bold tracking-tight uppercase">
                        {t("flashSale.sold")} {deal.soldCount}
                      </span>
                    </div>
                    <div className="text-[11px] text-on-surface-variant italic text-center">
                      {t("flashSale.limitPerBuyer")} {deal.limitPerBuyer}
                    </div>
                  </div>
                </div>
              </div>
              {/* CTA */}
              <div className="p-3 pt-0">
                <button className="w-full h-9 bg-tertiary hover:bg-tertiary-container text-on-tertiary text-[13px] font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm">
                  <MaterialSymbol name="shopping_bag" size="[16px]" fill />
                  Mua ngay
                </button>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
