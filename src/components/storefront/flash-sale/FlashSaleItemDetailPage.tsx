"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Zap,
  Flame,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle2,
  Lock,
  Store as StoreIcon,
  ChevronRight,
  Minus,
  Plus,
  Info,
  Star,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { formatVND } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  reserveFlashSale,
  isFlashSaleReserveError,
  FLASH_SALE_ERROR_MESSAGES,
  type PublicFlashSaleItemDetailResponse,
} from "@/features/flash-sale";

export interface FlashSaleItemDetailPageProps {
  item: PublicFlashSaleItemDetailResponse;
}

export function FlashSaleItemDetailPage({ item }: FlashSaleItemDetailPageProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [selectedImage, setSelectedImage] = useState<string>(
    item.primaryImageUrl || item.imageUrls[0] || "/placeholder.png"
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isReserving, setIsReserving] = useState<boolean>(false);

  // Maximum quantity allowed to buy in flash sale
  const maxAllowedQuantity = Math.max(
    1,
    Math.min(item.availableStock, item.userPurchaseLimit || 1)
  );

  const isSoldOut = item.availableStock <= 0;
  const isUpcoming = item.slotStatus === "UPCOMING";
  const isEnded = item.slotStatus === "ENDED";
  const isActive = item.slotStatus === "ACTIVE" && !isSoldOut;

  // Countdown timer calculation
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    isOver: boolean;
  }>({ hours: 0, minutes: 0, seconds: 0, isOver: false });

  useEffect(() => {
    const targetTimeStr = isUpcoming ? item.slotStartTime : item.slotEndTime;
    const targetDate = new Date(targetTimeStr).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diff = targetDate - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isOver: true });
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds, isOver: false });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [item.slotEndTime, item.slotStartTime, isUpcoming]);

  // Flash Sale direct reservation flow (trừ stock flash sale, không đụng stock gốc)
  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      toast.info("Vui lòng đăng nhập để mua sản phẩm Flash Sale");
      router.push(`/auth/login?redirect=/flash-sale/${item.id}`);
      return;
    }

    try {
      setIsReserving(true);
      const idempotencyKey =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `fs-order-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      const res = await reserveFlashSale(
        {
          flashSaleItemId: item.id,
          quantity,
        },
        idempotencyKey
      );

      toast.success(res.message || "Đặt giữ chỗ Flash Sale thành công! Đang chuyển đến thanh toán...");
      router.push(`/checkout/qr?orderCode=${encodeURIComponent(res.orderCode)}`);
    } catch (err: any) {
      if (isFlashSaleReserveError(err)) {
        toast.error(FLASH_SALE_ERROR_MESSAGES[err.code] || err.message);
      } else {
        toast.error(err?.message || "Không thể đặt giữ chỗ Flash Sale. Vui lòng thử lại!");
      }
    } finally {
      setIsReserving(false);
    }
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      toast.success("Đã sao chép liên kết sản phẩm Flash Sale!");
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // Stock calculations
  const totalStock = Math.max(item.allocatedStock, 1);
  const soldCount = Math.max(0, item.allocatedStock - item.availableStock);
  const soldPercent = Math.min(100, Math.round((soldCount / totalStock) * 100));

  const savingsAmount = Math.max(0, item.originalPrice - item.flashSalePrice);

  return (
    <div className="min-h-screen bg-surface pb-16">
      {/* Breadcrumb Bar */}
      <div className="border-b border-outline-variant/50 bg-surface-container-lowest/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center gap-1.5 px-4 py-3 text-body-sm text-on-surface-variant">
          <Link href="/" className="hover:text-primary transition-colors">
            Trang chủ
          </Link>
          <ChevronRight className="h-4 w-4 text-outline" />
          <Link href="/flash-sale" className="hover:text-primary transition-colors">
            Flash Sale
          </Link>
          <ChevronRight className="h-4 w-4 text-outline" />
          {item.categoryName && (
            <>
              <span className="truncate max-w-[150px]">{item.categoryName}</span>
              <ChevronRight className="h-4 w-4 text-outline" />
            </>
          )}
          <span className="truncate max-w-[200px] font-medium text-on-surface">
            {item.productName}
          </span>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-4 md:pt-6">
        {/* FLASH SALE HERO TOP BANNER */}
        <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 p-0.5 shadow-lg shadow-orange-500/10">
          <div className="flex flex-col items-center justify-between gap-4 rounded-[14px] bg-gradient-to-r from-red-600/95 via-orange-600/95 to-amber-600/95 px-5 py-3.5 text-white sm:flex-row sm:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md shadow-inner">
                <Zap className="h-6 w-6 text-yellow-300 animate-pulse fill-yellow-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-yellow-300 px-2 py-0.5 text-xs font-black uppercase tracking-wider text-red-700 shadow-sm">
                    FLASH SALE
                  </span>
                  <span className="font-bold tracking-tight text-white/90">
                    {item.slotTitle || "Phiên Giá Sốc Đặc Quyền"}
                  </span>
                </div>
                <p className="text-xs text-white/80">
                  {isUpcoming
                    ? "Phiên ưu đãi sắp mở bán"
                    : isEnded
                    ? "Phiên ưu đãi đã kết thúc"
                    : "Giá cực sốc áp dụng cố định cho phân loại bên dưới"}
                </p>
              </div>
            </div>

            {/* Countdown Box */}
            <div className="flex items-center gap-2 rounded-xl bg-black/25 px-4 py-2 backdrop-blur-md border border-white/10">
              <span className="text-xs font-semibold uppercase tracking-wider text-yellow-300">
                {isUpcoming ? "Mở bán sau" : "Kết thúc sau"}
              </span>
              <div className="flex items-center gap-1 font-mono text-sm font-black text-white">
                <span className="rounded bg-black/40 px-2 py-1 min-w-[28px] text-center">
                  {String(timeLeft.hours).padStart(2, "0")}
                </span>
                <span>:</span>
                <span className="rounded bg-black/40 px-2 py-1 min-w-[28px] text-center">
                  {String(timeLeft.minutes).padStart(2, "0")}
                </span>
                <span>:</span>
                <span className="rounded bg-black/40 px-2 py-1 min-w-[28px] text-center">
                  {String(timeLeft.seconds).padStart(2, "0")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN PRODUCT LAYOUT: 2 Columns */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* LEFT COLUMN: Gallery & Images (5 cols) */}
          <div className="lg:col-span-5">
            <div className="sticky top-20 space-y-4">
              {/* Main Image Frame */}
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-container-lowest shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedImage}
                  alt={item.productName}
                  className="h-full w-full object-cover transition-all duration-300 hover:scale-105"
                />

                {/* Top Badges */}
                <div className="absolute left-3 top-3 flex flex-col gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-tertiary px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-on-tertiary shadow-md">
                    <Zap className="h-3.5 w-3.5 fill-current" />
                    FLASH SALE
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1 text-xs font-bold text-white shadow-md">
                    -{item.discountPercent}%
                  </span>
                </div>

                {isSoldOut && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px]">
                    <span className="rounded-xl bg-surface-container-highest px-6 py-2.5 text-base font-black tracking-widest text-on-surface uppercase shadow-2xl">
                      ĐÃ HẾT HÀNG
                    </span>
                    <span className="mt-2 text-xs text-white/80">
                      Đã bán hết toàn bộ suất ưu đãi của phiên
                    </span>
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {item.imageUrls && item.imageUrls.length > 1 && (
                <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
                  {item.imageUrls.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImage(img)}
                      className={cn(
                        "relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all",
                        selectedImage === img
                          ? "border-primary shadow-sm ring-2 ring-primary/20 scale-105"
                          : "border-outline-variant/60 opacity-70 hover:opacity-100"
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img}
                        alt={`${item.productName} thumbnail ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Share & Guarantees */}
              <div className="flex items-center justify-between rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-3 text-body-sm text-on-surface-variant">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-outline">Mã Flash Sale:</span>
                  <span className="font-mono text-xs font-bold text-on-surface">
                    FS-{item.id}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  {isCopied ? "Đã sao chép!" : "Chia sẻ ưu đãi"}
                </button>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-2 rounded-xl border border-outline-variant/50 bg-surface-container-low p-3 text-center">
                <div className="flex flex-col items-center gap-1">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  <span className="text-[11px] font-medium text-on-surface">
                    Chính hãng 100%
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1 border-x border-outline-variant/50 px-1">
                  <RotateCcw className="h-5 w-5 text-blue-600" />
                  <span className="text-[11px] font-medium text-on-surface">
                    Đổi trả 7 ngày
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Truck className="h-5 w-5 text-orange-600" />
                  <span className="text-[11px] font-medium text-on-surface">
                    Giao hỏa tốc
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Info, FIXED VARIANT, Pricing, Stock & CTA (7 cols) */}
          <div className="space-y-6 lg:col-span-7">
            {/* Title & SPU Info */}
            <div className="space-y-2">
              {item.categoryName && (
                <span className="inline-block rounded-md bg-secondary-container px-2.5 py-0.5 text-xs font-semibold text-on-secondary-container">
                  {item.categoryName}
                </span>
              )}
              <h1 className="text-2xl font-bold tracking-tight text-on-surface sm:text-3xl">
                {item.productName}
              </h1>

              {/* Rating and Sold */}
              <div className="flex flex-wrap items-center gap-4 text-body-sm text-on-surface-variant">
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-on-surface">
                    {item.ratingAvg?.toFixed(1) || "5.0"}
                  </span>
                  <span className="text-xs text-outline">
                    ({item.ratingCount || 0} đánh giá)
                  </span>
                </div>
                <span className="text-outline">•</span>
                <div>
                  <span className="font-semibold text-on-surface">
                    {item.totalSold || 0}
                  </span>{" "}
                  đã bán toàn hệ thống
                </div>
              </div>
            </div>

            {/* PRICING BOX */}
            <div className="rounded-2xl border border-red-200/80 bg-gradient-to-br from-red-50/60 via-orange-50/40 to-transparent p-5 dark:border-red-900/40 dark:from-red-950/20">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-3xl font-extrabold tracking-tight text-red-600 sm:text-4xl dark:text-red-500">
                  {formatVND(item.flashSalePrice)}
                </span>
                <span className="text-lg text-outline line-through sm:text-xl">
                  {formatVND(item.originalPrice)}
                </span>
                <span className="rounded-full bg-red-600 px-3 py-0.5 text-xs font-black uppercase text-white shadow-sm">
                  TIẾT KIỆM {item.discountPercent}%
                </span>
              </div>
              {savingsAmount > 0 && (
                <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">
                  Bạn tiết kiệm được {formatVND(savingsAmount)} so với giá gốc khi mua trong khung giờ Flash Sale này!
                </p>
              )}

              {/* REAL-TIME FLASH SALE STOCK BAR */}
              <div className="mt-5 space-y-2 border-t border-red-200/60 pt-4 dark:border-red-900/30">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="flex items-center gap-1 text-red-700 dark:text-red-400 font-bold">
                    <Flame className="h-4 w-4 fill-red-500 text-red-500 animate-bounce" />
                    {isSoldOut
                      ? "ĐÃ BÁN HẾT"
                      : `Còn lại ${item.availableStock} / ${item.allocatedStock} suất trong phiên`}
                  </span>
                  <span className="text-outline">Đã bán {soldPercent}%</span>
                </div>

                {/* Progress bar */}
                <div className="h-3 w-full overflow-hidden rounded-full bg-red-100 dark:bg-red-950/60 p-0.5 shadow-inner">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      isSoldOut
                        ? "bg-outline"
                        : "bg-gradient-to-r from-orange-500 to-red-600"
                    )}
                    style={{ width: `${Math.max(5, soldPercent)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-outline">
                  <span>
                    Giới hạn mua: <strong>{item.userPurchaseLimit}</strong> sản phẩm / khách
                  </span>
                  <span>Tồn kho thời gian thực từ hệ thống</span>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* FIXED VARIANT SECTION (QUAN TRỌNG: CỐ ĐỊNH, KHÔNG CÓ BỘ CHỌN ĐỔI PHÂN LOẠI) */}
            {/* ========================================================================= */}
            <div className="rounded-2xl border-2 border-primary/30 bg-surface-container-lowest p-5 shadow-sm transition-all hover:border-primary/50">
              <div className="flex items-center justify-between border-b border-outline-variant/50 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Lock className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-on-surface">
                      Phân loại áp dụng ưu đãi Flash Sale
                    </h3>
                    <p className="text-[11px] text-on-surface-variant">
                      Biến thể SKU đăng ký cố định trong phiên sale
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Cố định theo phiên
                </span>
              </div>

              {/* Variant Details Display */}
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-surface-container-low p-3.5 border border-outline-variant/60">
                  <div className="space-y-0.5">
                    <div className="text-xs text-outline">Tên phân loại SKU:</div>
                    <div className="text-base font-bold text-on-surface">
                      {item.variantName || "Phân loại tiêu chuẩn"}
                    </div>
                  </div>
                  <div className="text-right space-y-0.5">
                    <div className="text-xs text-outline">Mã SKU:</div>
                    <div className="font-mono text-xs font-semibold text-primary">
                      {item.sku}
                    </div>
                  </div>
                </div>

                {/* Attributes breakdown tags (nếu có attributes map) */}
                {item.attributes && Object.keys(item.attributes).length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-xs font-semibold text-on-surface-variant">
                      Chi tiết thông số phân loại:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(item.attributes).map(([key, val]) => (
                        <div
                          key={key}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-on-surface shadow-2xs"
                        >
                          <span className="font-semibold text-primary">{key}:</span>
                          <span className="font-bold">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notice: KHÔNG ĐƯỢC ĐỔI PHÂN LOẠI */}
                <div className="flex items-start gap-2 rounded-xl bg-amber-500/10 p-3 text-amber-800 dark:text-amber-300 border border-amber-500/20 text-xs">
                  <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                  <span>
                    Ưu đãi Flash Sale giá sốc được áp dụng riêng cho phân loại{" "}
                    <strong>{item.variantName}</strong>. Trang này không hỗ trợ đổi sang phân loại hoặc kích cỡ khác trong suốt phiên bán.
                  </span>
                </div>
              </div>
            </div>

            {/* QUANTITY STEPPER */}
            <div className="flex items-center gap-6 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-4">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-on-surface-variant">
                  Số lượng mua:
                </span>
                <p className="text-[11px] text-outline">
                  Tối đa {maxAllowedQuantity} sản phẩm
                </p>
              </div>

              <div className="flex items-center rounded-lg border border-outline-variant bg-surface">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1 || isSoldOut || !isActive}
                  className="flex h-9 w-9 items-center justify-center text-on-surface hover:bg-surface-container transition-colors disabled:opacity-40"
                  aria-label="Giảm số lượng"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center font-mono text-sm font-bold text-on-surface">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(maxAllowedQuantity, q + 1))}
                  disabled={quantity >= maxAllowedQuantity || isSoldOut || !isActive}
                  className="flex h-9 w-9 items-center justify-center text-on-surface hover:bg-surface-container transition-colors disabled:opacity-40"
                  aria-label="Tăng số lượng"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="text-xs text-outline">
                Tổng tiền:{" "}
                <strong className="text-sm font-bold text-red-600 dark:text-red-400">
                  {formatVND(item.flashSalePrice * quantity)}
                </strong>
              </div>
            </div>

            {/* CTA BUTTON - CHỈ CÓ NÚT MUA NGAY DUY NHẤT */}
            <div className="flex w-full">
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={isSoldOut || !isActive || isReserving}
                className={cn(
                  "flex h-12 w-full items-center justify-center gap-2.5 rounded-xl px-8 text-sm sm:text-base font-black uppercase tracking-wider text-white shadow-xl transition-all",
                  isSoldOut
                    ? "cursor-not-allowed bg-outline"
                    : !isActive
                    ? "cursor-not-allowed bg-surface-container-highest text-outline"
                    : "bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 hover:from-red-700 hover:via-orange-700 hover:to-amber-700 hover:shadow-orange-500/30 hover:scale-[1.01] active:scale-[0.99]"
                )}
              >
                <Zap className="h-5 w-5 fill-current text-yellow-300" />
                {isSoldOut
                  ? "ĐÃ HẾT HÀNG TRONG PHIÊN"
                  : isUpcoming
                  ? "CHƯA ĐẾN GIỜ MỞ BÁN"
                  : isEnded
                  ? "PHIÊN SALE ĐÃ KẾT THÚC"
                  : isReserving
                  ? "ĐANG XỬ LÝ..."
                  : "MUA NGAY VỚI GIÁ FLASH SALE"}
              </button>
            </div>

            {/* STORE PROFILE CARD */}
            <div className="flex items-center justify-between rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-full border border-outline-variant bg-surface-container">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.storeLogoUrl || "https://picsum.photos/seed/store-default/120/120"}
                    alt={item.storeName}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-on-surface">{item.storeName}</span>
                    {item.storeTier === "OFFICIAL_MALL" && (
                      <span className="rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-black uppercase text-white">
                        MALL
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-on-surface-variant">
                    Gian hàng uy tín cung cấp sản phẩm trong phiên
                  </p>
                </div>
              </div>

              <Link
                href={`/search?storeId=${item.storeId}`}
                className="inline-flex items-center gap-1 rounded-xl border border-outline-variant px-3 py-1.5 text-xs font-semibold text-on-surface hover:border-primary hover:text-primary transition-colors"
              >
                <StoreIcon className="h-3.5 w-3.5" />
                Xem Shop
              </Link>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: Product Description & Full Details */}
        <div className="mt-12 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-6 shadow-sm">
          <h2 className="text-lg font-bold text-on-surface border-b border-outline-variant/60 pb-3">
            Mô tả chi tiết sản phẩm
          </h2>
          <div className="prose prose-sm max-w-none pt-4 text-on-surface-variant leading-relaxed">
            {item.productDescription ? (
              <p className="whitespace-pre-line">{item.productDescription}</p>
            ) : (
              <p>
                Sản phẩm {item.productName} chính hãng phiên bản phân loại{" "}
                <strong>{item.variantName}</strong>. Ưu đãi độc quyền chỉ có trong phiên Flash Sale này.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
