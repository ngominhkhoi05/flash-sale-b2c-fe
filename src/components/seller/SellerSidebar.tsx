"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MaterialSymbol, type MaterialSymbolName } from "@/components/ui/material-symbol";

interface SellerNavItem {
  key: string;
  label: string;
  href: string;
  icon: MaterialSymbolName;
  badge?: string;
  badgeVariant?: "error" | "seller" | "secondary";
}

interface SellerNavGroup {
  title?: string;
  items: SellerNavItem[];
}

const SELLER_NAV_GROUPS: SellerNavGroup[] = [
  {
    items: [
      { key: "overview", label: "Tổng quan", href: "/seller", icon: "grid_view" },
    ],
  },
  {
    title: "BÁN HÀNG",
    items: [
      { key: "products", label: "Sản phẩm", href: "/seller/products", icon: "inventory_2" },
      { key: "orders", label: "Đơn hàng", href: "/seller/orders", icon: "shopping_bag", badge: "12", badgeVariant: "error" },
      { key: "reviews", label: "Đánh giá", href: "/seller/reviews", icon: "star" },
    ],
  },
  {
    title: "MARKETING",
    items: [
      { key: "flash-sale", label: "Flash Sale", href: "/seller/flash-sale/register", icon: "bolt" },
      { key: "vouchers", label: "Voucher của shop", href: "/seller/vouchers", icon: "confirmation_number" },
    ],
  },
  {
    title: "TÀI CHÍNH",
    items: [
      { key: "wallet", label: "Ví doanh thu", href: "/seller/wallet", icon: "account_balance_wallet" },
    ],
  },
  {
    title: "CÀI ĐẶT",
    items: [
      { key: "profile", label: "Hồ sơ gian hàng", href: "/seller/profile", icon: "storefront" },
      { key: "staff", label: "Nhân viên & phân quyền", href: "/seller/staff", icon: "group" },
    ],
  },
];

interface SellerSidebarProps {
  storeName?: string;
  storeCode?: string;
  storeStatus?: string;
}

/**
 * SellerSidebar – Sidebar Kênh Người Bán chuẩn Stitch (Batch 5 & 6).
 * Cố định 240px (w-60), theme Mint/Emerald (#10B981).
 */
export function SellerSidebar({
  storeName = "UTC Fashion",
  storeCode = "#VM-8842",
  storeStatus = "Đã duyệt",
}: SellerSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-surface-container-lowest z-50 flex flex-col border-r border-outline-variant/30 shadow-[0_1px_8px_rgba(0,0,0,0.02)] select-none">
      {/* Brand Header */}
      <div className="h-16 px-space-md flex items-center gap-space-sm border-b border-outline-variant/20 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-sm font-headline-md text-headline-md font-bold">
          V
        </div>
        <div className="flex flex-col">
          <span className="font-headline-md text-body-lg text-emerald-600 font-bold leading-tight">
            Vibe Mart
          </span>
          <span className="font-headline-md text-label-sm text-secondary font-semibold uppercase tracking-wider">
            Kênh Người Bán
          </span>
        </div>
      </div>

      {/* Store Profile Card */}
      <div className="px-space-md py-space-sm flex-shrink-0">
        <div className="p-space-sm rounded-lg bg-surface-container-low border border-outline-variant/30 flex items-center gap-space-sm">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-label-md text-label-md font-bold flex-shrink-0">
            {storeName.slice(0, 3).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <p className="font-headline-md text-body-sm text-on-surface truncate font-semibold">
                {storeName}
              </p>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0">
                {storeStatus}
              </span>
            </div>
            <p className="font-body-sm text-label-sm text-secondary truncate">
              Mã: {storeCode}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-space-sm py-space-xs space-y-space-xs">
        {SELLER_NAV_GROUPS.map((group, gIdx) => (
          <div key={gIdx} className={cn(group.title && "pt-space-xs")}>
            {group.title && (
              <p className="px-space-sm py-1 font-label-sm text-label-sm uppercase tracking-wider text-outline font-semibold">
                {group.title}
              </p>
            )}
            <div className="space-y-0.5 mt-0.5">
              {group.items.map((item) => {
                const isActive = Boolean(
                  item.href === "/seller"
                    ? pathname === "/seller"
                    : pathname?.startsWith(item.href)
                );

                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between px-space-sm py-2 rounded-lg transition-colors font-body-md text-body-md",
                      isActive
                        ? "bg-emerald-50 text-emerald-700 font-semibold border-l-[3px] border-emerald-500 rounded-r-lg rounded-l-none"
                        : "text-secondary hover:bg-surface-container-low hover:text-on-surface"
                    )}
                  >
                    <div className="flex items-center gap-space-sm min-w-0">
                      <MaterialSymbol
                        name={item.icon}
                        size="[20px]"
                        className={cn(
                          "shrink-0",
                          isActive ? "text-emerald-600" : "text-secondary"
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={cn(
                          "font-label-sm text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0",
                          item.badgeVariant === "error"
                            ? "bg-error text-on-error"
                            : item.badgeVariant === "seller"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-surface-container text-secondary"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Quick Links */}
      <div className="p-space-sm border-t border-outline-variant/20 flex-shrink-0">
        <Link
          href="/"
          className="flex items-center gap-space-xs px-space-sm py-2 rounded-lg text-secondary hover:bg-surface-container-low hover:text-on-surface font-body-md text-body-sm transition-colors"
        >
          <MaterialSymbol name="open_in_new" size="[18px]" className="text-outline" />
          <span>Về trang mua sắm</span>
        </Link>
      </div>
    </aside>
  );
}
