/**
 * ProductStoreCard – Section 15 (Stitch `31bc6af5`).
 *
 * Card with:
 *   - Store identity: avatar (initials), "Mall" badge overlay, store name,
 *     "Official Mall" chip, online status, "Xem Shop" + "Chat ngay" buttons.
 *   - 3 stat columns: Shop Rating, Products, Response Rate.
 *     (Removed "Joined" — BE `storeProfile.joinedAt` not exposed.)
 *
 * Updated 2026-10-18 — align với BE `ProductDetailResponse.storeProfile` shape:
 *   - Bỏ cột "Joined" (BE không trả `joinedAt`).
 *   - Giữ nguyên các field: name, initials, isOfficial, ratingAvg, ratingCount,
 *     productCount, productCountUnit, responseRate, responseTimeLabel,
 *     lastActiveLabel, initialsBgClass.
 *
 * i18n namespace: `productDetail.store.*`.
 */
"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { StoreProfile } from "@/features/products";

export interface ProductStoreCardProps {
  store: StoreProfile;
  className?: string;
}

export function ProductStoreCard({ store, className }: ProductStoreCardProps) {
  const t = useTranslations("productDetail.store");

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-between gap-6 rounded-2xl bg-surface-container-lowest p-5 shadow-sm lg:flex-row",
        className,
      )}
      data-testid="product-store-card"
    >
      {/* Store identity */}
      <div className="flex w-full items-center gap-4 lg:w-auto">
        <div className="relative shrink-0">
          <div
            data-testid="store-initials"
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-full font-headline-md font-bold shadow-sm",
              store.initialsBgClass,
            )}
          >
            {store.initials}
          </div>
          <span className="absolute -bottom-1 -right-1 rounded-full bg-secondary px-1.5 py-0.5 font-label-sm text-[10px] font-bold text-on-secondary">
            Mall
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 className="font-headline-sm font-bold text-on-surface">
              {store.name}
            </h2>
            {store.isOfficial && (
              <span className="rounded bg-primary-fixed px-2 py-0.5 font-label-sm font-semibold text-on-primary-fixed">
                {t("officialBadge")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 font-body-sm text-outline">
            <span className="inline-block h-2 w-2 rounded-full bg-secondary" />
            <span>{store.lastActiveLabel}</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <button
              type="button"
              className="flex items-center gap-1 rounded-lg bg-surface-container px-3 py-1 font-label-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
            >
              <StorefrontIcon className="h-3.5 w-3.5 text-sm" />
              <span>{t("viewShop")}</span>
            </button>
            <button
              type="button"
              className="flex items-center gap-1 rounded-lg bg-primary-fixed/40 px-3 py-1 font-label-sm font-semibold text-primary transition-colors hover:bg-primary-fixed"
            >
              <ChatIcon className="h-3.5 w-3.5 text-sm" />
              <span>{t("chatNow")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 stat columns (BE shape — no joinedAt) */}
      <div
        className="grid w-full grid-cols-1 gap-4 text-left sm:grid-cols-3 sm:gap-8 lg:w-auto lg:border-l lg:border-outline-variant/30 lg:pl-8"
        data-testid="store-stats"
      >
        <div className="flex flex-col">
          <span className="font-label-sm text-outline">{t("rating")}</span>
          <span className="flex items-center gap-1 font-headline-sm font-bold text-primary">
            {store.ratingAvg}{" "}
            <StarIcon className="h-3.5 w-3.5 text-sm text-amber-500" filled />
            <span className="font-body-sm font-normal text-outline">
              ({formatCount(store.ratingCount)})
            </span>
          </span>
        </div>
        <div className="flex flex-col">
          <span className="font-label-sm text-outline">{t("products")}</span>
          <span className="font-headline-sm font-bold text-on-surface">
            {store.productCount}{" "}
            <span className="font-body-sm font-normal text-outline">
              {store.productCountUnit}
            </span>
          </span>
        </div>
        <div className="flex flex-col">
          <span className="font-label-sm text-outline">{t("responseRate")}</span>
          <span className="font-headline-sm font-bold text-secondary">
            {store.responseRate}%{" "}
            <span className="font-body-sm font-normal text-outline">
              ({store.responseTimeLabel})
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Format 42500 → "42,5k" (Vietnamese thousand separator + k suffix).
 * Defensive: n có thể undefined/null từ BE partial response.
 */
function formatCount(n: number | null | undefined): string {
  if (n == null) return "0";
  if (n >= 1000) {
    const k = n / 1000;
    return `${k.toFixed(1).replace(".", ",").replace(",0", "")}k`;
  }
  return n.toString();
}

// ── Inline SVG icons (Material Symbols outline-style) ────────────────────

function StorefrontIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M21.9 8.89 20.85 4.52A1 1 0 0 0 19.85 4H4.15a1 1 0 0 0-1 .52L2.1 8.89c-.24 1.02-.06 2.06.5 2.93.55.86 1.43 1.43 2.43 1.58.27.04.54.06.81.06 1.02 0 1.98-.41 2.69-1.15.46.47 1.05.78 1.69.92V16h-2v2h6v-2h-2v-2.77c.64-.14 1.23-.45 1.69-.92.71.74 1.67 1.15 2.69 1.15.27 0 .54-.02.81-.06 1-.15 1.88-.72 2.43-1.58.56-.87.74-1.91.5-2.93zM5.71 11.41c-.46.26-1.02.31-1.54.13-.5-.18-.85-.55-1.01-1.05-.16-.5-.1-1.04.15-1.49h2.5c0 .91-.4 1.74-1.1 2.27zm12.58 0c-.7-.53-1.1-1.36-1.1-2.27h2.5c.25.45.31.99.15 1.49-.16.5-.51.87-1.01 1.05-.52.18-1.08.13-1.54-.13z" />
    </svg>
  );
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z" />
    </svg>
  );
}

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