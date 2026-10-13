/**
 * CheckoutShopItem – 1 sản phẩm trong shop card.
 * Stitch reference: ui-code-dump.md L143–180 (item product).
 */
"use client";

import Image from "next/image";
import { formatVND } from "@/lib/format";
import type { CheckoutItem } from "@/features/checkout";

interface CheckoutShopItemProps {
  item: CheckoutItem;
}

export function CheckoutShopItem({ item }: CheckoutShopItemProps) {
  const hasDiscount =
    item.originalPrice !== undefined &&
    item.originalPrice > item.price;

  return (
    <div
      className="flex items-start gap-4"
      data-testid={`checkout-shop-item-${item.id}`}
    >
      <Image
        src={item.imageUrl || "/images/placeholder-product.png"}
        alt={item.productName}
        width={64}
        height={64}
        className="w-16 h-16 rounded-lg object-cover shrink-0 bg-surface-container-high shadow-xs"
      />

      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <h4 className="font-semibold text-sm text-on-surface line-clamp-1">
          {item.productName}
        </h4>
        <div className="font-normal text-xs text-on-surface-variant">
          Phân loại: {item.variantName}
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="font-medium text-xs text-on-surface-variant">
            Số lượng: x{item.quantity}
          </span>
          {hasDiscount ? (
            <div className="flex items-baseline gap-1">
              <span className="font-normal text-xs text-on-surface-variant line-through">
                {formatVND(item.originalPrice!)}
              </span>
              <span className="bg-tertiary-fixed text-on-tertiary-fixed-variant font-bold text-xs px-1 rounded">
                -{item.discountPercent}%
              </span>
              <span className="font-bold text-base text-tertiary ml-1">
                {formatVND(item.price)}
              </span>
            </div>
          ) : (
            <span className="font-bold text-base text-on-surface">
              {formatVND(item.price)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
