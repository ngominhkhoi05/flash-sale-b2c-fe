/**
 * StorefrontFooter – Stitch layout footer (4 columns, single source of truth).
 *
 * Pixel-match reference:
 * - Stitch project: 15206106541998912100 (Vibe Mart Marketplace UI/UX)
 * - Stitch screen: projects/.../screens/33db6dd859b643bda103e6045378886b
 *   (Trang chủ Storefront – Vibe Mart, 1280×8060 desktop)
 * - Stitch footer block: line 1352+ of the source HTML
 * - Local snapshot: tmp/stitch/footer.html
 *
 * 4 columns (lg breakpoint):
 *  1. Brand (logo + tagline + "100% Authentic" trust badge)
 *  2. Customer Care (hotline + email + 4 quick links)
 *  3. Payment & Shipping (6 payment pills + 4 shipping partner pills)
 *  4. Follow & Download App (QR placeholder + App Store + Google Play + Bộ Công Thương badge)
 *
 * Bottom bar: copyright (left) + 3 legal links (right).
 *
 * Rules applied:
 * - §3 design tokens (semantic colors only, no hex in JSX)
 * - §5 reuse (MaterialSymbol for icons)
 * - §6 labels (no English enum leaked to user)
 * - §10 a11y: <footer role="contentinfo"> + <h3> column headings + aria-label for icon-only links
 */
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { ROUTES, MAINTENANCE_FEATURE_CODES } from "@/lib/constants";

/** Payment gateway labels (display strings; no enum mapping needed). */
const PAYMENT_METHODS = ["Visa", "Mastercard", "MoMo", "ZaloPay", "VNPay", "COD"] as const;

/** Shipping partner labels (display strings). */
const SHIPPING_PARTNERS = ["GHTK", "GHN", "Viettel Post", "J&T Express"] as const;

export function StorefrontFooter() {
  const t = useTranslations();
  const tf = useTranslations("storefront.footer");
  const tfLinks = useTranslations("storefront.footer.links");

  return (
    <footer className="w-full bg-surface-container-lowest text-on-surface pt-8 pb-6 mt-12 shadow-[0_-1px_6px_rgba(0,0,0,0.03)] border-t border-surface-container">
      <div className="max-w-[1240px] mx-auto px-4 lg:px-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-8">
          {/* ── Col 1: Brand ────────────────────────────────────── */}
          <div className="flex flex-col gap-2">
            <div className="mb-2 flex items-center gap-2">
              <Image
                src="/images/vibe-mart-logo-lockup-light.png"
                alt="Vibe Mart"
                width={128}
                height={36}
                className="h-8 w-auto object-contain"
              />
            </div>
            <p className="text-body-sm text-on-surface-variant">
              {tf("tagline")}
            </p>
            <div className="mt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary-fixed/50 text-secondary text-label-sm font-semibold rounded-lg">
                <MaterialSymbol name="verified_user" size="[16px]" label="Verified" />
                {tf("trustBadge")}
              </span>
            </div>
          </div>

          {/* ── Col 2: Customer Care ────────────────────────────── */}
          <div className="flex flex-col gap-2">
            <h3 className="text-headline-sm text-on-surface mb-1 font-bold">
              {tf("colCustomerCare")}
            </h3>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <MaterialSymbol name="headset_mic" size="[18px]" className="text-primary" label="Hotline" />
                <a
                  href="tel:19008888"
                  aria-label={`${tf("hotlineLabel")}: ${tf("hotlineNumber")}`}
                  className="text-body-sm font-semibold text-primary hover:text-primary-hover transition-colors"
                >
                  {tf("hotlineLabel")}: {tf("hotlineNumber")}
                </a>
              </div>
              <div className="flex items-center gap-2 text-on-surface-variant">
                <MaterialSymbol name="mail" size="[18px]" label="Email" />
                <a
                  href={`mailto:${tf("supportEmail")}`}
                  className="text-body-sm hover:text-primary transition-colors"
                >
                  {tf("supportEmail")}
                </a>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 pt-1">
              <a
                href="/ho-tro"
                className="text-on-surface-variant hover:text-primary text-body-sm transition-colors"
              >
                {tfLinks("helpCenter")}
              </a>
              <a
                href={ROUTES.MAINTENANCE(
                  MAINTENANCE_FEATURE_CODES.HELP_SHOPPING_GUIDE,
                )}
                className="text-on-surface-variant hover:text-primary text-body-sm transition-colors"
              >
                {tfLinks("shoppingGuide")}
              </a>
              <a
                href={ROUTES.MAINTENANCE(
                  MAINTENANCE_FEATURE_CODES.HELP_SHIPPING_POLICY,
                )}
                className="text-on-surface-variant hover:text-primary text-body-sm transition-colors"
              >
                {tfLinks("shippingPolicy")}
              </a>
              <a
                href={ROUTES.MAINTENANCE(
                  MAINTENANCE_FEATURE_CODES.HELP_RETURN_POLICY,
                )}
                className="text-on-surface-variant hover:text-primary text-body-sm transition-colors"
              >
                {tfLinks("returnPolicy")}
              </a>
            </div>
          </div>

          {/* ── Col 3: Payment & Shipping ───────────────────────── */}
          <div className="flex flex-col gap-2">
            <h3 className="text-headline-sm text-on-surface mb-1 font-bold">
              {tf("colPaymentShipping")}
            </h3>
            <span className="text-label-md text-on-surface-variant font-medium">
              {tf("paymentGatewaysLabel")}
            </span>
            <div className="flex flex-wrap gap-2 mb-2">
              {PAYMENT_METHODS.map((method) => (
                <span
                  key={method}
                  className="px-2.5 py-1 bg-surface-container rounded text-label-sm text-on-surface font-semibold"
                >
                  {method}
                </span>
              ))}
            </div>
            <span className="text-label-md text-on-surface-variant font-medium mt-1">
              {tf("shippingPartnersLabel")}
            </span>
            <div className="flex flex-wrap gap-2">
              {SHIPPING_PARTNERS.map((partner) => (
                <span
                  key={partner}
                  className="px-2.5 py-1 bg-surface-container-high rounded text-label-sm text-on-surface font-semibold"
                >
                  {partner}
                </span>
              ))}
            </div>
          </div>

          {/* ── Col 4: Follow & Download App ────────────────────── */}
          <div className="flex flex-col gap-2">
            <h3 className="text-headline-sm text-on-surface mb-1 font-bold">
              {tf("colAppDownload")}
            </h3>
            <p className="text-body-sm text-on-surface-variant">
              {tf("qrAppDesc")}
            </p>
            <div className="flex items-center gap-4">
              <div
                className="w-20 h-20 bg-surface-container-high rounded-lg flex items-center justify-center text-center p-2 text-label-sm text-outline border border-surface-container"
                aria-label={tf("qrPlaceholder")}
              >
                {tf("qrPlaceholder")}
              </div>
              <div className="flex flex-col gap-1.5">
                <Link
                  href={ROUTES.MAINTENANCE(MAINTENANCE_FEATURE_CODES.APP_STORE)}
                  className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded text-label-sm cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <MaterialSymbol name="phone_iphone" size="[16px]" label="iOS" />
                  {tf("appStore")}
                </Link>
                <Link
                  href={ROUTES.MAINTENANCE(
                    MAINTENANCE_FEATURE_CODES.GOOGLE_PLAY,
                  )}
                  className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded text-label-sm cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <MaterialSymbol name="android" size="[16px]" label="Android" />
                  {tf("googlePlay")}
                </Link>
              </div>
            </div>
            <div className="mt-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-container-high text-primary rounded text-label-sm font-semibold">
                <MaterialSymbol name="verified" size="[16px]" label="Verified" />
                {tf("ministryCert")}
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom bar ──────────────────────────────────────── */}
        <div className="pt-6 border-t border-outline-variant flex flex-col sm:flex-row items-center justify-between gap-3 text-body-sm text-on-surface-variant">
          <p>{tf("copyright")}</p>
          <div className="flex items-center gap-4">
            <a href="/dieu-khoan" className="hover:text-primary transition-colors">
              {tfLinks("terms")}
            </a>
            <a href="/chinh-sach-bao-mat" className="hover:text-primary transition-colors">
              {tfLinks("privacy")}
            </a>
            <a href="/quy-che-hoat-dong" className="hover:text-primary transition-colors">
              {tfLinks("operationRules")}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
