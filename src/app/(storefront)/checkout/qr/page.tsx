/**
 * Trang Thanh toán ZaloPay QR — `/checkout/qr`.
 *
 * Theo Stitch design (docs/superpowers/handoffs/thanh-toan-QR-zalo.md,
 * screen 203897a8, project 15206106541998912100).
 *
 * Layout:
 *  - Header riêng (CheckoutQrHeader, "compact" variant)
 *  - Stepper 3 bước (1. Giỏ hàng ✓ → 2. Đặt hàng ✓ → 3. Thanh toán ZaloPay QR)
 *  - Module 2 cột (Q r + countdown | order details + CTA) — `QrPaymentModule`
 *  - Footer chung
 *
 * Page là Server Component. `?orderCode=<…>` được parse ở server.
 * Nếu thiếu `orderCode` → fallback về mock để dev UI.
 */
import { CheckoutQrHeader } from "@/components/storefront/checkout/CheckoutQrHeader";
import { QrPaymentPageContent } from "@/components/storefront/checkout/QrPaymentPageContent";
import { CheckoutStepper } from "@/components/storefront/checkout/CheckoutStepper";
import { StorefrontFooter } from "@/components/storefront/StorefrontFooter";

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
      <CheckoutQrHeader />
      <main
        className="w-full pt-20 bg-background min-h-screen"
        data-testid="checkout-qr-page"
      >
        {/* Stepper 3 bước (giống Stitch mockup L9-43) */}
        <div className="max-w-[1240px] w-full mx-auto px-4 lg:px-[2rem] pt-8 pb-6">
          <div className="bg-surface-container-lowest rounded-xl shadow-sm p-4 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <CheckoutStepper />
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container text-primary font-semibold text-label-md">
              <MaterialSymbolInline name="layers" />
              <span>Gộp 2 đơn tiện lợi</span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-on-surface-variant font-normal">
                Chỉ 1 lần quét QR
              </span>
            </div>
          </div>
        </div>

        <QrPaymentPageContent orderCode={orderCode} />

        {/* Footer link tĩnh (PCI-DSS) */}
        <div className="max-w-[1240px] w-full mx-auto px-4 lg:px-[2rem] pb-12">
          <div className="bg-surface-container-low rounded-xl p-3 flex items-center justify-center gap-2 text-body-sm text-on-surface-variant">
            <MaterialSymbolInline
              name="verified_user"
              className="text-secondary"
            />
            <span>
              Thanh toán bảo mật chuẩn{" "}
              <strong className="text-secondary">PCI-DSS Level 1</strong> – mã
              hoá đầu cuối.
            </span>
          </div>
        </div>
      </main>
      <StorefrontFooter />
    </>
  );
}

// ── Inline icon helper (Server Component không cần wrapper component) ──
function MaterialSymbolInline({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <span
      className={`material-symbols-outlined text-[18px] ${className ?? ""}`}
      aria-hidden
    >
      {name}
    </span>
  );
}
