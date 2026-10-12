/**
 * ProductShareBar – Section 5.
 * Share icon + Wishlist heart toggle.
 * Emits `onCopyLink()` on share click.
 */
"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useState } from "react";

export interface ProductShareBarProps {
  productName: string;
  isWishlisted?: boolean;
  onToggleWishlist?: () => void;
  onShare?: () => void;
  className?: string;
}

export function ProductShareBar({
  productName,
  isWishlisted = false,
  onToggleWishlist,
  onShare,
  className,
}: ProductShareBarProps) {
  const t = useTranslations("productDetail.share");
  const wishlistT = useTranslations("productDetail.wishlist");
  const [wishlisted, setWishlisted] = useState(isWishlisted);

  function handleToggle() {
    setWishlisted((prev) => !prev);
    onToggleWishlist?.();
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: productName, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      onShare?.();
    }
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 text-sm text-ink-2",
        className
      )}
    >
      <span className="text-ink-3">{t("label")}</span>

      {/* Share */}
      <button
        type="button"
        onClick={handleShare}
        aria-label={t("label")}
        className="flex items-center gap-1.5 hover:text-brand transition-colors"
      >
        <ShareIcon className="w-4 h-4" />
      </button>

      <span className="text-line">|</span>

      {/* Wishlist */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label={wishlisted ? wishlistT("liked") : wishlistT("count")}
        aria-pressed={wishlisted}
        className={cn(
          "flex items-center gap-1.5 transition-colors",
          wishlisted ? "text-danger" : "hover:text-danger"
        )}
      >
        <HeartIcon
          className={cn("w-4 h-4", wishlisted && "fill-current")}
        />
        <span className="text-xs">{wishlistT("count")}</span>
      </button>
    </div>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" d="M15.75 4.5a.75.75 0 0 1 .75.75v8.69c.393.127.762.295 1.095.504l5.657-5.657a.75.75 0 1 1 1.06 1.06l-5.657 5.657a7.502 7.502 0 0 1-1.138 1.102.75.75 0 0 1-1.067-.414V5.25a.75.75 0 0 1 .75-.75ZM4.5 15.75a.75.75 0 0 1 .75-.75h11.94a2.61 2.61 0 0 0-.408-1.136l-4.19-4.192a.75.75 0 0 1 1.06-1.06l4.19 4.192A3.61 3.61 0 0 1 18.44 15H5.25a.75.75 0 0 1 0-1.5h7.44a1.88 1.88 0 0 0 1.03-2.942l-5.657-5.657a.75.75 0 1 1 1.06-1.06l5.657 5.657c.355.355.635.785.835 1.267H5.25a.75.75 0 0 1 0-1.5h8.69a2.61 2.61 0 0 0-.504-1.096l-4.19-4.192a.75.75 0 0 1 1.06-1.06l4.19 4.192A3.61 3.61 0 0 1 15 5.25a.75.75 0 0 1-.75.75H4.5Z" clipRule="evenodd" />
    </svg>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
  );
}
