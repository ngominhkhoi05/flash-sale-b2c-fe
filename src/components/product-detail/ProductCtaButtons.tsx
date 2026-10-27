/**
 * ProductCtaButtons – Section 14.
 * Standard mode: 2 buttons (Add to Cart + Buy Now).
 * Flash mode: 1 full-width urgent CTA "Buy now – Hold for 5 minutes".
 */
"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/** Lý do disable CTA. Mỗi reason map tới 1 i18n key cho tooltip. */
export type CtaDisabledReason =
  | "canPurchase" // Cho phép mua
  | "contact" // Không có giá (liên hệ shop)
  | "outOfStock"; // Hết hàng (0 variant ACTIVE)

export interface ProductCtaButtonsProps {
  /** Render mode — standard (2 buttons) or flash sale (1 urgent CTA). */
  mode: "standard" | "flash";
  /** Lý do disable. Mặc định 'canPurchase'. */
  disabledReason?: CtaDisabledReason;
  /** Khi true → disable buttons + show spinner (fallback chung nếu không tách lẻ). */
  isLoading?: boolean;
  /** Khi true → chỉ hiển thị spinner cho nút Thêm vào giỏ hàng. */
  isAddingToCart?: boolean;
  /** Khi true → chỉ hiển thị spinner cho nút Mua ngay. */
  isBuyingNow?: boolean;
  /** Add-to-Cart handler (standard mode only). */
  onAddToCart?: () => void;
  /** Buy-Now handler (both modes). */
  onBuyNow?: () => void;
  className?: string;
}

const DISABLED_REASON_KEY: Record<Exclude<CtaDisabledReason, "canPurchase">, string> = {
  contact: "disabledReasonContact",
  outOfStock: "disabledReasonOutOfStock",
};

export function ProductCtaButtons({
  mode,
  disabledReason = "canPurchase",
  isLoading = false,
  isAddingToCart = false,
  isBuyingNow = false,
  onAddToCart,
  onBuyNow,
  className,
}: ProductCtaButtonsProps) {
  const t = useTranslations("productDetail.cta");
  const reasonKey = disabledReason === "canPurchase" ? null : DISABLED_REASON_KEY[disabledReason];
  const disabledTooltip = reasonKey ? t(reasonKey) : undefined;

  const isAnyLoading = isLoading || isAddingToCart || isBuyingNow;
  // Disabled khi disabledReason != 'canPurchase' HOẶC có bất kỳ action nào đang chạy.
  const isDisabled = disabledReason !== "canPurchase" || isAnyLoading;

  // Xác định nút nào hiển thị spinner xoay xoay:
  // Nếu truyền isAddingToCart hoặc isBuyingNow riêng thì nút tương ứng xoay.
  // Nếu chỉ truyền isLoading chung (legacy/flash) thì fallback theo isLoading.
  const showAddToCartSpinner = isAddingToCart || (isLoading && !isBuyingNow);
  const showBuyNowSpinner = isBuyingNow || (isLoading && !isAddingToCart);

  if (mode === "flash") {
    return (
      <div className={cn("pt-3", className)} data-testid="product-cta-flash">
        <button
          type="button"
          onClick={onBuyNow}
          disabled={isDisabled}
          aria-disabled={isDisabled}
          title={isDisabled ? disabledTooltip : undefined}
          className={cn(
            "flex h-13 w-full animate-bounce items-center justify-center gap-2 rounded-lg px-6 py-3 text-lg font-bold text-white shadow-lg transition-all",
            isDisabled
              ? "cursor-not-allowed bg-on-surface/30 hover:bg-on-surface/30"
              : "bg-tertiary hover:bg-tertiary-hover"
          )}
        >
          {showBuyNowSpinner || isAnyLoading ? (
            <Spinner />
          ) : (
            <BoltIcon className="h-6 w-6" />
          )}
          <span>{t("buyNowFlash")}</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn("grid grid-cols-1 gap-3 pt-3 sm:grid-cols-2", className)}
      data-testid="product-cta-standard"
    >
      <button
        type="button"
        onClick={onAddToCart}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        title={isDisabled ? disabledTooltip : undefined}
        className={cn(
          "flex h-12 items-center justify-center gap-2 rounded-lg border-2 px-6 text-[13px] font-bold shadow-sm transition-all",
          isDisabled
            ? "cursor-not-allowed border-outline/30 bg-surface-container text-outline/60"
            : "border-primary bg-surface-container-lowest text-primary hover:bg-surface-container"
        )}
      >
        {showAddToCartSpinner ? (
          <Spinner />
        ) : (
          <CartIcon className="h-5 w-5" />
        )}
        <span>{t("addToCart")}</span>
      </button>
      <button
        type="button"
        onClick={onBuyNow}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        title={isDisabled ? disabledTooltip : undefined}
        className={cn(
          "flex h-12 items-center justify-center gap-2 rounded-lg px-6 text-[13px] font-bold text-on-primary shadow-md transition-all",
          isDisabled
            ? "cursor-not-allowed bg-on-surface/30 text-on-primary/60 hover:bg-on-surface/30"
            : "bg-primary hover:bg-primary-hover"
        )}
      >
        {showBuyNowSpinner ? (
          <Spinner />
        ) : (
          <BagIcon className="h-5 w-5" />
        )}
        <span>{t("buyNow")}</span>
      </button>
    </div>
  );
}

/** Inline spinner thay cho icon khi đang loading. */
function Spinner() {
  return (
    <span
      className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden="true"
    />
  );
}

function CartIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M2.25 3a.75.75 0 0 0-.75.75v.75h1.59l1.36 8.14a2.25 2.25 0 0 0 2.22 1.86h8.67a2.25 2.25 0 0 0 2.22-1.86l1.36-8.14h1.59V3.75a.75.75 0 0 0-.75-.75H2.25Zm6 16.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm9 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function BagIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M7.5 6v.75A3.75 3.75 0 0 0 11.25 10.5h1.5A3.75 3.75 0 0 0 16.5 6.75V6h2.25c.62 0 1.14.46 1.21 1.07l1.27 12.34a1.125 1.125 0 0 1-1.122 1.218H5.872a1.125 1.125 0 0 1-1.122-1.218L6.03 7.07A1.225 1.225 0 0 1 7.241 6H7.5Zm3 0v.75c0 1.243 1.007 2.25 2.25 2.25h1.5A2.25 2.25 0 0 0 16.5 6.75V6h-6Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function BoltIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M14.615 1.598a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.301H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.141Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
