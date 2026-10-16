'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

export type OrdersTabKey = 'all' | 'pendingPayment' | 'confirmed' | 'shipping' | 'completed' | 'cancelled';

export interface OrdersTabsProps {
  activeTab: OrdersTabKey;
  onTabChange: (tab: OrdersTabKey) => void;
  /** Per-tab count badges (e.g. { pendingPayment: 3, shipping: 1 }). Hidden when 0/undefined. */
  counts?: Partial<Record<OrdersTabKey, number>>;
  className?: string;
}

const TABS: OrdersTabKey[] = ['all', 'pendingPayment', 'confirmed', 'shipping', 'completed', 'cancelled'];

/**
 * OrdersTabs – Sticky tab bar cho trang /orders.
 *
 * Maps to backend status filter:
 * - all           → no status filter
 * - pendingPayment → PENDING_PAYMENT
 * - confirmed     → CONFIRMED, PAID
 * - shipping      → SHIPPING
 * - completed     → COMPLETED, SHIPPED
 * - cancelled     → CANCELLED, CANCELLED_TIMEOUT, CANCELLED_USER
 *
 * Backend filtering happens ở OrderList layer — OrdersTabs chỉ báo tab key.
 */
export function OrdersTabs({ activeTab, onTabChange, counts, className }: OrdersTabsProps) {
  const t = useTranslations('orders.tabs');

  return (
    <div
      role="tablist"
      aria-label={t('all')}
      className={cn(
        'bg-surface-container-lowest rounded-xl shadow-sm overflow-x-auto flex items-center min-w-max border-b border-surface-container-high',
        className
      )}
    >
      {TABS.map((key) => {
        const isActive = key === activeTab;
        const count = counts?.[key];
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(key)}
            className={cn(
              'px-5 py-3.5 font-label-lg text-label-lg transition-colors flex items-center gap-1.5 border-b-2',
              isActive
                ? 'text-primary font-bold border-primary'
                : 'text-on-surface-variant hover:text-on-surface border-transparent'
            )}
          >
            <span>{t(key)}</span>
            {count !== undefined && count > 0 && (
              <span
                className={cn(
                  'w-5 h-5 rounded-full text-[11px] flex items-center justify-center font-bold',
                  isActive
                    ? 'bg-tertiary-container text-on-tertiary-container'
                    : 'bg-surface-container-high text-on-surface-variant'
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
