'use client';

import { useTranslations } from 'next-intl';
import { OrderCard, type OrderCardItem } from './OrderCard';
import { OrderCardSkeleton } from './OrderCardSkeleton';
import { OrderListEmpty } from './OrderListEmpty';
import { cn } from '@/lib/utils';

export interface OrderListCardData {
  orderId: number;
  orderCode: string;
  storeName: string;
  storeIcon?: import('@/components/ui/material-symbol').MaterialSymbolName;
  status: string;
  items: OrderCardItem[];
  totalAmount: number;
  expiresAt?: string;
  shippingCarrier?: string;
  shippingLocation?: string;
  etaText?: string;
  deliveredAt?: string;
  cancelledReason?: string;
}

export interface OrderListProps {
  orders: OrderListCardData[];
  isLoading?: boolean;
  skeletonCount?: number;
  onCancel?: (orderId: number) => void;
  onPayNow?: (orderId: number) => void;
  onContactShop?: (orderId: number) => void;
  onTrackOrder?: (orderId: number) => void;
  onReorder?: (orderId: number) => void;
  onReview?: (orderId: number) => void;
  onViewShop?: (storeId?: number) => void;
  /** Empty state — show when not loading + 0 orders. */
  emptyState?: React.ReactNode;
  className?: string;
}

export function OrderList({
  orders,
  isLoading,
  skeletonCount = 3,
  onCancel,
  onPayNow,
  onContactShop,
  onTrackOrder,
  onReorder,
  onReview,
  onViewShop,
  emptyState,
  className,
}: OrderListProps) {
  const t = useTranslations('orders');

  if (isLoading) {
    return (
      <div className={cn('flex flex-col gap-space-md', className)} data-testid="order-list-loading">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <OrderCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div data-testid="order-list-empty">
        {emptyState ?? <OrderListEmpty title={t('empty.title')} description={t('empty.description')} actionLabel={t('empty.action')} />}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-space-md', className)} data-testid="order-list">
      {orders.map((order) => (
        <OrderCard
          key={order.orderId}
          orderCode={order.orderCode}
          storeName={order.storeName}
          storeIcon={order.storeIcon}
          status={order.status}
          items={order.items}
          totalAmount={order.totalAmount}
          {...(order.expiresAt ? { expiresAt: order.expiresAt } : {})}
          {...(order.shippingCarrier ? { shippingCarrier: order.shippingCarrier } : {})}
          {...(order.shippingLocation ? { shippingLocation: order.shippingLocation } : {})}
          {...(order.etaText ? { etaText: order.etaText } : {})}
          {...(order.deliveredAt ? { deliveredAt: order.deliveredAt } : {})}
          {...(order.cancelledReason ? { cancelledReason: order.cancelledReason } : {})}
          onCancel={onCancel ? () => onCancel(order.orderId) : undefined}
          onPayNow={onPayNow ? () => onPayNow(order.orderId) : undefined}
          onContactShop={onContactShop ? () => onContactShop(order.orderId) : undefined}
          onTrackOrder={onTrackOrder ? () => onTrackOrder(order.orderId) : undefined}
          onReorder={onReorder ? () => onReorder(order.orderId) : undefined}
          onReview={onReview ? () => onReview(order.orderId) : undefined}
          onViewShop={onViewShop ? () => onViewShop() : undefined}
        />
      ))}
    </div>
  );
}
