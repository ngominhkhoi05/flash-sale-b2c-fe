"use client";

/**
 * SearchHeading – tiêu đề trang "Kết quả cho '...'" + số lượng sản phẩm.
 */

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

export interface SearchHeadingProps {
  query: string;
  total: number;
  className?: string;
}

export function SearchHeading({ query, total, className }: SearchHeadingProps) {
  const t = useTranslations("storefront.search");
  return (
    <div className={cn("flex flex-col gap-1 md:flex-row md:items-baseline md:justify-between", className)}>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-ink md:text-3xl">
          {t("resultsFor", { q: query || "…" })}
        </h1>
        <span className="text-sm font-normal text-ink-2">
          {total > 0
            ? t("resultsCount", { total: total.toLocaleString("vi-VN") })
            : t("resultsCountZero")}
        </span>
      </div>
    </div>
  );
}
