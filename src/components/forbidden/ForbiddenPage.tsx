"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { MaterialSymbol } from "@/components/ui/material-symbol";
import { useAuth } from "@/hooks/useAuth";
import { ROLES, type Role } from "@/lib/constants";

/**
 * ForbiddenPage — 403 screen
 *
 * Pixel-perfect re-implementation of Stitch design system screen
 * `8bea7c520e7f4d2c8896e7771210450a` ("Màn hình Lỗi 403 - Vibe Mart")
 * from project `15206106541998912100` (Vibe Mart Marketplace UI/UX).
 *
 * Data sources (verified against backend Swagger 2026-10-12):
 *   - `useAuth().user` → email, role (from `useAuthStore`, hydrated from
 *     `AuthResponse.user` on login). No API call needed.
 *   - `?required=ROLE` URL query → which role the route demanded.
 *     The proxy/middleware that redirects to /forbidden is expected to
 *     append this query so the user can see exactly which role is
 *     missing. If absent, fall back to the legacy `requiredRole` i18n
 *     key (currently "STORE_ADMIN") for backward compatibility.
 *   - Role labels: `error.forbidden.role.{BUYER|SELLER|ADMIN}` i18n
 *     keys. Mapping from JWT `ROLE_*` claim to plain role is in
 *     `features/auth/jwt.ts` (decodeJwtPrimaryRole) and constants.ROLES.
 *
 * Layout (top → bottom):
 *   1. Page-level watermark ("shopping_bag VIBE MART" at 3% opacity).
 *   2. Two soft glow blobs (primary-fixed-dim + secondary-container).
 *   3. Brand tag pill: icon + "Vibe Mart Security" + dot + "ID: 403-FORBIDDEN".
 *   4. Shield centerpiece: gradient circle → white circle → shield_lock icon
 *      with a pulsing secondary dot.
 *   5. "Khu vực giới hạn" sub-pill.
 *   6. H1 heading.
 *   7. Explanatory paragraph.
 *   8. Two action buttons (primary → /trang-chu, ghost → /dang-nhap?ref=forbidden_retry).
 *   9. Role diagnostic capsule: session label, current role badge, real
 *      user email (or "Chưa đăng nhập" for guests), required role.
 *  10. Support footer (mailto + tel).
 */
export function ForbiddenPage() {
  const t = useTranslations("error.forbidden");
  const { user } = useAuth();
  const searchParams = useSearchParams();

  // ----- Resolve role labels (i18n) -----
  const roleLabel = (role: Role): string => {
    try {
      return t(`role.${role}`);
    } catch {
      return t("sessionRole"); // legacy fallback
    }
  };

  // ----- Current user display -----
  const currentRole: Role = (user?.role as Role) ?? ROLES.BUYER;
  const currentRoleLabel = roleLabel(currentRole);
  const currentEmail = user?.email ?? t("notLoggedIn");

  // ----- Required role (from ?required=ROLE query, else legacy fallback) -----
  const requiredParam = searchParams.get("required");
  const requiredRoleText = (() => {
    if (requiredParam && (requiredParam === ROLES.BUYER || requiredParam === ROLES.SELLER || requiredParam === ROLES.ADMIN)) {
      return roleLabel(requiredParam as Role);
    }
    // Legacy fallback (matches old hardcoded "STORE_ADMIN" via i18n key).
    return t("requiredRole");
  })();

  return (
    <>
      {/* Page-level brand watermark (3% opacity, decorative) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 flex items-center justify-center opacity-[0.03] select-none z-0"
      >
        <div className="flex items-center gap-2">
          <MaterialSymbol
            name="shopping_bag"
            size="[120px]"
            className="text-primary"
          />
          <span className="text-[100px] font-bold tracking-tight text-primary">
            VIBE MART
          </span>
        </div>
      </div>

      <main className="relative z-10 w-full min-h-screen flex items-center justify-center p-6">
        <div className="flex flex-col w-full items-center justify-center py-6 px-4">
          <div className="relative w-full max-w-xl mx-auto flex flex-col items-center text-center">
            {/* Subtle glow backdrop (custom-token colors with opacity) */}
            <div
              aria-hidden="true"
              className="absolute -top-16 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-3xl pointer-events-none -z-10"
              style={{
                background:
                  "color-mix(in srgb, var(--color-primary-fixed-dim) 20%, transparent)",
              }}
            />
            <div
              aria-hidden="true"
              className="absolute top-20 right-1/4 w-44 h-44 rounded-full blur-2xl pointer-events-none -z-10"
              style={{
                background:
                  "color-mix(in srgb, var(--color-secondary-container) 30%, transparent)",
              }}
            />

            {/* Vibe Mart Subtle Brand Tag */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container shadow-sm mb-8">
              <MaterialSymbol
                name="shopping_bag"
                fill
                size="[20px]"
                className="text-primary"
              />
              <span className="text-label-md tracking-wider uppercase text-on-surface font-semibold">
                {t("brandTag")}
              </span>
              <span className="w-2 h-2 rounded-full bg-outline-variant" />
              <span className="text-label-sm text-outline tracking-widest uppercase">
                {t("idBadge")}
              </span>
            </div>

            {/* Centerpiece: Shield & Padlock Composition */}
            <div className="relative mb-6 flex flex-col items-center justify-center">
              <div className="relative flex items-center justify-center">
                <div
                  className="w-36 h-36 rounded-full flex items-center justify-center shadow-sm"
                  style={{
                    background:
                      "linear-gradient(to bottom, var(--color-primary-fixed), var(--color-surface-container-low), var(--color-surface-container))",
                  }}
                >
                  <div className="w-28 h-28 rounded-full bg-surface-container-lowest shadow-md flex items-center justify-center relative">
                    <MaterialSymbol
                      name="shield_lock"
                      fill
                      size="[56px]"
                      className="text-primary select-none"
                    />
                    <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-secondary-fixed shadow-sm flex items-center justify-center">
                      <span
                        className="w-2 h-2 rounded-full bg-secondary"
                        style={{
                          animation:
                            "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite",
                        }}
                      />
                    </span>
                  </div>
                </div>
              </div>
              <div
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container shadow-sm text-on-surface select-none"
                style={{ border: "1px solid color-mix(in srgb, var(--color-outline-variant) 30%, transparent)" }}
              >
                <MaterialSymbol
                  name="lock"
                  size="[16px]"
                  className="text-tertiary"
                />
                <span className="text-label-sm tracking-wider uppercase font-semibold text-on-surface-variant whitespace-nowrap">
                  {t("restrictedZone")}
                </span>
              </div>
            </div>

            {/* Heading */}
            <h1 className="text-display-lg font-bold text-on-surface mb-2 tracking-tight">
              {t("title")}
            </h1>

            {/* Explanatory Narrative */}
            <p className="text-body-lg text-on-surface-variant max-w-lg mb-8 leading-relaxed">
              {t("description")}
            </p>

            {/* Interactive Actions */}
            <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
              <Link
                href="/trang-chu"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-primary text-on-primary text-label-lg shadow-md hover:opacity-90 active:scale-[0.98] transition-all duration-150"
              >
                <MaterialSymbol name="home" size="[20px]" />
                <span>{t("primaryAction")}</span>
              </Link>
              <Link
                href="/dang-nhap?ref=forbidden_retry"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-surface-container-lowest text-on-surface text-label-lg shadow-sm hover:bg-surface-container active:scale-[0.98] transition-all duration-150"
              >
                <MaterialSymbol
                  name="switch_account"
                  size="[20px]"
                  className="text-on-surface-variant"
                />
                <span>{t("secondaryAction")}</span>
              </Link>
            </div>

            {/* Quick Role Diagnostic Capsule (real data from useAuth + URL query) */}
            <div
              className="w-full max-w-md bg-surface-container-low rounded-xl p-4 shadow-sm mb-8 text-left"
              data-testid="role-diagnostic-capsule"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-label-md text-on-surface-variant flex items-center gap-1">
                  <MaterialSymbol
                    name="account_circle"
                    size="[16px]"
                    className="text-primary"
                  />
                  {t("sessionLabel")}
                </span>
                <span
                  className="text-label-sm px-2 py-0.5 rounded bg-surface-container text-outline font-semibold uppercase"
                  data-testid="current-role-badge"
                >
                  {currentRoleLabel}
                </span>
              </div>
              <p
                className="text-body-sm text-outline truncate"
                data-testid="session-detail"
              >
                <span data-testid="session-email">{currentEmail}</span>
                {" • "}
                {t("requiredRolePrefix")}{" "}
                <span className="text-tertiary font-semibold" data-testid="required-role">
                  {requiredRoleText}
                </span>
              </p>
            </div>

            {/* Technical Support Footer Details */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-outline text-body-sm">
              <span className="flex items-center gap-1">
                <MaterialSymbol
                  name="mail"
                  size="[16px]"
                  className="text-primary"
                />
                <span>{t("supportLabel")}</span>
                <a
                  className="text-primary font-semibold hover:underline"
                  href={`mailto:${t("supportEmail")}`}
                >
                  {t("supportEmail")}
                </a>
              </span>
              <span className="hidden sm:inline text-outline-variant">•</span>
              <span className="flex items-center gap-1">
                <MaterialSymbol
                  name="support_agent"
                  size="[16px]"
                  className="text-secondary"
                />
                <span>{t("hotlineLabel")}</span>
                <a
                  className="text-on-surface font-semibold hover:underline"
                  href={`tel:${t("hotlineNumber").replace(/\s/g, "")}`}
                >
                  {t("hotlineNumber")}
                </a>
              </span>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default ForbiddenPage;
