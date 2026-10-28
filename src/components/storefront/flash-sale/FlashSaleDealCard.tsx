/**
 * FlashSaleDealCard – card 1 sản phẩm Flash Sale.
 *
 * 3 variants:
 * - "default"        : deal bình thường (stock < 90% và > 0)
 * - "almost-sold-out" : stock > 90% sold, vẫn còn (warning)
 * - "sold-out"        : availableStock = 0 (disabled, "Đã hết")
 *
 * Variant tự suy ra từ item.allocatedStock + availableStock qua selectors.
 *
 * Stitch reference: trang-flash-sale.md L116-L444
 *
 * NOTE: Text hiện hardcode (TODO i18n) – sẽ refactor sang next-intl ở commit i18n.
 *
 * a11y:
 * - Có alt tiếng Việt trên ảnh (productName)
 * - Nút "Mua ngay" có text rõ ràng (không chỉ icon)
 * - Sold-out button có `disabled` thuộc tính
 * - Badge có text rõ ràng, không chỉ màu
 */

import Link from "next/link";
import { ShoppingBag, ShoppingCart } from "lucide-react";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { formatVND } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  computeSoldPercent,
  computeDiscountPercent,
  isSoldOut,
  isAlmostSoldOut,
  type PublicFlashSaleItemResponse,
} from "@/features/flash-sale";

export type FlashSaleDealVariant = "default" | "almost-sold-out" | "sold-out";

export interface FlashSaleDealCardProps {
  item: PublicFlashSaleItemResponse;
  className?: string;
  isPaused?: boolean;
}

/** Suy ra variant từ item. */
export function getDealVariant(
  item: PublicFlashSaleItemResponse,
): FlashSaleDealVariant {
  if (isSoldOut(item)) return "sold-out";
  if (isAlmostSoldOut(item)) return "almost-sold-out";
  return "default";
}

export function FlashSaleDealCard({ item, className, isPaused }: FlashSaleDealCardProps) {
  const variant = getDealVariant(item);
  const soldPercent = computeSoldPercent(item);
  const discountPercent = computeDiscountPercent(item);
  const soldCount = item.allocatedStock - item.availableStock;
  const productHref = `/products/${item.id}`;
  const isSoldOutCard = variant === "sold-out";
  const isAlmostSoldOutCard = variant === "almost-sold-out";
  const isCardPaused = Boolean(isPaused || item.status === "PAUSED");


  return (
    <div
      data-testid="flash-sale-deal-card"
      className={cn(
        "group flex h-full flex-col justify-between rounded-xl border border-outline-variant bg-surface-container-lowest p-3 transition duration-200",
        isSoldOutCard
          ? "opacity-85"
          : "hover:-translate-y-1 hover:border-primary hover:shadow-md",
        className,
      )}
    >
      <div>
        {/* Image + badges */}
        <div className="relative mb-2.5 aspect-square w-full overflow-hidden rounded-t-xl rounded-b-lg bg-surface-container-high">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={item.productName}
            src={item.imageUrl}
            className={cn(
              "h-full w-full object-cover transition-transform duration-300",
              isSoldOutCard ? "grayscale" : "group-hover:scale-105",
            )}
          />
          {/* Badge FLASH SALE (góc trên trái) */}
          {!isSoldOutCard && (
            isCardPaused ? (
              <span
                data-testid="flash-sale-paused-badge"
                className="absolute left-2 top-2 inline-flex items-center gap-1 rounded bg-amber-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm"
              >
                <MaterialSymbol name="pause_circle" size="[12px]" fill />
                TẠM DỪNG
              </span>
            ) : (
              <span
                data-testid="flash-sale-badge"
                className="absolute left-2 top-2 inline-flex items-center gap-0.5 rounded bg-tertiary px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-on-tertiary shadow-sm"
              >
                <MaterialSymbol name="bolt" size="[12px]" fill />
                FLASH SALE
              </span>
            )
          )}

          {/* Badge giảm giá (góc trên phải) */}
          {discountPercent > 0 && (
            <span className="absolute right-2 top-2 rounded bg-tertiary-soft px-2 py-0.5 text-[11px] font-bold text-tertiary shadow-sm">
              -{discountPercent}%
            </span>
          )}
          {/* Overlay "HẾT HÀNG" nếu sold-out */}
          {isSoldOutCard && (
            <div className="absolute inset-0 flex items-center justify-center bg-inverse-surface/60">
              <div
                data-testid="sold-out-overlay"
                className="flex h-16 w-16 flex-col items-center justify-center rounded-full border border-outline bg-inverse-surface/90 text-center text-[11px] font-bold uppercase leading-tight text-surface-container-lowest shadow-lg"
              >
                <ShoppingCart className="mb-0.5 h-4 w-4" aria-hidden />
                <span>HẾT HÀNG</span>
              </div>
            </div>
          )}
        </div>

        {/* Tên sản phẩm */}
        <h3
          className={cn(
            "line-clamp-2 min-h-[40px] text-[14px] font-normal leading-[20px]",
            isSoldOutCard
              ? "text-on-surface-variant"
              : "text-on-surface group-hover:text-primary",
          )}
        >
          {item.productName}
        </h3>

        {/* Giá */}
        <div className="mt-2 flex items-baseline gap-1.5">
          <span
            className={cn(
              "text-[18px] font-semibold leading-[24px]",
              isSoldOutCard ? "text-on-surface-variant" : "text-tertiary",
            )}
          >
            {formatVND(item.flashSalePrice)}
          </span>
          {item.originalPrice > item.flashSalePrice && (
            <del className="text-[12px] font-normal leading-[16px] text-on-surface-variant">
              {formatVND(item.originalPrice)}
            </del>
          )}
        </div>
      </div>

      {/* Stock bar + CTA */}
      <div className="mt-3 space-y-1.5">
        <div className="relative flex h-4 w-full items-center overflow-hidden rounded-full bg-tertiary-soft">
          <div
            className={cn(
              "h-full rounded-full",
              isSoldOutCard ? "bg-on-surface-variant" : "bg-tertiary",
            )}
            style={{ width: `${Math.min(soldPercent, 100)}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold leading-none tracking-tight text-on-primary">
            {isAlmostSoldOutCard ? (
              <>
                <MaterialSymbol
                  name="local_fire_department"
                  size="[12px]"
                  fill
                  className="mr-0.5"
                />
                SẮP CHÁY HÀNG {soldCount}/{item.allocatedStock}
              </>
            ) : (
              <>ĐÃ BÁN {soldCount}</>
            )}
          </span>
        </div>
        {isSoldOutCard ? (
          <p className="text-center text-[11px] leading-tight text-on-surface-variant">
            Khung giờ mở bán đã kết thúc suất
          </p>
        ) : isCardPaused ? (
          <p className="text-center text-[11px] font-semibold leading-tight text-amber-700">
            Phiên tạm dừng nhận đơn
          </p>
        ) : isAlmostSoldOutCard ? (
          <p className="flex items-center justify-center gap-1 text-center text-[11px] font-semibold leading-tight text-tertiary">
            <span>⚠️ Chỉ còn lại {item.availableStock} suất sale!</span>
          </p>
        ) : (
          <p className="text-center text-[11px] leading-tight text-on-surface-variant">
            Giới hạn {item.userPurchaseLimit} sản phẩm/khách
          </p>
        )}
        {isSoldOutCard ? (
          <button
            type="button"
            disabled
            className="flex h-9 w-full cursor-not-allowed items-center justify-center rounded-lg border border-outline-variant bg-surface-container-high text-[13px] font-semibold text-on-surface-variant"
          >
            Đã hết
          </button>
        ) : isCardPaused ? (
          <button
            type="button"
            disabled
            className="flex h-9 w-full cursor-not-allowed items-center justify-center gap-1.5 rounded-lg border border-amber-300 bg-amber-100 text-[13px] font-semibold text-amber-800"
          >
            <MaterialSymbol name="pause_circle" size="[16px]" />
            Tạm dừng
          </button>
        ) : (
          <Link
            href={productHref}
            className="flex h-9 w-full items-center justify-center gap-1 rounded-lg bg-tertiary text-[13px] font-semibold text-on-tertiary shadow-sm transition-all hover:bg-tertiary-container active:scale-[0.98]"
          >
            <ShoppingBag className="h-4 w-4" aria-hidden />
            Mua ngay
          </Link>
        )}

      </div>
    </div>
  );
}
