/**
 * ProductHeaderInfo – Section 7 (Stitch `31bc6af5`).
 *
 * Renders:
 *   - Row of tag chips (favorite / official / SKU)
 *   - Product title in <h1>
 *   - Performance stats row: rating star + count link, sold count, question count
 *
 * i18n namespace: `productDetail.tags.*`, `productDetail.rating.*`,
 * `productDetail.wishlist.*` (favorite tag uses t("favorite")).
 */
"use client";

import NextLink from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export interface ProductHeaderInfoTags {
  /** "YÊU THÍCH+" chip */
  favorite?: boolean;
  /** "Chính Hãng UTC 100%" chip */
  official?: boolean;
  /** SKU code (e.g. "UTC-TS-001") */
  sku?: string;
}

export interface ProductHeaderInfoProps {
  tags: ProductHeaderInfoTags;
  title: string;
  /** Defensive: BE có thể trả null/undefined. */
  ratingAvg: number | null | undefined;
  ratingCount: number | null | undefined;
  soldCount: number | null | undefined;
  questionCount: number | null | undefined;
  className?: string;
}

export function ProductHeaderInfo({
  tags,
  title,
  ratingAvg,
  ratingCount,
  soldCount,
  questionCount,
  className,
}: ProductHeaderInfoProps) {
  const tTags = useTranslations("productDetail.tags");
  const tRating = useTranslations("productDetail.rating");

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Tag chips row */}
      <div className="flex flex-wrap items-center gap-2">
        {tags.favorite && (
          <span
            className="rounded bg-tertiary px-2 py-0.5 font-label-sm font-bold uppercase tracking-wider text-on-tertiary"
            data-testid="tag-favorite"
          >
            {tTags("favorite")}
          </span>
        )}
        {tags.official && (
          <span
            className="flex items-center gap-1 rounded bg-secondary-container/40 px-2.5 py-0.5 font-label-sm font-semibold text-on-secondary-container"
            data-testid="tag-official"
          >
            <CheckCircleIcon className="h-3 w-3" />
            {tTags("official")}
          </span>
        )}
        {tags.sku && (
          <span className="font-label-sm text-outline">
            {tTags("sku")}:{" "}
            <strong className="font-mono text-on-surface">{tags.sku}</strong>
          </span>
        )}
      </div>

      {/* Title */}
      <h1 className="text-xl font-bold leading-snug text-on-surface">
        {title}
      </h1>

      {/* Performance stats row */}
      <div className="flex flex-wrap items-center gap-3 text-[13px] text-on-surface-variant">
        <div className="flex items-center gap-1">
          <div className="flex items-center text-amber-500">
            <StarIcon className="h-4 w-4 text-base" filled />
          </div>
          <span className="font-semibold text-on-surface">
            {ratingAvg == null ? "—" : ratingAvg}
          </span>
          <NextLink
            href="#reviews-section"
            className="text-outline underline transition-colors hover:text-primary"
          >
            {tRating("reviews", { count: ratingCount ?? 0 })}
          </NextLink>
        </div>
        <span className="text-outline-variant">|</span>
        <div>
          {tRating("sold")}{" "}
          <strong className="font-semibold text-on-surface">
            {formatSoldCount(soldCount)}
          </strong>
        </div>
        <span className="text-outline-variant">|</span>
        <div className="text-outline">
          {tRating("questions", { count: questionCount ?? 0 })}
        </div>
      </div>
    </div>
  );
}

/**
 * Format sold count as "2,1k" for 2100, "1,4k" for 1400, "890" for <1000.
 * Uses Vietnamese thousand separator (dot) and decimal comma.
 * Defensive: n có thể null/undefined từ BE.
 */
function formatSoldCount(n: number | null | undefined): string {
  if (n == null) return "0";
  if (n >= 1000) {
    const k = n / 1000;
    // For 2,1k (1 decimal place) format
    const formatted = k.toFixed(1).replace(".", ",");
    // Strip trailing ",0" for round thousands
    return `${formatted.replace(",0", "")}k`;
  }
  return n.toString();
}

// ── Inline SVG icons (Material Symbols outline-style) ────────────────────

function StarIcon({
  className,
  filled,
}: {
  className?: string;
  filled?: boolean;
}) {
  if (filled) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
      >
        <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
      </svg>
    );
  }
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
    </svg>
  );
}
