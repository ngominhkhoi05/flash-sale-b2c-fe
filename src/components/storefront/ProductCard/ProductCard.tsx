"use client";

/**
 * ProductCard – Bộ Component Thẻ Sản Phẩm – Modern Clean (Vibe Mart v2.5)
 *
 * 11+ biến thể khớp 100% Stitch screen "Bộ Component Thẻ Sản Phẩm – Biến thể 1".
 * Design system: Ocean Mint (#0284C7 brand + #10B981 seller + #E11D48 sale).
 *
 * Quy tắc (docs/CLAUDE.md §5, §6, §7, §8, §10):
 *  - Mỗi thẻ w-[220px] cố định (mobile 170px, mini 160px), bo góc 16px (rounded-2xl).
 *  - Padding nội dung 14px (p-3.5). Title clamp 2 dòng 40px (line-clamp-2 + h-10).
 *  - Border 1px line/80, shadow soft, hover nâng -translate-y-0.5 + shadow-lg.
 *  - Chỉ light mode (không dark:). Tất cả màu dùng token (brand/sale/seller/ink/line/card).
 *  - Mọi nút bấm phải là <button> hoặc <a>; ảnh có alt tiếng Việt (a11y).
 *  - Server là source of truth cho giá/giảm giá — KHÔNG tự tính % ở client khi backend đã trả.
 */

import { Star, MapPin, ShoppingCart, Bell, Heart, Truck, Tag, Zap, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatVND, formatShortNumber } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { imageUrlWithFallback } from "@/lib/images/with-fallback";
import type {
  ProductCardProps,
  ProductCardBaseProps,
  ProductCardFlashSaleProps,
  ProductCardUpcomingProps,
  ProductCardMobileProps,
  ProductCardMobileHorizontalProps,
  ProductCardMiniProps,
} from "./ProductCard.types";

/* ========================================================================
 *  Internal shared sub-components (Modern Clean primitives)
 * ====================================================================== */

/** Card wrapper: 220px, rounded-2xl, border line/80, soft shadow, hover lift. */
function CardShell({
  children,
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "w-[220px] rounded-2xl overflow-hidden flex flex-col bg-card border border-line/80",
        "shadow-[0_2px_8px_rgba(15,23,42,0.04)]",
        "hover:shadow-[0_8px_20px_rgba(15,23,42,0.08)] hover:-translate-y-0.5",
        "transition-all duration-200",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/** Khung ảnh vuông 1:1 với object-cover + zoom nhẹ khi hover. */
function ProductImage({
  imageUrl,
  imageAlt,
  className,
}: {
  imageUrl: string;
  imageAlt?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative w-full aspect-square overflow-hidden bg-page", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrlWithFallback(imageUrl, "product")}
        alt={imageAlt ?? ""}
        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
      />
    </div>
  );
}

/** Pill badge ở góc trên phải ảnh: badge giảm giá -X%. */
function DiscountPill({ percent }: { percent: number }) {
  return (
    <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[11px] font-bold leading-none bg-sale text-white shadow-sm shadow-sale/30">
      -{percent}%
    </span>
  );
}

/** Pill tag ở góc dưới trái ảnh: "Giảm 10K" (brand) hoặc "Freeship" (seller). */
function CornerTag({
  label,
  tone = "brand",
  icon,
}: {
  label: string;
  tone?: "brand" | "seller";
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "absolute bottom-2.5 left-2.5 flex items-center gap-1 h-[22px] px-2 rounded-full text-[11px] font-semibold text-white shadow-sm",
        tone === "brand" ? "bg-brand shadow-brand/30" : "bg-seller shadow-seller/30",
      )}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}

/** Khung title clamp 2 dòng 40px. */
function ProductTitle({ title }: { title: string }) {
  return (
    <h3
      className="text-[13.5px] font-medium leading-[20px] text-ink-2 line-clamp-2 h-10"
      title={title}
    >
      {title}
    </h3>
  );
}

/** Giá chính + giá gốc gạch ngang (chỉ khi có originalPrice). */
function PriceRow({
  price,
  originalPrice,
  tone = "ink",
}: {
  price: number;
  originalPrice?: number | undefined;
  tone?: "ink" | "sale";
}) {
  return (
    <div className="flex items-baseline gap-1.5 mt-0.5">
      <span
        className={cn(
          "text-[17px] font-bold leading-none tracking-tight tabular-nums",
          tone === "sale" ? "text-sale" : "text-ink",
        )}
      >
        {formatVND(price)}
      </span>
      {originalPrice !== undefined && (
        <span className="text-[12px] font-normal line-through text-ink-3">
          {formatVND(originalPrice)}
        </span>
      )}
    </div>
  );
}

/** Hàng rating ★ + sold count. */
function RatingRow({ rating, soldCount }: { rating?: number; soldCount?: number }) {
  if (rating === undefined && soldCount === undefined) return null;
  return (
    <div className="flex items-center text-[12px] gap-1 text-ink-2">
      {rating !== undefined && <Star className="w-3 h-3 fill-star text-star" />}
      {rating !== undefined && <span className="font-semibold text-ink">{rating}</span>}
      {rating !== undefined && soldCount !== undefined && (
        <span className="text-[10px] text-ink-3">·</span>
      )}
      {soldCount !== undefined && <span>Đã bán {formatShortNumber(soldCount)}</span>}
    </div>
  );
}

/** Hàng location (icon MapPin + tên tỉnh). */
function LocationRow({ location }: { location?: string }) {
  if (!location) return null;
  return (
    <div className="flex items-center text-[11.5px] gap-1 text-ink-3">
      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
      <span className="truncate">{location}</span>
    </div>
  );
}

/* ========================================================================
 *  Body wrapper: p-3.5 + flex-1 + justify-between (rule §4: 4 state)
 * ====================================================================== */
function CardBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-3.5 flex flex-col flex-1 justify-between gap-2.5">{children}</div>
  );
}

/* ========================================================================
 *  Public: từng biến thể (A, B, C1, C2, C3, D, E, F, G, H, Hover, Focus, 3 mobile)
 * ====================================================================== */

export function ProductCardDefault(props: ProductCardBaseProps) {
  const { imageUrl, imageAlt, title, price, rating, soldCount, location, className } = props;
  return (
    <CardShell className={className}>
      <ProductImage imageUrl={imageUrl} imageAlt={imageAlt} />
      <CardBody>
        <div className="flex flex-col gap-1.5">
          <ProductTitle title={title} />
          <PriceRow price={price} />
        </div>
        <div className="flex flex-col gap-1.5 pt-1 border-t border-line/60">
          <RatingRow rating={rating} soldCount={soldCount} />
          <LocationRow location={location} />
        </div>
      </CardBody>
    </CardShell>
  );
}

export function ProductCardDiscount(props: ProductCardBaseProps & { discountPercent: number }) {
  const { imageUrl, imageAlt, title, price, originalPrice, discountPercent, rating, soldCount, location, className } =
    props;
  return (
    <CardShell className={className}>
      <div className="relative w-full aspect-square overflow-hidden bg-page">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrlWithFallback(imageUrl, "product")}
          alt={imageAlt ?? ""}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
        <DiscountPill percent={discountPercent} />
      </div>
      <CardBody>
        <div className="flex flex-col gap-1.5">
          <ProductTitle title={title} />
          <PriceRow price={price} originalPrice={originalPrice} tone="sale" />
        </div>
        <div className="flex flex-col gap-1.5 pt-1 border-t border-line/60">
          <RatingRow rating={rating} soldCount={soldCount} />
          <LocationRow location={location} />
        </div>
      </CardBody>
    </CardShell>
  );
}

export function ProductCardVoucher(props: ProductCardBaseProps & { voucherLabel: string }) {
  const { imageUrl, imageAlt, title, price, voucherLabel, rating, soldCount, location, className } = props;
  return (
    <CardShell className={className}>
      <div className="relative w-full aspect-square overflow-hidden bg-page">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrlWithFallback(imageUrl, "product")}
          alt={imageAlt ?? ""}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
        <CornerTag label={voucherLabel} tone="brand" icon={<Tag className="w-3 h-3" />} />
      </div>
      <CardBody>
        <div className="flex flex-col gap-1.5">
          <ProductTitle title={title} />
          <PriceRow price={price} />
        </div>
        <div className="flex flex-col gap-1.5 pt-1 border-t border-line/60">
          <RatingRow rating={rating} soldCount={soldCount} />
          <LocationRow location={location} />
        </div>
      </CardBody>
    </CardShell>
  );
}

export function ProductCardFreeship(props: ProductCardBaseProps) {
  const { imageUrl, imageAlt, title, price, rating, soldCount, location, className } = props;
  return (
    <CardShell className={className}>
      <div className="relative w-full aspect-square overflow-hidden bg-page">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrlWithFallback(imageUrl, "product")}
          alt={imageAlt ?? ""}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
        <CornerTag label="Freeship" tone="seller" icon={<Truck className="w-3.5 h-3.5" />} />
      </div>
      <CardBody>
        <div className="flex flex-col gap-1.5">
          <ProductTitle title={title} />
          <PriceRow price={price} />
        </div>
        <div className="flex flex-col gap-1.5 pt-1 border-t border-line/60">
          <RatingRow rating={rating} soldCount={soldCount} />
          <LocationRow location={location} />
        </div>
      </CardBody>
    </CardShell>
  );
}

export function ProductCardSaleVoucher(
  props: ProductCardBaseProps & { discountPercent: number; voucherLabel: string },
) {
  const {
    imageUrl,
    imageAlt,
    title,
    price,
    originalPrice,
    discountPercent,
    voucherLabel,
    rating,
    soldCount,
    location,
    className,
  } = props;
  return (
    <CardShell className={className}>
      <div className="relative w-full aspect-square overflow-hidden bg-page">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrlWithFallback(imageUrl, "product")}
          alt={imageAlt ?? ""}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
        <DiscountPill percent={discountPercent} />
        <CornerTag label={voucherLabel} tone="brand" icon={<Tag className="w-3 h-3" />} />
      </div>
      <CardBody>
        <div className="flex flex-col gap-1.5">
          <ProductTitle title={title} />
          <PriceRow price={price} originalPrice={originalPrice} tone="sale" />
        </div>
        <div className="flex flex-col gap-1.5 pt-1 border-t border-line/60">
          <RatingRow rating={rating} soldCount={soldCount} />
          <LocationRow location={location} />
        </div>
      </CardBody>
    </CardShell>
  );
}

/* ---------- Flash Sale variants (D, E, F, G) ---------- */

/** Thanh tiến trình tồn kho. Width theo `soldPercent`. */
function StockBar({
  percent,
  soldCount,
  hot = false,
  soldOut = false,
}: {
  percent: number;
  soldCount: number;
  hot?: boolean;
  soldOut?: boolean;
}) {
  if (soldOut) {
    return (
      <div className="relative w-full h-[18px] rounded-full overflow-hidden flex items-center justify-center bg-line/60">
        <span className="relative z-10 text-[9.5px] font-bold tracking-wider uppercase text-ink-2">
          ĐÃ BÁN HẾT
        </span>
      </div>
    );
  }
  return (
    <div
      className={cn(
        "relative w-full h-[18px] rounded-full overflow-hidden flex items-center justify-center p-0.5",
        hot ? "bg-sale-soft" : "bg-sale-soft/70",
      )}
    >
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 rounded-full",
          hot
            ? "bg-gradient-to-r from-sale via-sale to-warning"
            : "bg-gradient-to-r from-sale to-warning",
        )}
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
      <span className="relative z-10 text-[9.5px] font-extrabold tracking-wider text-white uppercase drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)]">
        {hot ? (
          <span className="flex items-center gap-1">
            <Flame className="w-2.5 h-2.5" /> SẮP CHÁY HÀNG
          </span>
        ) : (
          `ĐÃ BÁN ${soldCount}`
        )}
      </span>
    </div>
  );
}

function BuyButton({
  onClick,
  label = "Mua ngay",
  variant = "primary",
}: {
  onClick?: () => void;
  label?: string;
  variant?: "primary" | "disabled" | "outline";
}) {
  if (variant === "disabled") {
    return (
      <button
        disabled
        className="w-full h-[36px] rounded-xl text-[13px] font-medium flex items-center justify-center cursor-not-allowed bg-line/60 text-ink-2"
      >
        {label}
      </button>
    );
  }
  if (variant === "outline") {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full h-[36px] rounded-xl text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-all bg-card border border-sale/40 text-sale hover:bg-sale-soft/60 shadow-xs"
      >
        <Bell className="w-4 h-4" />
        <span>{label}</span>
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full h-[36px] rounded-xl text-[13px] font-semibold text-white flex items-center justify-center transition-all bg-gradient-to-r from-sale to-warning hover:from-sale-hover hover:to-warning shadow-sm shadow-sale/20 active:scale-[0.98]"
    >
      {label}
    </button>
  );
}

function FlashSaleHeader({ discountPercent }: { discountPercent: number | undefined }) {
  return (
    <>
      <div className="absolute top-2.5 left-2.5 flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold text-white bg-gradient-to-r from-sale to-warning shadow-sm shadow-sale/30">
        <Zap className="w-2.5 h-2.5" /> FLASH SALE
      </div>
      <DiscountPill percent={discountPercent ?? 0} />
    </>
  );
}

export function ProductCardFlashSale(props: ProductCardFlashSaleProps) {
  const {
    imageUrl,
    imageAlt,
    title,
    price,
    originalPrice,
    discountPercent,
    soldPercent,
    stockLeft,
    purchaseLimit,
    soldCount,
    onBuy,
  } = props;
  return (
    <CardShell>
      <div className="relative w-full aspect-square overflow-hidden bg-page">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrlWithFallback(imageUrl, "product")}
          alt={imageAlt ?? ""}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
        <FlashSaleHeader discountPercent={discountPercent} />
      </div>
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <ProductTitle title={title} />
          <PriceRow price={price} originalPrice={originalPrice} tone="sale" />
        </div>
        <div className="flex flex-col gap-2">
          <StockBar percent={soldPercent} soldCount={soldCount ?? 0} />
          <div className="flex justify-between items-center text-[11px] text-ink-2">
            <span>Giới hạn {purchaseLimit}/khách</span>
            <span className="font-semibold text-sale">Còn {stockLeft}</span>
          </div>
          <BuyButton onClick={onBuy} />
        </div>
      </div>
    </CardShell>
  );
}

export function ProductCardAlmostSoldOut(props: ProductCardFlashSaleProps) {
  const {
    imageUrl,
    imageAlt,
    title,
    price,
    originalPrice,
    discountPercent,
    soldPercent,
    stockLeft,
    purchaseLimit,
    soldCount,
    onBuy,
  } = props;
  return (
    <CardShell>
      <div className="relative w-full aspect-square overflow-hidden bg-page">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrlWithFallback(imageUrl, "product")}
          alt={imageAlt ?? ""}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
        <FlashSaleHeader discountPercent={discountPercent} />
      </div>
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <ProductTitle title={title} />
          <PriceRow price={price} originalPrice={originalPrice} tone="sale" />
        </div>
        <div className="flex flex-col gap-2">
          <StockBar percent={soldPercent} soldCount={soldCount ?? 0} hot />
          <div className="flex justify-between items-center text-[11px] text-ink-2">
            <span>Giới hạn {purchaseLimit}/khách</span>
            <span className="font-bold text-sale">Chỉ còn {stockLeft} suất</span>
          </div>
          <BuyButton onClick={onBuy} />
        </div>
      </div>
    </CardShell>
  );
}

export function ProductCardSoldOut(
  props: ProductCardBaseProps & { discountPercent: number; purchaseLimit: number },
) {
  const { imageUrl, imageAlt, title, price, originalPrice, purchaseLimit, className } = props;
  return (
    <div
      className={cn(
        "w-[220px] rounded-2xl overflow-hidden flex flex-col bg-card border border-line/80",
        "shadow-[0_2px_8px_rgba(15,23,42,0.03)] opacity-85",
        className,
      )}
    >
      <div className="relative w-full aspect-square overflow-hidden bg-page">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrlWithFallback(imageUrl, "product")}
          alt={imageAlt ?? ""}
          className="w-full h-full object-cover grayscale-[30%]"
        />
        <div className="absolute inset-0 bg-ink/30 backdrop-blur-[2px] flex items-center justify-center">
          <div className="px-3.5 py-1 rounded-full text-[12px] font-bold tracking-wide text-white bg-ink/85 backdrop-blur-md shadow-md">
            Hết hàng
          </div>
        </div>
      </div>
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <ProductTitle title={title} />
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-[18px] font-bold leading-none text-ink-3">
              {formatVND(price)}
            </span>
            {originalPrice !== undefined && (
              <span className="text-[12px] font-normal line-through text-ink-3/70">
                {formatVND(originalPrice)}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <StockBar percent={100} soldCount={0} soldOut />
          <div className="flex justify-between items-center text-[11px] text-ink-3">
            <span>Giới hạn {purchaseLimit}/khách</span>
            <span>0 còn lại</span>
          </div>
          <BuyButton variant="disabled" label="Đã hết" />
        </div>
      </div>
    </div>
  );
}

export function ProductCardUpcoming(props: ProductCardUpcomingProps) {
  const { imageUrl, imageAlt, title, price, originalPrice, discountPercent, startsAt, onRemind, className } =
    props;
  return (
    <CardShell className={className}>
      <div className="relative w-full aspect-square overflow-hidden bg-page">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrlWithFallback(imageUrl, "product")}
          alt={imageAlt ?? ""}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
        {discountPercent !== undefined && <DiscountPill percent={discountPercent} />}
      </div>
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <ProductTitle title={title} />
          <PriceRow price={price} originalPrice={originalPrice} />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-[12px] py-1 text-ink-2">
            <span className="w-4 h-4 flex-shrink-0 text-brand">🕒</span>
            <span>
              Bắt đầu lúc <strong className="text-ink">{startsAt}</strong>
            </span>
          </div>
          <BuyButton onClick={onRemind} variant="outline" label="Nhắc tôi" />
        </div>
      </div>
    </CardShell>
  );
}

/* ---------- H: Skeleton loading ---------- */

export function ProductCardSkeleton() {
  return (
    <div
      className="w-[220px] rounded-2xl overflow-hidden flex flex-col bg-card border border-line/80 shadow-[0_2px_8px_rgba(15,23,42,0.03)]"
      aria-hidden
    >
      <Skeleton className="w-full aspect-square rounded-none" />
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Skeleton className="w-full h-3.5" />
          <Skeleton className="w-3/4 h-3.5" />
          <Skeleton className="w-1/2 h-4 mt-1" />
        </div>
        <div className="flex flex-col gap-2 pt-1 border-t border-line/60">
          <Skeleton className="w-2/3 h-3" />
          <Skeleton className="w-1/2 h-3" />
        </div>
      </div>
    </div>
  );
}

/* ---------- Interactive: Hover, Focus ---------- */

export function ProductCardHover(props: ProductCardBaseProps) {
  const { imageUrl, imageAlt, title, price, rating, soldCount, location, onAddToCart, onToggleWishlist } =
    props;
  return (
    <div
      className={cn(
        "w-[220px] rounded-2xl overflow-hidden flex flex-col relative transition-all duration-200 -translate-y-1",
        "bg-card border border-brand/30 shadow-[0_12px_24px_-4px_rgba(2,132,199,0.18)]",
      )}
    >
      <div className="relative w-full aspect-square overflow-hidden bg-page">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrlWithFallback(imageUrl, "product")}
          alt={imageAlt ?? ""}
          className="w-full h-full object-cover scale-105 transition-transform duration-300"
        />
        <button
          aria-label="Thêm vào yêu thích"
          onClick={onToggleWishlist}
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-md text-sale hover:scale-110 transition-transform border border-white"
        >
          <Heart className="w-4 h-4 fill-sale text-sale" />
        </button>
        <button
          onClick={onAddToCart}
          className="absolute bottom-0 left-0 right-0 h-[32px] flex items-center justify-center gap-1.5 text-white text-[12px] font-semibold cursor-pointer shadow-md bg-gradient-to-r from-brand to-[#0EA5E9] backdrop-blur-md"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Thêm vào giỏ</span>
        </button>
      </div>
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-2.5">
        <div className="flex flex-col gap-1.5">
          <h3
            className="text-[13.5px] font-medium leading-[20px] text-brand line-clamp-2 h-10"
            title={title}
          >
            {title}
          </h3>
          <PriceRow price={price} />
        </div>
        <div className="flex flex-col gap-1.5 pt-1 border-t border-line/60">
          <RatingRow rating={rating} soldCount={soldCount} />
          <LocationRow location={location} />
        </div>
      </div>
    </div>
  );
}

export function ProductCardFocus(props: ProductCardBaseProps) {
  const { imageUrl, imageAlt, title, price, rating, soldCount, location } = props;
  return (
    <div
      tabIndex={0}
      className="w-[220px] rounded-2xl overflow-hidden flex flex-col outline-none cursor-pointer bg-card border-2 border-brand shadow-[0_0_0_4px_rgba(2,132,199,0.18)]"
    >
      <div className="relative w-full aspect-square overflow-hidden bg-page">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrlWithFallback(imageUrl, "product")} alt={imageAlt ?? ""} className="w-full h-full object-cover" />
        <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white bg-brand shadow-sm">
          Focused (Tab)
        </span>
      </div>
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-2.5">
        <div className="flex flex-col gap-1.5">
          <ProductTitle title={title} />
          <PriceRow price={price} />
        </div>
        <div className="flex flex-col gap-1.5 pt-1 border-t border-line/60">
          <RatingRow rating={rating} soldCount={soldCount} />
          <LocationRow location={location} />
        </div>
      </div>
    </div>
  );
}

/* ---------- Mobile adaptations ---------- */

export function ProductCardMobile({
  imageUrl,
  imageAlt,
  title,
  price,
  rating,
  soldCount,
  voucherLabel,
  className,
}: ProductCardMobileProps) {
  return (
    <div
      className={cn(
        "w-[170px] rounded-2xl overflow-hidden flex flex-col bg-card border border-line/80",
        "shadow-[0_2px_8px_rgba(15,23,42,0.04)]",
        "hover:shadow-[0_6px_16px_rgba(15,23,42,0.08)] transition-all",
        className,
      )}
    >
      <div className="relative w-full aspect-square overflow-hidden bg-page">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrlWithFallback(imageUrl, "product")} alt={imageAlt ?? ""} className="w-full h-full object-cover" />
        {voucherLabel && (
          <div className="absolute bottom-2 left-2 flex items-center gap-0.5 h-[19px] px-2 rounded-full text-[10px] font-semibold text-white bg-brand shadow-sm">
            <span>{voucherLabel}</span>
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col gap-1.5">
        <h4
          className="text-[13px] font-medium leading-[18px] text-ink-2 line-clamp-2 h-9"
          title={title}
        >
          {title}
        </h4>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className="text-[15.5px] font-bold leading-none text-ink">
            {formatVND(price)}
          </span>
        </div>
        {(rating !== undefined || soldCount !== undefined) && (
          <div className="flex items-center text-[11px] gap-1 pt-1 border-t border-line/60 text-ink-2">
            {rating !== undefined && <Star className="w-3 h-3 fill-star text-star" />}
            {rating !== undefined && (
              <span className="font-semibold text-ink">{rating}</span>
            )}
            {soldCount !== undefined && <span>({formatShortNumber(soldCount)})</span>}
          </div>
        )}
      </div>
    </div>
  );
}

export function ProductCardMobileHorizontal({
  imageUrl,
  imageAlt,
  title,
  price,
  originalPrice,
  soldPercent,
  onBuy,
  className,
}: ProductCardMobileHorizontalProps) {
  return (
    <div
      className={cn(
        "w-full max-w-[340px] rounded-2xl overflow-hidden p-2.5 flex gap-3 bg-card border border-line/80",
        "shadow-[0_2px_8px_rgba(15,23,42,0.04)]",
        className,
      )}
    >
      <div className="relative w-[100px] h-[100px] flex-shrink-0 rounded-xl overflow-hidden bg-page">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrlWithFallback(imageUrl, "product")} alt={imageAlt ?? ""} className="w-full h-full object-cover" />
        {originalPrice !== undefined && price < originalPrice && (
          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full text-[9.5px] font-bold text-white bg-sale shadow-sm">
            -
            {Math.round(((originalPrice - price) / originalPrice) * 100)}
            %
          </span>
        )}
      </div>
      <div className="flex flex-col flex-1 justify-between py-0.5">
        <div className="flex flex-col gap-1">
          <h4
            className="text-[13px] font-medium leading-[18px] text-ink-2 line-clamp-1"
            title={title}
          >
            {title}
          </h4>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[16px] font-bold leading-none text-sale">
              {formatVND(price)}
            </span>
            {originalPrice !== undefined && (
              <span className="text-[11px] line-through text-ink-3">
                {formatVND(originalPrice)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between gap-2.5 mt-1.5">
          <div className="flex flex-col flex-1 gap-1">
            <div className="w-full h-[8px] rounded-full overflow-hidden bg-sale-soft">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sale to-warning"
                style={{ width: `${Math.min(100, Math.max(0, soldPercent))}%` }}
              />
            </div>
            <span className="text-[10px] font-medium text-ink-2">
              Đã bán {Math.round(soldPercent)}%
            </span>
          </div>
          <button
            onClick={onBuy}
            className="h-[28px] px-3 rounded-full text-[11px] font-semibold text-white flex-shrink-0 bg-gradient-to-r from-sale to-warning shadow-sm shadow-sale/20"
          >
            Mua ngay
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProductCardMini({
  imageUrl,
  imageAlt,
  title,
  price,
  className,
}: ProductCardMiniProps) {
  return (
    <div
      className={cn(
        "w-[160px] rounded-2xl overflow-hidden flex flex-col bg-card border border-line/80",
        "shadow-[0_2px_8px_rgba(15,23,42,0.04)]",
        "hover:shadow-[0_6px_16px_rgba(15,23,42,0.08)] transition-all",
        className,
      )}
    >
      <div className="relative w-[160px] h-[160px] overflow-hidden bg-page">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrlWithFallback(imageUrl, "product")} alt={imageAlt ?? ""} className="w-full h-full object-cover" />
      </div>
      <div className="p-3 flex flex-col gap-1">
        <h4 className="text-[13px] font-medium truncate text-ink-2" title={title}>
          {title}
        </h4>
        <span className="text-[15px] font-bold leading-none text-ink">{formatVND(price)}</span>
      </div>
    </div>
  );
}

/* ========================================================================
 *  Root dispatcher: <ProductCard variant="..." />
 * ====================================================================== */

export function ProductCard(props: ProductCardProps) {
  const { variant, ...rest } = props;
  switch (variant) {
    case "default":
      return <ProductCardDefault {...(rest as ProductCardBaseProps)} />;
    case "discount":
      return (
        <ProductCardDiscount
          {...(rest as ProductCardBaseProps & { discountPercent: number })}
        />
      );
    case "voucher":
      return (
        <ProductCardVoucher
          {...(rest as ProductCardBaseProps & { voucherLabel: string })}
        />
      );
    case "freeship":
      return <ProductCardFreeship {...(rest as ProductCardBaseProps)} />;
    case "saleVoucher":
      return (
        <ProductCardSaleVoucher
          {...(rest as ProductCardBaseProps & {
            discountPercent: number;
            voucherLabel: string;
          })}
        />
      );
    case "flashSale":
      return <ProductCardFlashSale {...(rest as ProductCardFlashSaleProps)} />;
    case "almostSoldOut":
      return <ProductCardAlmostSoldOut {...(rest as ProductCardFlashSaleProps)} />;
    case "soldOut":
      return (
        <ProductCardSoldOut
          {...(rest as ProductCardBaseProps & { discountPercent: number; purchaseLimit: number })}
        />
      );
    case "upcoming":
      return <ProductCardUpcoming {...(rest as ProductCardUpcomingProps)} />;
    case "skeleton":
      return <ProductCardSkeleton />;
    case "hover":
      return <ProductCardHover {...(rest as ProductCardBaseProps)} />;
    case "focus":
      return <ProductCardFocus {...(rest as ProductCardBaseProps)} />;
    case "mobile":
      return (
        <ProductCardMobile
          {...(rest as Omit<ProductCardMobileProps, "className">)}
          className={rest.className}
        />
      );
    case "mobileHorizontal":
      return (
        <ProductCardMobileHorizontal
          {...(rest as Omit<ProductCardMobileHorizontalProps, "className">)}
          className={rest.className}
        />
      );
    case "mini":
      return (
        <ProductCardMini
          {...(rest as Omit<ProductCardMiniProps, "className">)}
          className={rest.className}
        />
      );
    default: {
      // Exhaustiveness check
      const _exhaustive: never = variant;
      return _exhaustive;
    }
  }
}
