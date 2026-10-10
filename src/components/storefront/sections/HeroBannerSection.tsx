/**
 * HeroBannerSection – Stitch "HÀNG HERO BANNER" (Section #1).
 *
 * Gồm 3 phần trong 1 grid:
 * - Banner lớn trái (8/12 cols): gradient chính với text + CTA + ảnh
 * - Banner phụ trên (4/12 cols): Freeship hỏa tốc
 * - Banner phụ dưới (4/12 cols): Voucher shop mới
 *
 * Pixel-match reference:
 * Stitch HTML lines 5-77, class "bg-gradient-to-r from-primary via-primary-container to-secondary"
 */
import Link from "next/link";
import { useTranslations } from "next-intl";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";

const HERO_IMAGE_URL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDrHfWtQYEzPPPIF2PpWnqlTR7Knr9s-M06kKdrgt53cXmqUIdz8C8uP7GjjZNMID2Gp2hlaWHALiHnPjcpTQpIfvlHsWoiHbSfu0Qnm4OyaQLAUPXdlEZusT4sBYElOkUJiXm4YK3csfry3pgy8vwmCSCAY3L6CnwP6R2XCVhK65fmMvs2C421T3RmLQlYjCognVQ5tTDrqRc5rkE5wmy5-F0f3ZL3yfac51herdXm3rY0ZpGGWnTmkA";

export function HeroBannerSection() {
  const t = useTranslations("storefront.home");
  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
      {/* ── Banner Lớn (Trái - 8 cột) ─────────────────────────── */}
      <div className="lg:col-span-8 relative overflow-hidden rounded-xl bg-gradient-to-r from-primary via-primary-container to-secondary shadow-sm text-on-primary p-6 sm:p-8 flex flex-col justify-between min-h-[340px]">
        <div className="relative z-10 max-w-lg space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-lowest/20 backdrop-blur-sm text-on-primary font-label-sm text-label-sm tracking-wider uppercase">
            <MaterialSymbol name="local_fire_department" size="[14px]" />
            {t("hero.badge")}
          </span>
          <h1 className="font-display-lg text-display-lg-mobile sm:text-display-lg leading-tight font-bold tracking-tight">
            {t("hero.headline")}
          </h1>
          <p className="font-body-md text-body-md text-primary-fixed opacity-95">
            {t("hero.subtext")}
          </p>
          <div className="pt-2">
            <Link
              href="/flash-sale"
              className="px-6 py-2.5 rounded-lg bg-surface-container-lowest text-primary font-label-lg text-label-lg shadow-md hover:bg-primary-fixed transition-all duration-200 transform active:scale-95 inline-flex items-center gap-2"
            >
              {t("hero.cta")}
              <MaterialSymbol name="arrow_forward" size="base" />
            </Link>
          </div>
        </div>
        {/* Ảnh hero */}
        <div className="absolute right-0 bottom-0 top-0 w-1/2 opacity-25 lg:opacity-85 pointer-events-none flex items-center justify-end pr-4">
          <img
            alt="Render 3D cao cấp rực rỡ các thiết bị công nghệ hiện đại, tai nghe bluetooth không dây, hộp quà phát sáng"
            src={HERO_IMAGE_URL}
            className="h-full max-h-[300px] object-contain drop-shadow-2xl"
          />
        </div>
        {/* Carousel Indicators */}
        <div className="relative z-10 flex items-center gap-2 pt-4">
          <span className="w-8 h-2 rounded-full bg-surface-container-lowest shadow-sm" />
          <span className="w-2 h-2 rounded-full bg-surface-container-lowest/40 hover:bg-surface-container-lowest cursor-pointer transition-colors" />
          <span className="w-2 h-2 rounded-full bg-surface-container-lowest/40 hover:bg-surface-container-lowest cursor-pointer transition-colors" />
          <span className="w-2 h-2 rounded-full bg-surface-container-lowest/40 hover:bg-surface-container-lowest cursor-pointer transition-colors" />
        </div>
      </div>

      {/* ── Banner Phụ Bên Phải (4 cột) ─────────────────────── */}
      <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-between">
        {/* Banner Trên: Freeship */}
        <div className="flex-1 rounded-xl p-5 bg-gradient-to-br from-primary-fixed to-secondary-fixed/50 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between relative z-10">
            <div>
              <span className="inline-flex items-center gap-1 font-label-sm text-label-sm uppercase px-2 py-0.5 rounded bg-secondary text-on-secondary mb-1.5">
                {t("sideBanners.freeshipTag")}
              </span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold leading-snug">
                {t("sideBanners.freeshipTitle")}
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                {t("sideBanners.freeshipDesc")}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-surface-container-lowest shadow-sm flex items-center justify-center text-secondary shrink-0">
              <MaterialSymbol name="local_shipping" size="2xl" />
            </div>
          </div>
          <div className="pt-3 relative z-10">
            <button className="px-4 py-1.5 rounded-lg bg-secondary text-on-secondary font-label-md text-label-md hover:bg-on-secondary-container transition-colors shadow-sm">
              {t("sideBanners.freeshipCta")}
            </button>
          </div>
        </div>

        {/* Banner Dưới: Voucher shop mới */}
        <div className="flex-1 rounded-xl p-5 bg-gradient-to-br from-tertiary-soft to-pink-100 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between relative z-10">
            <div>
              <span className="inline-flex items-center gap-1 font-label-sm text-label-sm uppercase px-2 py-0.5 rounded bg-tertiary text-on-tertiary mb-1.5">
                {t("sideBanners.voucherTag")}
              </span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold leading-snug">
                {t("sideBanners.voucherTitle")}
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                {t("sideBanners.voucherDesc")}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-surface-container-lowest shadow-sm flex items-center justify-center text-tertiary shrink-0">
              <MaterialSymbol name="savings" size="2xl" />
            </div>
          </div>
          <div className="pt-3 relative z-10">
            <button className="px-4 py-1.5 rounded-lg bg-tertiary text-on-tertiary font-label-md text-label-md hover:bg-tertiary-container transition-colors shadow-sm">
              {t("sideBanners.voucherCta")}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
