'use client';

import { MaterialSymbol } from '@/components/ui/material-symbol';

export interface OrderListEmptyProps {
  title: string;
  description: string;
  actionLabel: string;
  onAction?: () => void;
}

export function OrderListEmpty({ title, description, actionLabel, onAction }: OrderListEmptyProps) {
  return (
    <div
      className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col items-center justify-center text-center gap-space-md"
      data-testid="order-list-empty-card"
    >
      <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center">
        <MaterialSymbol name="shopping_bag" size="[40px]" className="text-on-surface-variant" />
      </div>
      <div>
        <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">{title}</h3>
        <p className="font-body-md text-body-md text-on-surface-variant mt-2 max-w-md">{description}</p>
      </div>
      {onAction && (
        <button
          type="button"
          onClick={onAction}
          className="px-5 py-2 bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg rounded-lg transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
