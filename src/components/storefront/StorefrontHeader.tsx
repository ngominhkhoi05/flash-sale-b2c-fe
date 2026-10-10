"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
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
  const { isAuthenticated } = useAuth();
  // Cart count chỉ fetch khi đã đăng nhập (tránh 401 spam khi user chưa login)
  const { data: cartCount = 0 } = useCartCount(isAuthenticated);

  const detected: StorefrontNavKey = (() => {
    if (pathname.startsWith(ROUTES.FLASH_SALE)) return "flash-sale";
    if (pathname.startsWith(ROUTES.VOUCHERS)) return "voucher";
    if (pathname.startsWith("/danh-muc")) return "category";
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
            <img
              alt="Vibe Mart"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBy79OcQcBJqBYuWsbyxBHYG_KNTVmWUtuHm6cTWSUHMBCklMREHkj1lZP61HP8UyknE3FygOx0-qIyt6jxOYDQsHbaurQZv4jMriUjeg8sqWiHGF8PtKwlT7eZUFIHvua7B0g0cH6uZtuUaE5GAYl6H6MOtdER8sYZ481KAE3Wc8k07ggWk2b8lR5VRRTqyRtEXbvHt-m0IIpNDkY_5V_O6G9qr1YeQr4Dx_mU3jzZXLWoXq_7bgv4im9x5rhOCKEOPgU"
              className="h-9 w-auto object-contain"
            />
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <Link
              href={ROUTES.SEARCH}
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
                  className="absolute -top-0.5 -right-0.5 bg-tertiary text-on-tertiary font-label-sm text-label-sm w-4 h-4 rounded-full flex items-center justify-center font-bold"
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
      <div className="hidden sm:block border-b border-outline-variant bg-surface-container-low text-[11px] text-on-surface-variant py-1.5">
        <div className="max-w-[1240px] mx-auto px-4 lg:px-5 flex items-center justify-between font-label-md">
          {/* Left links */}
          <div className="flex items-center gap-3">
            <Link href="/seller" className="hover:text-primary transition-colors">
              {t("sellerChannel")}
            </Link>
            <span className="text-outline-variant">|</span>
            <Link href={ROUTES.SELLER_REGISTER} className="hover:text-primary transition-colors">
              {t("becomeSeller")}
            </Link>
            <span className="text-outline-variant">|</span>
            <Link href="#" className="hover:text-primary transition-colors flex items-center gap-1">
              <MaterialSymbol name="download" size="[14px]" />
              {t("downloadApp")}
            </Link>
            <span className="text-outline-variant">|</span>
            <span className="flex items-center gap-1.5">
              <span>{t("connectLabel")}</span>
              <Link href="#" className="hover:text-primary font-bold">Facebook</Link>
              <Link href="#" className="hover:text-primary font-bold">Zalo</Link>
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
            <button className="flex items-center gap-1 cursor-pointer hover:text-primary text-on-surface-variant">
              <MaterialSymbol name="language" size="[14px]" />
              <span>{t("language")}</span>
              <MaterialSymbol name="expand_more" size="[12px]" />
            </button>
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
              <img
                alt="Vibe Mart"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBy79OcQcBJqBYuWsbyxBHYG_KNTVmWUtuHm6cTWSUHMBCklMREHkj1lZP61HP8UyknE3FygOx0-qIyt6jxOYDQsHbaurQZv4jMriUjeg8sqWiHGF8PtKwlT7eZUFIHvua7B0g0cH6uZtuUaE5GAYl6H6MOtdER8sYZ481KAE3Wc8k07ggWk2b8lR5VRRTqyRtEXbvHt-m0IIpNDkY_5V_O6G9qr1YeQr4Dx_mU3jzZXLWoXq_7bgv4im9x5rhOCKEOPgU"
                className="h-9 w-auto object-contain"
              />
            </Link>

            {/* Search bar */}
            <div className="flex-1 max-w-2xl mx-2 lg:mx-0">
              <div className="relative flex items-center">
                <input
                  className="w-full h-10 pl-4 pr-12 rounded-lg bg-surface-container-low text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary font-body-md text-body-md"
                  placeholder={t("searchPlaceholder")}
                  type="text"
                  aria-label={t("searchPlaceholder")}
                />
                <button
                  className="absolute right-1 top-1 h-8 w-10 bg-primary hover:bg-primary-container text-on-primary rounded-lg flex items-center justify-center transition-colors"
                  type="button"
                  aria-label={t("searchPlaceholder")}
                >
                  <MaterialSymbol name="search" size="base" />
                </button>
              </div>
            </div>

            {/* Right icons + user */}
            <div className="flex items-center gap-3 lg:gap-4 shrink-0">
              {/* Notifications */}
              <Link
                href="#"
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
                    className="absolute -top-0.5 -right-0.5 bg-tertiary text-on-tertiary font-label-sm text-label-sm w-4 h-4 rounded-full flex items-center justify-center font-bold"
                  >
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>

              {/* User avatar + name */}
              <div className="flex items-center gap-2 pl-2">
                <div className="text-right hidden sm:block">
                  <div className="font-label-lg text-label-lg text-on-surface leading-tight font-semibold">
                    {t("greeting")}
                  </div>
                  <div className="font-label-sm text-label-sm text-secondary font-medium">
                    {t("vipBadge")}
                  </div>
                </div>
                <img
                  alt="Profile"
                  src="https://lh3.googleusercontent.com/aida/AEtjO1Wwf88_26XJ-0gblbzI6RDeUiMvKdTX2axTaCcfQvZC-MwX_A0uVbQKucYlUzuCxZZ8UrEAucYloaJ47EeT80zyw0pcoJtkZQIOAmGKxe0NO5gZM2iYPPolRMJ-WJNHF6zS4kWi-BMTQivIRo40cTJU9VCijXF0JOgKuu063WUtxUr9q169kG4-TaBxMUxz_vF0y1m6iye_Ijswg2fAL3ug4t02pjtwhmfI9C2RaXpFjkE-voV2T8BTY90W"
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-surface-container-high"
                />
              </div>
            </div>
          </div>

          {/* ── Nav Pills ────────────────────────────────────────── */}
          <div className="h-11 flex items-center overflow-x-auto border-t border-outline-variant mt-2 pt-1 scrollbar-hide">
            <nav className="flex items-center gap-1 shrink-0">
              <Link
                aria-current={active === "home" ? "page" : undefined}
                className={cn(
                  "px-4 py-1.5 rounded-full transition-all font-label-lg text-label-lg",
                  active === "home"
                    ? "bg-primary text-on-primary"
                    : "bg-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                )}
                href={ROUTES.HOME}
              >
                {t("nav.home")}
              </Link>
              <Link
                aria-current={active === "flash-sale" ? "page" : undefined}
                className={cn(
                  "px-4 py-1.5 rounded-full transition-all font-label-lg text-label-lg inline-flex items-center gap-1 font-bold",
                  active === "flash-sale"
                    ? "bg-primary text-on-primary"
                    : "bg-transparent text-tertiary hover:text-rose-700 hover:bg-surface-container"
                )}
                href={ROUTES.FLASH_SALE}
              >
                <MaterialSymbol name="bolt" size="[16px]" fill />
                {t("nav.flashSale")}
              </Link>
              <Link
                aria-current={active === "category" ? "page" : undefined}
                className={cn(
                  "px-4 py-1.5 rounded-full transition-all font-label-lg text-label-lg",
                  active === "category"
                    ? "bg-primary text-on-primary"
                    : "bg-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                )}
                href="/danh-muc"
              >
                {t("nav.newArrivals")}
              </Link>
              <Link
                href="#"
                className="px-4 py-1.5 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container font-label-lg text-label-lg transition-all"
              >
                {t("nav.featuredBrands")}
              </Link>
              <Link
                href="#"
                className="px-4 py-1.5 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container font-label-lg text-label-lg transition-all"
              >
                {t("nav.bestSellers")}
              </Link>
              <Link
                href={ROUTES.VOUCHERS}
                aria-current={active === "voucher" ? "page" : undefined}
                className={cn(
                  "px-4 py-1.5 rounded-full transition-all font-label-lg text-label-lg",
                  active === "voucher"
                    ? "bg-primary text-on-primary"
                    : "bg-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                )}
              >
                {t("nav.voucherPromo")}
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
