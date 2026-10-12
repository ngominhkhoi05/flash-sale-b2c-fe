"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { Error404Illustration } from "./Error404Illustration";

/**
 * NotFoundPage — 404 screen
 *
 * Pixel-perfect re-implementation of Stitch design system screen
 * `211f1b0c78254f89b529c59ba14fd9eb` ("Màn hình Lỗi 404 - Vibe Mart")
 * from project `15206106541998912100` (Vibe Mart Marketplace UI/UX).
 *
 * Layout (top → bottom):
 *   1. Brand pill: Vibe Mart default logo (lockup-light) + divider + "Lỗi 404".
 *   2. SVG 404 centerpiece: two "4" digits + magnifying-glass "0"
 *      with a sad package inside the lens (see Error404Illustration).
 *   3. H1 title "Không tìm thấy trang" + description.
 *   4. Two actions:
 *      - Primary "Về trang chủ" → / (CLAUDE.md §2: Storefront home).
 *      - Secondary "Quay lại" button (uses `history.back()`).
 *   5. Hints row: "Gợi ý: …" + 2 quick-links "Hỗ trợ khách hàng"
 *      and "Tìm kiếm sản phẩm" separated by a dot.
 */
export function NotFoundPage() {
  const t = useTranslations("error.notFound");

  return (
    <main className="relative z-10 w-full min-h-screen flex items-center justify-center p-6">
      <div className="flex flex-col w-full items-center justify-center py-6 px-4">
        <div className="relative w-full max-w-xl mx-auto flex flex-col items-center text-center">
          {/* Vibe Mart Default Logo + 404 badge pill */}
          <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-surface-container shadow-sm mb-6">
            <Image
              src="/images/vibe-mart-logo-lockup-light.png"
              alt="Vibe Mart"
              width={96}
              height={28}
              priority
              className="h-7 w-auto"
            />
            <span
              className="inline-block w-px h-4 bg-outline-variant"
              aria-hidden
            />
            <span className="text-label-sm uppercase tracking-wider text-outline">
              {t("idBadge")}
            </span>
          </div>

            {/* Massive 404 Typography with Outline & SVG Integration */}
            <div className="relative flex items-center justify-center my-2 select-none">
              <Error404Illustration />
            </div>

            {/* Title & Description */}
            <div className="mt-4 flex flex-col items-center">
              <h1 className="text-display-lg font-bold text-on-surface tracking-tight">
                {t("title")}
              </h1>
              <p className="text-body-lg text-on-surface-variant max-w-md mt-2 leading-relaxed">
                {t("description")}
              </p>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
              <Link
                href="/"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-primary text-on-primary text-label-lg shadow-md hover:bg-primary-container active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 group"
              >
                <MaterialSymbol
                  name="home"
                  size="[20px]"
                  fill
                  className="text-on-primary transition-transform group-hover:-translate-y-0.5"
                />
                <span>{t("primaryAction")}</span>
              </Link>
              <button
                type="button"
                onClick={() => history.back()}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-surface-container text-on-surface text-label-lg hover:bg-surface-container-high active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <MaterialSymbol
                  name="arrow_back"
                  size="[20px]"
                  className="text-on-surface"
                />
                <span>{t("secondaryAction")}</span>
              </button>
            </div>

            {/* Helpful Hints & Quick Links */}
            <div className="mt-10 pt-6 flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 text-outline text-body-sm">
                <MaterialSymbol
                  name="info"
                  size="[16px]"
                  className="text-primary"
                />
                <span>
                  <span className="font-semibold">{t("hintPrefix")}</span>{" "}
                  {t("hintText")}
                </span>
              </div>
              <div className="flex items-center justify-center gap-4 text-body-sm text-on-surface-variant">
                <span>{t("supportPrompt")}</span>
                <a
                  className="inline-flex items-center gap-1 text-primary text-label-md hover:underline"
                  href="#support"
                >
                  <MaterialSymbol
                    name="support_agent"
                    size="[16px]"
                    className="text-primary"
                  />
                  <span>{t("supportLink")}</span>
                </a>
                <span className="w-1 h-1 rounded-full bg-outline-variant" />
                <a
                  className="inline-flex items-center gap-1 text-primary text-label-md hover:underline"
                  href="#search"
                >
                  <MaterialSymbol
                    name="manage_search"
                    size="[16px]"
                    className="text-primary"
                  />
                  <span>{t("searchLink")}</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
  );
}

export default NotFoundPage;
