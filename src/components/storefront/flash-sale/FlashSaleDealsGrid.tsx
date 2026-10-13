/**
 * FlashSaleDealsGrid – grid responsive 2 cột mobile / 3 tablet / 4 xl.
 *
 * Render pattern qua `renderItem` prop để caller quyết định dùng
 * FlashSaleDealCard hay variant khác. Empty state dùng EmptyState component.
 *
 * Stitch reference: trang-flash-sale.md L182-L221
 */

"use client";

import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/common/EmptyState";
import { MaterialSymbol } from "@/components/ui/material-symbol";

export interface FlashSaleDealsGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  emptyTitle?: string;
  emptyHint?: string;
  className?: string;
}

export function FlashSaleDealsGrid<T extends { id: number | string }>({
  items,
  renderItem,
  emptyTitle = "Chưa có sản phẩm trong phiên này",
  emptyHint = "Vui lòng chọn khung giờ khác hoặc quay lại sau.",
  className,
}: FlashSaleDealsGridProps<T>) {
  if (items.length === 0) {
    return (
      <div data-testid="flash-sale-deals-empty" className={className}>
        <EmptyState
          icon={<MaterialSymbol name="local_offer" size="[48px]" className="text-on-surface-variant" />}
          title={emptyTitle}
          description={emptyHint}
        />
      </div>
    );
  }

  return (
    <div
      data-testid="flash-sale-deals-grid"
      className={cn(
        "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4",
        className,
      )}
    >
      {items.map((it, i) => renderItem(it, i))}
    </div>
  );
}
