/**
 * CheckoutHeader – header riêng cho trang Thanh toán.
 * Theo Stitch design (docs/CLAUDE.md mục 5 + screen 203897a8 của ui-code-dump.md).
 *
 * Khác với StorefrontHeader / CartHeader:
 *  - Logo Vibe Mart + divider + breadcrumb "Thanh toán" (text-only)
 *  - Nav 3 bước desktop: "Giỏ hàng → Thanh toán (active) → Xác nhận"
 *  - Bên phải: badge PCI DSS, hotline, avatar user
 *  - KHÔNG có search bar, subnav, mobile nav (mobile view dùng MobileCheckoutBar)
 */
"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLogoutMutation } from "@/features/auth";

export function CheckoutHeader() {
  const t = useTranslations("storefront.header");
  const tCheckout = useTranslations("storefront.checkout");
  const { isAuthenticated, user } = useAuth();
  const { mutate: logout, isPending: isLoggingOut } = useLogoutMutation();

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md shadow-[0_1px_8px_rgba(15,23,42,0.06)] border-b border-slate-100">
      <div className="h-20 max-w-[1240px] mx-auto px-4 lg:px-8 flex items-center justify-between gap-4">
        {/* ── Brand + breadcrumb ────────────────────────────────── */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href={ROUTES.HOME}
            className="flex items-center gap-2 group"
            aria-label="Trang chủ Vibe Mart"
          >
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
              V
            </div>
            <span className="font-bold text-lg text-primary tracking-tight hidden sm:inline">
              Vibe Mart
            </span>
          </Link>
          <span className="h-6 w-px bg-outline-variant/60 rounded-full" />
          <span className="font-semibold text-on-surface text-base hidden sm:inline">
            {tCheckout("breadcrumb")}
          </span>
        </div>

        {/* ── Desktop nav 3 bước ───────────────────────────────── */}
        <nav
          className="hidden lg:flex items-center gap-6"
          aria-label="Tiến trình thanh toán"
        >
          <Link
            href={ROUTES.CART}
            className="font-semibold text-sm text-on-surface-variant hover:text-on-surface transition-colors"
          >
            {tCheckout("nav.cart")}
          </Link>
          <span
            className="font-bold text-sm text-primary"
            aria-current="page"
          >
            {tCheckout("nav.payment")}
          </span>
          <span className="font-semibold text-sm text-on-surface-variant">
            {tCheckout("nav.confirmation")}
          </span>
        </nav>

        {/* ── Right info + user ────────────────────────────────── */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-container-low text-secondary">
            <MaterialSymbol name="verified_user" size="[16px]" />
            <span className="font-semibold text-xs">PCI DSS 256-bit</span>
          </div>
          <div className="hidden md:flex items-center gap-1 text-on-surface-variant">
            <MaterialSymbol
              name="call"
              size="[16px]"
              className="text-primary"
            />
            <span className="font-semibold text-sm text-on-surface">
              1900 8888
            </span>
          </div>
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center pl-1 hover:bg-slate-50 rounded-full transition-colors"
                  aria-label="Menu người dùng"
                >
                  {user?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt={user.fullName ?? "Avatar"}
                      src={user.avatarUrl}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-surface-variant"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm">
                      {(user?.fullName ?? "?").charAt(0).toUpperCase()}
                    </div>
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
                    <span>{tCheckout("userMenu.account")}</span>
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
                      ? tCheckout("userMenu.loggingOut")
                      : tCheckout("userMenu.logout")}
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href={ROUTES.LOGIN}
              className="hidden sm:inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-on-primary text-xs font-semibold hover:bg-primary-hover transition-colors"
            >
              <MaterialSymbol name="person" size="base" />
              <span>{t("nav.login")}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Stepper dưới header đã được render bởi (checkout)/layout.tsx
          (a11y: progress indicator không thuộc landmark <header>).
          Page này chỉ chứa nội dung chính. */}
    </header>
  );
}
