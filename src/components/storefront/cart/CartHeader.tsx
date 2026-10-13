/**
 * CartHeader – header riêng cho trang Giỏ hàng.
 * Khác với StorefrontHeader: có thêm "Giỏ hàng" text, search bar disabled, user VIP badge.
 * Dựa trên Stitch design (docs/superpowers/plans/2026-10-13-cart-page-ui-stitch.md).
 */
"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import { useCartCount } from "@/features/cart";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLogoutMutation } from "@/features/auth";

export function CartHeader() {
  const t = useTranslations("storefront.header");
  const { isAuthenticated, user } = useAuth();
  const { data: cartCount = 0 } = useCartCount(isAuthenticated);
  const { mutate: logout, isPending: isLoggingOut } = useLogoutMutation();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white shadow-sm border-b border-slate-100">
      {/* ── Top Bar ──────────────────────────────────────────────── */}
      <div className="border-b border-slate-100 bg-slate-50 text-[11px] text-slate-600 py-1.5 hidden sm:block">
        <div className="max-w-[1240px] mx-auto px-4 lg:px-8 flex items-center justify-between font-medium">
          {/* Left links */}
          <div className="flex items-center gap-3">
            <Link href="/seller" className="hover:text-primary transition-colors">
              {t("sellerChannel")}
            </Link>
            <span className="text-slate-300">|</span>
            <Link
              href={ROUTES.SELLER_REGISTER}
              className="hover:text-primary transition-colors"
            >
              {t("becomeSeller")}
            </Link>
            <span className="text-slate-300">|</span>
            <Link
              href="#"
              className="hover:text-primary transition-colors flex items-center gap-1"
            >
              <MaterialSymbol name="download" size="[13px]" />
              {t("downloadApp")}
            </Link>
            <span className="text-slate-300">|</span>
            <span className="flex items-center gap-1.5">
              <span>{t("connectLabel")}</span>
              <Link href="#" className="hover:text-primary font-bold">
                {t("facebook")}
              </Link>
              <span className="text-slate-300">,</span>
              <Link href="#" className="hover:text-primary font-bold">
                {t("zalo")}
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
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1 cursor-pointer hover:text-primary">
              <MaterialSymbol name="language" size="[14px]" />
              <span>{t("language")}</span>
              <MaterialSymbol name="expand_more" size="[12px]" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Header ─────────────────────────────────────────── */}
      <div className="max-w-[1240px] mx-auto px-4 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-6">
          {/* Logo + "Giỏ hàng" text */}
          <div className="flex items-center gap-4 shrink-0">
            <Link href={ROUTES.HOME} className="flex items-center gap-2 group">
              <Image
                alt="Vibe Mart"
                src="/images/vibe-mart-logo-lockup-light.png"
                width={128}
                height={36}
                priority
                className="h-9 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </Link>
            <div className="h-6 w-px bg-slate-200 hidden sm:block" />
            <span className="font-medium text-slate-800 hidden sm:block tracking-tight text-base">
              Giỏ hàng
            </span>
          </div>

          {/* Search bar (decorative) */}
          <div className="flex-1 max-w-2xl mx-2">
            <div className="relative flex items-center">
              <input
                className="w-full h-10 pl-4 pr-12 rounded-lg bg-slate-100 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary text-xs sm:text-sm border border-transparent transition-all"
                placeholder={t("searchPlaceholder")}
                type="text"
                disabled
              />
              <button
                className="absolute right-1 top-1 h-8 w-10 bg-primary hover:bg-primary-hover text-on-primary rounded-lg flex items-center justify-center transition-colors shadow-sm"
                type="button"
                aria-label={t("searchPlaceholder")}
                disabled
              >
                <MaterialSymbol name="search" size="base" />
              </button>
            </div>
          </div>

          {/* Right icons + user */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {/* Notifications */}
            <Link
              href="#"
              className="relative p-2 text-slate-600 hover:text-primary transition-colors rounded-full hover:bg-slate-100 flex items-center justify-center"
              aria-label="Thông báo"
            >
              <MaterialSymbol name="notifications" size="2xl" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
            </Link>

            {/* Cart button with badge */}
            <Link
              href={ROUTES.CART}
              className="relative p-2 text-primary transition-colors"
              aria-label={t("nav.cart")}
            >
              <MaterialSymbol name="shopping_cart" size="2xl" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-tertiary text-on-tertiary text-label-sm w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>

            {/* User area */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2 pl-2 border-l border-slate-200 hover:bg-slate-50 transition-colors rounded-full"
                  >
                    <div className="text-right hidden md:block">
                      <div className="text-xs text-slate-900 leading-tight font-semibold">
                        {user?.fullName || t("greeting")}
                      </div>
                      {/* VIP badge */}
                      <div className="text-[11px] text-emerald-600 font-semibold flex items-center justify-end gap-0.5">
                        <MaterialSymbol name="workspace_premium" size="[12px]" fill />
                        Thành viên VIP
                      </div>
                    </div>
                    {user?.avatarUrl ? (
                      <Image
                        alt={user.fullName || t("greeting")}
                        src={user.avatarUrl}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/20"
                      />
                    ) : (
                      <Image
                        alt="Ảnh đại diện mặc định"
                        src="/images/default-avatar.svg"
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-200"
                      />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[200px]">
                  <DropdownMenuItem asChild>
                    <Link
                      href={ROUTES.ACCOUNT}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <MaterialSymbol name="person" size="base" />
                      <span>{t("userMenu.myAccount")}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled={isLoggingOut}
                    onSelect={(event) => {
                      event.preventDefault();
                      logout();
                    }}
                    className="text-tertiary focus:text-tertiary cursor-pointer"
                  >
                    <MaterialSymbol name="logout" size="base" />
                    <span>
                      {isLoggingOut
                        ? t("userMenu.loggingOut")
                        : t("userMenu.logout")}
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                href={ROUTES.LOGIN}
                className="ml-2 flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-on-primary transition-colors hover:bg-primary-hover"
              >
                <MaterialSymbol name="person" size="base" />
                <span className="text-label-lg font-semibold">
                  {t("nav.login")}
                </span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Subnav ──────────────────────────────────────────────── */}
      <div className="border-t border-slate-100 bg-white hidden md:block">
        <div className="max-w-[1240px] mx-auto px-4 lg:px-8 flex items-center gap-7 text-xs font-medium text-slate-700 py-2 overflow-x-auto">
          <Link href={ROUTES.HOME} className="hover:text-primary transition-colors whitespace-nowrap">
            {t("nav.home")}
          </Link>
          <Link
            href={ROUTES.FLASH_SALE}
            className="text-rose-600 font-semibold hover:text-rose-700 transition-colors flex items-center gap-1 whitespace-nowrap"
          >
            <MaterialSymbol name="bolt" size="[16px]" fill />
            {t("nav.flashSale")}
          </Link>
          <Link href="#" className="hover:text-primary transition-colors whitespace-nowrap">
            Hàng mới về
          </Link>
          <Link href="#" className="hover:text-primary transition-colors whitespace-nowrap">
            Thương hiệu nổi bật
          </Link>
          <Link href="#" className="hover:text-primary transition-colors whitespace-nowrap">
            Bán chạy
          </Link>
          <Link
            href={ROUTES.VOUCHERS}
            className="hover:text-primary transition-colors flex items-center gap-1 text-emerald-700 font-semibold whitespace-nowrap"
          >
            <MaterialSymbol name="confirmation_number" size="[14px]" />
            Voucher & Khuyến mãi
          </Link>
        </div>
      </div>
    </header>
  );
}
