/**
 * ProductDescriptionCard – Section 17 (Stitch `31bc6af5`).
 *
 * Card với 3 sub-blocks (theo BE `descriptionRich` shape):
 *   1. Intro paragraph
 *   2. Highlights list (bullets)
 *   3. Paragraphs list (multi-paragraph)
 *
 * Sau đó là Features (string[]) và Size chart (BE shape {large, standard}).
 *
 * Updated 2026-10-18 — align với BE `ProductDetailResponse`:
 *   - `descriptionRich`: object {intro, highlights[], paragraphs[]} thay vì string[].
 *   - `features`: string[] (text-only) thay vì ProductFeature[] (icon object).
 *   - `sizeChart`: object {large, standard} thay vì SizeChartRow[].
 *
 * i18n namespace: `productDetail.description.*`.
 */
"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type {
  DescriptionRichDto,
  SizeChartDto,
} from "@/features/products";

export interface ProductDescriptionCardProps {
  /** BE shape: object {intro, highlights[], paragraphs[]}.
   *  Component defensive khi thiếu/null → render 0 paragraph. */
  descriptionRich: DescriptionRichDto | null | undefined;
  /** BE trả string[]. Defensive khi null/undefined. */
  features: string[] | null | undefined;
  /** BE shape: object {large, standard}. Defensive khi null/undefined. */
  sizeChart: SizeChartDto | null | undefined;
  className?: string;
}

function asArray<T>(input: T[] | null | undefined): T[] {
  return Array.isArray(input) ? input : [];
}

export function ProductDescriptionCard({
  descriptionRich,
  features,
  sizeChart,
  className,
}: ProductDescriptionCardProps) {
  const t = useTranslations("productDetail.description");
  const featureList = asArray(features);

  const intro = descriptionRich?.intro ?? "";
  const highlights = asArray(descriptionRich?.highlights);
  const paragraphs = asArray(descriptionRich?.paragraphs);

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

      {/* Intro paragraph */}
      {intro && (
        <p
          className="font-body-md leading-relaxed text-on-surface-variant"
          data-testid="description-intro"
        >
          {intro}
        </p>
      )}

      {/* Highlights bullets */}
      {highlights.length > 0 && (
        <ul
          className="flex flex-col gap-2 pl-5 font-body-md text-on-surface-variant"
          data-testid="description-highlights"
        >
          {highlights.map((h, idx) => (
            <li
              key={idx}
              className="list-disc leading-relaxed"
            >
              {h}
            </li>
          ))}
        </ul>
      )}

      {/* Paragraphs */}
      {paragraphs.length > 0 && (
        <div
          className="flex max-w-none flex-col gap-3 font-body-md leading-relaxed text-on-surface-variant"
          data-testid="description-paragraphs"
        >
          {paragraphs.map((p, idx) => (
            <p key={idx}>{p}</p>
          ))}
        </div>
      )}

      {/* Features (string[]) */}
      {featureList.length > 0 && (
        <div
          className="flex flex-col gap-3 rounded-xl bg-surface-container-low p-4"
          data-testid="feature-list"
        >
          <h3 className="text-base font-headline-sm font-bold text-on-surface">
            {t("featureTitle")}
          </h3>
          <ul className="flex flex-col gap-2 pl-5 font-body-sm text-on-surface-variant">
            {featureList.map((f, idx) => (
              <li
                key={idx}
                className="list-disc leading-relaxed"
                data-testid="feature-item"
              >
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Size chart (BE shape — 2 row: large + standard).
       *
       * Defensive guard (xem plan 2026-10-18-product-description-size-chart-defensive):
       * BE ProductDetailResponse.sizeChart là Object với 5 runtime shape:
       *   1. null/undefined — DB không set
       *   2. "" (empty string) — 30% seed skip field
       *   3. [] (empty ArrayList) — DTO default
       *   4. {S,M,L,XL} — apparel (chest_cm/length_cm, KHÔNG có width_cm)
       *   5. {standard:{width_cm,height_cm}, large:{width_cm,height_cm}} — non-apparel
       *
       * Component PHẢI skip render khi không phải shape #5. Ngược lại sẽ crash
       * `Cannot read properties of undefined (reading 'width_cm')` ở runtime khi
       * user mở sản phẩm giày / quần áo không thuộc non-apparel group. */}
      {sizeChart &&
        typeof sizeChart === "object" &&
        !Array.isArray(sizeChart) &&
        typeof (sizeChart as { standard?: { width_cm?: number } }).standard?.width_cm === "number" &&
        typeof (sizeChart as { large?: { width_cm?: number } }).large?.width_cm === "number" && (
          <div
            className="flex flex-col gap-3 pt-2"
            id="size-guide"
            data-testid="size-chart"
          >
            <h3 className="flex items-center gap-2 text-base font-headline-sm font-bold text-on-surface">
              <StraightenIcon className="h-4 w-4 text-base text-primary" />
              <span>{t("sizeChartTitle")}</span>
            </h3>
            <div className="overflow-x-auto rounded-xl shadow-sm">
              <table className="w-full text-left font-body-sm">
                <thead className="bg-surface-container text-on-surface font-label-md">
                  <tr>
                    <th className="p-3">{t("sizeChart.size")}</th>
                    <th className="p-3">{t("sizeChart.widthCm")}</th>
                    <th className="p-3">{t("sizeChart.heightCm")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y-0 text-on-surface-variant font-body-sm">
                  <tr
                    data-testid="size-chart-row"
                    data-row="standard"
                    className="bg-surface-container-low"
                  >
                    <td className="p-3 font-bold text-primary">
                      {t("sizeChart.standard")}
                    </td>
                    <td className="p-3">{sizeChart.standard.width_cm} cm</td>
                    <td className="p-3">{sizeChart.standard.height_cm} cm</td>
                  </tr>
                  <tr
                    data-testid="size-chart-row"
                    data-row="large"
                    className="bg-surface-container-lowest"
                  >
                    <td className="p-3 font-bold text-primary">
                      {t("sizeChart.large")}
                    </td>
                    <td className="p-3">{sizeChart.large.width_cm} cm</td>
                    <td className="p-3">{sizeChart.large.height_cm} cm</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
    </div>
  );
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