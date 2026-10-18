/**
 * ProductSpecsTable – Section 16 (Stitch `31bc6af5`).
 *
 * Card showing 4-row key/value table (BE shape `specs` object):
 *   Xuất xứ | Khối lượng | Chất liệu | Bảo hành
 *
 * Updated 2026-10-18 — align với BE `ProductDetailResponse.specs` shape:
 *   - `specs` là object {origin, weight, material, warranty}
 *   - Trước đây FE dùng 6 field: category/material/origin/style/sku/careInstructions.
 *   - 4 field kia không có trong BE → bỏ.
 *
 * i18n namespace: `productDetail.specs.*`.
 */
"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { ProductSpecsDto } from "@/features/products";

export interface ProductSpecsTableProps {
  /** BE có thể trả null khi product không có specs (quyết định 2026-10-18 defensive null). */
  specs: ProductSpecsDto | null | undefined;
  className?: string;
}

interface Row {
  labelKey: "origin" | "weight" | "material" | "warranty";
  value: string;
}

export function ProductSpecsTable({ specs, className }: ProductSpecsTableProps) {
  const t = useTranslations("productDetail.specs");

  // Defensive: BE runtime có thể trả specs = null. Tránh crash page.
  if (!specs) return null;

  const rows: Row[] = [
    { labelKey: "origin", value: specs.origin },
    { labelKey: "weight", value: specs.weight },
    { labelKey: "material", value: specs.material },
    { labelKey: "warranty", value: specs.warranty },
  ];

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-2xl bg-surface-container-lowest p-6 shadow-sm",
        className,
      )}
    >
      <h2 className="flex items-center gap-2 font-headline-md font-bold text-on-surface">
        <span className="inline-block h-6 w-1.5 rounded-full bg-primary" />
        <span>{t("title")}</span>
      </h2>

      <div
        className="overflow-hidden rounded-xl text-body-sm"
        data-testid="specs-table"
      >
        {rows.map((row, idx) => (
          <div
            key={row.labelKey}
            data-testid="spec-row"
            className={cn(
              "grid grid-cols-1 gap-1 p-3 md:grid-cols-3",
              idx % 2 === 0 ? "bg-surface-container-low" : "bg-surface-container-lowest",
            )}
          >
            <span className="font-semibold text-outline">{t(row.labelKey)}</span>
            <span className="text-on-surface md:col-span-2">
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}