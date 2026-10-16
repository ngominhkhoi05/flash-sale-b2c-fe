'use client';

import { useEffect, useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { formatVND } from '@/lib/format';
import { MaterialSymbol } from '@/components/ui/material-symbol';
import { StatusBadge } from '@/components/common/StatusBadge';

export interface OrderCardItem {
  id: string;
  name: string;
  variant?: string;
  quantity: number;
  price: number;
  thumbnail?: string;
  originalPrice?: number;
  flashSaleBadge?: boolean;
}

export interface OrderCardProps {
  orderCode: string;
  storeName: string;
  storeIcon?: import('@/components/ui/material-symbol').MaterialSymbolName;
  status: string;
  items: OrderCardItem[];
  totalAmount: number;
  /** PENDING_PAYMENT — show countdown */
  expiresAt?: string;
  /** SHIPPING — show shipping notice */
  shippingCarrier?: string;
  shippingLocation?: string;
  etaText?: string;
  /** COMPLETED — show delivery confirmation */
  deliveredAt?: string;
  /** CANCELLED_TIMEOUT — show auto-cancel notice */
  cancelledReason?: string;
  onViewShop?: () => void;
  onCancel?: () => void;
  onPayNow?: () => void;
  onContactShop?: () => void;
  onTrackOrder?: () => void;
  onReorder?: () => void;
  onReview?: () => void;
  className?: string;
}

function useCountdown(targetIso?: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!targetIso) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  if (!targetIso) return null;
  const target = new Date(targetIso).getTime();
  const diff = Math.max(0, target - now);
  const totalSec = Math.floor(diff / 1000);
  const mm = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const ss = String(totalSec % 60).padStart(2, '0');
  return { text: `${mm}:${ss}`, isExpired: diff === 0 };
}

export function OrderCard({
  orderCode,
  storeName,
  storeIcon = 'storefront',
  status,
  items,
  totalAmount,
  expiresAt,
  shippingCarrier,
  shippingLocation,
  etaText,
  deliveredAt,
  cancelledReason,
  onViewShop,
  onCancel,
  onPayNow,
  onContactShop,
  onTrackOrder,
  onReorder,
  onReview,
  className,
}: OrderCardProps) {
  const t = useTranslations('orders');
  const format = useFormatter();
  const countdown = useCountdown(expiresAt);

  const showCountdown = status === 'PENDING_PAYMENT' && expiresAt && countdown && !countdown.isExpired;
  const showShipping = status === 'SHIPPING' && (shippingCarrier || etaText);
  const showCompleted = status === 'COMPLETED' && deliveredAt;
  const showCancelledNotice =
    (status === 'CANCELLED_TIMEOUT' || status === 'CANCELLED_USER') && (cancelledReason || status === 'CANCELLED_TIMEOUT');

  return (
    <article
      className={cn(
        'bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-md transition-all hover:shadow-md',
        (status === 'CANCELLED' || status === 'CANCELLED_TIMEOUT' || status === 'CANCELLED_USER') && 'opacity-90',
        className
      )}
      data-testid="order-card"
      data-status={status}
    >
      {/* Header */}
      <header className="flex items-center justify-between flex-wrap gap-2 pb-space-sm border-b border-surface-container-high">
        <div className="flex items-center gap-space-sm">
          <MaterialSymbol name={storeIcon} size="[22px]" className="text-primary" />
          <span className="font-headline-sm text-headline-sm text-on-surface font-bold">{storeName}</span>
          <button
            type="button"
            onClick={onViewShop}
            className="px-2.5 py-1 bg-surface-container-low text-on-surface-variant hover:text-primary font-label-sm text-label-sm rounded transition-colors flex items-center gap-1"
          >
            <span>{t('viewShop')}</span>
            <MaterialSymbol name="arrow_forward" size="[14px]" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge type="order" status={status} />
        </div>
      </header>

      <p className="font-body-sm text-body-sm text-on-surface-variant" data-testid="order-code">
        #{orderCode}
      </p>

      {/* Items */}
      <div className="flex flex-col gap-space-sm">
        {items.map((item, idx) => (
          <div
            key={item.id}
            className={cn(
              'flex items-center justify-between gap-space-md',
              idx > 0 && 'pt-2 border-t border-surface-container-low'
            )}
          >
            <div className="flex items-center gap-space-md min-w-0">
              {item.thumbnail && (
                <Image
                  src={item.thumbnail}
                  alt={item.name}
                  width={72}
                  height={72}
                  className="w-[72px] h-[72px] object-cover rounded-lg flex-shrink-0 shadow-sm"
                />
              )}
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {item.flashSaleBadge && (
                    <span className="px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed-variant font-label-sm text-label-sm font-bold">
                      Flash Sale
                    </span>
                  )}
                  <h4 className="font-label-lg text-label-lg text-on-surface truncate">{item.name}</h4>
                </div>
                {item.variant && (
                  <span className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                    {t('itemVariant', { variant: item.variant })}
                  </span>
                )}
                <span className="font-label-sm text-label-sm text-outline mt-0.5">
                  {t('itemQty', { count: item.quantity })}
                </span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <span className={cn('font-price-md text-price-md', item.originalPrice ? 'text-tertiary' : 'text-on-surface')}>
                {formatVND(item.price)}
              </span>
              {item.originalPrice !== undefined && item.originalPrice > item.price && (
                <span className="font-body-sm text-body-sm text-outline line-through block">
                  {formatVND(item.originalPrice)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Countdown (PENDING_PAYMENT) */}
      {showCountdown && (
        <div
          className="bg-error-container/60 rounded-lg p-space-sm flex items-center gap-space-sm text-on-error-container"
          data-testid="countdown"
        >
          <MaterialSymbol name="hourglass_top" size="[20px]" className="text-error" />
          <p className="font-body-sm text-body-sm text-error font-medium flex-1">
            {t('countdown.expiresIn', { time: countdown?.text ?? '' })}
          </p>
        </div>
      )}

      {/* Shipping notice */}
      {showShipping && (
        <div className="bg-surface-container-low rounded-lg p-space-sm flex items-center justify-between gap-space-sm flex-wrap">
          <div className="flex items-center gap-space-sm text-on-surface">
            <div className="w-8 h-8 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed">
              <MaterialSymbol name="near_me" size="[18px]" />
            </div>
            <div className="flex flex-col">
              {shippingCarrier && (
                <span className="font-label-md text-label-md font-semibold text-secondary">
                  {t('shippingNotice', { carrier: shippingCarrier, location: shippingLocation ?? '' })}
                </span>
              )}
              {etaText && (
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  {t('eta', { time: etaText })}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Completed notice */}
      {showCompleted && (
        <div
          className="bg-surface-container-low rounded-lg p-space-sm flex items-center gap-space-sm text-on-surface-variant"
          data-testid="completed-notice"
        >
          <MaterialSymbol name="task_alt" size="[20px]" className="text-secondary" />
          <p className="font-body-sm text-body-sm">
            {t('completedNotice', { time: format.dateTime(new Date(deliveredAt)) })}
          </p>
        </div>
      )}

      {/* Cancelled notice */}
      {showCancelledNotice && (
        <div
          className="bg-surface-container-low rounded-lg p-space-sm flex items-center gap-space-sm text-on-surface-variant"
          data-testid="cancelled-notice"
        >
          <MaterialSymbol name="info" size="[20px]" className="text-outline" />
          <p className="font-body-sm text-body-sm">{cancelledReason || t('cancelledNotice')}</p>
        </div>
      )}

      {/* Footer */}
      <footer className="flex items-center justify-between flex-wrap gap-space-md pt-space-xs border-t border-surface-container-high">
        <div className="flex items-baseline gap-2">
          <span className="font-body-md text-body-md text-on-surface-variant">{t('totalPayment')}</span>
          <span
            className={cn(
              'font-display-lg text-headline-lg font-bold',
              status === 'CANCELLED' || status === 'CANCELLED_TIMEOUT' || status === 'CANCELLED_USER'
                ? 'text-outline line-through'
                : status === 'PENDING_PAYMENT'
                  ? 'text-tertiary'
                  : 'text-on-surface'
            )}
            data-testid="total-amount"
          >
            {formatVND(totalAmount)}
          </span>
        </div>
        <div className="flex items-center gap-space-sm flex-wrap">
          {status === 'PENDING_PAYMENT' && (
            <>
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 bg-surface-container-low text-on-surface hover:bg-surface-container font-label-lg text-label-lg rounded-lg transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={onPayNow}
                className="px-5 py-2 bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg rounded-lg shadow-sm transition-transform active:scale-95 flex items-center gap-1.5"
              >
                <MaterialSymbol name="credit_card" size="[18px]" />
                <span>{t('payNow')}</span>
              </button>
            </>
          )}
          {status === 'SHIPPING' && (
            <>
              <button
                type="button"
                onClick={onContactShop}
                className="px-4 py-2 bg-surface-container-low text-on-surface hover:bg-surface-container font-label-lg text-label-lg rounded-lg transition-colors flex items-center gap-1"
              >
                <MaterialSymbol name="chat" size="[16px]" />
                <span>{t('contactShop')}</span>
              </button>
              <button
                type="button"
                onClick={onTrackOrder}
                className="px-4 py-2 bg-surface-container-high text-on-surface hover:bg-surface-variant font-label-lg text-label-lg rounded-lg transition-colors flex items-center gap-1"
              >
                <MaterialSymbol name="map" size="[16px]" />
                <span>{t('trackOrder')}</span>
              </button>
            </>
          )}
          {status === 'COMPLETED' && (
            <>
              <button
                type="button"
                onClick={onReorder}
                className="px-4 py-2 bg-surface-container-low text-on-surface hover:bg-surface-container font-label-lg text-label-lg rounded-lg transition-colors"
              >
                {t('reorder')}
              </button>
              <button
                type="button"
                onClick={onReview}
                className="px-5 py-2 bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                data-testid="review-trigger"
              >
                <MaterialSymbol name="rate_review" size="[18px]" />
                <span>{t('reviewNow')}</span>
              </button>
            </>
          )}
          {(status === 'CANCELLED' || status === 'CANCELLED_TIMEOUT' || status === 'CANCELLED_USER') && (
            <button
              type="button"
              onClick={onReorder}
              className="px-4 py-2 bg-surface-container-low text-on-surface hover:bg-surface-container font-label-lg text-label-lg rounded-lg transition-colors"
            >
              {t('reorder')}
            </button>
          )}
          {status === 'CONFIRMED' && (
            <button
              type="button"
              onClick={onTrackOrder}
              className="px-4 py-2 bg-surface-container-low text-on-surface hover:bg-surface-container font-label-lg text-label-lg rounded-lg transition-colors"
            >
              {t('trackOrder')}
            </button>
          )}
        </div>
      </footer>
    </article>
  );
}
