/**
 * FlashSaleHeroBanner – banner quảng cáo Flash Sale (rose-50 background).
 *
 * Stitch reference: trang-flash-sale.md L43-L66
 * NOTE: Text hardcode – sẽ refactor sang i18n ở commit cuối.
 */

import { MaterialSymbol } from "@/components/ui/material-symbol";

export interface FlashSaleHeroBannerProps {
  className?: string;
}

export function FlashSaleHeroBanner({ className }: FlashSaleHeroBannerProps) {
  return (
    <section
      data-testid="flash-sale-hero"
      className={`mb-6 rounded-xl bg-tertiary-fixed-dim p-4 shadow-sm ${className ?? ""}`}
    >
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-start gap-4 md:items-center">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-tertiary text-on-tertiary shadow-sm">
            <MaterialSymbol name="bolt" size="3xl" fill className="animate-pulse" />
          </div>
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="flex items-center gap-1 font-headline-lg text-headline-lg font-extrabold uppercase tracking-tight text-tertiary">
                FLASH SALE
              </h1>
              <span className="rounded-full bg-tertiary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-on-tertiary">
                Hôm Nay
              </span>
              <span className="rounded-full bg-secondary-container px-2 py-0.5 text-[10px] font-semibold text-on-secondary-container">
                Ưu đãi chớp nhoáng
              </span>
            </div>
            <p className="mt-0.5 text-body-md text-on-surface-variant">
              Giá sốc theo khung giờ – Số lượng có hạn • Giảm tới 50% toàn bộ
              ngành hàng hôm nay
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start rounded-lg bg-surface-container-lowest/80 px-3.5 py-2 backdrop-blur-sm md:self-center">
          <MaterialSymbol name="verified" size="[18px]" fill className="text-secondary" />
          <div className="flex flex-col">
            <span className="text-label-md font-semibold leading-tight text-on-surface">
              100% Cam kết chính hãng
            </span>
            <span className="text-label-sm leading-tight text-on-surface-variant">
              Đổi trả 7 ngày an tâm
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
