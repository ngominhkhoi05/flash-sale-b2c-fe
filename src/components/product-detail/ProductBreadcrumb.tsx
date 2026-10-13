/**
 * ProductBreadcrumb – Section 2.
 * Renders breadcrumb: Trang chủ > Category > Product Name
 * Stitch markup: `<nav class="flex items-center gap-1 text-body-sm text-outline">`
 * with `chevron_right` Material Symbol between segments.
 */
"use client";

import NextLink from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export interface ProductBreadcrumbProps {
  categoryName: string;
  productName: string;
  className?: string;
}

export function ProductBreadcrumb({
  categoryName,
  productName,
  className,
}: ProductBreadcrumbProps) {
  const t = useTranslations("productDetail.breadcrumb");

  // Slugify categoryName to ascii for query string (Vietnamese → ASCII fallback)
  const categorySlug = slugifyAscii(categoryName);

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex items-center gap-1 text-body-sm text-outline",
        className,
      )}
    >
      <NextLink
        href="/"
        className="transition-colors hover:text-primary"
      >
        {t("home")}
      </NextLink>

      <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-outline" />

      <NextLink
        href={`/products?category=${categorySlug}`}
        className="transition-colors hover:text-primary"
      >
        {categoryName}
      </NextLink>

      <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-outline" />

      <span className="line-clamp-1 font-medium text-on-surface">
        {productName}
      </span>
    </nav>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("h-4 w-4", className)}
    >
      <path
        fillRule="evenodd"
        d="M8.72 18.78a.75.75 0 0 1 0-1.06L14.44 12 8.72 6.28a.75.75 0 0 1 1.06-1.06l6 6a.75.75 0 0 1 0 1.06l-6 6a.75.75 0 0 1-1.06 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * Convert Vietnamese category name to ASCII slug used in URL query.
 * "Thời trang Unisex" → "thoi-trang-unisex"
 * - Lowercases
 * - Replaces whitespace with hyphen
 * - Strips diacritics (đ → d, ư → u, …)
 * - Removes non-alphanumeric chars (keeps ASCII a-z, 0-9, hyphen)
 */
function slugifyAscii(input: string): string {
  const stripped = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
  return stripped
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}