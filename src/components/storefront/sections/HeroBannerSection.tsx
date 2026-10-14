/**
 * HeroBannerSection – Stitch "HÀNG HERO BANNER" (Section #1).
 *
 * Gồm 3 phần trong 1 grid:
 * - Banner lớn trái (8/12 cols): carousel slides, ảnh nền full-bleed,
 *   click vào bất kỳ đâu trên banner → trang ctaHref tương ứng
 * - Banner phụ trên (4/12 cols): Freeship hỏa tốc
 * - Banner phụ dưới (4/12 cols): Voucher shop mới
 *
 * Carousel behavior (useCarousel):
 * - Auto-advance 5s
 * - Pause on mouseenter / focus
 * - Resume on mouseleave / blur
 * - Manual click on dot
 * - Respects prefers-reduced-motion (no auto-rotate)
 * - 700ms cross-fade transition between slides
 *
 * Data: API /api/v1/banners/home
 */
"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";
import { useHomeBanners, useFeaturedProducts } from "@/features/homepage/hooks";
import { useCarousel } from "./useCarousel";
import { cn } from "@/lib/utils";

const AUTO_ROTATE_MS = 5000;
const FADE_DURATION_MS = 700;
const HERO_SLIDE_LIMIT = 4;

export function HeroBannerSection() {
  const t = useTranslations("storefront.home");
  const { data: banners, isLoading: bannersLoading } = useHomeBanners();
  const { data: products, isLoading: productsLoading } = useFeaturedProducts(HERO_SLIDE_LIMIT);

  const isLoading = bannersLoading && productsLoading;

  // Ưu tiên banner từ API; nếu empty thì fallback sang featured products.
  const slides = useMemo(() => {
    if (banners?.mainSlides && banners.mainSlides.length > 0) {
      return banners.mainSlides.map((s) => ({
        id: s.id,
        imageUrl: s.imageUrl,
        imageAlt: s.imageAlt,
        ctaHref: s.ctaHref,
        isProduct: false,
      }));
    }
    if (products && products.length > 0) {
      return products.slice(0, HERO_SLIDE_LIMIT).map((p) => ({
        id: p.id,
        imageUrl: p.imageUrl,
        imageAlt: p.name,
        ctaHref: `/san-pham/${p.id}`,
        isProduct: true,
      }));
    }
    return [];
  }, [banners, products]);

  const { currentIndex, goTo, pause, resume } = useCarousel({
    totalSlides: slides.length,
    intervalMs: AUTO_ROTATE_MS,
  });

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (slides.length === 0) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goTo((currentIndex + 1) % slides.length);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goTo((currentIndex - 1 + slides.length) % slides.length);
      }
    },
    [currentIndex, goTo, slides.length]
  );

  // Loading skeleton
  if (isLoading) {
    return (
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
        <div className="lg:col-span-8 rounded-xl min-h-[340px] bg-surface-container animate-pulse" />
        <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3">
          <div className="flex-1 rounded-xl min-h-[164px] bg-surface-container animate-pulse" />
          <div className="flex-1 rounded-xl min-h-[164px] bg-surface-container animate-pulse" />
        </div>
      </section>
    );
  }

  // Empty state - không có banner và không có products
  if (slides.length === 0) {
    return (
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
        <div className="lg:col-span-8 rounded-xl min-h-[340px] bg-surface-container flex items-center justify-center text-on-surface-variant">
          <p>{t("hero.empty")}</p>
        </div>
        <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3">
          <div className="flex-1 rounded-xl min-h-[164px] bg-gradient-to-br from-primary-fixed to-secondary-fixed/50 flex flex-col justify-between shadow-sm p-5">
            <div>
              <span className="inline-flex items-center justify-center gap-1 text-label-sm uppercase px-2 py-0.5 rounded bg-secondary text-on-secondary mb-1.5">
                {t("sideBanners.freeshipTag")}
              </span>
              <h3 className="text-headline-sm text-on-surface font-bold leading-snug">
                {t("sideBanners.freeshipTitle")}
              </h3>
              <p className="text-body-sm text-on-surface-variant mt-0.5">
                {t("sideBanners.freeshipDesc")}
              </p>
            </div>
            <div className="pt-3">
              <Link href="/vouchers?type=freeship">
                <button className="px-4 py-1.5 rounded-lg bg-secondary text-on-secondary text-label-md hover:bg-on-secondary-container transition-colors shadow-sm">
                  {t("sideBanners.freeshipCta")}
                </button>
              </Link>
            </div>
          </div>
          <div className="flex-1 rounded-xl min-h-[164px] bg-gradient-to-br from-tertiary-soft to-pink-100 flex flex-col justify-between shadow-sm p-5">
            <div>
              <span className="inline-flex items-center justify-center gap-1 text-label-sm uppercase px-2 py-0.5 rounded bg-tertiary text-on-tertiary mb-1.5">
                {t("sideBanners.voucherTag")}
              </span>
              <h3 className="text-headline-sm text-on-surface font-bold leading-snug">
                {t("sideBanners.voucherTitle")}
              </h3>
              <p className="text-body-sm text-on-surface-variant mt-0.5">
                {t("sideBanners.voucherDesc")}
              </p>
            </div>
            <div className="pt-3">
              <Link href="/vouchers?filter=new-shop">
                <button className="px-4 py-1.5 rounded-lg bg-tertiary text-on-tertiary text-label-md hover:bg-tertiary-container transition-colors shadow-sm">
                  {t("sideBanners.voucherCta")}
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Get side banners by type (từ API banner hoặc fallback hardcode)
  const sideBanners = banners?.sideBanners ?? [];
  const freeshipBanner = sideBanners.find((b) => b.type === "FREESHIP");
  const voucherBanner = sideBanners.find((b) => b.type === "VOUCHER_NEW_SHOP");

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
      {/* ── Banner Lớn (Trái - 8 cột) ─────────────────────────── */}
      <div
        className="lg:col-span-8 relative overflow-hidden rounded-xl shadow-sm min-h-[340px]"
        role="region"
        aria-roledescription="carousel"
        aria-label={t("hero.ariaLabel")}
        tabIndex={0}
        onMouseEnter={pause}
        onMouseLeave={resume}
        onFocus={pause}
        onBlur={resume}
        onKeyDown={handleKeyDown}
      >
        {/* ── Slides stack (cross-fade) ──────────────────────── */}
        {slides.map((slide, idx) => {
          const isActive = idx === currentIndex;
          return (
            <Link
              key={slide.id}
              href={slide.ctaHref}
              data-testid={`hero-slide-${idx}`}
              data-slide-id={slide.id}
              aria-roledescription="slide"
              aria-label={`Slide ${idx + 1} / ${slides.length}: ${slide.imageAlt}`}
              aria-hidden={!isActive}
              tabIndex={isActive ? 0 : -1}
              className={cn(
                "absolute inset-0 transition-opacity ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-surface-container-lowest focus-visible:ring-offset-2",
                isActive
                  ? "opacity-100 z-10 pointer-events-auto"
                  : "opacity-0 z-0 pointer-events-none"
              )}
              style={{ transitionDuration: `${FADE_DURATION_MS}ms` }}
            >
              <img
                alt={slide.imageAlt}
                src={slide.imageUrl}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </Link>
          );
        })}

        {/* ── Carousel Indicators ──────────────────────────── */}
        {slides.length > 1 && (
          <div
            className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2"
            role="tablist"
            aria-label="Chọn slide"
          >
            {slides.map((slide, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={slide.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-current={isActive ? "true" : undefined}
                  aria-label={`Slide ${idx + 1}`}
                  data-testid={`hero-dot-${idx}`}
                  onClick={() => goTo(idx)}
                  className={cn(
                    "h-2 rounded-full transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/40",
                    isActive
                      ? "w-8 bg-white shadow-sm"
                      : "w-2 bg-white/50 hover:bg-white"
                  )}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* ── Banner Phụ Bên Phải (4 cột) ─────────────────────── */}
      <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-between">
        {/* Banner Trên: Freeship */}
        <div className="flex-1 rounded-xl p-5 bg-gradient-to-br from-primary-fixed to-secondary-fixed/50 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between relative z-10">
            <div>
              <span className="inline-flex items-center justify-center gap-1 text-label-sm uppercase px-2 py-0.5 rounded bg-secondary text-on-secondary mb-1.5">
                {freeshipBanner ? freeshipBanner.ctaText : t("sideBanners.freeshipTag")}
              </span>
              <h3 className="text-headline-sm text-on-surface font-bold leading-snug">
                {freeshipBanner ? freeshipBanner.imageAlt : t("sideBanners.freeshipTitle")}
              </h3>
              <p className="text-body-sm text-on-surface-variant mt-0.5">
                {t("sideBanners.freeshipDesc")}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-surface-container-lowest shadow-sm flex items-center justify-center text-secondary shrink-0">
              <span className="material-symbols-outlined text-2xl">
                local_shipping
              </span>
            </div>
          </div>
          <div className="pt-3 relative z-10">
            <Link href={freeshipBanner?.ctaHref ?? "/vouchers?type=freeship"}>
              <button className="px-4 py-1.5 rounded-lg bg-secondary text-on-secondary text-label-md hover:bg-on-secondary-container transition-colors shadow-sm">
                {t("sideBanners.freeshipCta")}
              </button>
            </Link>
          </div>
        </div>

        {/* Banner Dưới: Voucher shop mới */}
        <div className="flex-1 rounded-xl p-5 bg-gradient-to-br from-tertiary-soft to-pink-100 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between relative z-10">
            <div>
              <span className="inline-flex items-center justify-center gap-1 text-label-sm uppercase px-2 py-0.5 rounded bg-tertiary text-on-tertiary mb-1.5">
                {voucherBanner ? voucherBanner.ctaText : t("sideBanners.voucherTag")}
              </span>
              <h3 className="text-headline-sm text-on-surface font-bold leading-snug">
                {voucherBanner ? voucherBanner.imageAlt : t("sideBanners.voucherTitle")}
              </h3>
              <p className="text-body-sm text-on-surface-variant mt-0.5">
                {t("sideBanners.voucherDesc")}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-surface-container-lowest shadow-sm flex items-center justify-center text-tertiary shrink-0">
              <span className="material-symbols-outlined text-2xl">savings</span>
            </div>
          </div>
          <div className="pt-3 relative z-10">
            <Link href={voucherBanner?.ctaHref ?? "/vouchers?filter=new-shop"}>
              <button className="px-4 py-1.5 rounded-lg bg-tertiary text-on-tertiary text-label-md hover:bg-tertiary-container transition-colors shadow-sm">
                {t("sideBanners.voucherCta")}
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
