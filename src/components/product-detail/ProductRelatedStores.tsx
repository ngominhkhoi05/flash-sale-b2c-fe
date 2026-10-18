/**
 * ProductRelatedStores - Section 19 (Stitch `31bc6af5`).
 *
 * Card với:
 *   - Section heading "Cùng Shop UTC" + "Xem hết" link
 *   - Product list: mỗi item là 1 link ngang với thumbnail, name, price, store name
 *
 * Updated 2026-10-18 — align với BE `ProductDetailResponse.relatedSameStore` shape:
 *   - Input đổi từ `RecommendedProduct[]` (string id, totalSold) sang
 *     `RelatedProductSummary[]` (numeric id, minPrice/maxPrice, totalStock).
 *   - Loại bỏ hiển thị `totalSold` (BE không trả). Thay bằng `storeName` + tổng stock.
 *
 * i18n namespace: `productDetail.related.*`.
 */
"use client";

import Image from "next/image";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { RelatedProductSummary } from "@/features/products";

export interface ProductRelatedStoresProps {
  /** BE có thể trả null/undefined khi không có sản phẩm liên quan.
   *  Component tự defensive để không crash page. */
  products: RelatedProductSummary[] | null | undefined;
  className?: string;
}

function asArray<T>(input: T[] | null | undefined): T[] {
  return Array.isArray(input) ? input : [];
}

/** Dedupe theo id để phòng backend trả duplicate rows → React warning. */
function dedupeById<T extends { id: number }>(items: T[]): T[] {
  const seen = new Set<number>();
  const out: T[] = [];
  for (const item of items) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      out.push(item);
    }
  }
  return out;
}

export function ProductRelatedStores({
  products,
  className,
}: ProductRelatedStoresProps) {
  const t = useTranslations("productDetail.related");
  const format = useFormatter();
  const list = dedupeById(asArray(products));

  return (
    <div
      data-testid="product-related-stores"
      className={cn(
        "flex flex-col gap-4 rounded-2xl bg-surface-container-lowest p-4 shadow-sm",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-headline-sm text-base font-bold text-on-surface">
          {t("sameStore")}
        </h3>
        <Link
          href="#"
          className="text-label-sm font-semibold text-primary hover:underline"
        >
          {t("seeAll")}
        </Link>
      </div>

      {list.length === 0 ? (
        <p className="text-body-sm text-outline">{t("emptySameStore")}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((product) => {
            const href = `/products/${product.id}`;
            return (
              <Link
                key={product.id}
                href={href}
                className="group flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-surface-container"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-container">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    width={64}
                    height={64}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium text-on-surface transition-colors group-hover:text-primary">
                    {product.name}
                  </span>
                  <span className="text-sm font-bold text-tertiary">
                    {format.number(product.minPrice, {
                      style: "currency",
                      currency: "VND",
                    })}
                  </span>
                  <span className="text-xs text-outline">
                    {product.storeName}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}