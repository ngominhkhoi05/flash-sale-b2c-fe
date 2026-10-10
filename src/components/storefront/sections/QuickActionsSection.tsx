/**
 * QuickActionsSection – Stitch "6 LỐI TẮT DỊCH VỤ" (Section #2).
 *
 * Gồm 6 nút tròn với icon + label.
 * Grid: 3 cols mobile → 6 cols tablet+.
 *
 * Pixel-match reference:
 * Stitch HTML lines 78-120
 */
import Link from "next/link";
import { useTranslations } from "next-intl";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { cn } from "@/lib/utils";

interface QuickActionItem {
  icon: Parameters<typeof MaterialSymbol>[0]["name"];
  labelKey: string;
  href: string;
  iconBg: string;
  iconColor: string;
}

const QUICK_ACTIONS: QuickActionItem[] = [
  {
    icon: "bolt",
    labelKey: "quickActions.flashSale",
    href: "/flash-sale",
    iconBg: "bg-tertiary-soft",
    iconColor: "text-tertiary",
  },
  {
    icon: "confirmation_number",
    labelKey: "quickActions.voucher",
    href: "/kho-voucher",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  {
    icon: "verified",
    labelKey: "quickActions.authentic",
    href: "/danh-muc/hang-chinh-hang",
    iconBg: "bg-primary-soft",
    iconColor: "text-primary",
  },
  {
    icon: "local_shipping",
    labelKey: "quickActions.freeship",
    href: "/kho-voucher?type=freeship",
    iconBg: "bg-secondary-soft",
    iconColor: "text-secondary",
  },
  {
    icon: "store",
    labelKey: "quickActions.newShop",
    href: "/danh-muc/shop-moi",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-700",
  },
  {
    icon: "devices",
    labelKey: "quickActions.tech",
    href: "/danh-muc/dien-tu",
    iconBg: "bg-sky-100",
    iconColor: "text-primary-container",
  },
];

export function QuickActionsSection() {
  const t = useTranslations("storefront.home");
  return (
    <section className="bg-surface-container-lowest rounded-xl p-4 sm:p-6 shadow-sm">
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 sm:gap-6">
        {QUICK_ACTIONS.map((item) => (
          <Link
            key={item.icon}
            href={item.href}
            className="flex flex-col items-center text-center group cursor-pointer"
          >
            <div
              className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center",
                item.iconBg,
                item.iconColor,
                "group-hover:scale-105 group-hover:shadow-md transition-all"
              )}
            >
              <MaterialSymbol
                name={item.icon}
                size="2xl"
                fill={item.icon === "bolt" || item.icon === "confirmation_number" || item.icon === "verified"}
              />
            </div>
            <span className="mt-2 font-label-md text-label-md text-on-surface group-hover:text-primary transition-colors">
              {t(item.labelKey)}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
