/**
 * Trang Thanh toán (Storefront) — `/checkout`.
 *
 * Theo Stitch design (docs/superpowers/handoffs/2026-10-13-ui-code-dump.md).
 * Layout: Header + Stepper (do `(checkout)/layout.tsx` render chung) + Content (2 cột) + mobile sticky bar.
 *
 * Lưu ý:
 *  - Page nằm trong route group `(checkout)/layout.tsx` (move từ `(storefront)`
 *    để tách khỏi header/footer Storefront mặc định — tránh render trùng).
 *  - Layout cha render `<CheckoutHeader />` + `<CheckoutStepper />` + `<CheckoutFooter />` chung.
 *  - Page này chỉ render nội dung chính.
 *  - Backend hiện đang thiếu endpoint /api/v1/checkout (xem
 *    docs/superpowers/handoffs/2026-10-13-backend-gap-report.md).
 *    Khi backend sẵn sàng, set `useMockData={false}`.
 */
import { CheckoutPageContent } from "@/components/storefront/checkout/CheckoutPageContent";

export const metadata = {
  title: "Thanh toán – Vibe Mart",
  description: "Hoàn tất đơn hàng Vibe Mart của bạn.",
};

export default function CheckoutPage() {
  return <CheckoutPageContent useMockData />;
}
