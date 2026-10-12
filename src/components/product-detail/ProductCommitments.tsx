/**
 * ProductCommitments – Section 6.
 * 3 commitment badges in a row: `grid grid-cols-3 gap-2 p-3 rounded-xl bg-surface-container-low`.
 * Each badge: icon (Material Symbol) + label.
 * Icon color: text-secondary for eco + verified_user, text-primary for published_with_changes.
 */
"use client";

import { cn } from "@/lib/utils";
import type { CommitmentBadge } from "@/features/products";

export interface ProductCommitmentsProps {
  commitments: CommitmentBadge[];
  className?: string;
}

export function ProductCommitments({
  commitments,
  className,
}: ProductCommitmentsProps) {
  if (commitments.length === 0) {
    return null;
  }
  return (
    <div
      className={cn(
        "mt-2 grid grid-cols-3 gap-2 rounded-xl bg-surface-container-low p-3 text-on-surface",
        className,
      )}
    >
      {commitments.map((c, idx) => (
        <div
          key={`${c.icon}-${idx}`}
          className="flex flex-col items-center gap-1 p-1 text-center"
        >
          <CommitmentIcon
            name={c.icon}
            className={c.iconClass ?? "text-on-surface"}
          />
          <span className="font-label-sm font-semibold leading-tight">
            {c.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function CommitmentIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const iconClass = cn("h-5 w-5", className);

  switch (name) {
    case "eco":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={iconClass}
        >
          <path d="M17 8c0-2.21-.9-4.21-2.34-5.65L13 4l1.66 1.66C13.55 6.43 13 7.65 13 9h2c0-1.1.9-2 2-2v2c0 3.31-2.69 6-6 6h-1.59l.71-.71L9.41 12.7l-2.71 2.71 3 3L11.41 17H11c-4.41 0-8-3.59-8-8V8c0-.55.45-1 1-1h7c2.21 0 4 1.79 4 4h2c0-3.31-2.69-6-6-6H5.41l-1.71-1.71L2.29 1.71 1.29 2.71l3 3 .71.71V8Z" />
        </svg>
      );
    case "published_with_changes":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={iconClass}
        >
          <path d="M16.95 9.04c-.04-.02-.08-.04-.13-.06-.66-.4-1.46-.78-2.34-.96-.18-.04-.36-.06-.54-.08-.4-.04-.78-.04-1.18 0-.18.02-.36.04-.54.08-.66.18-1.28.5-1.86.92-.04.02-.08.04-.12.06L9 9.5V7c0-.55-.45-1-1-1s-1 .45-1 1v4c0 .55.45 1 1 1h4c.55 0 1-.45 1-1s-.45-1-1-1H9.5l1.34-1.34c.04-.04.08-.08.12-.12.42-.32.92-.58 1.46-.72.18-.04.36-.08.54-.1.18-.02.36-.04.54-.04s.36.02.54.04c.18.02.36.06.54.1.54.14 1.04.4 1.46.72.04.04.08.08.12.12L16.5 11H15c-.55 0-1 .45-1 1s.45 1 1 1h4c.55 0 1-.45 1-1V8c0-.55-.45-1-1-1s-1 .45-1 1v1.04ZM4 12c0-.55-.45-1-1-1H2c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h4c.55 0 1-.45 1-1s-.45-1-1-1H3.5l1.34-1.34c.04-.04.08-.08.12-.12.42-.32.92-.58 1.46-.72.18-.04.36-.08.54-.1.18-.02.36-.04.54-.04s.36.02.54.04c.18.02.36.06.54.1.54.14 1.04.4 1.46.72.04.04.08.08.12.12L10.5 16H12c.55 0 1 .45 1 1s-.45 1-1 1H8c-.55 0-1-.45-1-1v-1.04l-.04.04c-.42-.32-.92-.58-1.46-.72-.18-.04-.36-.08-.54-.1-.18-.02-.36-.04-.54-.04s-.36.02-.54.04c-.18.02-.36-.4-.54-.4-.54-.14-1.04-.4-1.46-.72l-.04-.04Z" />
        </svg>
      );
    case "verified_user":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={iconClass}
        >
          <path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4Zm-2 16-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8Z" />
        </svg>
      );
    default:
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={iconClass}
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9Z" />
        </svg>
      );
  }
}