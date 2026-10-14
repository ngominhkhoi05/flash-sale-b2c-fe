/**
 * Layout cho group (checkout) — `/checkout` và `/checkout/qr`.
 *
 * Lý do tách khỏi `(storefront)/layout.tsx`:
 *  - Checkout flow KHÔNG dùng header/footer Storefront chung
 *    (xem rule §9 bảng mục điều hướng: "header compact, ẩn bottom nav").
 *  - Layout này render header + stepper + footer chung cho cả flow checkout,
 *    các page con chỉ chứa nội dung chính (address / shop / payment / ...).
 *
 * Lưu ý:
 *  - KHÔNG render `StorefrontHeader` / `StorefrontFooter` / `MobileBottomNav`.
 *  - `CheckoutStepper` tách khỏi `<header>` (a11y: progress indicator không
 *    thuộc landmark header) — render ở layout, nằm ngay dưới header.
 *  - Header `sticky top-0` (80px) + stepper trong flow (~60px) — layout tự
 *    nhiên giữ spacing. KHÔNG cần padding-top ở main. Mọi vùng (header,
 *    stepper, page content, footer) dùng chung `max-w-[1240px] px-4
 *    lg:px-8` để thẳng hàng lề trái/phải.
 *  - `max-w-[1240px]` giữ padding desktop giống các trang storefront khác.
 */
import type { ReactNode } from "react";
import { CheckoutFooter } from "@/components/storefront/checkout/CheckoutFooter";
import { CheckoutHeader } from "@/components/storefront/checkout/CheckoutHeader";
import { CheckoutStepper } from "@/components/storefront/checkout/CheckoutStepper";

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <CheckoutHeader />
      <CheckoutStepper />
      <main className="flex-1">{children}</main>
      <CheckoutFooter />
    </div>
  );
}
