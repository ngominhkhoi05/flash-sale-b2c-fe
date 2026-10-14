/**
 * Trang Đơn hàng đã hết hạn — `/checkout/expired`.
 *
 * Theo Stitch design (docs/superpowers/handoffs/don-hang-het-han.md).
 *
 * Layout (do `(checkout)/layout.tsx` render chung):
 *  - `<CheckoutHeader />` (dùng chung với /checkout, /checkout/qr, /checkout/success, /checkout/failed)
 *  - `<CheckoutStepper />` 3 bước (step 3 "Hoàn tất" active)
 *  - `<main>{children}</main>` — page này render nội dung
 *  - `<CheckoutFooter />` chung
 *
 * Lưu ý:
 *  - Page là Server Component. `?orderCode=<…>` được parse ở server.
 *  - Thiếu orderCode → fallback mock (rule §7 "không bịa API").
 *  - Đây là trang "dead-end" sau khi hold timeout (mặc định 5 phút).
 *    BE đã tự huỷ đơn + restore voucher + restock sản phẩm.
 */
import { ExpiredPageContent } from "@/components/storefront/checkout/ExpiredPageContent";

export const metadata = {
  title: "Đơn hàng đã hết hạn – Vibe Mart",
  description:
    "Đơn hàng của bạn đã hết hạn thanh toán. Vui lòng quay lại Flash Sale hoặc xem giỏ hàng để tiếp tục mua sắm.",
};

type SearchParams = Promise<{ orderCode?: string | string[] }>;

export default async function CheckoutExpiredPage({
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

  return <ExpiredPageContent orderCode={orderCode} />;
}
