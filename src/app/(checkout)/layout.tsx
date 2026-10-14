/**
 * Layout cho group (checkout) — `/checkout` và `/checkout/qr`.
 *
 * Lý do tách khỏi `(storefront)/layout.tsx`:
 *  - Checkout flow KHÔNG dùng header/footer Storefront chung
 *    (xem rule §9 bảng mục điều hướng: "header compact, ẩn bottom nav").
 *  - Mỗi trang dùng chung `CheckoutHeader` (kể cả /checkout/qr).
 *  - Layout này chỉ wrap `<CheckoutFooter>` chung + main container.
 *
 * Lưu ý:
 *  - KHÔNG render `StorefrontHeader` / `StorefrontFooter` / `MobileBottomNav`.
 *  - 2 page con tự render header riêng (vì chúng khác nhau).
 *  - `max-w-[1240px]` giữ padding desktop giống các trang storefront khác.
 */
import type { ReactNode } from "react";
import { CheckoutFooter } from "@/components/storefront/checkout/CheckoutFooter";

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1">{children}</main>
      <CheckoutFooter />
    </div>
  );
}
