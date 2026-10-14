/**
 * Trang Thanh toán ZaloPay QR — `/checkout/qr`.
 *
 * Theo Stitch design (docs/superpowers/handoffs/thanh-toan-QR-zalo.md,
 * screen 203897a8, project 15206106541998912100).
 *
 * Layout (do `(checkout)/layout.tsx` render chung):
 *  - `<CheckoutHeader />` (dùng chung với /checkout)
 *  - `<CheckoutStepper />` 3 bước (1. Giỏ hàng ✓ → 2. Đặt hàng ✓ → 3. Thanh toán ZaloPay QR)
 *  - `<main>{children}</main>` — page này render nội dung
 *  - `<CheckoutFooter />` chung
 *
 * Lưu ý:
 *  - Page là Server Component. `?orderCode=<…>` được parse ở server.
 *    Nếu thiếu / invalid → dùng mock để dev UI (rule §7 "không bịa API").
 */
import { QrPaymentPageContent } from "@/components/storefront/checkout/QrPaymentPageContent";

export const metadata = {
  title: "Thanh toán ZaloPay QR – Vibe Mart",
  description:
    "Quét mã QR ZaloPay để hoàn tất thanh toán đơn hàng Vibe Mart của bạn.",
};

type SearchParams = Promise<{ orderCode?: string | string[] }>;

export default async function CheckoutQrPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  // Next 16: searchParams là Promise.
  // - Chỉ nhận string đầu tiên nếu là array.
  // - Thiếu / invalid → dùng mock để dev UI (rule §7 "không bịa API").
  const params = searchParams ? await searchParams : undefined;
  const raw = params?.orderCode;
  const orderCode = Array.isArray(raw) ? raw[0] : raw;

  return <QrPaymentPageContent orderCode={orderCode} />;
}
