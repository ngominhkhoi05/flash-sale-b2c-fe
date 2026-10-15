"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getApprovalCounts } from "@/lib/mocks";

interface NavItem {
  key: string;
  label: string;
  href?: string;
  icon: string;
  badge?: string;
  badgeVariant?: "tertiary" | "primary" | "pulse";
  disabled?: boolean;
}

interface NavGroup {
  title?: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { key: "overview", label: "Tổng quan", href: "/admin", icon: "dashboard" },
    ],
  },
  {
    title: "NGƯỜI DÙNG",
    items: [
      { key: "users", label: "Người dùng", href: "/admin/users", icon: "group" },
      { key: "stores", label: "Gian hàng", href: "/admin/stores", icon: "storefront" },
    ],
  },
  {
    title: "SẢN PHẨM",
    items: [
      { key: "products", label: "Sản phẩm toàn sàn", href: "/admin/products", icon: "inventory_2" },
      { key: "categories", label: "Danh mục & hoa hồng", href: "/admin/categories", icon: "layers" },
    ],
  },
  {
    title: "FLASH SALE",
    items: [
      {
        key: "fs-slots",
        label: "Khung giờ",
        href: "/admin/flash-sale",
        icon: "schedule",
      },
      {
        key: "fs-approvals",
        label: "Duyệt sản phẩm",
        href: "/admin/flash-sale/approvals",
        icon: "check_box",
        badge: "14",
        badgeVariant: "tertiary",
      },
      {
        key: "fs-monitor",
        label: "Giám sát realtime",
        href: "/admin/flash-sale/monitor",
        icon: "monitoring",
        badgeVariant: "pulse",
      },
    ],
  },
  {
    title: "MARKETING",
    items: [
      { key: "vouchers", label: "Voucher sàn", href: "/admin/vouchers", icon: "confirmation_number" },
    ],
  },
  {
    title: "TÀI CHÍNH",
    items: [
      { key: "settlement", label: "Đối soát", href: "/admin/reconciliation", icon: "payments" },
    ],
  },
  {
    title: "HỆ THỐNG",
    items: [
      { key: "permissions", label: "Phân quyền & tính năng", href: "/admin/permissions", icon: "verified_user" },
    ],
  },
];

/**
 * AdminSidebar – thanh điều hướng bên trái Admin Console chuẩn thiết kế Stitch.
 * - Nền tối #1E293B (inverse-surface), chữ sáng #CBD5E1.
 * - Mục đang chọn: nền #334155 + vạch trái #0284C7 (border-primary).
 * - Các mục chưa làm: hiển thị đúng thiết kế nhưng ở trạng thái disabled (không link, không 404).
 */
export function AdminSidebar() {
  const pathname = usePathname();
  const [pendingSkuCount, setPendingSkuCount] = useState<number>(() => {
    try {
      return getApprovalCounts().pending;
    } catch {
      return 14;
    }
  });

  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<number>;
      if (typeof customEvent.detail === "number") {
        setPendingSkuCount(customEvent.detail);
      }
    };

    window.addEventListener("admin:sku-pending-count", handler);
    return () => {
      window.removeEventListener("admin:sku-pending-count", handler);
    };
  }, []);

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-inverse-surface border-r border-outline-variant/30 z-50 flex flex-col justify-between overflow-y-auto select-none">
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="h-16 px-space-md flex items-center gap-space-sm border-b border-outline-variant/20">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary font-bold text-sm shadow-sm shrink-0">
            VM
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-headline-md font-bold tracking-tight text-white text-[15px] leading-tight truncate">
              Vibe Mart
            </span>
            <span className="font-label-sm uppercase tracking-wider text-outline-variant text-[10px] leading-none mt-0.5">
              Admin Console
            </span>
          </div>
        </div>

        {/* Navigation Groups */}
        <nav className="flex flex-col py-space-sm gap-0.5">
          {NAV_GROUPS.map((group, gIdx) => (
            <div key={gIdx} className={cn(group.title && "mt-space-sm")}>
              {group.title && (
                <div className="px-space-md py-1 font-label-sm text-[11px] font-semibold tracking-wider text-outline-variant uppercase">
                  {group.title}
                </div>
              )}
              <div className="px-space-md flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const isActive = !item.disabled && item.href && (
                    item.href === "/admin"
                      ? pathname === "/admin"
                      : pathname?.startsWith(item.href)
                  );

                  const itemBadge =
                    item.key === "fs-approvals"
                      ? pendingSkuCount > 0
                        ? String(pendingSkuCount)
                        : undefined
                      : item.badge;

                  const content = (
                    <>
                      <div className="flex items-center gap-space-sm min-w-0">
                        <span className="material-symbols-outlined text-[20px] shrink-0">
                          {item.icon}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </div>
                      {itemBadge && (
                        <span
                          className={cn(
                            "px-1.5 py-0.5 rounded text-[11px] font-bold leading-none shrink-0",
                            item.badgeVariant === "tertiary"
                              ? "bg-tertiary-container text-on-tertiary-container"
                              : "bg-surface-container text-secondary"
                          )}
                        >
                          {itemBadge}
                        </span>
                      )}
                      {item.badgeVariant === "pulse" && (
                        <span className="relative flex h-2 w-2 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary" />
                        </span>
                      )}
                    </>
                  );

                  if (item.disabled || !item.href) {
                    return (
                      <div
                        key={item.key}
                        className="flex items-center justify-between px-space-sm py-2 rounded-lg text-outline-variant/40 font-body-md text-sm cursor-not-allowed select-none"
                        title="Tính năng chưa kích hoạt ở đợt này"
                      >
                        {content}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      className={cn(
                        "flex items-center justify-between px-space-sm py-2 rounded-lg font-body-md text-sm transition-colors",
                        isActive
                          ? "bg-secondary/40 text-on-primary font-medium border-l-4 border-primary pl-space-md"
                          : "text-outline-variant hover:bg-inverse-surface/80 hover:text-on-primary"
                      )}
                    >
                      {content}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer Exit & Copyright */}
      <div className="p-space-md border-t border-outline-variant/20 flex flex-col gap-space-xs shrink-0">
        <Link
          href="/"
          className="flex items-center justify-center gap-space-xs w-full py-2 px-space-sm bg-secondary/30 hover:bg-secondary/50 text-on-primary rounded-lg text-body-sm font-medium transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">open_in_new</span>
          <span>Về trang mua sắm</span>
        </Link>
        <div className="text-center text-[11px] font-label-sm text-outline-variant mt-1">
          © Vibe Mart v2.4 Admin
        </div>
      </div>
    </aside>
  );
}
