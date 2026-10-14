/**
 * CheckoutQrHeader – header riêng cho trang Thanh toán ZaloPay QR (`/checkout/qr`).
 *
 * Theo Stitch design (docs/superpowers/handoffs/thanh-toan-QR-zalo.md):
 *  - Logo Vibe Mart + divider + breadcrumb "Thanh toán ZaloPay"
 *  - Bên phải: chip "SSL 256-bit Encrypted" (desktop), hotline, nút "Hủy giao dịch", avatar
 *  - KHÔNG có search bar, subnav, mobile bottom nav
 *  - KHÔNG bao gồm stepper (stepper nằm riêng trong StepperBar, trang dùng)
 *
 * Server Component (không cần 'use client') vì không có state.
 */
import Link from "next/link";

import { MaterialSymbol } from "@/components/ui/material-symbol";
import { ROUTES } from "@/lib/constants";

interface CheckoutQrHeaderProps {
  /** Tùy chọn: tên user để hiển thị avatar fallback. */
  userInitial?: string;
  /** Tùy chọn: URL avatar. */
  userAvatarUrl?: string;
}

export function CheckoutQrHeader({
  userInitial,
  userAvatarUrl,
}: CheckoutQrHeaderProps) {
  return (
    <header
      className="fixed top-0 left-0 w-full z-50 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]"
      data-testid="checkout-qr-header"
    >
      <div className="h-20 max-w-[1240px] mx-auto px-4 lg:px-[2rem] flex items-center justify-between gap-4">
        {/* Brand + breadcrumb */}
        <div className="flex items-center gap-3">
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
          <span className="h-6 w-px bg-outline-variant rounded-full hidden sm:block" />
          <span className="font-semibold text-on-surface-variant text-base hidden sm:inline">
            Thanh toán ZaloPay
          </span>
        </div>

        {/* Right info + cancel + user */}
        <div className="flex items-center gap-3 lg:gap-6">
          <div className="hidden md:flex items-center gap-1 px-2 py-1 rounded-full bg-secondary-fixed/30 text-secondary">
            <MaterialSymbol name="lock" size="[16px]" />
            <span className="font-semibold text-label-md">
              SSL 256-bit Encrypted
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-1 text-on-surface-variant">
            <MaterialSymbol name="support_agent" size="[18px]" />
            <span className="text-body-sm">CSKH:</span>
            <a
              href="tel:19008888"
              className="font-semibold text-label-md text-on-surface hover:text-primary transition-colors"
            >
              1900 8888
            </a>
          </div>

          <Link
            href={ROUTES.CART}
            className="font-semibold text-label-md text-tertiary hover:underline transition-colors flex items-center gap-1"
            data-testid="qr-cancel-transaction"
          >
            <MaterialSymbol name="close" size="[16px]" />
            <span className="hidden sm:inline">Hủy giao dịch</span>
          </Link>

          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center overflow-hidden">
            {userAvatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt="Avatar"
                src={userAvatarUrl}
                className="w-full h-full object-cover"
              />
            ) : (
              <MaterialSymbol
                name="person"
                size="[18px]"
                className="text-on-primary"
              />
            )}
            {!userAvatarUrl && userInitial && (
              <span className="sr-only">{userInitial}</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
