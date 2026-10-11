/**
 * HeroBannerSection – Stitch "HÀNG HERO BANNER" (Section #1).
 *
 * Gồm 3 phần trong 1 grid:
 * - Banner lớn trái (8/12 cols): carousel 4 slides, auto-rotate 5s
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
 * Pixel-match reference:
 * Stitch HTML lines 5-77, class "bg-gradient-to-r from-primary via-primary-container to-secondary"
 */
"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { HERO_SLIDES, type HeroSlide } from "./home-mocks";
import { useCarousel } from "./useCarousel";
import { cn } from "@/lib/utils";

const AUTO_ROTATE_MS = 5000;
const FADE_DURATION_MS = 700;

export function HeroBannerSection() {
  const t = useTranslations("storefront.home");
  const tHero = useTranslations("storefront.home.hero");

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
        className="lg:col-span-8 relative overflow-hidden rounded-xl bg-gradient-to-r from-primary via-primary-container to-secondary shadow-sm text-on-primary p-6 sm:p-8 flex flex-col justify-between min-h-[340px]"
        role="region"
        aria-roledescription="carousel"
        aria-label={tHero("ariaLabel")}
        tabIndex={0}
        onMouseEnter={pause}
        onMouseLeave={resume}
        onFocus={pause}
        onBlur={resume}
        onKeyDown={handleKeyDown}
      >
        {/* ── Slides stack (cross-fade) ──────────────────────── */}
        <div className="relative flex-1">
          {HERO_SLIDES.map((slide, idx) => (
            <HeroSlideContent
              key={slide.id}
              slide={slide}
              index={idx}
              isActive={idx === currentIndex}
            />
          ))}
        </div>

        {/* ── Carousel Indicators ──────────────────────────── */}
        <div
          className="relative z-10 flex items-center gap-2 pt-4"
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
                aria-label={`Slide ${idx + 1}: ${tHero(slide.badgeKey)}`}
                data-testid={`hero-dot-${idx}`}
                onClick={() => goTo(idx)}
                className={cn(
                  "h-2 rounded-full transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-surface-container-lowest focus-visible:ring-offset-2 focus-visible:ring-offset-primary",
                  isActive
                    ? "w-8 bg-surface-container-lowest shadow-sm"
                    : "w-2 bg-surface-container-lowest/40 hover:bg-surface-container-lowest"
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
              <span className="inline-flex items-center gap-1 text-label-sm uppercase px-2 py-0.5 rounded bg-secondary text-on-secondary mb-1.5">
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
              <MaterialSymbol name="local_shipping" size="2xl" />
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
              <span className="inline-flex items-center gap-1 text-label-sm uppercase px-2 py-0.5 rounded bg-tertiary text-on-tertiary mb-1.5">
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
              <MaterialSymbol name="savings" size="2xl" />
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

// ─── HeroSlideContent ─────────────────────────────────────────────────────────

interface HeroSlideContentProps {
  slide: HeroSlide;
  index: number;
  isActive: boolean;
}

function HeroSlideContent({ slide, index, isActive }: HeroSlideContentProps) {
  const tHero = useTranslations("storefront.home.hero");

  return (
    <div
      data-testid={`hero-slide-${index}`}
      data-slide-id={slide.id}
      role="tabpanel"
      aria-hidden={!isActive}
      aria-roledescription="slide"
      aria-label={`${index + 1} / ${HERO_SLIDES.length}`}
      className={cn(
        "absolute inset-0 flex flex-col justify-between transition-opacity ease-in-out",
        isActive
          ? "opacity-100 z-10 pointer-events-auto"
          : "opacity-0 z-0 pointer-events-none"
      )}
      style={{ transitionDuration: `${FADE_DURATION_MS}ms` }}
    >
      {/* ── Gradient overlay (per-slide accent) ──────────────── */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-r",
          slide.accentClass
        )}
        aria-hidden
      />

      <div className="relative z-10 max-w-lg space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-lowest/20 backdrop-blur-sm text-on-primary text-label-sm tracking-wider uppercase">
          <MaterialSymbol name="local_fire_department" size="[14px]" />
          {tHero(slide.badgeKey)}
        </span>
        <h1 className="text-display-lg-mobile sm:text-display-lg font-bold tracking-tight">
          {tHero(slide.headlineKey)}
        </h1>
        <p className="text-body-md text-primary-fixed opacity-95">
          {tHero(slide.subtextKey)}
        </p>
        <div className="pt-2">
          <Link
            href={slide.ctaHref}
            tabIndex={isActive ? 0 : -1}
            className="px-6 py-2.5 rounded-lg bg-surface-container-lowest text-primary text-label-lg shadow-md hover:bg-primary-fixed transition-all duration-200 transform active:scale-95 inline-flex items-center gap-2"
          >
            {tHero(slide.ctaKey)}
            <MaterialSymbol name={slide.ctaIcon} size="base" />
          </Link>
        </div>
      </div>

      {/* Ảnh hero */}
      <div className="absolute right-0 bottom-0 top-0 w-1/2 opacity-25 lg:opacity-85 pointer-events-none flex items-center justify-end pr-4">
        <img
          alt={slide.imageAlt}
          src={slide.imageUrl}
          className="h-full max-h-[300px] object-contain drop-shadow-2xl"
        />
      </div>
    </div>
  );
}
