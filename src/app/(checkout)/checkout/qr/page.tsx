/**
 * Trang Thanh toán ZaloPay QR — `/checkout/qr`.
 *
 * Theo Stitch design (docs/superpowers/handoffs/thanh-toan-QR-zalo.md,
 * screen 203897a8, project 15206106541998912100).
 *
 * Layout:
 *  - Dùng chung `CheckoutHeader` với /checkout (xem mục 5 `docs/CLAUDE.md` —
 *    tái sử dụng component dùng chung, không tạo header riêng cho QR)
 *  - Stepper 3 bước (1. Giỏ hàng ✓ → 2. Đặt hàng ✓ → 3. Thanh toán ZaloPay QR)
 *  - Module 2 cột (QR + countdown | order details + CTA) — `QrPaymentPageContent`
 *  - Footer chung (`CheckoutFooter`) — wrap bởi `(checkout)/layout.tsx`
 *
 * Lưu ý:
 *  - Page nằm trong route group `(checkout)/layout.tsx` (move từ `(storefront)`
 *    để tách khỏi header/footer Storefront mặc định — tránh render trùng).
 *  - Page là Server Component. `?orderCode=<…>` được parse ở server.
 *    Nếu thiếu / invalid → dùng mock để dev UI (rule §7 "không bịa API").
 */
import { CheckoutHeader } from "@/components/storefront/checkout/CheckoutHeader";
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

  return (
    <>
      <CheckoutHeader />
      {/*
        Stepper 3 bước đã có sẵn trong `CheckoutHeader` (dùng chung với /checkout
        theo mục 5 `docs/CLAUDE.md`); KHÔNG render lại ở page để tránh duplicate.
        Trước đây page có `<main>` riêng + stepper riêng → bị double stepper và
        nested `<main>` (vi phạm cấu trúc landmark). Layout `(checkout)/layout.tsx`
        đã wrap `<main>` rồi → page chỉ render fragment + nội dung.
      */}
      <QrPaymentPageContent orderCode={orderCode} />
    </>
  );
}
