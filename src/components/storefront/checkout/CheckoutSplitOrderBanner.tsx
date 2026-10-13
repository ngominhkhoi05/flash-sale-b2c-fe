/**
 * CheckoutSplitOrderBanner – banner thông báo "đơn gồm N shop → tách N đơn".
 * Stitch reference: ui-code-dump.md L120–138.
 */
"use client";

import { MaterialSymbol } from "@/components/ui/material-symbol";

interface CheckoutSplitOrderBannerProps {
  shopCount: number;
}

export function CheckoutSplitOrderBanner({
  shopCount,
}: CheckoutSplitOrderBannerProps) {
  return (
    <div
      className="w-full bg-surface-container-low rounded-xl p-4 flex items-center gap-3 shadow-sm"
      data-testid="checkout-split-order-banner"
    >
      <div className="w-9 h-9 rounded-full bg-surface-container-high text-primary flex items-center justify-center shrink-0">
        <MaterialSymbol name="info" size="xl" />
      </div>
      <p className="flex-1 font-normal text-sm text-on-surface">
        Đơn của bạn gồm sản phẩm từ{" "}
        <strong className="font-semibold text-primary">{shopCount} shop</strong>{" "}
        nên sẽ được tách thành {shopCount} đơn hàng riêng biệt nhằm tối ưu vận
        chuyển.
      </p>
    </div>
  );
}
