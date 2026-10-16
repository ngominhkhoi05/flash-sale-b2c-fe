'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AccountSidebar } from '@/components/account/AccountSidebar';
import { OrdersTabs, type OrdersTabKey } from '@/features/orders/components/OrdersTabs';
import { OrderList, type OrderListCardData } from '@/features/orders/components/OrderList';
import { ReviewProductDialog } from '@/features/orders/components/ReviewProductDialog';
import { useOrders, useCancelOrder } from '@/features/orders/hooks';
import { useAuth } from '@/hooks/useAuth';
import { MaterialSymbol } from '@/components/ui/material-symbol';
import { ApiError } from '@/lib/api';
import { ROUTES } from '@/lib/constants';
import { ORDER_STATUS } from '@/lib/constants';
import type { BackendOrderSummary, GetOrdersParams } from '@/features/orders/api';

const TAB_TO_STATUS: Partial<Record<OrdersTabKey, string>> = {
  pendingPayment: ORDER_STATUS.PENDING_PAYMENT,
  confirmed: ORDER_STATUS.CONFIRMED,
  shipping: ORDER_STATUS.SHIPPING,
  completed: ORDER_STATUS.COMPLETED,
  cancelled: ORDER_STATUS.CANCELLED,
};

function OrdersPageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6" data-testid="orders-page-skeleton">
      <div className="h-8 w-48 mb-6 animate-pulse rounded bg-surface-container" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md">
        <div className="lg:col-span-3 h-64 animate-pulse rounded-xl bg-surface-container" />
        <div className="lg:col-span-9 flex flex-col gap-space-md">
          <div className="h-14 animate-pulse rounded-xl bg-surface-container" />
          <div className="h-14 animate-pulse rounded-xl bg-surface-container" />
          <div className="h-40 animate-pulse rounded-xl bg-surface-container" />
        </div>
      </div>
    </div>
  );
}

function OrdersContent() {
  const t = useTranslations('orders');
  const tErrors = useTranslations('error');
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<OrdersTabKey>('all');
  const [search, setSearch] = useState('');
  const [reviewingOrderId, setReviewingOrderId] = useState<number | null>(null);

  const params: GetOrdersParams = useMemo(
    () => ({
      page: 0,
      size: 10,
      ...(TAB_TO_STATUS[activeTab] ? { status: TAB_TO_STATUS[activeTab] } : {}),
    }),
    [activeTab]
  );

  const { data, isLoading, isError } = useOrders(params);

  const cancelOrder = useCancelOrder({
    onSuccess: () => toast.success('Đã huỷ đơn hàng'),
    onError: (err) => {
      if (err instanceof ApiError) {
        toast.error(tErrors(err.code));
      } else {
        toast.error('Không thể huỷ đơn hàng');
      }
    },
  });

  const cards: OrderListCardData[] = useMemo(() => {
    const items = data?.items ?? [];
    return items
      .filter((o) => !search || o.orderCode.toLowerCase().includes(search.toLowerCase()))
      .map((o: BackendOrderSummary) => ({
        orderId: o.id,
        orderCode: o.orderCode,
        storeName: o.storeName,
        status: o.status,
        items: [
          {
            id: `${o.id}-summary`,
            name: `${o.totalItems} sản phẩm`,
            quantity: o.totalItems,
            price: o.totalAmount,
            thumbnail: o.thumbnail ?? undefined,
          },
        ],
        totalAmount: o.totalAmount,
        ...(o.expiresAt ? { expiresAt: o.expiresAt } : {}),
        ...(o.status === ORDER_STATUS.SHIPPING ? { shippingCarrier: 'Đang vận chuyển' } : {}),
        ...(o.status === ORDER_STATUS.COMPLETED && o.createdAt ? { deliveredAt: o.createdAt } : {}),
      }));
  }, [data, search]);

  // Tab counts: only fetch once with no status filter, count by group
  const { data: allData } = useOrders({ page: 0, size: 50 });
  const tabCounts = useMemo(() => {
    const items = allData?.items ?? [];
    return {
      all: items.length,
      pendingPayment: items.filter((o) => o.status === ORDER_STATUS.PENDING_PAYMENT).length,
      confirmed: items.filter((o) => o.status === ORDER_STATUS.CONFIRMED).length,
      shipping: items.filter((o) => o.status === ORDER_STATUS.SHIPPING).length,
      completed: items.filter((o) => o.status === ORDER_STATUS.COMPLETED).length,
      cancelled: items.filter(
        (o) =>
          o.status === ORDER_STATUS.CANCELLED ||
          o.status === ORDER_STATUS.CANCELLED_TIMEOUT ||
          o.status === ORDER_STATUS.CANCELLED_USER
      ).length,
    } as Partial<Record<OrdersTabKey, number>>;
  }, [allData]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6" data-testid="orders-page">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant mb-4">
        <a href={ROUTES.HOME} className="hover:text-primary transition-colors">
          {t('breadcrumbHome')}
        </a>
        <span className="text-outline-variant">/</span>
        <a href={ROUTES.ACCOUNT} className="hover:text-primary transition-colors">
          {t('breadcrumbAccount')}
        </a>
        <span className="text-outline-variant">/</span>
        <span className="text-on-surface font-semibold">{t('breadcrumbCurrent')}</span>
      </nav>

      <h1 className="text-2xl font-bold text-on-surface mb-6">{t('pageTitle')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md">
        {/* Sidebar */}
        <div className="lg:col-span-3">
          <AccountSidebar
            activeItem="orders"
            displayName={user?.fullName}
            email={user?.email}
          />
        </div>

        {/* Main content */}
        <section className="lg:col-span-9 flex flex-col gap-space-md">
          <OrdersTabs activeTab={activeTab} onTabChange={setActiveTab} counts={tabCounts} />

          {/* Search + time filter */}
          <div className="bg-surface-container-lowest rounded-xl p-space-sm shadow-sm flex flex-col md:flex-row gap-space-sm items-center justify-between">
            <div className="flex-1 w-full flex items-center bg-surface-container-low rounded-lg px-space-md py-1.5">
              <MaterialSymbol name="search" size="[20px]" className="text-outline mr-2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="bg-transparent w-full focus:outline-none font-body-md text-body-md text-on-surface placeholder:text-outline"
                data-testid="orders-search-input"
              />
              <button
                type="button"
                className="px-3 py-1 bg-primary text-on-primary font-label-md text-label-md rounded hover:bg-primary-container transition-colors ml-2"
                onClick={() => {
                  // search is reactive — click is a UX hint
                }}
              >
                {t('searchButton')}
              </button>
            </div>
            <div className="w-full md:w-auto flex items-center gap-2">
              <div className="flex items-center gap-1 bg-surface-container-low px-3 py-2 rounded-lg font-body-sm text-body-sm text-on-surface flex-shrink-0">
                <MaterialSymbol name="calendar_today" size="[18px]" className="text-outline" />
                <span>{t('timeFilter')}</span>
                <MaterialSymbol name="arrow_drop_down" size="[16px]" />
              </div>
            </div>
          </div>

          {/* List */}
          {isError ? (
            <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm text-center" data-testid="orders-error">
              <MaterialSymbol name="error" size="[40px]" className="text-error mx-auto" />
              <h2 className="mt-3 font-headline-sm text-headline-sm text-on-surface font-bold">
                {t('errorTitle')}
              </h2>
              <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
                {t('errorDescription')}
              </p>
            </div>
          ) : (
            <OrderList
              orders={cards}
              isLoading={isLoading}
              skeletonCount={3}
              onCancel={(id) => cancelOrder.mutate({ orderId: id })}
              onPayNow={(id) => router.push(`${ROUTES.ORDERS}/${id}`)}
              onReview={(id) => setReviewingOrderId(id)}
              onTrackOrder={(id) => router.push(`${ROUTES.ORDERS}/${id}`)}
              onViewShop={() => router.push(ROUTES.HOME)}
              emptyState={
                <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm text-center">
                  <MaterialSymbol name="shopping_bag" size="[40px]" className="text-on-surface-variant mx-auto" />
                  <h2 className="mt-3 font-headline-sm text-headline-sm text-on-surface font-bold">
                    {t('empty.title')}
                  </h2>
                  <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
                    {t('empty.description')}
                  </p>
                  <button
                    type="button"
                    onClick={() => router.push(ROUTES.HOME)}
                    className="mt-4 px-5 py-2 bg-primary text-on-primary font-label-lg text-label-lg rounded-lg hover:bg-primary-container transition-colors"
                  >
                    {t('empty.action')}
                  </button>
                </div>
              }
            />
          )}
        </section>
      </div>

      <ReviewProductDialog
        open={reviewingOrderId !== null}
        onOpenChange={(open) => !open && setReviewingOrderId(null)}
        orderId={reviewingOrderId ?? 0}
        orderCode={
          cards.find((c) => c.orderId === reviewingOrderId)?.orderCode ?? ''
        }
      />
    </div>
  );
}

export function OrdersPageClient() {
  return (
    <AuthGuard fallback={<OrdersPageSkeleton />}>
      <OrdersContent />
    </AuthGuard>
  );
}
