"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Receipt,
  Zap,
  Wallet,
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
  { key: "overview", label: "Tổng quan", href: "/seller", icon: LayoutDashboard },
  { key: "products", label: "Sản phẩm", href: "/seller/products", icon: Package },
  { key: "orders", label: "Đơn hàng", href: "/seller/orders", icon: Receipt },
  { key: "flash-sale", label: "Flash Sale", href: "/seller/flash-sale", icon: Zap },
  { key: "wallet", label: "Ví & Doanh thu", href: "/seller/vi", icon: Wallet },
  { key: "settings", label: "Cài đặt shop", href: "/seller/cai-dat", icon: Settings },
];

/**
 * SellerSidebar – chỉ desktop, theme mint (token `seller`).
 * Menu khai báo trong mảng cấu hình (rule §5).
 */
export function SellerSidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-60 shrink-0 border-r border-line bg-card md:block md:h-[calc(100vh-3.5rem)]">
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
                  ? "bg-seller-soft font-semibold text-seller-hover"
                  : "text-ink-2 hover:bg-page hover:text-ink"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
        <div className="mt-auto">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-ink-2">
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </Button>
        </div>
      </nav>
    </aside>
  );
}
