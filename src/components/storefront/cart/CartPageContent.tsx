/**
 * CartPageContent – layout chính của trang Giỏ hàng.
 * Kết hợp CartHeader + CartShopGroup + CartStickyFooter.
 * Hookup API backend qua useCart() + mutations.
 * Dựa trên Stitch design (docs/superpowers/plans/2026-10-13-cart-page-ui-stitch.md).
 */
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { CartHeader } from "./CartHeader";
import { CartShopGroup } from "./CartShopGroup";
import { CartStickyFooter } from "./CartStickyFooter";
import { EmptyState } from "@/components/common/EmptyState";
import {
  useCart,
  useRemoveCartItemMutation,
  useUpdateCartItemMutation,
  useClearCartMutation,
} from "@/features/cart";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/lib/constants";

export function CartPageContent() {
  const t = useTranslations("storefront.cart");
  const { isAuthenticated } = useAuth();
  const { data: cart, isLoading, isError, error, refetch } = useCart(isAuthenticated);
  const updateItem = useUpdateCartItemMutation();
  const removeItem = useRemoveCartItemMutation();
  const clearCart = useClearCartMutation();

  // State cho checkbox items
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

  // Khi cart load xong, tự động chọn tất cả items
  useMemo(() => {
    if (cart?.storeGroups) {
      const allIds = new Set<number>();
      cart.storeGroups.forEach((g) => g.items.forEach((i) => allIds.add(i.id)));
      setCheckedItems(allIds);
    }
  }, [cart?.id]);

  // Tính tổng tiền các items được chọn
  const { selectedCount, subtotal, totalCount } = useMemo(() => {
    let count = 0;
    let total = 0;
    let totalCount = 0;
    cart?.storeGroups.forEach((group) => {
      group.items.forEach((item) => {
        totalCount++;
        if (checkedItems.has(item.id)) {
          count++;
          total += item.itemSubtotal;
        }
      });
    });
    return { selectedCount: count, subtotal: total, totalCount };
  }, [cart, checkedItems]);

  // Handlers
  const handleItemCheckedChange = (itemId: number, checked: boolean) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(itemId);
      } else {
        next.delete(itemId);
      }
      return next;
    });
  };

  const handleQuantityChange = (itemId: number, quantity: number) => {
    updateItem.mutate({ itemId, payload: { quantity } });
  };

  const handleDeleteItem = (itemId: number) => {
    removeItem.mutate(itemId);
    setCheckedItems((prev) => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (!cart) return;
    const allIds = new Set<number>();
    cart.storeGroups.forEach((g) => g.items.forEach((i) => allIds.add(i.id)));
    setCheckedItems(allIds);
  };

  const handleDeselectAll = () => {
    setCheckedItems(new Set());
  };

  const handleDeleteSelected = () => {
    if (!cart) return;
    // Gọi mutation xóa từng item
    cart.storeGroups.forEach((group) => {
      group.items.forEach((item) => {
        if (checkedItems.has(item.id)) {
          removeItem.mutate(item.id);
        }
      });
    });
    setCheckedItems(new Set());
  };

  // ── Loading state ───────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100">
        <CartHeader />
        <main className="pt-36 md:pt-40 pb-24">
          <div className="max-w-[1240px] mx-auto px-4 lg:px-8 flex justify-center">
            <div className="flex flex-col items-center gap-3 py-20">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-600">{t("loading")}</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────
  if (isError) {
    return (
      <div className="min-h-screen bg-slate-100">
        <CartHeader />
        <main className="pt-36 md:pt-40 pb-24">
          <div className="max-w-[1240px] mx-auto px-4 lg:px-8">
            <EmptyState
              icon={<MaterialSymbol name="error" size="[56px]" />}
              title="Không thể tải giỏ hàng"
              description={error?.message ?? "Đã có lỗi xảy ra. Vui lòng thử lại."}
              actionLabel="Thử lại"
              onAction={() => refetch()}
            />
          </div>
        </main>
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────
  if (!cart || cart.totalItems === 0) {
    return (
      <div className="min-h-screen bg-slate-100">
        <CartHeader />
        <main className="pt-36 md:pt-40 pb-24">
          <div className="max-w-[1240px] mx-auto px-4 lg:px-8">
            <EmptyState
              icon={<MaterialSymbol name="remove_shopping_cart" size="[56px]" />}
              title={t("empty")}
              description={t("emptyDescription")}
              actionLabel={t("continueShopping")}
              onAction={() => {
                window.location.href = ROUTES.HOME;
              }}
            />
          </div>
        </main>
      </div>
    );
  }

  // ── Main content ───────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <CartHeader />

      {/* Main content */}
      <main className="pt-36 md:pt-40 pb-24">
        <div className="max-w-[1240px] mx-auto px-4 lg:px-8 space-y-4">
          {/* Breadcrumb */}
          <div className="flex items-center justify-between pb-1 text-xs">
            <nav className="flex items-center gap-1.5 text-slate-500 font-medium">
              <Link href={ROUTES.HOME} className="hover:text-primary transition-colors">
                Trang chủ
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-slate-800 font-semibold">Giỏ hàng</span>
            </nav>
          </div>

          {/* Cart content */}
          <div className="space-y-4">
            {/* Cart Header Banner */}
            <div className="bg-gradient-to-r from-sky-50 via-white to-blue-50/40 p-4 sm:p-5 rounded-xl border border-sky-100 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    Giỏ hàng
                    <span className="text-sm font-normal text-slate-500 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                      ({cart.totalItems} sản phẩm)
                    </span>
                  </h1>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                    <MaterialSymbol name="verified" size="sm" fill />
                    100% hàng chính hãng • Đổi trả miễn phí 15 ngày
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1.5 flex items-center gap-1.5">
                  <MaterialSymbol name="local_shipping" size="base" className="text-primary" />
                  <span>
                    Miễn phí vận chuyển cho đơn hàng từ{" "}
                    <strong className="text-primary">300.000₫</strong>
                  </span>
                </p>
              </div>
              {/* Grand total badge */}
              <div className="w-full md:w-auto bg-white/90 p-3 rounded-lg border border-sky-100 text-xs">
                <div className="text-[11px] text-slate-500 mb-1">
                  Tổng giá trị giỏ hàng
                </div>
                <div className="text-lg font-bold text-primary">
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(cart.grandTotal)}
                </div>
              </div>
            </div>

            {/* Column Headers (desktop) */}
            <div className="bg-surface-container-lowest rounded-xl border border-slate-200/80 shadow-xs px-4 sm:px-6 py-3.5 hidden md:grid grid-cols-12 gap-4 text-xs font-semibold text-slate-600 items-center">
              <div className="col-span-5 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="check-all-top"
                  checked={selectedCount === totalCount && totalCount > 0}
                  onChange={() =>
                    selectedCount === totalCount ? handleDeselectAll() : handleSelectAll()
                  }
                  className="w-4 h-4 rounded text-primary focus:ring-primary border-slate-300 cursor-pointer"
                />
                <label
                  htmlFor="check-all-top"
                  className="cursor-pointer select-none text-slate-800"
                >
                  Chọn tất cả ({selectedCount}/{totalCount} sản phẩm)
                </label>
              </div>
              <div className="col-span-2 text-center">Đơn giá</div>
              <div className="col-span-2 text-center">Số lượng</div>
              <div className="col-span-2 text-right">Thành tiền</div>
              <div className="col-span-1 text-center">Thao tác</div>
            </div>

            {/* Shop Groups */}
            {cart.storeGroups.map((group) => (
              <CartShopGroup
                key={group.storeId}
                storeId={group.storeId}
                storeName={group.storeName}
                items={group.items}
                checkedItems={checkedItems}
                onCheckedChange={handleItemCheckedChange}
                onQuantityChange={handleQuantityChange}
                onDeleteItem={handleDeleteItem}
              />
            ))}

            {/* Clear cart button */}
            <div className="flex justify-end">
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      "Bạn có chắc muốn xóa toàn bộ giỏ hàng?"
                    )
                  ) {
                    clearCart.mutate();
                    setCheckedItems(new Set());
                  }
                }}
                disabled={clearCart.isPending}
                className="text-xs text-slate-500 hover:text-rose-600 transition-colors font-medium disabled:opacity-50"
              >
                {clearCart.isPending ? "Đang xóa..." : "Xóa toàn bộ giỏ hàng"}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Sticky Footer */}
      <CartStickyFooter
        subtotal={subtotal}
        discount={0}
        selectedCount={selectedCount}
        totalCount={totalCount}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        onDeleteSelected={handleDeleteSelected}
      />
    </div>
  );
}
