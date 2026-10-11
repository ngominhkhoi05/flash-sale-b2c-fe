import Image from 'next/image';
import { useTranslations } from 'next-intl';

/**
 * AuthBrandPanel – cột trái của trang auth (Stitch screen 203897a8).
 *
 * Layout Stitch:
 *  - Container bg-surface-container, rounded-2xl, p-8 lg:p-12
 *  - 2 blur blob nền (primary-fixed + secondary-container)
 *  - Top: logo + wordmark
 *  - Middle: title + intro + 3 benefit cards
 *  - Bottom: SVG flat illustration (túi mua sắm + hộp quà + coupon tag)
 *
 * Ẩn trên mobile (md:flex theo parent).
 * Icon inline SVG – KHÔNG thêm lucide theo plan 2026-10-09 quyết định 4.
 */
export function AuthBrandPanel() {
  const t = useTranslations('auth.brand');
  return (
    <aside
      className="relative hidden h-full w-full flex-col justify-between overflow-hidden rounded-2xl bg-surface-container p-8 shadow-sm md:flex lg:p-12"
      data-testid="auth-brand-panel"
    >
      {/* Lớp trang trí nền trừu tượng (Stitch) */}
      <div
        className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-primary-soft opacity-40 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-secondary-container opacity-30 blur-3xl"
        aria-hidden
      />

      {/* Top: logo + wordmark */}
      <div className="relative z-10 flex items-center gap-2">
        <Image
          src="/brand/logo/vibe-mart-logo-lockup-light.png"
          alt="Vibe Mart"
          width={0}
          height={0}
          sizes="120px"
          priority
          className="h-9 w-auto"
          style={{ width: 'auto', height: '36px' }}
        />
      </div>

      {/* Middle: title + intro + benefits */}
      <div className="relative z-10 space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold leading-tight tracking-tight text-on-surface lg:text-[36px] lg:leading-[44px] lg:font-bold">
            {t('title')}
          </h2>
          <p className="max-w-md text-sm leading-relaxed text-on-surface-variant lg:text-base">
            {t('intro')}
          </p>
        </div>

        <div className="space-y-3">
          <Benefit
            iconBg="bg-surface-container"
            iconColor="text-primary"
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
              >
                <path d="M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-5h6v5z" />
              </svg>
            }
            title={t('benefit1Title')}
            desc={t('benefit1Desc')}
          />
          <Benefit
            iconBg="bg-tertiary-soft"
            iconColor="text-tertiary"
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
              >
                <path d="M7 2v11h3v9l7-12h-4l4-8z" />
              </svg>
            }
            title={t('benefit2Title')}
            desc={t('benefit2Desc')}
            badge={t('benefit2Badge')}
          />
          <Benefit
            iconBg="bg-secondary-container"
            iconColor="text-secondary"
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h7" />
                <path d="M16 12h.01M12 12h.01M8 12h.01" />
                <path d="M22 17h-6M19 14v6" />
              </svg>
            }
            title={t('benefit3Title')}
            desc={t('benefit3Desc')}
          />
        </div>
      </div>

      {/* Bottom: SVG flat illustration */}
      <div className="relative z-10 mt-6 flex items-end justify-center pt-4">
        <svg
          className="h-36 w-full max-w-[340px]"
          viewBox="0 0 340 144"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <ellipse cx="170" cy="132" fill="#d2d9f4" rx="140" ry="8" />
          {/* Túi mua sắm chính */}
          <rect fill="#006194" height="82" rx="8" width="70" x="90" y="44" />
          <path
            d="M107 44V34C107 24.0589 115.059 16 125 16C134.941 16 143 24.0589 143 34V44"
            stroke="#cce5ff"
            strokeLinecap="round"
            strokeWidth="4"
          />
          <circle cx="125" cy="85" fill="#ffffff" fillOpacity="0.15" r="14" />
          <path
            d="M125 76L129 82H136L130 87L132 94L125 89L118 94L120 87L114 82H121L125 76Z"
            fill="#ffffff"
          />
          {/* Hộp quà Sale */}
          <rect fill="#6cf8bb" height="66" rx="10" width="66" x="175" y="60" />
          <rect
            fill="#006c49"
            fillOpacity="0.2"
            height="12"
            width="66"
            x="175"
            y="76"
          />
          <rect
            fill="#006c49"
            fillOpacity="0.2"
            height="66"
            width="12"
            x="202"
            y="60"
          />
          <path
            d="M200 60C194 52 188 50 184 54C180 58 186 64 208 60Z"
            fill="#006c49"
          />
          <path
            d="M216 60C222 52 228 50 232 54C236 58 230 64 208 60Z"
            fill="#006c49"
          />
          {/* Coupon tag */}
          <g transform="translate(230, 24) rotate(12)">
            <rect fill="#e21e49" height="34" rx="6" width="64" />
            <circle cx="0" cy="17" fill="#eaedff" r="5" />
            <circle cx="64" cy="17" fill="#eaedff" r="5" />
            <rect fill="#ffffff" height="4" rx="2" width="36" x="14" y="9" />
            <rect fill="#ffdada" height="4" rx="2" width="22" x="14" y="18" />
          </g>
          {/* Bong bóng + bay */}
          <circle cx="70" cy="95" fill="#cce5ff" r="18" />
          <path
            d="M64 95H76M70 89V101"
            stroke="#004b73"
            strokeLinecap="round"
            strokeWidth="2.5"
          />
        </svg>
      </div>
    </aside>
  );
}

function Benefit({
  icon,
  iconBg,
  iconColor,
  title,
  desc,
  badge,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  desc: string;
  badge?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-surface-container-lowest/80 p-3 shadow-sm backdrop-blur-sm">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconBg} ${iconColor}`}
      >
        {icon}
      </div>
      <div className="flex flex-1 items-center justify-between gap-1">
        <div>
          <p className="text-sm font-semibold text-on-surface">{title}</p>
          <p className="text-xs text-on-surface-variant">{desc}</p>
        </div>
        {badge && (
          <span className="shrink-0 rounded-full bg-tertiary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-on-tertiary">
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}
