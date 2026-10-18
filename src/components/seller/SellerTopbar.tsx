"use client";

import React from "react";
import Link from "next/link";
import { MaterialSymbol } from "@/components/ui/material-symbol";

interface SellerTopbarProps {
  storeName?: string;
  storeRole?: string;
  avatarInitials?: string;
}

/**
 * SellerTopbar – Topbar Kênh Người Bán chuẩn Stitch (Batch 5 & 6).
 * Cố định trên cùng (left-60, h-16), backdrop-blur.
 */
export function SellerTopbar({
  storeName = "UTC Fashion",
  storeRole = "Chủ gian hàng",
  avatarInitials = "UTC",
}: SellerTopbarProps) {
  return (
    <header className="fixed top-0 left-60 right-0 h-16 bg-surface-container-lowest/95 backdrop-blur-md border-b border-outline-variant/30 z-40 select-none">
      <div className="h-16 w-full px-space-lg flex items-center justify-between">
        {/* Breadcrumb Left */}
        <div className="flex items-center gap-space-xs font-body-md text-body-sm text-secondary">
          <Link href="/seller" className="hover:text-on-surface transition-colors cursor-pointer">
            Kênh Người Bán
          </Link>
          <MaterialSymbol name="chevron_right" size="[16px]" className="text-outline" />
          <span className="font-label-md text-body-sm text-on-surface font-medium">
            {storeName}
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

          {/* Shop Profile Badge */}
          <div className="flex items-center gap-space-sm pl-1">
            <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-label-md text-label-md font-bold shadow-sm">
              {avatarInitials}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="font-headline-md text-body-sm text-on-surface font-semibold leading-tight">
                {storeName}
              </span>
              <span className="font-body-sm text-label-sm text-secondary leading-tight">
                {storeRole}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center ml-1 text-on-primary">
              <MaterialSymbol name="person" size="[18px]" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
