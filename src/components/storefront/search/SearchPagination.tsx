"use client";

/**
 * SearchPagination – phân trang đầy đủ ở cuối grid.
 *
 * Stitch: ‹ 1 2 3 4 ... 42 ›
 */

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

import { cn } from "@/lib/utils";

function buildPageList(current: number, total: number): Array<number | "ellipsis"> {
  const pages: Array<number | "ellipsis"> = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
    return pages;
  }
  pages.push(1);
  if (current > 4) pages.push("ellipsis");
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 3) pages.push("ellipsis");
  pages.push(total);
  return pages;
}

export interface SearchPaginationProps {
  current: number;
  totalPages: number;
  className?: string;
}

export function SearchPagination({
  current,
  totalPages,
  className,
}: SearchPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const goTo = useCallback(
    (target: number) => {
      const next = new URLSearchParams(searchParams.toString());
      if (target <= 1) next.delete("page");
      else next.set("page", target.toString());
      startTransition(() => router.push(`/search?${next.toString()}`));
    },
    [router, searchParams],
  );

  if (totalPages <= 1) return null;

  const pages = buildPageList(current, totalPages);
  const isFirst = current <= 1;
  const isLast = current >= totalPages;

  return (
    <nav
      className={cn(
        "mt-2 flex items-center justify-center gap-1 py-4",
        className,
      )}
      aria-label="pagination"
      data-testid="search-pagination"
    >
      <button
        type="button"
        onClick={() => goTo(current - 1)}
        disabled={isFirst || isPending}
        aria-label="Trang trước"
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-page text-ink-2 hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronLeft className="h-5 w-5" aria-hidden />
      </button>
      {pages.map((p, idx) =>
        p === "ellipsis" ? (
          <span
            key={`e-${idx}`}
            className="flex h-10 w-10 items-center justify-center text-sm text-outline"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => goTo(p)}
            disabled={isPending}
            aria-current={p === current ? "page" : undefined}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition-colors",
              p === current
                ? "bg-primary text-white shadow-xs"
                : "bg-page text-ink hover:bg-surface-container-high",
            )}
          >
            {p}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={() => goTo(current + 1)}
        disabled={isLast || isPending}
        aria-label="Trang sau"
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-page text-ink-2 hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronRight className="h-5 w-5" aria-hidden />
      </button>
    </nav>
  );
}
