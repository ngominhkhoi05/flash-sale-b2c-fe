/**
 * ProductSpecsTable – Section 16 (Stitch `31bc6af5`).
 *
 * Card showing 6-row key/value table:
 *   Danh mục | Chất liệu | Xuất xứ | Kiểu dáng | Mã SKU | Hướng dẫn giặt ủi
 *
 * i18n namespace: `productDetail.specs.*`.
 */
"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { ProductSpecs } from "@/features/products";

export interface ProductSpecsTableProps {
  specs: ProductSpecs;
  className?: string;
}

interface Row {
  labelKey: "category" | "material" | "origin" | "style" | "sku" | "careInstructions";
  value: string;
  mono?: boolean;
}

export function ProductSpecsTable({ specs, className }: ProductSpecsTableProps) {
  const t = useTranslations("productDetail.specs");

  const rows: Row[] = [
    { labelKey: "category", value: specs.category },
    { labelKey: "material", value: specs.material },
    { labelKey: "origin", value: specs.origin },
    { labelKey: "style", value: specs.style },
    { labelKey: "sku", value: specs.sku, mono: true },
    { labelKey: "careInstructions", value: specs.careInstructions },
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
            <span
              className={cn(
                "text-on-surface md:col-span-2",
                row.mono && "font-mono font-semibold",
              )}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
