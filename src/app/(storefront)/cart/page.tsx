/**
 * Trang Giỏ hàng (Storefront) — `/cart`.
 * Render CartPageContent với đầy đủ UI từ Stitch design.
 *
 * @see src/components/storefront/cart - components
 * @see src/features/cart/hooks.ts – useCartItems, useCartCount
 */
import { CartPageContent } from "@/components/storefront/cart";

export default function GioHangPage() {
  return <CartPageContent />;
}
