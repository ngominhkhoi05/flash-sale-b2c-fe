/**
 * ProductBreadcrumb – Section 2.
 * Renders: Trang chủ > Thời trang Unisex > Tên sản phẩm.
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

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center gap-1 text-sm text-ink-3", className)}
    >
      <NextLink
        href="/"
        className="hover:text-brand transition-colors"
      >
        {t("home")}
      </NextLink>

      <ChevronRightIcon className="w-3.5 h-3.5 shrink-0 text-ink-3" />

      <NextLink
        href="/products"
        className="hover:text-brand transition-colors"
      >
        {categoryName}
      </NextLink>

      <ChevronRightIcon className="w-3.5 h-3.5 shrink-0 text-ink-3" />

      <span className="text-ink line-clamp-1">{productName}</span>
    </nav>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("w-4 h-4", className)}
    >
      <path fillRule="evenodd" d="M8.72 18.78a.75.75 0 0 1 0-1.06L14.44 12 8.72 6.28a.75.75 0 0 1 1.06-1.06l6 6a.75.75 0 0 1 0 1.06l-6 6a.75.75 0 0 1-1.06 0Z" clipRule="evenodd" />
    </svg>
  );
}
