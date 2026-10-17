/**
 * Map Google OAuth error code (sau khi strip `google_` prefix) → i18n key.
 *
 * Callback page `/auth/google/callback` redirect về `/login?error=google_<CODE>`
 * với 5 nhánh:
 * - `cancelled`        → user bấm "Cancel" ở Google consent
 * - `no_code`          → Google redirect thiếu ?code=
 * - `state_mismatch`   → CSRF check fail
 * - `AUTH_*`           → ApiError.code từ BE (vd AUTH_502_GOOGLE_EXCHANGE)
 * - `unknown`          → catch-all cho network error hoặc code lạ
 *
 * Lookup case-insensitive để chấp nhận cả `auth_502_google_exchange` (lowercase
 * từ URL) lẫn `AUTH_502_GOOGLE_EXCHANGE` (raw từ ApiError.code).
 *
 * Mọi input không match → fallback `error.google_unknown` (safe default).
 *
 * @see docs/handoffs/google-oauth-fe-integration.md mục 3 + 4
 */

const GOOGLE_ERROR_MAP: Readonly<Record<string, string>> = {
  cancelled: "error.google_cancelled",
  no_code: "error.google_no_code",
  state_mismatch: "error.google_state_mismatch",
  AUTH_401_GOOGLE_TOKEN: "error.google_auth_401_google_token",
  AUTH_502_GOOGLE_EXCHANGE: "error.google_auth_502_google_exchange",
  AUTH_500_GOOGLE_CONFIG: "error.google_auth_500_google_config",
  AUTH_401_GOOGLE_EMAIL_UNVERIFIED: "error.google_auth_401_google_email_unverified",
  unknown: "error.google_unknown",
};

/** Normalize key để lookup case-insensitive. */
function normalizeKey(key: string): string {
  return key.toLowerCase();
}

/** Build lowercase index một lần (memoize cho lần lookup sau). */
const NORMALIZED_MAP: ReadonlyMap<string, string> = (() => {
  const m = new Map<string, string>();
  for (const [k, v] of Object.entries(GOOGLE_ERROR_MAP)) {
    m.set(normalizeKey(k), v);
  }
  return m;
})();

/**
 * Pure function — map raw error code (sau khi strip `google_` prefix) → i18n key.
 *
 * @param rawCode - Phần sau khi strip `google_` prefix từ URL `?error=google_<CODE>`.
 *                  Có thể là string rỗng, null, undefined (luôn fallback an toàn).
 * @returns i18n key trong namespace `error.*`.
 */
export function mapGoogleErrorToI18nKey(
  rawCode: string | null | undefined,
): string {
  if (!rawCode) return GOOGLE_ERROR_MAP.unknown;
  return NORMALIZED_MAP.get(normalizeKey(rawCode)) ?? GOOGLE_ERROR_MAP.unknown;
}
