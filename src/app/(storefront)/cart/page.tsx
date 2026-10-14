/**
 * Trang Giỏ hàng (Storefront) — `/cart`.
 * Yêu cầu đăng nhập: khi chưa auth → redirect về /login?redirect=/cart.
 * AuthGuard render skeleton khi chưa hydrated (tránh flash redirect).
 *
 * TODO(api): khi backend cung cấp GET /api/v1/cart, tích hợp useCartItems()
 *
 * @see src/features/cart/hooks.ts – useCartItems, useCartCount
 * @see src/components/auth/AuthGuard.tsx – client-side auth guard
 */
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { EmptyState } from "@/components/common/EmptyState";
import { ROUTES } from "@/lib/constants";

function CartContent() {
  const t = useTranslations("storefront.cart");

  return (
    <div className="mx-auto max-w-3xl py-8">
      <h1 className="mb-6 text-2xl font-semibold text-on-surface">{t("title")}</h1>
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
