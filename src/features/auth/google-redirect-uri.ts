/**
 * Helpers resolve Google OAuth2 redirect URI (client-side).
 *
 * `redirectUri` gui len BE o `POST /api/v1/auth/google` PHAI khop 100% voi
 * `redirect_uri` da dung trong consent URL. Neu lech, Google tra
 * `invalid_grant` -> BE tra HTTP 400 + `AUTH_502_GOOGLE_EXCHANGE`.
 *
 * Thu tu uu tien (xem `resolveGoogleRedirectUri`):
 * 1. sessionStorage - gia tri lay tu consent URL that -> luon khop tuyet doi.
 * 2. `NEXT_PUBLIC_GOOGLE_REDIRECT_URI` - env public (inline duoc vao browser).
 * 3. `window.location.origin + pathname` - fallback cuoi.
 */

/** Path callback ma Google redirect ve (top-level redirect flow). */
export const GOOGLE_CALLBACK_PATH = "/auth/google/callback";

/**
 * Key sessionStorage luu `redirect_uri` lay tu consent URL.
 *
 * KHAC voi `google_oauth_redirect_uri` (key cua flow popup legacy o
 * `src/app/oauth2/redirect/page.tsx`) - 2 flow khong duoc tranh nhau key.
 */
export const GOOGLE_CONSENT_REDIRECT_URI_KEY = "google_oauth_consent_redirect_uri";

/**
 * Trich `redirect_uri` (da URL-decode) tu consent URL do BE build.
 *
 * @param authorizationUrl - URL consent cua Google.
 * @returns `redirect_uri` neu co va khong rong, nguoc lai `null`.
 */
export function extractRedirectUriFromConsentUrl(
  authorizationUrl: string
): string | null {
  if (!authorizationUrl) return null;
  try {
    const parsed = new URL(authorizationUrl);
    const value = parsed.searchParams.get("redirect_uri");
    if (!value) return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  } catch {
    return null;
  }
}

/** Input cho `resolveGoogleRedirectUri`. */
export interface ResolveGoogleRedirectUriInput {
  /** Gia tri doc tu sessionStorage (null khi chua co). */
  storedValue?: string | null;
  /** `process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI`. */
  envValue?: string | null;
  /** `window.location.origin`. */
  origin?: string | null;
  /** `window.location.pathname`. */
  pathname?: string | null;
}

function normalize(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Resolve redirect URI dung de doi authorization code.
 *
 * @returns URL tuyet doi khi co `origin`; chi la path khi thieu `origin`
 *          (truong hop suy bien, khong xay ra o trang callback).
 */
export function resolveGoogleRedirectUri(
  input: ResolveGoogleRedirectUriInput
): string {
  const stored = normalize(input.storedValue);
  if (stored) return stored;

  const fromEnv = normalize(input.envValue);
  if (fromEnv) return fromEnv;

  const origin = normalize(input.origin);
  const pathname = normalize(input.pathname) ?? GOOGLE_CALLBACK_PATH;
  if (!origin) return pathname;
  const base = origin.replace(/\/+$/, "");
  return `${base}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}
