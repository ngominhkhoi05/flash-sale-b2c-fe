/**
 * Trang Thanh toán (Storefront) — `/checkout`.
 *
 * Theo Stitch design (docs/superpowers/handoffs/2026-10-13-ui-code-dump.md).
 * Layout: CheckoutHeader (sticky) + CheckoutPageContent (2 cột) + mobile sticky bar.
 *
 * Lưu ý: Backend hiện đang thiếu endpoint /api/v1/checkout (xem
 * docs/superpowers/handoffs/2026-10-13-backend-gap-report.md).
 * Khi backend sẵn sàng, set `useMockData={false}`.
 */
import { CheckoutHeader } from "@/components/storefront/checkout/CheckoutHeader";
import { CheckoutPageContent } from "@/components/storefront/checkout/CheckoutPageContent";

export const metadata = {
  title: "Thanh toán – Vibe Mart",
  description: "Hoàn tất đơn hàng Vibe Mart của bạn.",
};

export default function CheckoutPage() {
  return (
    <>
      <CheckoutHeader />
      <CheckoutPageContent useMockData />
    </>
  );
}
