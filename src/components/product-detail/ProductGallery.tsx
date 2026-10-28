/**
 * ProductGallery – Section 4.
 * - Main image (1:1 aspect ratio, rounded-xl, bg-surface-container-low, shadow-sm).
 * - Top-left badge "100% Cotton Compact" with verified Material Symbol.
 * - Bottom-right zoom_in button → opens lightbox.
 * - Thumbnails: grid-cols-5 gap-2.5, each aspect-square rounded-lg,
 *   selected has outline outline-2 outline-primary.
 * - Click thumb → swap main image.
 * - Mobile: horizontal scroll for thumbnails.
 */
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/features/products";

export interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
  selectedImageUrl?: string | null;
  className?: string;
}

export function ProductGallery({
  images,
  productName,
  selectedImageUrl,
  className,
}: ProductGalleryProps) {
  const t = useTranslations("productDetail.gallery");
  const [activeIdx, setActiveIdx] = useState(
    Math.max(
      0,
      images.findIndex((img) => img.isPrimary),
    ),
  );
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!selectedImageUrl) return;
    const foundIdx = images.findIndex((img) => img.url === selectedImageUrl);
    if (foundIdx !== -1) {
      setActiveIdx(foundIdx);
    }
  }, [selectedImageUrl, images]);

  const active = images[activeIdx] ?? images[0];
  if (!active) {
    return null;
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Main image (1:1) */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-surface-container-low shadow-sm">
        <Image
          src={active.url}
          alt={active.alt || productName}
          width={800}
          height={800}
          className="h-full w-full object-cover"
          data-testid="gallery-main-image"
          priority
          unoptimized
        />

        {/* Top-left badge (removed: hard-coded "100% Cotton Compact" không khớp nhiều
            loại sản phẩm — quyết định 2026-10-18 xóa hard-code, chờ BE trả tags[]). */}

        {/* Bottom-right zoom button */}
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          aria-label={t("zoom")}
          className="absolute bottom-3 right-3 rounded-full bg-surface-container-lowest/80 p-2 text-on-surface shadow-sm backdrop-blur transition-transform hover:scale-105 hover:bg-surface-container-lowest"
        >
          <ZoomInIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Thumbnails: grid on desktop, horizontal scroll on mobile */}
      <div
        className="flex gap-2.5 overflow-x-auto pb-1 sm:grid sm:grid-cols-5 sm:overflow-visible"
        role="list"
        aria-label="Product images"
      >
        {images.map((img, idx) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setActiveIdx(idx)}
            aria-label={img.alt || `Hình ${idx + 1}`}
            aria-current={idx === activeIdx ? "true" : undefined}
            className={cn(
              "relative aspect-square shrink-0 overflow-hidden rounded-lg bg-surface-container p-0.5 shadow-sm transition-all",
              idx === activeIdx
                ? "outline outline-2 outline-primary"
                : "outline-none hover:opacity-90",
            )}
            role="listitem"
          >
            <Image
              src={img.url}
              alt={img.alt || productName}
              width={160}
              height={160}
              className="h-full w-full rounded-md object-cover"
              unoptimized
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <Lightbox
          image={active}
          productName={productName}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}

function Lightbox({
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/80 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image lightbox"
    >
      <Image
        src={image.url}
        alt={image.alt || productName}
        width={1200}
        height={1200}
        className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain"
        onClick={(e) => e.stopPropagation()}
        unoptimized
      />
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
      >
        <CloseIcon className="h-5 w-5" />
      </button>
    </div>
  );
}

// ── Icon components (Material Symbols outline-style SVG) ──────────────────

function ZoomInIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
      <path d="M11 8v6M8 11h6" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}