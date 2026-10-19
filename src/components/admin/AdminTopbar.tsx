"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMeQuery, useLogoutMutation } from "@/features/auth/hooks";
import { useAuthStore } from "@/stores/auth.store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const BREADCRUMB_MAP: Record<string, string> = {
  "/admin": "Tổng quan",
  "/admin/users": "Quản lý người dùng",
  "/admin/stores": "Quản lý gian hàng",
  "/admin/products": "Sản phẩm toàn sàn",
  "/admin/categories": "Danh mục & hoa hồng",
  "/admin/flash-sale": "Khung giờ Flash Sale",
  "/admin/flash-sale/approvals": "Duyệt sản phẩm",
  "/admin/flash-sale/monitor": "Giám sát realtime",
  "/admin/vouchers": "Voucher sàn",
  "/admin/reconciliation": "Đối soát tài chính",
  "/admin/permissions": "Phân quyền & tính năng",
};

interface AdminNotificationItem {
  id: number;
  title: string;
  desc: string;
  time: string;
  icon: string;
  href: string;
  unread: boolean;
  colorClass: string;
}

const INITIAL_NOTIFICATIONS: AdminNotificationItem[] = [
  {
    id: 1,
    title: "14 SKU chờ phê duyệt",
    desc: "Các gian hàng đã đăng ký sản phẩm vào slot Flash Sale tiếp theo.",
    time: "10 phút trước",
    icon: "check_box",
    href: "/admin/flash-sale/approvals",
    unread: true,
    colorClass: "text-amber-600 bg-amber-50",
  },
  {
    id: 2,
    title: "Hồ sơ gian hàng mới",
    desc: "Có đối tác kinh doanh mới nộp hồ sơ đăng ký mở gian hàng.",
    time: "35 phút trước",
    icon: "storefront",
    href: "/admin/stores",
    unread: true,
    colorClass: "text-blue-600 bg-blue-50",
  },
  {
    id: 3,
    title: "Sẵn sàng phiên Flash Sale",
    desc: "Khung giờ 20:00 đã nạp dữ liệu tồn kho vào Redis thành công.",
    time: "1 giờ trước",
    icon: "monitoring",
    href: "/admin/flash-sale/monitor",
    unread: false,
    colorClass: "text-emerald-600 bg-emerald-50",
  },
];

export function AdminTopbar() {
  const pathname = usePathname();
  const currentTitle = BREADCRUMB_MAP[pathname] || "Tổng quan";

  const { data: userData } = useMeQuery();
  const authUser = useAuthStore((s) => s.user);
  const { mutate: logout, isPending: isLoggingOut } = useLogoutMutation();

  const [notifications, setNotifications] = useState<AdminNotificationItem[]>(INITIAL_NOTIFICATIONS);
  const unreadCount = useMemo(() => notifications.filter((n) => n.unread).length, [notifications]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const markAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  };

  const displayName = userData?.fullName || authUser?.fullName || "Trần Quản Trị";
  const displayEmail = userData?.email || authUser?.email || "admin@vibemarket.vn";
  const displayRole = authUser?.role === "ADMIN" ? "Super Admin" : "Quản trị viên";

  const userInitials = useMemo(() => {
    if (!displayName) return "QT";
    const parts = displayName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return displayName.slice(0, 2).toUpperCase();
  }, [displayName]);

  return (
    <header className="fixed top-0 left-60 right-0 h-16 bg-surface-container-lowest border-b border-outline-variant/30 z-40 px-gutter flex items-center justify-between shadow-[0_1px_8px_rgba(0,0,0,0.02)] select-none">
      {/* Left: Breadcrumbs & Global Search */}
      <div className="flex items-center gap-space-lg">
        <div className="hidden lg:flex items-center gap-1.5 font-body-sm text-sm text-secondary">
          <span className="font-medium text-on-surface">Admin Console</span>
          <span className="text-outline-variant">/</span>
          <span className="text-primary font-medium">{currentTitle}</span>
        </div>

        <div className="relative w-80 lg:w-96">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
            search
          </span>
          <input
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-outline-variant/60 bg-surface-bright font-body-sm text-sm text-on-surface placeholder:text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            placeholder="Tìm kiếm đơn hàng, người dùng, gian hàng... (Cmd+K)"
            type="text"
            readOnly
          />
        </div>
      </div>

      {/* Right: Storefront shortcut, Notifications, Admin Profile */}
      <div className="flex items-center gap-space-md">
        <Link
          href="/"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant/60 text-secondary hover:text-on-surface hover:bg-surface-container-low transition-colors font-label-md text-xs font-semibold"
        >
          <span className="material-symbols-outlined text-[16px]">open_in_new</span>
          <span>Về trang mua sắm</span>
        </Link>

        {/* Notification Bell Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="relative p-2 rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container-low transition-colors flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
              type="button"
              aria-label="Thông báo hệ thống"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-tertiary ring-2 ring-surface-container-lowest" />
              )}
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-80 sm:w-96 p-0 bg-surface-container-lowest border border-outline-variant/40 rounded-2xl shadow-xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-3.5 bg-surface-container-low/70 border-b border-outline-variant/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary">notifications_active</span>
                <span className="font-headline-md text-sm font-bold text-on-surface">
                  Thông báo hệ thống
                </span>
              </div>
              {unreadCount > 0 ? (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-xs text-primary hover:underline font-semibold cursor-pointer"
                >
                  Đánh dấu đã đọc
                </button>
              ) : (
                <span className="text-xs text-secondary font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-emerald-600">check</span>
                  Đã đọc tất cả
                </span>
              )}
            </div>

            {/* List */}
            <div className="max-h-[360px] overflow-y-auto divide-y divide-outline-variant/10">
              {notifications.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => markAsRead(item.id)}
                  className={`flex items-start gap-3 p-3 hover:bg-surface-container-low transition-colors ${
                    item.unread ? "bg-primary/5" : ""
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.colorClass}`}>
                    <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-xs text-on-surface truncate">{item.title}</p>
                      <span className="text-[10px] text-secondary shrink-0">{item.time}</span>
                    </div>
                    <p className="text-xs text-secondary mt-0.5 line-clamp-2">{item.desc}</p>
                  </div>
                  {item.unread && (
                    <span className="w-1.5 h-1.5 rounded-full bg-tertiary mt-1.5 shrink-0" />
                  )}
                </Link>
              ))}
            </div>

            {/* Footer */}
            <div className="p-2.5 bg-surface-container-low/40 border-t border-outline-variant/20 text-center">
              <Link
                href="/admin/flash-sale/monitor"
                className="inline-flex items-center justify-center gap-1.5 w-full py-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                <span>Giám sát hệ thống Realtime</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="h-6 w-px bg-outline-variant/40 hidden sm:block" />

        {/* Super Admin Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-space-sm pl-1 p-1 rounded-xl hover:bg-surface-container-low transition-colors cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-primary/20"
              aria-label="Menu quản trị viên"
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-xs ring-1 ring-outline-variant/40 shrink-0">
                {userInitials}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <div className="flex items-center gap-space-xs">
                  <span className="font-body-md text-sm font-semibold text-on-surface leading-tight truncate max-w-[130px]">
                    {displayName}
                  </span>
                  <span className="material-symbols-outlined text-[16px] text-secondary">
                    expand_more
                  </span>
                </div>
                <span className="inline-block px-1.5 py-0.5 rounded font-label-sm text-[10px] font-semibold bg-primary-fixed text-on-primary-fixed-variant leading-none mt-0.5 w-fit">
                  {displayRole}
                </span>
              </div>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-64 p-2 bg-surface-container-lowest border border-outline-variant/40 rounded-2xl shadow-xl z-50 animate-in fade-in-80 zoom-in-95"
          >
            {/* Header Info */}
            <DropdownMenuLabel className="p-3 bg-surface-container-low/70 rounded-xl mb-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-sm ring-1 ring-outline-variant/40 shrink-0">
                  {userInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-headline-md text-sm font-bold text-on-surface truncate">
                    {displayName}
                  </p>
                  <p className="font-body-sm text-xs text-secondary truncate">
                    {displayEmail}
                  </p>
                  <span className="inline-block px-1.5 py-0.5 rounded font-label-sm text-[10px] font-semibold bg-primary-fixed text-on-primary-fixed-variant leading-none mt-1">
                    {displayRole}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="my-1 bg-outline-variant/20" />

            {/* Menu Items */}
            <DropdownMenuItem asChild>
              <Link
                href="/admin/permissions"
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-on-surface hover:bg-surface-container-low rounded-lg transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-primary">verified_user</span>
                <span className="font-medium">Phân quyền & tính năng</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link
                href="/account?tab=profile"
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-on-surface hover:bg-surface-container-low rounded-lg transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-secondary">person</span>
                <span className="font-medium">Hồ sơ cá nhân</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link
                href="/"
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-secondary hover:text-on-surface hover:bg-surface-container-low rounded-lg transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-secondary">open_in_new</span>
                <span>Về trang mua sắm</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1 bg-outline-variant/20" />

            {/* Logout Button */}
            <DropdownMenuItem
              disabled={isLoggingOut}
              onSelect={(e) => {
                e.preventDefault();
                logout();
              }}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-error hover:bg-error-container/20 hover:text-error rounded-lg transition-colors cursor-pointer font-semibold"
            >
              <span className="material-symbols-outlined text-[18px] text-error">logout</span>
              <span>{isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
