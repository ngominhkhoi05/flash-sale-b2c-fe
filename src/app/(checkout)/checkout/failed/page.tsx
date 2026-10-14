/**
 * Trang Thanh toán chưa thành công — `/checkout/failed`.
 *
 * Theo Stitch design (docs/superpowers/handoffs/thanh-toan-chua-thanh-cong.md).
 *
 * Layout (do `(checkout)/layout.tsx` render chung):
 *  - `<CheckoutHeader />` (dùng chung với /checkout, /checkout/qr, /checkout/success)
 *  - `<CheckoutStepper />` 3 bước (step 3 "Hoàn tất" active)
 *  - `<main>{children}</main>` — page này render nội dung
 *  - `<CheckoutFooter />` chung
 *
 * Lưu ý:
 *  - Page là Server Component. `?orderCode=<…>` được parse ở server.
 *  - Thiếu orderCode → fallback mock (rule §7 "không bịa API").
 */
import { FailedPageContent } from "@/components/storefront/checkout/FailedPageContent";

export const metadata = {
  title: "Thanh toán chưa thành công – Vibe Mart",
  description: "Đơn hàng của bạn chưa được thanh toán thành công. Vui lòng thử lại hoặc chọn phương thức khác.",
};

type SearchParams = Promise<{ orderCode?: string | string[] }>;

export default async function CheckoutFailedPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  // Next 16: searchParams là Promise.
  // - Chỉ nhận string đầu tiên nếu là array.
  // - Thiếu / invalid → fallback mock (rule §7).
  const params = searchParams ? await searchParams : undefined;
  const raw = params?.orderCode;
  const orderCode = Array.isArray(raw) ? raw[0] : raw;

  return <FailedPageContent orderCode={orderCode} />;
}
