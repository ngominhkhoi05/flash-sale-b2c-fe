/**
 * ProductCommitments – Section 6.
 * Renders 3 commitment badges: 100% Cotton, Đổi trả 30 ngày, Bảo hành 6 tháng.
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
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-4 text-sm text-ink-2",
        className
      )}
    >
      {commitments.map((c) => (
        <div key={c.label} className="flex items-center gap-1.5">
          <CommitmentIcon name={c.icon} className={c.iconClass ?? "text-ink-3"} />
          <span>{c.label}</span>
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
  const iconClass = cn("w-4 h-4", className);

  switch (name) {
    case "eco":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={iconClass}>
          <path d="M12.37 2.56a.75.75 0 0 1 1.26 0l4.83 5.02a.75.75 0 0 1-.6 1.3H19.5v8.74a.75.75 0 0 1-1.5 0V9.88h-1.75v5.74a.75.75 0 0 1-1.5 0V9.88H11.5v5.74a.75.75 0 0 1-1.5 0V9.88h-1.5v5.74a.75.75 0 0 1-1.5 0v-8.74H4.86a.75.75 0 0 1-.6-1.3z" />
        </svg>
      );
    case "published_with_changes":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={iconClass}>
          <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-3.75 7.5a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h5a.75.75 0 0 0 0-1.5h-5Z" clipRule="evenodd" />
        </svg>
      );
    case "verified_user":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={iconClass}>
          <path fillRule="evenodd" d="M12 1.5a.75.75 0 0 1 .75.75v5.69l2.447 2.447a.75.75 0 1 0 1.06-1.06l-3-3a.75.75 0 0 0-1.06 0l-3 3a.75.75 0 1 0 1.06 1.06l2.19-2.19V2.25a.75.75 0 0 1 .75-.75Zm-9 13.5a.75.75 0 0 1 .75.75v2.25a2.25 2.25 0 0 0 4.5 0v-2.25a.75.75 0 0 1 1.5 0v2.25a2.25 2.25 0 0 0 4.5 0v-2.25a.75.75 0 0 1 1.5 0v2.25a3.75 3.75 0 0 1-7.5 0v-2.25a.75.75 0 0 1-.75-.75Zm6.5 3a.75.75 0 0 0-1.5 0v.75a.75.75 0 0 0 1.5 0V18Z" clipRule="evenodd" />
        </svg>
      );
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={iconClass}>
          <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-2.47 9.47a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 1 1-1.06 1.06l-2.25-2.25a.75.75 0 0 1 0-1.06l-1.25-1.25a.75.75 0 0 1 0-1.06l1.25-1.25a.75.75 0 0 1 1.06 1.06l-1.25 1.25 2.25 2.25a.75.75 0 0 1-1.06 1.06l-3.25-3.25Z" clipRule="evenodd" />
        </svg>
      );
  }
}
