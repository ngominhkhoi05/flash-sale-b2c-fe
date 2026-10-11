/**
 * SEO config – Single source of truth for site-wide search/SEO metadata.
 *
 * Use cases:
 *  - RootLayout `metadata` export reads `defaultSeo` for site defaults.
 *  - Per-page `metadata` export reads `resolveSeo(pageKey)` for overrides.
 *  - `<Head>` blocks / Open Graph cards can import the merged config directly.
 *
 * Conventions enforced (tested in seo.config.test.ts):
 *  - title ≤ 60 chars (Google SERP cap)
 *  - description ≤ 160 chars (Google SERP cap)
 *  - ogImage is absolute http(s) URL
 *  - siteUrl from NEXT_PUBLIC_SITE_URL, with localhost fallback
 *  - pageSeo is immutable: resolveSeo() returns a new object, not a mutation
 *
 * Why TS (not JSON / i18n):
 *  - Type-safe: SeoConfig interface catches missing fields at compile time.
 *  - Refactor-friendly: rename fields with TS assistance.
 *  - SEO copy is mostly language-agnostic brand strings; localized page
 *    titles/descriptions live in per-page `generateMetadata({ params })`
 *    which can still call `resolveSeo(pageKey, { locale: 'en' })` and
 *    override text from `messages/<locale>.json`.
 */

const SITE_NAME = "Vibe Mart";

/**
 * Resolve site URL from env (set in `.env.local` per .env.example).
 * Fallback to localhost for dev / build. Never throw at import time.
 */
function resolveSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl && /^https?:\/\//.test(envUrl)) return envUrl;
  return "http://localhost:3000";
}

export type SeoLocale = "vi_VN" | "en_US";

export interface SeoConfig {
  /** Default page title (≤ 60 chars). Per-page titles use template "%s | Vibe Mart". */
  title: string;
  /** Meta description (≤ 160 chars). */
  description: string;
  /** SEO keywords. */
  keywords: string[];
  /** Absolute URL of Open Graph image. */
  ogImage: string;
  /** Vietnamese alt text for the OG image. */
  ogImageAlt: string;
  /** BCP-47 locale tag. */
  locale: SeoLocale;
  /** Public site URL (canonical base). */
  siteUrl: string;
  /** Brand name shown in tab + SERP. */
  siteName: string;
  /** Browser theme color (mobile chrome). */
  themeColor: string;
  /** Optional: Twitter handle (e.g. "@vibemart"). */
  twitterHandle?: string;
}

/** Site-wide defaults. Pages override via `pageSeo`. */
export const defaultSeo: SeoConfig = {
  title: "Vibe Mart – Sàn TMĐT Flash Sale B2C",
  description:
    "Mua sắm online hàng triệu sản phẩm công nghệ, thời trang, làm đẹp với Flash Sale giảm giá sốc mỗi ngày. Freeship, voucher, chính hãng.",
  keywords: [
    "vibe mart",
    "flash sale",
    "mua sắm online",
    "thương mại điện tử",
    "B2C",
    "công nghệ",
    "thời trang",
    "voucher",
    "freeship",
    "đồ án UTC2",
  ],
  ogImage: "/images/og-vibe-mart-default.jpg",
  ogImageAlt:
    "Vibe Mart – sàn thương mại điện tử Flash Sale B2C, hàng triệu deal sốc mỗi ngày",
  locale: "vi_VN",
  siteUrl: resolveSiteUrl(),
  siteName: SITE_NAME,
  themeColor: "#006194", // --color-primary
  twitterHandle: "@vibemart",
};

/**
 * Per-page SEO overrides. Keys are stable page identifiers.
 * Values are Partial<SeoConfig> — only override what differs from default.
 */
export const pageSeo = {
  home: {
    title: "Vibe Mart – Mua sắm Flash Sale giảm giá sốc mỗi ngày",
    description:
      "Siêu hội 10.10, Flash Sale theo khung giờ, voucher shop mới. Hàng triệu sản phẩm chính hãng, giao nhanh toàn quốc.",
    ogImage: "/images/og-vibe-mart-home.jpg",
    ogImageAlt: "Trang chủ Vibe Mart – Flash Sale hôm nay",
  },
  flashSale: {
    title: "Flash Sale hôm nay – Giảm đến 50% mỗi khung giờ",
    description:
      "Săn deal Flash Sale 0đ, voucher freeship, mã giảm 15% toàn sàn. Cập nhật liên tục, số lượng có hạn.",
    ogImage: "/images/og-vibe-mart-flash-sale.jpg",
    ogImageAlt: "Flash Sale Vibe Mart – đếm ngược đến khi deal lên sàn",
  },
} as const satisfies Record<string, Partial<SeoConfig>>;

/**
 * Merge a page's SEO override on top of `defaultSeo`.
 * Returns a new object — does not mutate defaults (immutability test).
 */
export function resolveSeo<K extends keyof typeof pageSeo>(
  pageKey: K
): SeoConfig;
export function resolveSeo(pageKey: string): SeoConfig;
export function resolveSeo(pageKey: string): SeoConfig {
  const override = (pageSeo as Record<string, Partial<SeoConfig>>)[pageKey];
  return {
    ...defaultSeo,
    ...(override ?? {}),
  };
}
