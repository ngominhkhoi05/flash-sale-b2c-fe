/**
 * StorefrontFooter – Stitch layout footer.
 * - 4 cột grid: brand+tagline, customer care, about us, payment
 * - Bottom: certification + copyright
 *
 * Pixel-match reference:
 * Stitch HTML line 1352+
 */
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/lib/constants";

/**
 * Internal links – dùng key i18n để dễ migrate en.
 */
const FOOTER_COLUMNS = [
  {
    titleKey: "storefront.footer.colCustomerCare",
    links: [
      { labelKey: "storefront.footer.links.helpCenter", href: "/ho-tro" },
      { labelKey: "storefront.footer.links.shoppingGuide", href: "/ho-tro/huong-dan-mua-hang" },
      { labelKey: "storefront.footer.links.shippingPolicy", href: "/ho-tro/chinh-sach-van-chuyen" },
      { labelKey: "storefront.footer.links.returnPolicy", href: "/ho-tro/chinh-sach-doi-tra" },
      { labelKey: "storefront.footer.links.paymentGuide", href: "/ho-tro/huong-dan-thanh-toan" },
    ],
  },
  {
    titleKey: "storefront.footer.colAboutUs",
    links: [
      { labelKey: "storefront.footer.links.aboutUs", href: "/gioi-thieu" },
      { labelKey: "storefront.footer.links.termsOfUse", href: "/dieu-khoan" },
      { labelKey: "storefront.footer.links.privacyPolicy", href: "/chinh-sach-bao-mat" },
      { labelKey: "storefront.footer.links.careers", href: "/tuyen-dung" },
      { labelKey: "storefront.footer.links.press", href: "/tin-tuc" },
    ],
  },
  {
    titleKey: "storefront.footer.colPayment",
    links: [
      { labelKey: "nav.voucher", href: ROUTES.VOUCHERS },
      { labelKey: "common.appName", href: ROUTES.HOME },
      { labelKey: "nav.flashSale", href: ROUTES.FLASH_SALE },
      { labelKey: "nav.cart", href: ROUTES.CART },
      { labelKey: "nav.account", href: ROUTES.ACCOUNT },
    ],
  },
];

export function StorefrontFooter() {
  const t = useTranslations();
  return (
    <footer className="w-full bg-surface-container-lowest text-on-surface pt-8 pb-6 mt-12 shadow-[0_-1px_6px_rgba(0,0,0,0.03)] border-t border-surface-container">
      <div className="max-w-[1240px] mx-auto px-4 lg:px-5">
        {/* 4-col grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-8">
          {/* Col 1: Brand + tagline */}
          <div className="flex flex-col gap-2">
            <div className="mb-2">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBVY13feGs4gcFa97yPLWiFf1lyH9UbcYs3pejgkFZ0WqNR8psHktn4HCz-VIvGsUNAQwLNVkzQ69am6pDnex6TUMCnUBO8h-MYRlwLTMBuiyKH9EQsfVP9PZinwuvrjoRBd79SQfBAaKy2L1XTwygICivK5ztgA3rL1ZDGMQFMwQ8TlgVaNZ67jdeQUU99Z5vi1zAqhpcES9L3BF5ZvQGpLMDEMYy45gpXBRtWolDWPjBUKv58TfHFaKJ4bKgNi3u2BRI"
                alt="Vibe Mart"
                className="h-8 w-auto object-contain"
              />
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              {t("storefront.footer.tagline")}
            </p>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              {t("storefront.footer.address")}
            </p>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              {t("storefront.footer.businessLicense")}
            </p>
          </div>
          {/* Cols 2-4 */}
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.titleKey}>
              <h4 className="text-sm font-semibold text-on-surface mb-3 uppercase tracking-wide">
                {t(col.titleKey)}
              </h4>
              <ul className="space-y-2 text-sm text-on-surface-variant">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="hover:text-primary transition-colors"
                    >
                      {t(l.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {/* Bottom: certification + copyright */}
        <div className="border-t border-outline-variant py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-on-surface-variant">
          <span>{t("storefront.footer.certification")}</span>
          <span>{t("storefront.footer.copyright")}</span>
        </div>
      </div>
    </footer>
  );
}
