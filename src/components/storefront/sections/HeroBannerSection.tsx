/**
 * HeroBannerSection – Stitch "HÀNG HERO BANNER" (Section #1).
 *
 * Gồm 3 phần trong 1 grid:
 * - Banner lớn trái (8/12 cols): carousel 4 slides, ảnh nền full-bleed,
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
 * UX note: banner thuần ảnh (text đã được đưa xuống dưới overlay của
 * pixel-match Stitch gốc). Click anywhere = navigate. Dot indicator ở
 * dưới cho phép chuyển slide thủ công.
 */
"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { HERO_SLIDES } from "./home-mocks";
import { useCarousel } from "./useCarousel";
import { cn } from "@/lib/utils";

const AUTO_ROTATE_MS = 5000;
const FADE_DURATION_MS = 700;

export function HeroBannerSection() {
  const t = useTranslations("storefront.home");

  const { currentIndex, goTo, pause, resume } = useCarousel({
    totalSlides: HERO_SLIDES.length,
    intervalMs: AUTO_ROTATE_MS,
  });

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goTo((currentIndex + 1) % HERO_SLIDES.length);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goTo((currentIndex - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
      }
    },
    [currentIndex, goTo]
  );

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
        {HERO_SLIDES.map((slide, idx) => {
          const isActive = idx === currentIndex;
          return (
            <Link
              key={slide.id}
              href={slide.ctaHref}
              data-testid={`hero-slide-${idx}`}
              data-slide-id={slide.id}
              aria-roledescription="slide"
              aria-label={`Slide ${idx + 1} / ${HERO_SLIDES.length}`}
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
        <div
          className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2"
          role="tablist"
          aria-label="Chọn slide"
        >
          {HERO_SLIDES.map((slide, idx) => {
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
      </div>

      {/* ── Banner Phụ Bên Phải (4 cột) ─────────────────────── */}
      <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-between">
        {/* Banner Trên: Freeship */}
        <div className="flex-1 rounded-xl p-5 bg-gradient-to-br from-primary-fixed to-secondary-fixed/50 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between relative z-10">
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
            <div className="w-10 h-10 rounded-full bg-surface-container-lowest shadow-sm flex items-center justify-center text-secondary shrink-0">
              <span className="material-symbols-outlined text-2xl">
                local_shipping
              </span>
            </div>
          </div>
          <div className="pt-3 relative z-10">
            <button className="px-4 py-1.5 rounded-lg bg-secondary text-on-secondary text-label-md hover:bg-on-secondary-container transition-colors shadow-sm">
              {t("sideBanners.freeshipCta")}
            </button>
          </div>
        </div>

        {/* Banner Dưới: Voucher shop mới */}
        <div className="flex-1 rounded-xl p-5 bg-gradient-to-br from-tertiary-soft to-pink-100 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between relative z-10">
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
            <div className="w-10 h-10 rounded-full bg-surface-container-lowest shadow-sm flex items-center justify-center text-tertiary shrink-0">
              <span className="material-symbols-outlined text-2xl">savings</span>
            </div>
          </div>
          <div className="pt-3 relative z-10">
            <button className="px-4 py-1.5 rounded-lg bg-tertiary text-on-tertiary text-label-md hover:bg-tertiary-container transition-colors shadow-sm">
              {t("sideBanners.voucherCta")}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
