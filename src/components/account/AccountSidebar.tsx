'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { MaterialSymbol, type MaterialSymbolName } from '@/components/ui/material-symbol';

export type AccountSidebarItem = 'profile' | 'orders' | 'vouchers' | 'notifications' | 'seller' | 'none';

export interface AccountSidebarProps {
  activeItem?: AccountSidebarItem;
  displayName?: string;
  email?: string;
  voucherCount?: number;
  ordersCount?: number;
  className?: string;
}

interface NavItem {
  key: AccountSidebarItem;
  icon: MaterialSymbolName;
  labelKey: 'myAccount' | 'myOrders' | 'vouchers' | 'notifications' | 'sellerChannel';
  href: string;
  showHotBadge?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'profile', icon: 'person', labelKey: 'myAccount', href: '/account' },
  { key: 'orders', icon: 'shopping_bag', labelKey: 'myOrders', href: '/orders' },
  { key: 'vouchers', icon: 'confirmation_number', labelKey: 'vouchers', href: '/account/vouchers' },
  { key: 'notifications', icon: 'notifications_active', labelKey: 'notifications', href: '/account/notifications' },
  { key: 'seller', icon: 'storefront', labelKey: 'sellerChannel', href: '/seller', showHotBadge: true },
];

/**
 * Account sidebar — dùng cho các trang trong nhóm /account/**, /orders, /seller.
 * Hiển thị: header user (avatar + tên + email), reward tier, navigation list.
 *
 * NOTE: Stitch mock có accordion "Tài khoản của tôi" với sub-items (Profile, Banks, Addresses).
 * Phiên bản này flatten thành single-link — sẽ mở rộng khi có các trang con.
 */
export function AccountSidebar({
  activeItem = 'none',
  displayName,
  email,
  voucherCount,
  ordersCount,
  className,
}: AccountSidebarProps) {
  const t = useTranslations('sidebar');

  return (
    <aside className={cn('flex flex-col gap-space-sm w-full', className)}>
      {(displayName || email) && (
        <div className="bg-surface-container-lowest rounded-xl p-space-sm shadow-sm flex items-center gap-space-sm">
          <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-label-lg text-label-lg font-bold">
            {displayName?.charAt(0).toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            {displayName && (
              <p className="font-label-lg text-label-lg text-on-surface truncate">{displayName}</p>
            )}
            {email && (
              <p className="font-body-sm text-body-sm text-on-surface-variant truncate">{email}</p>
            )}
          </div>
        </div>
      )}

      <nav
        aria-label={t('nav.myAccount')}
        className="bg-surface-container-lowest rounded-xl p-space-sm shadow-sm flex flex-col gap-1"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = item.key === activeItem;
          const badge =
            item.key === 'orders' && ordersCount && ordersCount > 0
              ? ordersCount
              : item.key === 'vouchers' && voucherCount && voucherCount > 0
                ? voucherCount
                : null;

          return (
            <a
              key={item.key}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex items-center justify-between px-3 py-2.5 rounded-lg font-label-lg text-label-lg transition-colors relative',
                isActive
                  ? 'bg-primary-fixed/40 text-primary font-bold'
                  : 'text-on-surface hover:bg-surface-container-low'
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r" aria-hidden="true" />
              )}
              <span className="flex items-center gap-space-sm">
                <MaterialSymbol
                  name={item.icon as MaterialSymbolName}
                  size="[20px]"
                  fill={isActive}
                  className={isActive ? 'text-primary' : 'text-on-surface-variant'}
                />
                <span>{t(`nav.${item.labelKey}`)}</span>
              </span>
              {badge !== null ? (
                <span className="px-2 py-0.5 rounded-full bg-tertiary-container text-on-tertiary-container font-label-sm text-label-sm font-bold">
                  {badge}
                </span>
              ) : item.showHotBadge ? (
                <span className="px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed-variant font-label-sm text-label-sm font-bold uppercase tracking-wider">
                  {t('nav.sellerHot')}
                </span>
              ) : null}
            </a>
          );
        })}
      </nav>
    </aside>
  );
}
