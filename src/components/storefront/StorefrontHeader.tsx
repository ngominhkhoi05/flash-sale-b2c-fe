"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { cn } from "@/lib/utils";
import { ROUTES, MAINTENANCE_FEATURE_CODES } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import { useCartCount } from "@/features/cart";
import { MaterialSymbol } from "@/components/ui/material-symbol";

export type StorefrontNavKey =
  | "home"
  | "flash-sale"
  | "category"
  | "voucher"
  | null;

export interface StorefrontHeaderProps {
  activeNav?: StorefrontNavKey;
  variant?: "default" | "compact";
  className?: string;
}

/**
 * StorefrontHeader – thiết kế Stitch "Trang chủ Storefront".
 *
 * Cấu trúc 2 tầng:
 * 1. Top bar (nhỏ, biến mất khi scroll — dùng `hidden sm:block` để ẩn mobile)
 * 2. Header chính sticky (logo + search + cart + user avatar)
 * 3. Nav pills (dưới header, 1 hàng scroll ngang)
 *
 * Nav pills nằm ở `main` content, không phải trong `<header>` — theo Stitch layout.
 * Component này chỉ render phần `header` sticky.
 */
export function StorefrontHeader({
  activeNav,
  variant = "default",
  className,
}: StorefrontHeaderProps) {
  const pathname = usePathname() ?? "";
  const t = useTranslations("storefront.header");
  const { isAuthenticated, user } = useAuth();
  // Cart count chỉ fetch khi đã đăng nhập (tránh 401 spam khi user chưa login)
  const { data: cartCount = 0 } = useCartCount(isAuthenticated);

  const detected: StorefrontNavKey = (() => {
    if (pathname.startsWith(ROUTES.FLASH_SALE)) return "flash-sale";
    if (pathname.startsWith(ROUTES.VOUCHERS)) return "voucher";
    // Trang /danh-muc chưa có → pill "Danh mục" dẫn về /bao-tri?feature=category.
    // Khi user đang ở /bao-tri với feature=category thì vẫn tô active "Danh mục".
    if (
      pathname.startsWith("/danh-muc") ||
      pathname.includes(`feature=${MAINTENANCE_FEATURE_CODES.CATEGORY}`)
    )
      return "category";
    if (pathname === ROUTES.HOME || pathname === "/") return "home";
    return null;
  })();
  const active = activeNav ?? detected;

  if (variant === "compact") {
    return (
      <header
        className={cn(
          "sticky top-0 z-50 w-full border-b border-outline-variant bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)]",
          className
        )}
      >
        <div className="mx-auto flex h-12 max-w-[1240px] items-center gap-3 px-4">
          <Link href={ROUTES.HOME} className="flex items-center gap-2 shrink-0">
            <Image
              alt="Vibe Mart"
              src="/images/vibe-mart-logo-lockup-light.png"
              width={128}
              height={36}
              priority
              className="h-9 w-auto object-contain"
            />
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <Link
              href={ROUTES.MAINTENANCE(MAINTENANCE_FEATURE_CODES.SEARCH_SUBMIT)}
              aria-label={t("searchPlaceholder")}
              className="p-2 text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-container-low flex items-center justify-center"
            >
              <MaterialSymbol name="search" size="2xl" />
            </Link>
            <Link
              href={ROUTES.CART}
              aria-label={t("nav.cart")}
              className="relative p-2 text-on-surface-variant hover:text-primary transition-colors"
            >
              <MaterialSymbol name="shopping_cart" size="2xl" />
              {cartCount > 0 && (
                <span
                  data-testid="cart-count-badge"
                  className="absolute -top-0.5 -right-0.5 bg-tertiary text-on-tertiary text-label-sm w-4 h-4 rounded-full flex items-center justify-center font-bold"
                >
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full",
        className
      )}
    >
      {/* ── Top Bar ──────────────────────────────────────────────── */}
      {/*
        Stitch `33db6dd8` "Trang chủ Storefront - Vibe Mart":
        - outer: bg-surface-container-low, text-[11px] (size 11), py-1.5
        - inner: font-label-md (chỉ set weight=600, KHÔNG set size)
        - icons: 14px (download/headset_mic/language) + 12px (expand_more)
        - border-b border-surface-container
        Bug trước: inner có `text-label-md` (size 12px) ghi đè outer `text-[11px]`
        → text topbar hiển thị 12px, lệch so với design. Fix: bỏ `text-label-md`
        ở inner, dùng `font-label-md` (chỉ weight, theo Stitch).
      */}
      <div className="hidden sm:block border-b border-surface-container bg-surface-container-low text-[11px] text-on-surface-variant py-1.5">
        <div className="max-w-[1240px] mx-auto px-4 lg:px-5 flex items-center justify-between font-label-md">
          {/* Left links */}
          <div className="flex items-center gap-3">
            <Link href="/seller" className="hover:text-primary transition-colors">
              {t("sellerChannel")}
            </Link>
            <span className="text-outline-variant">|</span>
            <Link
              href={ROUTES.MAINTENANCE(MAINTENANCE_FEATURE_CODES.SELLER_REGISTER)}
              className="hover:text-primary transition-colors"
            >
              {t("becomeSeller")}
            </Link>
            <span className="text-outline-variant">|</span>
            <Link
              href={ROUTES.MAINTENANCE(MAINTENANCE_FEATURE_CODES.DOWNLOAD_APP)}
              className="hover:text-primary transition-colors flex items-center gap-1"
            >
              <MaterialSymbol name="download" size="[14px]" />
              {t("downloadApp")}
            </Link>
            <span className="text-outline-variant">|</span>
            <span className="flex items-center gap-1.5">
              <span>{t("connectLabel")}</span>
              <Link
                href={ROUTES.MAINTENANCE(MAINTENANCE_FEATURE_CODES.SOCIAL_FACEBOOK)}
                className="hover:text-primary font-bold"
              >
                Facebook
              </Link>
              <Link
                href={ROUTES.MAINTENANCE(MAINTENANCE_FEATURE_CODES.SOCIAL_ZALO)}
                className="hover:text-primary font-bold"
              >
                Zalo
              </Link>
            </span>
          </div>
          {/* Right links */}
          <div className="flex items-center gap-3">
            <Link
              href="tel:19008888"
              className="hover:text-primary flex items-center gap-1 transition-colors"
            >
              <MaterialSymbol name="headset_mic" size="[14px]" />
              {t("supportPhone")}
            </Link>
            <span className="text-outline-variant">|</span>
            <Link
              href={ROUTES.MAINTENANCE(MAINTENANCE_FEATURE_CODES.LANGUAGE_SWITCH)}
              className="flex items-center gap-1 cursor-pointer hover:text-primary text-on-surface-variant"
            >
              <MaterialSymbol name="language" size="[14px]" />
              <span>{t("language")}</span>
              <MaterialSymbol name="expand_more" size="[12px]" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Main Header ─────────────────────────────────────────── */}
      <div className="border-b border-outline-variant bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="max-w-[1240px] mx-auto px-4 lg:px-5 py-2 lg:py-3">
          <div className="flex items-center justify-between gap-3 lg:gap-5">
            {/* Logo */}
            <Link
              href={ROUTES.HOME}
              className="flex items-center gap-2 shrink-0"
              data-path="trang-chu"
            >
              <Image
                alt="Vibe Mart"
                src="/images/vibe-mart-logo-lockup-light.png"
                width={128}
                height={36}
                priority
                className="h-9 w-auto object-contain"
              />
            </Link>

            {/* Search bar */}
            <form
              action={ROUTES.MAINTENANCE(MAINTENANCE_FEATURE_CODES.SEARCH_SUBMIT)}
              className="flex-1 max-w-2xl mx-2 lg:mx-0"
            >
              <div className="relative flex items-center">
                <input
                  className="w-full h-10 pl-4 pr-12 rounded-lg bg-surface-container-low text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary text-body-md"
                  placeholder={t("searchPlaceholder")}
                  type="text"
                  name="q"
                  aria-label={t("searchPlaceholder")}
                />
                <button
                  className="absolute right-1 top-1 h-8 w-10 bg-primary hover:bg-primary-container text-on-primary rounded-lg flex items-center justify-center transition-colors"
                  type="submit"
                  aria-label={t("searchPlaceholder")}
                >
                  <MaterialSymbol name="search" size="base" />
                </button>
              </div>
            </form>

            {/* Right icons + user */}
            <div className="flex items-center gap-3 lg:gap-4 shrink-0">
              {/* Notifications */}
              <Link
                href={ROUTES.MAINTENANCE(MAINTENANCE_FEATURE_CODES.NOTIFICATIONS)}
                className="relative p-2 text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-container-low flex items-center justify-center"
                aria-label="Thông báo"
              >
                <MaterialSymbol name="notifications" size="2xl" />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-tertiary rounded-full ring-2 ring-surface-container-lowest" />
              </Link>

              {/* Cart */}
              <Link
                href={ROUTES.CART}
                className="relative p-2 text-on-surface-variant hover:text-primary transition-colors"
                aria-label={t("nav.cart")}
              >
                <MaterialSymbol name="shopping_cart" size="2xl" />
                {cartCount > 0 && (
                  <span
                    data-testid="cart-count-badge"
                    className="absolute -top-0.5 -right-0.5 bg-tertiary text-on-tertiary text-label-sm w-4 h-4 rounded-full flex items-center justify-center font-bold"
                  >
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>

              {/* User area: avatar + greeting khi auth, nút "Đăng nhập" khi chưa auth */}
              {isAuthenticated ? (
                <Link
                  href={ROUTES.MAINTENANCE(MAINTENANCE_FEATURE_CODES.ACCOUNT_DROPDOWN)}
                  className="flex items-center gap-2 pl-2 rounded-full hover:bg-surface-container-low transition-colors"
                  aria-label={user?.fullName || t("greeting")}
                >
                  <div className="text-right hidden sm:block">
                    <div className="text-label-lg text-on-surface leading-tight font-semibold">
                      {user?.fullName || t("greeting")}
                    </div>
                  </div>
                  {user?.avatarUrl ? (
                    <Image
                      alt={user.fullName || t("greeting")}
                      src={user.avatarUrl}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-surface-container-high"
                    />
                  ) : (
                    <Image
                      alt="Ảnh đại diện mặc định"
                      src="/images/default-avatar.svg"
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-surface-container-high"
                    />
                  )}
                </Link>
              ) : (
                <Link
                  href={ROUTES.LOGIN}
                  className="ml-2 flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-on-primary transition-colors hover:bg-primary-hover"
                  data-testid="header-login-link"
                >
                  <MaterialSymbol name="person" size="base" />
                  <span className="text-label-lg font-semibold">
                    {t("nav.login")}
                  </span>
                </Link>
              )}
            </div>
          </div>

          {/* ── Nav Pills ────────────────────────────────────────── */}
          <div className="h-11 flex items-center overflow-x-auto border-t border-outline-variant mt-2 pt-1 scrollbar-hide">
            <nav className="flex items-center gap-1 shrink-0">
              {[
                {
                  key: "home" as const,
                  href: ROUTES.HOME,
                  label: t("nav.home"),
                },
                {
                  key: "flash-sale" as const,
                  href: ROUTES.FLASH_SALE,
                  label: t("nav.flashSale"),
                  icon: <MaterialSymbol name="bolt" size="[16px]" fill />,
                },
                {
                  key: "category" as const,
                  href: ROUTES.MAINTENANCE(MAINTENANCE_FEATURE_CODES.CATEGORY),
                  label: t("nav.newArrivals"),
                },
                {
                  key: null,
                  href: ROUTES.MAINTENANCE(MAINTENANCE_FEATURE_CODES.FEATURED_BRANDS),
                  label: t("nav.featuredBrands"),
                },
                {
                  key: null,
                  href: ROUTES.MAINTENANCE(MAINTENANCE_FEATURE_CODES.BEST_SELLERS),
                  label: t("nav.bestSellers"),
                },
                {
                  key: "voucher" as const,
                  href: ROUTES.VOUCHERS,
                  label: t("nav.voucherPromo"),
                },
              ].map((item) => {
                const isActive = active === item.key;
                // Tách base classes (chứa text-label-lg cho font-size) ra
                // NGOÀI cn(twMerge) để tailwind-merge không strip text-label-lg
                // khi color branch dùng text-on-primary/text-tertiary. tailwind-merge
                // group tất cả class "text-*" cùng prefix → conflict resolution sẽ
                // giữ class text-* cuối, làm mất font-size token.
                // (Lỗi này đã được user báo qua DevTools: "có thẻ a không có font-size"
                // khi active state được apply.)
                const baseClasses = clsx(
                  "px-4 py-1.5 rounded-full transition-all text-label-lg font-semibold",
                  item.icon && "inline-flex items-center gap-1"
                );
                // tailwind-merge chỉ áp dụng cho color/state branch
                const colorClasses = twMerge(
                  isActive
                    ? "bg-primary text-on-primary"
                    : item.key === "flash-sale"
                      ? "bg-transparent text-tertiary hover:text-rose-700 hover:bg-surface-container"
                      : "bg-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                );
                return (
                  <Link
                    key={item.href + item.label}
                    aria-current={isActive ? "page" : undefined}
                    // Concat thủ công: base (clsx-only) + color (twMerge-only)
                    // để text-label-lg KHÔNG bị tailwind-merge strip.
                    className={`${baseClasses} ${colorClasses}`}
                    href={item.href}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
