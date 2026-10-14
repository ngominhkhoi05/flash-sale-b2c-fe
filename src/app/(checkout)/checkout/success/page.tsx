/**
 * Trang Đặt hàng thành công — `/checkout/success`.
 *
 * Theo Stitch design (docs/superpowers/handoffs/dat-hang-thanh-cong.md,
 * screen 203897a8, project 15206106541998912100).
 *
 * Layout (do `(checkout)/layout.tsx` render chung):
 *  - `<CheckoutHeader />` (dùng chung với /checkout, /checkout/qr)
 *  - `<CheckoutStepper />` 3 bước (step 3 "Hoàn tất" active)
 *  - `<main>{children}</main>` — page này render nội dung
 *  - `<CheckoutFooter />` chung
 *
 * Lưu ý:
 *  - Page là Server Component. `?orderCode=<…>` được parse ở server.
 *  - orderCode có thể là CSV nếu user đặt nhiều shop.
 *  - Thiếu orderCode → fallback mock (rule §7 "không bịa API").
 */
import { SuccessPageContent } from "@/components/storefront/checkout/SuccessPageContent";

export const metadata = {
  title: "Đặt hàng thành công – Vibe Mart",
  description: "Đơn hàng của bạn đã được đặt thành công tại Vibe Mart.",
};

type SearchParams = Promise<{ orderCode?: string | string[] }>;

export default async function CheckoutSuccessPage({
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

  return <SuccessPageContent orderCode={orderCode} />;
}
