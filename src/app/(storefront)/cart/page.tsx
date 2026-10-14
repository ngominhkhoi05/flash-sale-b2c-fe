/**
 * Trang Giỏ hàng (Storefront) — `/cart`.
 * User có thể xem giỏ hàng (trống hoặc có sản phẩm) mà không cần đăng nhập.
 * Chỉ require auth khi thực hiện action (checkout, thêm sản phẩm).
 *
 * TODO(api): khi backend cung cấp GET /api/v1/cart, tích hợp useCartItems()
 *
 * @see src/features/cart/hooks.ts – useCartItems, useCartCount
 */
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
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

export default function GioHangPage() {
  return <CartContent />;
}
