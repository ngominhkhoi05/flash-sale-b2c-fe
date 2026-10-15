/**
 * ProductRelatedStores - Section 19 (Stitch `31bc6af5`).
 *
 * Card with:
 *   - Section heading "Cùng Shop UTC" + "Xem hết" link
 *   - Product list: each item is a horizontal link with thumbnail,
 *     name, price, sold count
 *
 * i18n namespace: `productDetail.related.*`.
 */
"use client";

import Image from "next/image";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { RecommendedProduct } from "@/features/products";

export interface ProductRelatedStoresProps {
  /** BE có thể trả null/undefined khi không có sản phẩm liên quan.
   *  Component tự defensive để không crash page. */
  products: RecommendedProduct[] | null | undefined;
  className?: string;
}

function asArray<T>(input: T[] | null | undefined): T[] {
  return Array.isArray(input) ? input : [];
}

/** Dedupe theo id để phòng backend trả duplicate rows → React warning. */
function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      out.push(item);
    }
  }
  return out;
}

export function ProductRelatedStores({ products, className }: ProductRelatedStoresProps) {
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
        <p className="text-body-sm text-outline">Chưa có sản phẩm cùng shop.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((product) => (
            <Link
              key={product.id}
              href={product.href}
              className="group flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-surface-container"
            >
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-container">
                <Image
                  src={product.imageUrl}
                  alt={product.imageAlt}
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
                  {format.number(product.price, { style: "currency", currency: "VND" })}
                </span>
                {product.totalSold !== undefined && (
                  <span className="text-xs text-outline">
                    Đã bán {format.number(product.totalSold)}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
