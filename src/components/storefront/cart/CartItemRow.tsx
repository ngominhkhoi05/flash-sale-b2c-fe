"use client";

import { useState, useEffect, useRef } from "react";
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
  onChangeQuantity?: (quantity: number) => void;
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
  onChangeQuantity,
  onRemove,
}: CartItemRowProps) {
  const t = useTranslations("storefront.cart");
  const [inputValue, setInputValue] = useState<string>(String(item.quantity));
  const [isFocused, setIsFocused] = useState(false);
  const lastCommittedRef = useRef<number>(item.quantity);

  useEffect(() => {
    lastCommittedRef.current = item.quantity;
    if (!isFocused) {
      setInputValue(String(item.quantity));
    }
  }, [item.quantity, isFocused]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    // Chặn dấu âm và mọi ký tự không phải số
    const cleaned = raw.replace(/\D/g, "");

    if (cleaned === "") {
      setInputValue("");
      return;
    }

    // Nếu nhập 01 -> hiển thị 1 (loại bỏ leading zero)
    const parsed = parseInt(cleaned, 10);
    setInputValue(String(parsed));
  }

  function commitValue() {
    const digitsOnly = inputValue.replace(/\D/g, "");
    const parsed = digitsOnly === "" ? 0 : parseInt(digitsOnly, 10);

    // Nếu về 0 -> xóa khỏi giỏ hàng
    if (parsed <= 0) {
      setInputValue("0");
      if (lastCommittedRef.current !== 0) {
        lastCommittedRef.current = 0;
        if (onChangeQuantity) {
          onChangeQuantity(0);
        }
        onRemove();
      }
      return;
    }

    setInputValue(String(parsed));
    if (parsed !== lastCommittedRef.current) {
      lastCommittedRef.current = parsed;
      if (onChangeQuantity) {
        onChangeQuantity(parsed);
      }
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    // Chặn phím dấu âm '-', '+', '.', 'e'
    if (e.key === "-" || e.key === "+" || e.key === "." || e.key === "e") {
      e.preventDefault();
      return;
    }
    if (e.key === "Enter") {
      commitValue();
      e.currentTarget.blur();
    }
  }

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
        <div className="flex items-center gap-2">
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
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={inputValue}
              disabled={isLoading}
              aria-label={t("quantity")}
              data-testid="cart-item-qty"
              onChange={handleInputChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                setIsFocused(false);
                commitValue();
              }}
              onKeyDown={handleKeyDown}
              className={cn(
                "h-7 w-11 border-x border-outline-variant/40 bg-transparent px-1 text-center font-label-md font-semibold text-on-surface tabular-nums",
                "focus:bg-surface-container/40 focus:outline-none focus:ring-1 focus:ring-primary/40",
                "disabled:cursor-not-allowed disabled:text-outline-variant",
              )}
            />
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
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg text-outline transition-colors",
              "hover:bg-error-container/40 hover:text-error active:scale-95",
              "disabled:cursor-not-allowed disabled:opacity-40",
            )}
          >
            <MaterialSymbol name="delete" size="[18px]" />
          </button>
        </div>
      </div>
    </div>
  );
}
