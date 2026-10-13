/**
 * ProductBestSellers - Section 20 (Stitch `31bc6af5`).
 *
 * Card with:
 *   - Section heading "Bán Chạy Cùng Ngành" with HOT badge + "Xem hết" link
 *   - Product list: each item shows image, name, price, rating, sold count
 *
 * i18n namespace: `productDetail.related.*`.
 */
"use client";

import Image from "next/image";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RecommendedProduct } from "@/features/products";

export interface ProductBestSellersProps {
  products: RecommendedProduct[];
  className?: string;
}

export function ProductBestSellers({ products, className }: ProductBestSellersProps) {
  const t = useTranslations("productDetail.related");
  const format = useFormatter();

  return (
    <div
      data-testid="product-best-sellers"
      className={cn(
        "flex flex-col gap-4 rounded-2xl bg-surface-container-lowest p-4 shadow-sm",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-headline-sm flex items-center gap-2 text-base font-bold text-on-surface">
          {t("bestSellers")}
          <span className="rounded bg-tertiary px-2 py-0.5 text-label-sm font-bold text-on-tertiary">
            {t("hot")}
          </span>
        </h3>
        <Link
          href="#"
          className="text-label-sm font-semibold text-primary hover:underline"
        >
          {t("seeAll")}
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="text-body-sm text-outline">Chưa có sản phẩm bán chạy.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {products.map((product) => (
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
                {product.rating !== undefined && (
                  <span className="flex items-center gap-1 text-xs text-outline">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    {product.rating.toFixed(1)}
                    {product.totalSold !== undefined && (
                      <> • Đã bán {format.number(product.totalSold)}</>
                    )}
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
