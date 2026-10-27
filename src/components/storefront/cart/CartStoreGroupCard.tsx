"use client";

import { useTranslations } from "next-intl";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { formatVND } from "@/lib/format";
import type { BackendCartStoreGroup } from "@/features/cart";
import { CartItemRow } from "./CartItemRow";

export interface CartStoreGroupCardProps {
  group: BackendCartStoreGroup;
  isLoading?: boolean;
  onUpdateQty: (itemId: number, quantity: number) => void;
  onRemoveItem: (itemId: number) => void;
}

/**
 * 1 shop group trong cart: shop header + list items + shop subtotal.
 */
export function CartStoreGroupCard({
  group,
  isLoading = false,
  onUpdateQty,
  onRemoveItem,
}: CartStoreGroupCardProps) {
  const t = useTranslations("storefront.cart");

  return (
    <div
      className="rounded-2xl bg-surface-container-lowest p-4 shadow-sm"
      data-testid="cart-store-group"
    >
      {/* Shop header */}
      <div className="mb-3 flex items-center gap-2 border-b border-outline-variant pb-3">
        <MaterialSymbol name="storefront" size="base" className="text-primary" />
        <span className="font-label-md font-semibold text-on-surface">
          {group.storeName}
        </span>
      </div>

      {/* Items */}
      <div className="flex flex-col gap-3">
        {group.items.map((item) => (
          <CartItemRow
            key={item.id}
            item={item}
            isLoading={isLoading}
            onIncrement={() => onUpdateQty(item.id, item.quantity + 1)}
            onDecrement={() => onUpdateQty(item.id, Math.max(1, item.quantity - 1))}
            onChangeQuantity={(qty) => {
              if (qty <= 0) {
                onRemoveItem(item.id);
              } else {
                onUpdateQty(item.id, qty);
              }
            }}
            onRemove={() => onRemoveItem(item.id)}
          />
        ))}
      </div>

      {/* Shop subtotal */}
      <div className="mt-3 flex items-center justify-end gap-2 border-t border-outline-variant pt-3">
        <span className="font-body-sm text-outline">
          {t("shopSubtotal")}
        </span>
        <span className="font-headline-sm font-bold text-on-surface tabular-nums">
          {formatVND(group.storeSubtotal)}
        </span>
      </div>
    </div>
  );
}
