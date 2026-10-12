/**
 * ProductShareBar – Section 5.
 * Layout (Stitch): `flex items-center justify-between pt-2 text-on-surface-variant font-body-sm`
 * Left: "Chia sẻ:" label + 3 icon buttons (Facebook share, Messenger chat, link copy).
 * Right: Wishlist heart (tertiary, FILL=1) + "Đã thích (1,4k)" text.
 *
 * Click "link" → `navigator.clipboard.writeText(window.location.href)` + alert.
 */
"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export interface ProductShareBarProps {
  likedCount: string;
  className?: string;
}

export function ProductShareBar({
  likedCount,
  className,
}: ProductShareBarProps) {
  const t = useTranslations("productDetail.share");
  const wishlistT = useTranslations("productDetail.wishlist");

  function handleCopyLink() {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href).catch(() => {
        // Clipboard write may fail (insecure context, permissions); swallow.
      });
      window.alert(t("copied"));
    }
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between pt-2 text-body-sm text-on-surface-variant",
        className,
      )}
    >
      {/* Left: Share */}
      <div className="flex items-center gap-2">
        <span className="font-label-sm text-outline">{t("label")}</span>
        <ShareIconButton title="Facebook">
          <ShareIcon className="h-3.5 w-3.5" />
        </ShareIconButton>
        <ShareIconButton title="Messenger">
          <ChatIcon className="h-3.5 w-3.5" />
        </ShareIconButton>
        <ShareIconButton title="Sao chép link" onClick={handleCopyLink}>
          <LinkIcon className="h-3.5 w-3.5" />
        </ShareIconButton>
      </div>

      {/* Right: Wishlist */}
      <div className="flex cursor-pointer items-center gap-1.5 text-tertiary hover:opacity-80">
        <HeartFilledIcon className="h-5 w-5" />
        <span className="font-label-md font-semibold text-on-surface">
          {wishlistT("liked")} {likedCount}
        </span>
      </div>
    </div>
  );
}

function ShareIconButton({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container text-primary transition-colors hover:bg-surface-container-high"
    >
      {children}
    </button>
  );
}

// ── Inline SVG icons (Material Symbols outline-style) ────────────────────

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.15c-.05.21-.08.43-.08.66 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92Z" />
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
      <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2Zm-2 12H6v-2h12v2Zm0-3H6V9h12v2Zm0-3H6V6h12v2Z" />
    </svg>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1ZM8 13h8v-2H8v2Zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5Z" />
    </svg>
  );
}

function HeartFilledIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ fontVariationSettings: "'FILL' 1" }}
      className={className}
    >
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}