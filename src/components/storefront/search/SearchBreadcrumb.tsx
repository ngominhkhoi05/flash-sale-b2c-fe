/**
 * SearchBreadcrumb – breadcrumb ngắn cho /search.
 *
 * Stitch: "Trang chủ / Thiết bị điện tử / <q>"
 * Dùng i18n (key `storefront.search.breadcrumbs`).
 */

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export interface SearchBreadcrumbProps {
  /** Query hiện tại để hiển thị ở segment cuối (thay vì hard-code). */
  query?: string;
  className?: string;
}

export function SearchBreadcrumb({ query, className }: SearchBreadcrumbProps) {
  const t = useTranslations("storefront.search.breadcrumbs");
  return (
    <nav
      className={cn(
        "flex items-center gap-1 text-sm text-ink-2",
        className,
      )}
      aria-label="Breadcrumb"
    >
      <Link
        href={ROUTES.HOME}
        className="rounded-full px-3 py-1.5 text-sm font-semibold text-ink-2 transition-colors hover:bg-page hover:text-ink"
      >
        {t("home")}
      </Link>
      <ChevronRight className="h-3 w-3 text-outline" aria-hidden />
      <Link
        href={`${ROUTES.HOME}?category=electronics`}
        className="rounded-full px-3 py-1.5 text-sm font-semibold text-ink-2 transition-colors hover:bg-page hover:text-ink"
      >
        {t("category")}
      </Link>
      <ChevronRight className="h-3 w-3 text-outline" aria-hidden />
      <span
        className="px-3 py-1.5 text-sm font-medium text-ink"
        data-testid="search-breadcrumb-current"
      >
        {query?.trim() ? t("current", { q: query }) : t("currentEmpty")}
      </span>
    </nav>
  );
}
