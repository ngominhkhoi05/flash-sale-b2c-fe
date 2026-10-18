"use client";

import React from "react";
import Link from "next/link";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { useMyStore } from "@/hooks/useMyStore";
import { useMeQuery, useLogoutMutation } from "@/features/auth/hooks";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SellerTopbarProps {
  storeName?: string;
  storeRole?: string;
  avatarInitials?: string;
}

/**
 * SellerTopbar – Topbar Kênh Người Bán chuẩn Stitch.
 * Cố định trên cùng (left-60, h-16), backdrop-blur.
 * Tự động lấy tên gian hàng thật của tài khoản đăng nhập qua useMyStore().
 * Logo/Avatar trên topbar khi click hiển thị thông tin cá nhân và nút đăng xuất.
 */
export function SellerTopbar({
  storeName: propStoreName,
  storeRole = "Chủ gian hàng",
  avatarInitials: propInitials,
}: SellerTopbarProps) {
  const { store, storeName: realStoreName, storeCode, storeStatusText, initials } = useMyStore();
  const { data: userData } = useMeQuery();
  const { mutate: logout, isPending: isLoggingOut } = useLogoutMutation();

  const finalStoreName = propStoreName || realStoreName || "Gian hàng";
  const finalInitials = propInitials || initials || "VM";
  const finalStoreCode = storeCode || (store?.id ? `#VM-${store.id}` : "");
  const avatarImage = userData?.avatarUrl || store?.logoUrl;

  const isApproved = store?.status === "APPROVED" || store?.status === "ACTIVE";

  return (
    <header className="fixed top-0 left-60 right-0 h-16 bg-surface-container-lowest/95 backdrop-blur-md border-b border-outline-variant/30 z-40 select-none">
      <div className="h-16 w-full px-space-lg flex items-center justify-between">
        {/* Breadcrumb Left */}
        <div className="flex items-center gap-space-xs font-body-md text-body-sm text-secondary">
          <Link href="/seller" className="hover:text-on-surface transition-colors cursor-pointer">
            Kênh Người Bán
          </Link>
          <MaterialSymbol name="chevron_right" size="[16px]" className="text-outline" />
          <span className="font-label-md text-body-sm text-on-surface font-semibold max-w-[240px] truncate">
            {finalStoreName}
          </span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-space-md">
          {/* Back to Storefront Link */}
          <Link
            href="/"
            className="hidden sm:flex items-center gap-1.5 px-space-sm py-1.5 rounded-lg text-secondary hover:bg-surface-container-low hover:text-on-surface font-body-md text-body-sm transition-colors border border-outline-variant/30"
          >
            <MaterialSymbol name="open_in_new" size="[18px]" />
            <span>Về trang mua sắm</span>
          </Link>

          {/* Notifications */}
          <div className="relative">
            <button
              type="button"
              className="w-9 h-9 flex items-center justify-center rounded-lg text-secondary hover:bg-surface-container-low hover:text-on-surface transition-colors"
              aria-label="Thông báo"
            >
              <MaterialSymbol name="notifications" size="[22px]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-tertiary-container ring-2 ring-surface-container-lowest animate-pulse" />
            </button>
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-outline-variant/30" />

          {/* User & Shop Profile Badge with Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-surface-container-low transition-colors cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                aria-label="Menu tài khoản người bán"
              >
                {/* Avatar / Logo */}
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-label-md text-label-md font-bold shadow-sm overflow-hidden flex-shrink-0">
                  {avatarImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarImage}
                      alt={finalStoreName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{finalInitials}</span>
                  )}
                </div>

                {/* Text Info */}
                <div className="hidden md:flex flex-col text-left max-w-[150px]">
                  <span className="font-headline-md text-body-sm text-on-surface font-semibold leading-tight truncate">
                    {finalStoreName}
                  </span>
                  <span className="font-body-sm text-label-sm text-secondary leading-tight truncate">
                    {storeRole}
                  </span>
                </div>

                {/* Dropdown Chevron Icon */}
                <div className="w-7 h-7 rounded-full bg-surface-container text-secondary flex items-center justify-center ml-0.5 transition-transform">
                  <MaterialSymbol name="expand_more" size="[18px]" />
                </div>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="w-72 p-2 bg-surface-container-lowest border border-outline-variant/40 rounded-2xl shadow-xl z-50 animate-in fade-in-80 zoom-in-95"
            >
              {/* Header: Thông tin cá nhân & Gian hàng */}
              <DropdownMenuLabel className="p-3 bg-surface-container-low/70 rounded-xl mb-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-sm overflow-hidden flex-shrink-0">
                    {avatarImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarImage}
                        alt={userData?.fullName || finalStoreName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{finalInitials}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-headline-md text-body-md text-on-surface font-bold truncate">
                      {userData?.fullName || finalStoreName}
                    </p>
                    <p className="font-body-sm text-label-sm text-secondary truncate">
                      {userData?.email || "Chưa có email"}
                    </p>
                    {userData?.phone && (
                      <p className="font-body-sm text-[11px] text-outline truncate">
                        SĐT: {userData.phone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Gian hàng chi tiết mini card */}
                <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between gap-2 text-label-sm">
                  <div className="min-w-0">
                    <span className="text-secondary block text-[11px]">Gian hàng:</span>
                    <span className="font-semibold text-on-surface truncate block">
                      {finalStoreName}
                    </span>
                    {finalStoreCode && (
                      <span className="text-[10px] text-outline block">
                        Mã: {finalStoreCode}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 border ${
                      isApproved
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {storeStatusText}
                  </span>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator className="my-1 bg-outline-variant/20" />

              {/* Navigation items */}
              <DropdownMenuItem asChild>
                <Link
                  href="/seller/profile"
                  className="flex items-center gap-2.5 px-3 py-2 text-body-sm text-on-surface hover:bg-surface-container-low rounded-lg transition-colors cursor-pointer"
                >
                  <MaterialSymbol name="storefront" size="[18px]" className="text-emerald-600" />
                  <span className="font-medium">Hồ sơ gian hàng</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link
                  href="/account"
                  className="flex items-center gap-2.5 px-3 py-2 text-body-sm text-on-surface hover:bg-surface-container-low rounded-lg transition-colors cursor-pointer"
                >
                  <MaterialSymbol name="person" size="[18px]" className="text-secondary" />
                  <span className="font-medium">Tài khoản cá nhân</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link
                  href="/account?tab=password"
                  className="flex items-center gap-2.5 px-3 py-2 text-body-sm text-on-surface hover:bg-surface-container-low rounded-lg transition-colors cursor-pointer"
                >
                  <MaterialSymbol name="lock" size="[18px]" className="text-secondary" />
                  <span className="font-medium">Đổi mật khẩu</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link
                  href="/"
                  className="flex items-center gap-2.5 px-3 py-2 text-body-sm text-secondary hover:text-on-surface hover:bg-surface-container-low rounded-lg transition-colors cursor-pointer"
                >
                  <MaterialSymbol name="open_in_new" size="[18px]" className="text-secondary" />
                  <span>Về sàn mua sắm</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1 bg-outline-variant/20" />

              {/* Nút Đăng xuất */}
              <DropdownMenuItem
                disabled={isLoggingOut}
                onSelect={(e) => {
                  e.preventDefault();
                  logout();
                }}
                className="flex items-center gap-2.5 px-3 py-2 text-body-sm text-error hover:bg-error-container/20 hover:text-error rounded-lg transition-colors cursor-pointer font-semibold"
              >
                <MaterialSymbol name="logout" size="[18px]" className="text-error" />
                <span>{isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

