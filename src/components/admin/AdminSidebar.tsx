"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Store,
  Clock,
  Ticket,
  ShoppingBag,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface MenuItem {
  key: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const MENU: MenuItem[] = [
  { key: "overview", label: "Tổng quan", href: "/admin", icon: LayoutDashboard },
  { key: "users", label: "Người dùng", href: "/admin/nguoi-dung", icon: Users },
  { key: "stores", label: "Gian hàng", href: "/admin/gian-hang", icon: Store },
  { key: "slots", label: "Khung giờ", href: "/admin/khung-gio", icon: Clock },
  { key: "vouchers", label: "Voucher sàn", href: "/admin/voucher", icon: Ticket },
  { key: "orders", label: "Đơn hàng", href: "/admin/orders", icon: ShoppingBag },
  { key: "settings", label: "Cấu hình", href: "/admin/cai-dat", icon: Settings },
];

/**
 * AdminSidebar – chỉ desktop, theme xám than (token `admin`).
 */
export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-60 shrink-0 border-r border-line bg-admin text-white md:block md:h-[calc(100vh-3.5rem)]">
      <nav className="flex h-full flex-col gap-1 p-3">
        {MENU.map((item) => {
          const Icon = item.icon;
          const active = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-white/10 font-semibold text-white"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
        <div className="mt-auto">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-white/70 hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </Button>
        </div>
      </nav>
    </aside>
  );
}
