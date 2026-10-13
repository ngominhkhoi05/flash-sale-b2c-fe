/**
 * CartPageContent – layout chính của trang Giỏ hàng.
 * Kết hợp CartHeader + CartShopGroup + CartStickyFooter.
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
import type { CartItem } from "@/features/cart/types";
import { ROUTES } from "@/lib/constants";

// ============================================================
// Mock data for development (sẽ thay bằng API call khi backend ready)
// ============================================================
const MOCK_CART_ITEMS: CartItem[] = [
  {
    id: "item-1",
    productId: "prod-1",
    productName: "Áo thun unisex cotton 100% UTC Basic form rộng thoáng mát",
    imageUrl: "https://picsum.photos/seed/shirt/200/200",
    variantLabel: "Đen, M",
    quantity: 2,
    unitPrice: 149000,
    originalPrice: 189000,
    storeId: "shop-1",
    storeName: "UTC Fashion",
    inStock: true,
  },
  {
    id: "item-2",
    productId: "prod-2",
    productName: "Áo khoác dù gió thể thao 2 lớp cản gió chống thấm nước cao cấp",
    imageUrl: "https://picsum.photos/seed/jacket/200/200",
    variantLabel: "Xanh navy, L",
    quantity: 1,
    unitPrice: 265000,
    originalPrice: 330000,
    storeId: "shop-1",
    storeName: "UTC Fashion",
    inStock: true,
  },
  {
    id: "item-3",
    productId: "prod-3",
    productName: "Quần short thể thao nam co giãn 4 chiều kháng khuẩn",
    imageUrl: "https://picsum.photos/seed/shorts/200/200",
    variantLabel: "Xám, XL",
    quantity: 1,
    unitPrice: 120000,
    originalPrice: 150000,
    storeId: "shop-1",
    storeName: "UTC Fashion",
    inStock: true,
  },
  {
    id: "item-4",
    productId: "prod-4",
    productName: "Tai nghe True Wireless ANC thể thao chống ồn chủ động",
    imageUrl: "https://picsum.photos/seed/earbuds/200/200",
    variantLabel: "Trắng ngọc",
    quantity: 1,
    unitPrice: 299000,
    originalPrice: 550000,
    storeId: "shop-2",
    storeName: "TechZone Official",
    inStock: true,
  },
  {
    id: "item-5",
    productId: "prod-5",
    productName: "Tai nghe chụp tai Bluetooth khử tiếng ồn Gaming RGB Vibe Pro",
    imageUrl: "https://picsum.photos/seed/headphone/200/200",
    variantLabel: "Đen Titan",
    quantity: 1,
    unitPrice: 385000,
    originalPrice: 520000,
    storeId: "shop-2",
    storeName: "TechZone Official",
    inStock: true,
  },
];

// ============================================================
// Component
// ============================================================
export function CartPageContent() {
  const t = useTranslations("storefront.cart");
  
  // TODO: Khi backend API ready, thay bằng useCartItems() hook
  // const { data: cartItems = [], isLoading } = useCartItems();
  const isLoading = false;
  const cartItems = MOCK_CART_ITEMS;

  // State cho checkbox items
  const [checkedItems, setCheckedItems] = useState<Set<string>>(
    new Set(cartItems.map((item) => item.id))
  );
  const [hasVoucherApplied] = useState(true); // TODO: khi nào có API voucher

  // Group items by shop
  const shopGroups = useMemo(() => {
    const groups = new Map<string, { shopName: string; isMall: boolean; items: CartItem[] }>();
    
    cartItems.forEach((item) => {
      const existing = groups.get(item.storeId);
      if (existing) {
        existing.items.push(item);
      } else {
        // Mock isMall based on shop name (hoặc có thể thêm field isMall vào CartItem)
        const isMall = item.storeName.includes("Official") || item.storeName.includes("Mall");
        groups.set(item.storeId, {
          shopName: item.storeName,
          isMall,
          items: [item],
        });
      }
    });
    
    return Array.from(groups.entries()).map(([shopId, group]) => ({
      shopId,
      ...group,
    }));
  }, [cartItems]);

  // Calculate totals
  const { selectedCount, subtotal, discount } = useMemo(() => {
    let count = 0;
    let total = 0;
    let saved = 0;

    cartItems.forEach((item) => {
      if (checkedItems.has(item.id)) {
        count++;
        total += item.unitPrice * item.quantity;
        if (item.originalPrice) {
          saved += (item.originalPrice - item.unitPrice) * item.quantity;
        }
      }
    });

    return { selectedCount: count, subtotal: total, discount: saved };
  }, [cartItems, checkedItems]);

  // Handlers
  const handleItemCheckedChange = (itemId: string, checked: boolean) => {
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

  const handleQuantityChange = (itemId: string, quantity: number) => {
    // TODO: Gọi API update quantity
    console.log("Update quantity:", itemId, quantity);
  };

  const handleDeleteItem = (itemId: string) => {
    // TODO: Gọi API delete item
    console.log("Delete item:", itemId);
    setCheckedItems((prev) => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
  };

  const handleSelectAll = () => {
    setCheckedItems(new Set(cartItems.map((item) => item.id)));
  };

  const handleDeselectAll = () => {
    setCheckedItems(new Set());
  };

  const handleDeleteSelected = () => {
    // TODO: Gọi API delete multiple items
    console.log("Delete selected:", Array.from(checkedItems));
    setCheckedItems(new Set());
  };

  // Empty state
  if (!isLoading && cartItems.length === 0) {
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
          <div className="space-y-4" id="cart-content-view">
            {/* Cart Header Banner */}
            <div className="bg-gradient-to-r from-sky-50 via-white to-blue-50/40 p-4 sm:p-5 rounded-xl border border-sky-100 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    Giỏ hàng
                    <span className="text-sm font-normal text-slate-500 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                      ({cartItems.length} sản phẩm)
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
              {/* Freeship progress */}
              <div className="w-full md:w-64 bg-white/90 p-2.5 rounded-lg border border-sky-100 text-xs">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-medium text-slate-600">Tiến độ nhận Freeship Extra:</span>
                  <span className="font-bold text-emerald-600">Đã đạt!</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full w-full" />
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Đã áp dụng mã vận chuyển giảm tối đa 30.000₫
                </div>
              </div>
            </div>

            {/* Column Headers (desktop) */}
            <div className="bg-surface-container-lowest rounded-xl border border-slate-200/80 shadow-xs px-4 sm:px-6 py-3.5 hidden md:grid grid-cols-12 gap-4 text-xs font-semibold text-slate-600 items-center">
              <div className="col-span-5 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="check-all-top"
                  checked={selectedCount === cartItems.length}
                  onChange={() => (selectedCount === cartItems.length ? handleDeselectAll() : handleSelectAll())}
                  className="w-4 h-4 rounded text-primary focus:ring-primary border-slate-300 cursor-pointer"
                />
                <label htmlFor="check-all-top" className="cursor-pointer select-none text-slate-800">
                  Chọn tất cả ({selectedCount}/{cartItems.length} sản phẩm)
                </label>
              </div>
              <div className="col-span-2 text-center">Đơn giá</div>
              <div className="col-span-2 text-center">Số lượng</div>
              <div className="col-span-2 text-right">Thành tiền</div>
              <div className="col-span-1 text-center">Thao tác</div>
            </div>

            {/* Shop Groups */}
            {shopGroups.map((group) => (
              <CartShopGroup
                key={group.shopId}
                shopId={group.shopId}
                shopName={group.shopName}
                isMall={group.isMall}
                items={group.items}
                checkedItems={checkedItems}
                onCheckedChange={handleItemCheckedChange}
                onQuantityChange={handleQuantityChange}
                onDeleteItem={handleDeleteItem}
                shopVoucher={
                  group.shopId === "shop-1"
                    ? { code: "UTC15", discountLabel: "Giảm 15k đơn 250k" }
                    : { code: "TECH30", discountLabel: "Giảm 30k đơn 500k" }
                }
              />
            ))}
          </div>
        </div>
      </main>

      {/* Sticky Footer */}
      <CartStickyFooter
        totalItems={cartItems.length}
        subtotal={subtotal}
        discount={discount}
        selectedCount={selectedCount}
        totalCount={cartItems.length}
        hasVoucherApplied={hasVoucherApplied}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        onDeleteSelected={handleDeleteSelected}
      />
    </div>
  );
}
