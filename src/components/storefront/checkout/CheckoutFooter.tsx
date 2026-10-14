/**
 * CheckoutFooter – footer gọn dùng chung cho flow checkout (`/checkout`, `/checkout/qr`).
 *
 * Theo Stitch design (docs/superpowers/handoffs/thanh-toan-QR-zalo.md):
 *  - Copyright + 4 link pháp lý (Điều khoản, Bảo mật, Hướng dẫn TT, Trung tâm hỗ trợ)
 *  - Badge PCI-DSS Compliant
 *
 * Khác với `StorefrontFooter` (4 columns cho trang public):
 *  - Đơn giản hơn vì checkout flow đã tập trung vào conversion
 *  - KHÔNG có link rời khỏi luồng (tránh user abandon)
 *  - Vẫn dùng design tokens từ `tailwind.config.ts`
 *
 * Server Component (không cần state, hook).
 */
import { useTranslations } from "next-intl";
import { MaterialSymbol } from "@/components/ui/material-symbol";

export function CheckoutFooter() {
  const t = useTranslations("storefront.checkout.footer");

  return (
    <footer
      className="w-full border-t border-outline-variant bg-surface-container-low shadow-[0_-1px_8px_rgba(0,0,0,0.02)]"
      data-testid="checkout-footer"
    >
      <div className="mx-auto flex max-w-[1240px] flex-col items-center justify-between gap-4 px-4 py-6 md:flex-row lg:px-8">
        {/* ── Left: copyright + PCI badge ────────────────────── */}
        <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
          <span className="text-body-sm text-on-surface-variant">
            {t("copyright")}
          </span>
          <span className="hidden h-3 w-px bg-outline-variant sm:block" />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-highest px-2.5 py-0.5 text-on-surface-variant">
            <MaterialSymbol
              name="verified_user"
              size="[14px]"
              className="text-secondary"
            />
            <span className="text-label-sm font-semibold tracking-wide">
              {t("pciBadge")}
            </span>
          </span>
        </div>

        {/* ── Right: legal links ─────────────────────────────── */}
        <nav
          className="flex flex-wrap items-center justify-center gap-4"
          aria-label="Liên kết pháp lý"
        >
          <a
            href="/terms"
            className="text-body-sm text-on-surface-variant transition-colors hover:text-on-surface"
          >
            {t("terms")}
          </a>
          <a
            href="/privacy"
            className="text-body-sm text-on-surface-variant transition-colors hover:text-on-surface"
          >
            {t("privacy")}
          </a>
          <a
            href="/payment-guide"
            className="text-body-sm text-on-surface-variant transition-colors hover:text-on-surface"
          >
            {t("paymentGuide")}
          </a>
          <a
            href="/support"
            className="text-body-sm text-on-surface-variant transition-colors hover:text-on-surface"
          >
            {t("helpCenter")}
          </a>
        </nav>
      </div>
    </footer>
  );
}
