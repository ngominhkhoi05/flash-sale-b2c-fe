"use client";

/**
 * SearchMallBanner – banner "Mall Chính Hãng" cho brand match.
 *
 * Stitch: SONY Audio Official Store
 * Hiển thị: avatar + tên + rating + phản hồi + 3 highlight products + CTA "Xem Shop"
 *
 * Plan: docs/superpowers/plans/2026-10-13-search-page-ui-stitch.md (Subplan B)
 */

import Image from "next/image";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { ArrowRight, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { SearchMall } from "@/features/search/types";
import { formatVND } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface SearchMallBannerProps {
  mall: SearchMall;
  className?: string;
}

export function SearchMallBanner({ mall, className }: SearchMallBannerProps) {
  const t = useTranslations("storefront.search.mall");
  const format = useFormatter();

  return (
    <section
      className={cn(
        "flex flex-col items-stretch justify-between gap-4 rounded-xl border border-line bg-card p-4 shadow-sm lg:flex-row lg:items-center",
        className,
      )}
      data-testid="search-mall-banner"
    >
      {/* Shop info */}
      <div className="flex items-center gap-4 lg:w-5/12">
        <div className="relative shrink-0">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-page shadow-sm">
            <span className="text-xl font-black tracking-tighter text-ink">
              {mall.initials}
            </span>
          </div>
          <span className="absolute -bottom-1 -right-1 rounded bg-sale px-1.5 py-0.5 text-[10px] font-bold leading-none text-on-tertiary shadow-xs">
            {t("officialBadge")}
          </span>
        </div>
        <div className="flex min-w-0 flex-col">
          <div className="flex flex-wrap items-center gap-1">
            <h2 className="truncate text-lg font-semibold text-ink">
              {mall.name}
            </h2>
            <span className="shrink-0 rounded bg-tertiary-soft px-1.5 py-0.5 text-[10px] font-semibold text-on-tertiary">
              {t("mallOfficial")}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-ink-2">
            <span className="flex items-center gap-0.5 font-semibold text-ink">
              <Star
                className="h-3.5 w-3.5 fill-amber-500 text-amber-500"
                aria-hidden
              />
              {format.number(mall.rating, { maximumFractionDigits: 1 })}
              <span className="font-normal text-outline">
                ({mall.ratingCountLabel})
              </span>
            </span>
            <span className="text-outline">•</span>
            <span>
              {t.rich("responseRate", {
                rate: () => (
                  <strong className="text-ink">{mall.responseRate}</strong>
                ),
              })}
            </span>
            <span className="text-outline">•</span>
            <span>
              {t.rich("products", {
                count: () => (
                  <strong className="text-ink">{mall.productCount}</strong>
                ),
              })}
            </span>
          </div>
        </div>
      </div>

      {/* 3 Highlight products */}
      <div className="hidden grid-cols-3 gap-2 rounded-lg bg-page p-2 sm:grid lg:w-5/12">
        {mall.highlights.map((p) => (
          <Link
            key={p.id}
            href={`/products/${p.id}`}
            className="flex items-center gap-1.5 rounded p-1 transition-colors hover:bg-card"
          >
            <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-surface-container-high">
              <Image
                src={p.imageUrl}
                alt={p.imageAlt}
                fill
                sizes="44px"
                className="object-cover"
              />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-[10px] font-semibold uppercase tracking-wider text-ink">
                {p.name}
              </span>
              <span className="text-sm font-bold leading-tight text-sale tabular-nums">
                {formatVND(p.price)}
              </span>
            </span>
          </Link>
        ))}
      </div>

      {/* CTA */}
      <div className="flex shrink-0 items-center justify-end">
        <Button asChild variant="secondary" size="sm">
          <Link href={`/shops/${mall.storeId}`}>
            {t("viewStore")}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </div>
    </section>
  );
}
