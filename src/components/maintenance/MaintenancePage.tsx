"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { MaintenanceIllustration } from "./MaintenanceIllustration";
import { getMaintenanceFeatureLabel } from "./feature-code";
import { ROUTES, type MaintenanceFeatureCode } from "@/lib/constants";

/**
 * MaintenancePage – 503 / "feature being upgraded" screen
 *
 * Pixel-perfect re-implementation of Stitch design system screen
 * `4dc42fa4da2345148536ed23af2364f1` ("Tính năng đang được nâng cấp -
 * Vibe Mart") from project `15206106541998912100` (Vibe Mart Marketplace
 * UI/UX).
 *
 * Layout (top → bottom):
 *   1. Centerpiece illustration (spinner + halos + build badge).
 *   2. Feature code sub-pill ("Mã tính năng: <code>").
 *   3. H1 title.
 *   4. Description paragraph (with highlighted feature name).
 *   5. Auto-progress info card (icon + title + body).
 *   6. Action buttons: primary → /, secondary → /support.
 *   7. "In the meantime" section: lead text + 3 quick-link pills
 *      (Flash Sale, Best sellers, Check orders).
 *
 * Feature code (optional):
 * - Khi page được mở qua `?feature=<code>` từ link placeholder
 *   trong header/footer, prop `featureCode` sẽ thay đổi:
 *     • sub-pill hiển thị "Mã tính năng: <code>"
 *     • description highlight đổi sang label tiếng Việt/Anh tương ứng
 * - Nếu prop không truyền → fallback mặc định "Đánh giá sản phẩm"
 *   (giữ behavior cũ, backward-compatible với test hiện tại).
 *
 * Deviations from Stitch (mirrors the ForbiddenPage / NotFoundPage pattern):
 *   - `bg-primary-fixed/40` opacity modifier → inline `color-mix()` because
 *     Tailwind 4 utility opacity on a CSS custom-color token can be flaky.
 *   - `space-xs/sm/md/lg/xl` semantic spacing tokens (not declared in
 *     `globals.css` per `no-overengineering.mdc`) → Tailwind standard
 *     `gap-1, gap-2, gap-3, p-4, mb-6, py-8, px-4, lg:px-8`.
 *   - Inline JS click handler for code badge copy → removed (Next.js RSC
 *     convention; badge is display-only).
 *   - Stitch `font-label-sm text-label-sm` dual class → project convention
 *     `text-label-sm font-semibold`.
 *   - `animate-[spin_20s_linear_infinite]` arbitrary value → `animate-spin`
 *     (default 1s) with inline `style.animationDuration: "20s"`.
 */
export interface MaintenancePageProps {
  /** Mã tính năng từ URL `?feature=<code>`. Optional. */
  featureCode?: MaintenanceFeatureCode | string | null;
}

export function MaintenancePage({ featureCode }: MaintenancePageProps = {}) {
  const t = useTranslations("error.maintenance");
  const locale = useLocale() as "vi" | "en";

  // Resolve feature label (locale-aware) nếu có code hợp lệ.
  // Fallback về key i18n `descriptionHighlight` mặc định khi:
  //  - prop không truyền
  //  - code không nằm trong MAINTENANCE_FEATURE_CODES enum
  const resolvedLabel = featureCode
    ? getMaintenanceFeatureLabel(featureCode, locale)
    : null;
  const highlight = resolvedLabel ?? t("descriptionHighlight");
  const codeBadgeText = featureCode
    ? `${t("codeBadge")}: ${featureCode}`
    : t("codeBadge");

  return (
    <main className="w-full min-h-screen flex items-center justify-center py-8 px-4 lg:px-8">
      <div className="w-full max-w-2xl flex flex-col items-center text-center">
        {/* 1. Centerpiece illustration */}
        <MaintenanceIllustration />

        {/* 2. Feature code sub-pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-on-surface mb-4">
          <MaterialSymbol
            name="terminal"
            size="[12px]"
            className="text-primary"
          />
          <span className="text-label-sm font-semibold tracking-wide">
            {codeBadgeText}
          </span>
        </div>

        {/* 3. H1 title */}
        <h1 className="text-display-lg font-bold text-on-surface tracking-tight mb-2">
          {t("title")}
        </h1>

        {/* 4. Description paragraph with highlighted feature name */}
        <p className="text-body-lg text-on-surface-variant max-w-lg mb-6 leading-relaxed">
          {t("descriptionPrefix")}
          <span className="text-label-lg text-on-surface">
            {highlight}
          </span>
          {t("descriptionSuffix")}
        </p>

        {/* 5. Auto-progress info card */}
        <div className="w-full bg-surface-container-lowest p-4 rounded-xl shadow-sm mb-8 text-left flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center flex-shrink-0 text-primary mt-0.5">
            <MaterialSymbol name="update" size="[18px]" />
          </div>
          <div className="flex-1">
            <p className="text-label-md font-medium text-on-surface">
              {t("progressTitle")}
            </p>
            <p className="text-body-md text-on-surface-variant">
              {t("progressBody")}
            </p>
          </div>
        </div>

        {/* 6. Action buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mb-8">
          <Link
            href={ROUTES.HOME}
            className="w-full sm:w-auto px-6 h-10 rounded-lg bg-primary text-on-primary text-label-lg font-semibold flex items-center justify-center gap-2 hover:bg-primary-container shadow-sm transition-all active:scale-[0.98]"
          >
            <MaterialSymbol
              name="arrow_back"
              size="[16px]"
              className="text-on-primary"
            />
            <span>{t("primaryAction")}</span>
          </Link>
          <Link
            href={ROUTES.SUPPORT}
            className="w-full sm:w-auto px-6 h-10 rounded-lg bg-surface-container-lowest text-on-surface text-label-lg font-semibold flex items-center justify-center gap-2 hover:bg-surface-container-low shadow-sm transition-all active:scale-[0.98]"
          >
            <MaterialSymbol
              name="support_agent"
              size="[16px]"
              className="text-secondary"
            />
            <span>{t("secondaryAction")}</span>
          </Link>
        </div>

        {/* 7. "In the meantime" explore section */}
        <div className="w-full pt-6 flex flex-col items-center gap-3">
          <span className="text-label-md font-medium text-on-surface-variant">
            {t("explorePrompt")}
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link
              href={ROUTES.FLASH_SALE}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container-high transition-colors shadow-sm"
            >
              <MaterialSymbol
                name="bolt"
                fill
                size="[14px]"
                className="text-tertiary"
              />
              <span className="text-label-md font-medium">
                {t("exploreFlashSale")}
              </span>
            </Link>
            <Link
              href="/categories"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container-high transition-colors shadow-sm"
            >
              <MaterialSymbol
                name="local_fire_department"
                size="[14px]"
                className="text-primary"
              />
              <span className="text-label-md font-medium">
                {t("exploreBestSellers")}
              </span>
            </Link>
            <Link
              href={ROUTES.CART}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container-high transition-colors shadow-sm"
            >
              <MaterialSymbol
                name="package_2"
                size="[14px]"
                className="text-secondary"
              />
              <span className="text-label-md font-medium">
                {t("exploreOrders")}
              </span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default MaintenancePage;
