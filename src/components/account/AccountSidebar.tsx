'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { MaterialSymbol, type MaterialSymbolName } from '@/components/ui/material-symbol';

export type AccountSidebarItem =
  | 'profile'
  | 'addresses'
  | 'linked'
  | 'password'
  | 'orders'
  | 'vouchers'
  | 'notifications'
  | 'seller'
  | 'none';

export interface AccountSidebarProps {
  activeItem?: AccountSidebarItem;
  displayName?: string;
  email?: string;
  avatarUrl?: string | null;
  voucherCount?: number;
  ordersCount?: number;
  className?: string;
}

const ACCOUNT_SUB_ITEMS: {
  key: AccountSidebarItem;
  label: string;
  href: string;
  icon: MaterialSymbolName;
}[] = [
  { key: 'profile', label: 'Hồ sơ', href: '/account?tab=profile', icon: 'badge' },
  { key: 'addresses', label: 'Sổ địa chỉ', href: '/account?tab=addresses', icon: 'location_on' },
  { key: 'linked', label: 'Liên kết tài khoản', href: '/account?tab=linked', icon: 'link' },
  { key: 'password', label: 'Đổi mật khẩu', href: '/account?tab=password', icon: 'lock_reset' },
];

/**
 * Account sidebar — dùng cho các trang trong nhóm /account/**, /orders, /seller.
 * Hiển thị: header user (avatar + tên + email), navigation list kèm sub-items.
 */
export function AccountSidebar({
  activeItem = 'none',
  displayName,
  email,
  avatarUrl,
  voucherCount,
  ordersCount,
  className,
}: AccountSidebarProps) {
  const t = useTranslations('sidebar');
  const isAccountActive = ['profile', 'addresses', 'linked', 'password'].includes(activeItem);
  const [isAccountOpen, setIsAccountOpen] = useState(true);

  return (
    <aside className={cn('flex flex-col gap-space-sm w-full select-none', className)}>
      {(displayName || email) && (
        <div className="bg-surface-container-lowest rounded-xl p-space-sm shadow-xs border border-outline-variant/30 flex items-center gap-space-sm">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName || 'User Avatar'}
              width={48}
              height={48}
              unoptimized
              className="w-12 h-12 rounded-full object-cover border border-outline-variant"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-label-lg text-label-lg font-bold">
              {displayName?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            {displayName && (
              <p className="font-label-lg text-label-lg text-on-surface truncate font-semibold">
                {displayName}
              </p>
            )}
            {email && (
              <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                {email}
              </p>
            )}
          </div>
        </div>
      )}

      <nav
        aria-label={t('nav.myAccount')}
        className="bg-surface-container-lowest rounded-xl p-space-sm shadow-xs border border-outline-variant/30 flex flex-col gap-1"
      >
        {/* Nhóm: Tài khoản của tôi (Accordion) */}
        <div className="flex flex-col">
          <button
            type="button"
            onClick={() => setIsAccountOpen((prev) => !prev)}
            className={cn(
              'w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-label-lg text-label-lg transition-colors text-left',
              isAccountActive
                ? 'text-primary font-bold'
                : 'text-on-surface hover:bg-surface-container-low'
            )}
          >
            <span className="flex items-center gap-space-sm">
              <MaterialSymbol
                name="person"
                size="[20px]"
                fill={isAccountActive}
                className={isAccountActive ? 'text-primary' : 'text-on-surface-variant'}
              />
              <span>{t('nav.myAccount')}</span>
            </span>
            <MaterialSymbol
              name={isAccountOpen ? 'expand_less' : 'expand_more'}
              size="[20px]"
              className="text-on-surface-variant transition-transform"
            />
          </button>

          {/* Sub-items của Tài khoản của tôi */}
          {isAccountOpen && (
            <div className="ml-4 pl-3 border-l-2 border-outline-variant/40 flex flex-col gap-1 my-1">
              {ACCOUNT_SUB_ITEMS.map((sub) => {
                const isSubActive = activeItem === sub.key;
                return (
                  <Link
                    key={sub.key}
                    href={sub.href}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-sm transition-colors flex items-center gap-2',
                      isSubActive
                        ? 'bg-primary-fixed/40 text-primary font-bold'
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                    )}
                  >
                    <MaterialSymbol
                      name={sub.icon}
                      size="[16px]"
                      className={isSubActive ? 'text-primary' : 'text-outline'}
                    />
                    <span>{sub.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Đơn mua */}
        <Link
          href="/orders"
          aria-current={activeItem === 'orders' ? 'page' : undefined}
          className={cn(
            'flex items-center justify-between px-3 py-2.5 rounded-lg font-label-lg text-label-lg transition-colors relative',
            activeItem === 'orders'
              ? 'bg-primary-fixed/40 text-primary font-bold'
              : 'text-on-surface hover:bg-surface-container-low'
          )}
        >
          {activeItem === 'orders' && (
            <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r" aria-hidden="true" />
          )}
          <span className="flex items-center gap-space-sm">
            <MaterialSymbol
              name="shopping_bag"
              size="[20px]"
              fill={activeItem === 'orders'}
              className={activeItem === 'orders' ? 'text-primary' : 'text-on-surface-variant'}
            />
            <span>{t('nav.myOrders')}</span>
          </span>
          {ordersCount && ordersCount > 0 ? (
            <span className="px-2 py-0.5 rounded-full bg-tertiary-container text-on-tertiary-container font-label-sm text-label-sm font-bold">
              {ordersCount}
            </span>
          ) : null}
        </Link>

        {/* Kho voucher */}
        <Link
          href="/account/vouchers"
          aria-current={activeItem === 'vouchers' ? 'page' : undefined}
          className={cn(
            'flex items-center justify-between px-3 py-2.5 rounded-lg font-label-lg text-label-lg transition-colors relative',
            activeItem === 'vouchers'
              ? 'bg-primary-fixed/40 text-primary font-bold'
              : 'text-on-surface hover:bg-surface-container-low'
          )}
        >
          {activeItem === 'vouchers' && (
            <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r" aria-hidden="true" />
          )}
          <span className="flex items-center gap-space-sm">
            <MaterialSymbol
              name="confirmation_number"
              size="[20px]"
              fill={activeItem === 'vouchers'}
              className={activeItem === 'vouchers' ? 'text-primary' : 'text-on-surface-variant'}
            />
            <span>{t('nav.vouchers')}</span>
          </span>
          {voucherCount && voucherCount > 0 ? (
            <span className="px-2 py-0.5 rounded-full bg-tertiary-container text-on-tertiary-container font-label-sm text-label-sm font-bold">
              {voucherCount}
            </span>
          ) : null}
        </Link>

        {/* Thông báo */}
        <Link
          href="/account/notifications"
          aria-current={activeItem === 'notifications' ? 'page' : undefined}
          className={cn(
            'flex items-center justify-between px-3 py-2.5 rounded-lg font-label-lg text-label-lg transition-colors relative',
            activeItem === 'notifications'
              ? 'bg-primary-fixed/40 text-primary font-bold'
              : 'text-on-surface hover:bg-surface-container-low'
          )}
        >
          {activeItem === 'notifications' && (
            <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r" aria-hidden="true" />
          )}
          <span className="flex items-center gap-space-sm">
            <MaterialSymbol
              name="notifications_active"
              size="[20px]"
              fill={activeItem === 'notifications'}
              className={activeItem === 'notifications' ? 'text-primary' : 'text-on-surface-variant'}
            />
            <span>{t('nav.notifications')}</span>
          </span>
        </Link>

        {/* Đăng ký bán hàng (Kênh Người Bán) */}
        <Link
          href="/seller/register"
          aria-current={activeItem === 'seller' ? 'page' : undefined}
          className={cn(
            'flex items-center justify-between px-3 py-2.5 rounded-lg font-label-lg text-label-lg transition-colors relative',
            activeItem === 'seller'
              ? 'bg-primary-fixed/40 text-primary font-bold'
              : 'text-on-surface hover:bg-surface-container-low'
          )}
        >
          {activeItem === 'seller' && (
            <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r" aria-hidden="true" />
          )}
          <span className="flex items-center gap-space-sm">
            <MaterialSymbol
              name="storefront"
              size="[20px]"
              fill={activeItem === 'seller'}
              className={activeItem === 'seller' ? 'text-primary' : 'text-on-surface-variant'}
            />
            <span>{t('nav.sellerChannel')}</span>
          </span>
          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            {t('nav.sellerHot')}
          </span>
        </Link>
      </nav>
    </aside>
  );
}
