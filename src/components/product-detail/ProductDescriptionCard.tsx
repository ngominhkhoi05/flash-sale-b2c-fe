/**
 * ProductDescriptionCard – Section 17 (Stitch `31bc6af5`).
 *
 * Card with 3 sub-blocks:
 *   1. Two HTML-rich description paragraphs.
 *   2. Three feature cards (icon + title + description).
 *   3. Size chart table with 4 rows; current row highlighted, OOS row grayed.
 *
 * The `descriptionRich` is rendered as `dangerouslySetInnerHTML` because
 * the source of the strings is the trusted `mock.ts` (not user input).
 * Khi tích hợp BE thật, sẽ dùng DOMPurify hoặc render từ cấu trúc JSON.
 *
 * i18n namespace: `productDetail.description.*`.
 */
"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { ProductFeature, SizeChartRow } from "@/features/products";

export interface ProductDescriptionCardProps {
  descriptionRich: string[];
  features: ProductFeature[];
  sizeChart: SizeChartRow[];
  className?: string;
}

export function ProductDescriptionCard({
  descriptionRich,
  features,
  sizeChart,
  className,
}: ProductDescriptionCardProps) {
  const t = useTranslations("productDetail.description");

  return (
    <div
      className={cn(
        "flex flex-col gap-6 rounded-2xl bg-surface-container-lowest p-6 shadow-sm",
        className,
      )}
    >
      <h2 className="flex items-center gap-2 font-headline-md font-bold text-on-surface">
        <span className="inline-block h-6 w-1.5 rounded-full bg-primary" />
        <span>{t("title")}</span>
      </h2>

      {/* Description paragraphs (rich HTML) */}
      <div
        className="prose flex max-w-none flex-col gap-3 font-body-md leading-relaxed text-on-surface-variant"
        data-testid="description-paragraphs"
      >
        {descriptionRich.map((html, idx) => (
          <p
            key={idx}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ))}
      </div>

      {/* 3 feature cards */}
      <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-3">
        {features.map((feature, idx) => (
          <div
            key={`${feature.icon}-${idx}`}
            className="flex flex-col gap-2 rounded-xl bg-surface-container-low p-4"
            data-testid="feature-card"
          >
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                feature.iconBgClass,
                feature.iconTextClass,
              )}
            >
              <FeatureIcon name={feature.icon} className="h-5 w-5 text-xl" />
            </div>
            <h3 className="text-base font-headline-sm font-bold text-on-surface">
              {feature.title}
            </h3>
            <p className="font-body-sm text-outline">{feature.description}</p>
          </div>
        ))}
      </div>

      {/* Size chart */}
      <div className="flex flex-col gap-3 pt-2" id="size-guide">
        <h3 className="flex items-center gap-2 text-base font-headline-sm font-bold text-on-surface">
          <StraightenIcon className="h-4 w-4 text-base text-primary" />
          <span>{t("featureTitle")}</span>
        </h3>
        <div className="overflow-x-auto rounded-xl shadow-sm">
          <table className="w-full text-left font-body-sm">
            <thead className="bg-surface-container text-on-surface font-label-md">
              <tr>
                <th className="p-3">Size</th>
                <th className="p-3">Chiều cao (cm)</th>
                <th className="p-3">Cân nặng (kg)</th>
                <th className="p-3">Rộng áo (cm)</th>
                <th className="p-3">Dài áo (cm)</th>
              </tr>
            </thead>
            <tbody className="divide-y-0 text-on-surface-variant font-body-sm">
              {sizeChart.map((row, idx) => {
                const isOOS = row.isOutOfStock;
                const isCurrent = row.isCurrent;
                return (
                  <tr
                    key={row.size}
                    data-testid="size-chart-row"
                    className={cn(
                      isCurrent
                        ? "bg-primary-fixed"
                        : idx % 2 === 0
                          ? "bg-surface-container-lowest"
                          : "bg-surface-container-low",
                      isOOS && "text-outline opacity-60",
                    )}
                  >
                    <td
                      className={cn(
                        "p-3 font-bold",
                        isOOS ? "text-outline" : "text-primary",
                      )}
                    >
                      {row.size}
                      {isCurrent && " (Đang chọn)"}
                      {isOOS && " (Tạm hết)"}
                    </td>
                    <td className={cn("p-3", isCurrent && "font-semibold text-on-surface")}>
                      {row.height}
                    </td>
                    <td className={cn("p-3", isCurrent && "font-semibold text-on-surface")}>
                      {row.weight}
                    </td>
                    <td className="p-3">{row.width}</td>
                    <td className="p-3">{row.length}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Inline SVG icons (Material Symbols outline-style) ────────────────────

function FeatureIcon({ name, className }: { name: string; className?: string }) {
  switch (name) {
    case "air":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
        >
          <path d="M14.5 17c0 1.65-1.35 3-3 3s-3-1.35-3-3h2c0 .55.45 1 1 1s1-.45 1-1-.45-1-1-1H2v-2h9.5c1.65 0 3 1.35 3 3zm5.5-9c0-2.21-1.79-4-4-4H2v2h14c1.1 0 2 .9 2 2s-.9 2-2 2H7v2h9.5c2.21 0 4-1.79 4-4h-.5zM5.5 12c0 .55-.45 1-1 1H2v2h2.5c1.38 0 2.5-1.12 2.5-2.5S5.88 10 4.5 10H2v2h2.5c.55 0 1 .45 1 1z" />
        </svg>
      );
    case "all_inclusive":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
        >
          <path d="M18.6 6.62c-1.44 0-2.8.56-3.77 1.53L12 10.66 10.48 9.15c-1.43-1.43-3.83-1.43-5.27 0-1.43 1.43-1.43 3.84 0 5.27l3.54 3.54c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L6.62 13c-.66-.66-.66-1.73 0-2.39.66-.66 1.73-.66 2.39 0l1.99 1.99c.39.39 1.02.39 1.41 0l3.53-3.54c.5-.5 1.34-.5 1.84 0 .5.5.5 1.34 0 1.84l-3.54 3.54c-.39.39-.39 1.02 0 1.41s1.02.39 1.41 0l3.54-3.54c1.31-1.31 1.31-3.43 0-4.74-.99-.98-2.34-1.55-3.79-1.55z" />
        </svg>
      );
    case "layers":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
        >
          <path d="M11.99 18.54-7.05-2.46 1.69-7.49 12 1.18l10.31 5.32-8.74 4.74 1.42 6.3zM12 15.4l6.36-3.45L12 8.55l-6.36 3.4L12 15.4z" />
        </svg>
      );
    default:
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
        >
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
  }
}

function StraightenIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 10H3V8h2v4h2V8h2v4h2V8h2v4h2V8h2v4h2V8h2v8z" />
    </svg>
  );
}
