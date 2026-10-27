"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";
import { formatVND } from "@/lib/format";
import type { BackendCartItem } from "@/features/cart";

export interface CartItemRowProps {
  item: BackendCartItem;
  isLoading?: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}

/**
 * 1 row trong cart: image + name + variant + price + qty stepper + remove.
 */
export function CartItemRow({
  item,
  isLoading = false,
  onIncrement,
  onDecrement,
  onRemove,
}: CartItemRowProps) {
  const t = useTranslations("storefront.cart");

  return (
    <div
      className="flex items-start gap-3 rounded-xl bg-surface-container-lowest p-3"
      data-testid="cart-item-row"
    >
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-container">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.productName}
            width={80}
            height={80}
            className="h-full w-full object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <MaterialSymbol
              name="receipt_long"
              size="lg"
              className="text-outline-variant"
            />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <p className="font-label-md text-on-surface line-clamp-2">
          {item.productName}
        </p>
        <p className="font-body-sm text-outline">{item.variantName}</p>
        <p className="font-label-sm text-outline-variant">
          {formatVND(item.price)}
        </p>
      </div>

      <div className="flex flex-col items-end gap-2">
        <p className="font-headline-sm text-on-surface tabular-nums">
          {formatVND(item.itemSubtotal)}
        </p>
        <div className="inline-flex items-center rounded-lg border border-outline-variant/60 bg-surface-container-lowest shadow-2xs">
          <button
            type="button"
            onClick={onDecrement}
            disabled={isLoading || item.quantity <= 1}
            aria-label={t("decrement")}
            className={cn(
              "flex h-7 w-7 items-center justify-center text-on-surface transition-colors",
              "hover:bg-surface-container active:scale-95",
              "disabled:cursor-not-allowed disabled:text-outline-variant disabled:opacity-40 disabled:hover:bg-transparent disabled:active:scale-100",
            )}
          >
            <MaterialSymbol name="remove" size="sm" />
          </button>
          <span
            className="min-w-8 border-x border-outline-variant/40 px-2 py-0.5 text-center font-label-md font-semibold text-on-surface tabular-nums select-none"
            data-testid="cart-item-qty"
          >
            {item.quantity}
          </span>
          <button
            type="button"
            onClick={onIncrement}
            disabled={isLoading}
            aria-label={t("increment")}
            className={cn(
              "flex h-7 w-7 items-center justify-center text-on-surface transition-colors",
              "hover:bg-surface-container active:scale-95",
              "disabled:cursor-not-allowed disabled:text-outline-variant disabled:opacity-40 disabled:hover:bg-transparent disabled:active:scale-100",
            )}
          >
            <MaterialSymbol name="add" size="sm" />
          </button>
        </div>
        <button
          type="button"
          onClick={onRemove}
          disabled={isLoading}
          aria-label={t("remove")}
          className="font-label-sm text-error hover:underline"
        >
          {t("remove")}
        </button>
      </div>
    </div>
  );
}
