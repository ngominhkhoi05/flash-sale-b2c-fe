/**
 * Trang Giỏ hàng (Storefront) — `/cart`.
 * Subplan B (2026-10-18): wire real cart API.
 *
 * Auth: AuthGuard yêu cầu login. Khi chưa auth → redirect /login?redirect=/cart.
 *
 * States: loading (skeleton), error (retry), empty (EmptyState), has-items (list).
 *
 * @see src/features/cart/hooks.ts – useCart, useUpdateCartItem, useRemoveCartItem
 * @see src/components/auth/AuthGuard.tsx – client-side auth guard
 * @see src/components/storefront/cart/CartStoreGroupCard.tsx
 * @see src/components/storefront/cart/CartSummary.tsx
 */
"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { toast } from "sonner";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { Button } from "@/components/ui/button";
import { CartStoreGroupCard } from "@/components/storefront/cart/CartStoreGroupCard";
import { CartSummary } from "@/components/storefront/cart/CartSummary";
import {
  useCart,
  useRemoveCartItem,
  useUpdateCartItem,
} from "@/features/cart";
import { ROUTES } from "@/lib/constants";
import { ApiError } from "@/lib/api/client";

function CartContent() {
  const t = useTranslations("storefront.cart");
  const router = useRouter();
  const cartQuery = useCart();
  const updateMut = useUpdateCartItem({
    onError: (err) => {
      if (err instanceof ApiError) {
        const translated = t(`toast.cartError.${err.code}`, {
          defaultValue: t("toast.cartError.GENERIC"),
        });
        toast.error(translated);
      } else {
        toast.error(t("toast.cartError.GENERIC"));
      }
    },
  });
  const removeMut = useRemoveCartItem({
    onError: (err) => {
      if (err instanceof ApiError) {
        toast.error(
          t(`toast.cartError.${err.code}`, {
            defaultValue: t("toast.cartError.GENERIC"),
          }),
        );
      } else {
        toast.error(t("toast.cartError.GENERIC"));
      }
    },
  });

  const data = cartQuery.data;
  const isLoading = cartQuery.isLoading;
  const isError = cartQuery.isError;
  const storeGroups = data?.storeGroups ?? [];
  const totalItems = data?.totalItems ?? 0;
  const grandTotal = data?.grandTotal ?? 0;
  const storeCount = storeGroups.length;

  const isMutating = updateMut.isPending || removeMut.isPending;

  const hasItems = useMemo(
    () => !isLoading && !isError && totalItems > 0,
    [isLoading, isError, totalItems],
  );

  // ── Handlers ────────────────────────────────────────────────────
  function handleUpdateQty(itemId: number, quantity: number) {
    if (quantity < 1) {
      handleRemoveItem(itemId);
      return;
    }
    updateMut.mutate({ itemId, quantity });
  }

  function handleRemoveItem(itemId: number) {
    removeMut.mutate({ itemId });
  }

  function handleCheckout() {
    router.push(ROUTES.CHECKOUT);
  }

  function handleRetry() {
    cartQuery.refetch();
  }

  // ── Error state ─────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="mx-auto max-w-3xl py-8">
        <h1 className="mb-6 text-2xl font-semibold text-on-surface">
          {t("title")}
        </h1>
        <ErrorState
          title={t("errorTitle")}
          message={t("errorDescription")}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  // ── Empty state ─────────────────────────────────────────────────
  if (!hasItems) {
    return (
      <div className="mx-auto max-w-3xl py-8">
        <h1 className="mb-6 text-2xl font-semibold text-on-surface">
          {t("title")}
        </h1>
        <EmptyState
          icon={<ShoppingCart className="h-6 w-6" aria-hidden />}
          title={t("empty")}
          description={t("emptyDescription")}
          actionLabel={t("continueShopping")}
          onAction={undefined}
        />
        <div className="mt-6 text-center">
          <Link
            href={ROUTES.HOME}
            className="text-sm font-semibold text-primary hover:underline"
          >
            ← {t("continueShopping")}
          </Link>
        </div>
      </div>
    );
  }

  // ── Has-items state ─────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-semibold text-on-surface">
        {t("title")}
      </h1>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: store groups */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          {storeGroups.map((group) => (
            <CartStoreGroupCard
              key={group.storeId}
              group={group}
              isLoading={isMutating}
              onUpdateQty={handleUpdateQty}
              onRemoveItem={handleRemoveItem}
            />
          ))}
        </div>

        {/* Right: sticky summary */}
        <div className="lg:col-span-1">
          <CartSummary
            totalItems={totalItems}
            grandTotal={grandTotal}
            storeCount={storeCount}
            isSubmitting={false}
            onCheckout={handleCheckout}
          />
        </div>
      </div>

      {/* Mobile sticky checkout button */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-outline-variant bg-surface-container-lowest p-3 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] text-outline uppercase">{t("grandTotal")}</p>
            <p className="text-lg font-bold text-primary tabular-nums">
              {grandTotal.toLocaleString("vi-VN")}₫
            </p>
          </div>
          <Button
            onClick={handleCheckout}
            disabled={totalItems === 0}
            className="h-11 flex-1 max-w-[180px]"
          >
            {t("checkout")}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Skeleton fallback cho AuthGuard khi chưa hydration. */
function CartSkeleton() {
  return (
    <div
      className="mx-auto max-w-3xl py-8 animate-pulse"
      data-testid="cart-skeleton"
    >
      <div className="mb-6 h-8 w-48 rounded bg-surface-container" />
      <div className="space-y-3">
        <div className="h-20 rounded-lg bg-surface-container" />
        <div className="h-20 rounded-lg bg-surface-container" />
        <div className="h-20 rounded-lg bg-surface-container" />
      </div>
    </div>
  );
}

export default function GioHangPage() {
  return (
    <AuthGuard fallback={<CartSkeleton />}>
      <CartContent />
    </AuthGuard>
  );
}
