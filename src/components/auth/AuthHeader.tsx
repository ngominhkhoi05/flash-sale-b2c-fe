import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/lib/constants";

/**
 * AuthHeader – header riêng cho trang xác thực (login, register, forgot-password).
 * Stitch screen 203897a8:
 * - Fixed top, backdrop-blur-xl, shadow nhẹ
 * - Logo + "Xác thực tài khoản" breadcrumb + nav (Trợ giúp, Về trang chủ)
 * - max-w-[1240px], h-16
 */
export function AuthHeader() {
  const t = useTranslations("auth.chrome.header");
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 w-full border-b border-outline-variant bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]"
      data-testid="auth-header"
    >
      <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-2">
          <Link
            href={ROUTES.HOME}
            className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
            aria-label="Vibe Mart – Trang chủ"
          >
            <Image
              src="/images/vibe-mart-logo-lockup-light.png"
              alt="Vibe Mart"
              width={0}
              height={0}
              sizes="120px"
              priority
              className="h-8 w-auto"
              style={{ width: 'auto', height: '32px' }}
            />
          </Link>
          <span
            className="hidden text-outline-variant sm:inline-block"
            aria-hidden
          >
            |
          </span>
          <span className="hidden text-label-lg text-on-surface-variant sm:inline-block">
            {t("authLabel")}
          </span>
        </div>

        <nav className="flex items-center gap-4 text-sm">
          <Link
            href={ROUTES.HELP}
            className="rounded-md px-2 py-1 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {t("navHelp")}
          </Link>
          <Link
            href={ROUTES.HOME}
            className="rounded-md px-2 py-1 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {t("navHome")}
          </Link>
        </nav>
      </div>
    </header>
  );
}
