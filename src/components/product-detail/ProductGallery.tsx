/**
 * ProductGallery – Section 4.
 * - Main image display + 5 thumbnail strip.
 * - Click thumb → swap main image.
 * - Zoom button → lightbox overlay.
 * - Mobile: horizontal scrollable thumbnails.
 */
"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useState } from "react";
import type { ProductImage } from "@/features/products";

export interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
  className?: string;
}

export function ProductGallery({
  images,
  productName,
  className,
}: ProductGalleryProps) {
  const t = useTranslations("productDetail.gallery");
  const [activeIdx, setActiveIdx] = useState(
    images.findIndex((img) => img.isPrimary) ?? 0
  );
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const active = images[activeIdx] ?? images[0];

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Main image */}
      <div className="relative overflow-hidden rounded-xl bg-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={active.url}
          alt={active.alt ?? productName}
          className="w-full aspect-[4/3] object-cover"
          data-testid="gallery-main-image"
        />

        {/* Zoom button */}
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          aria-label={t("zoom")}
          className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-ink/60 text-white backdrop-blur-sm transition-colors hover:bg-ink/80"
        >
          <ZoomIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Thumbnail strip */}
      <div
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
        role="list"
        aria-label="Product images"
      >
        {images.map((img, idx) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setActiveIdx(idx)}
            aria-label={img.alt ?? `Hình ${idx + 1}`}
            aria-current={idx === activeIdx ? "true" : undefined}
            className={cn(
              "relative shrink-0 overflow-hidden rounded-lg transition-all",
              idx === activeIdx
                ? "ring-2 ring-brand ring-offset-2"
                : "opacity-70 hover:opacity-100"
            )}
            role="listitem"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt={img.alt ?? productName}
              className="h-16 w-16 object-cover md:h-20 md:w-20"
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <LightboxOverlay
          image={active}
          productName={productName}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}

function LightboxOverlay({
  image,
  productName,
  onClose,
}: {
  image: ProductImage;
  productName: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image lightbox"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.url}
        alt={image.alt ?? productName}
        className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
      >
        <CloseIcon className="w-5 h-5" />
      </button>
    </div>
  );
}

function ZoomIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
      <path d="M11 8v6M8 11h6" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
