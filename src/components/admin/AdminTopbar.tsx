"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
};

export function AdminTopbar() {
  const pathname = usePathname();
  const currentTitle = BREADCRUMB_MAP[pathname] || "Tổng quan";

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

        {/* Notification Bell */}
        <button
          className="relative p-2 rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container-low transition-colors flex items-center justify-center"
          type="button"
          aria-label="Thông báo hệ thống"
        >
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-tertiary ring-2 ring-surface-container-lowest" />
        </button>

        <div className="h-6 w-px bg-outline-variant/40 hidden sm:block" />

        {/* Super Admin Profile */}
        <div className="flex items-center gap-space-sm pl-1 cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-xs ring-1 ring-outline-variant/40 shrink-0">
            QT
          </div>
          <div className="hidden md:flex flex-col text-left">
            <div className="flex items-center gap-space-xs">
              <span className="font-body-md text-sm font-semibold text-on-surface leading-tight">
                Trần Quản Trị
              </span>
              <span className="material-symbols-outlined text-[16px] text-secondary">
                expand_more
              </span>
            </div>
            <span className="inline-block px-1.5 py-0.5 rounded font-label-sm text-[10px] font-semibold bg-primary-fixed text-on-primary-fixed-variant leading-none mt-0.5 w-fit">
              Super Admin
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
