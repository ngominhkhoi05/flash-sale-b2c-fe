import Link from "next/link";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/lib/constants";

/**
 * AuthFooter – footer riêng cho trang xác thực.
 * Stitch screen 203897a8: copyright + 3 link pháp lý ngăn bởi dấu "•".
 * max-w-[1240px], nền surface-container-lowest.
 */
export function AuthFooter() {
  const t = useTranslations("auth.chrome.footer");
  return (
    <footer
      className="w-full bg-surface-container-lowest py-6 shadow-[0_-1px_6px_rgba(0,0,0,0.02)]"
      data-testid="auth-footer"
    >
      <div className="mx-auto flex max-w-[1240px] flex-col items-center justify-between gap-2 px-4 text-sm sm:flex-row md:px-8">
        <p className="text-on-surface-variant text-center sm:text-left">
          {t("copyright")}
        </p>
        <nav
          className="flex items-center gap-4 text-on-surface-variant"
          aria-label="Footer"
        >
          <Link
            href={ROUTES.TERMS}
            className="hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
          >
            {t("terms")}
          </Link>
          <span className="text-outline-variant" aria-hidden>
            •
          </span>
          <Link
            href={ROUTES.PRIVACY}
            className="hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
          >
            {t("privacy")}
          </Link>
          <span className="text-outline-variant" aria-hidden>
            •
          </span>
          <Link
            href={ROUTES.CONTACT}
            className="hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
          >
            {t("contact")}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
