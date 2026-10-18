import type { Role } from '@/lib/constants';

/**
 * JWT helpers – decode Backend Spring Boot JWT payload.
 *
 * Backend JWT shape (verified 2026-10-10 against swagger):
 *   { type: "ACCESS"|"REFRESH",
 *     authorities: ["ROLE_BUYER"|"ROLE_SELLER"|"ROLE_ADMIN"],
 *     sub: <email>,
 *     userId?: <number>,           // only in REFRESH token
 *     jti?: <uuid>,                // only in REFRESH token
 *     iat: <epoch>,
 *     exp: <epoch> }
 *
 * NOTE: This is a *partial* decode – we don't verify the signature.
 * Use only for non-security UX decisions (display role, route nav).
 * Auth decisions MUST still rely on the Bearer token sent to backend.
 */

interface JwtPayload {
  type?: 'ACCESS' | 'REFRESH';
  authorities?: string[];
  sub?: string;
  userId?: number;
  jti?: string;
  iat?: number;
  exp?: number;
}

/** Pad BASE64URL to base64 length. */
function pad(input: string): string {
  const padLen = (4 - (input.length % 4)) % 4;
  return input + '='.repeat(padLen);
}

/** Convert BASE64URL → base64. */
function b64urlToB64(s: string): string {
  return s.replace(/-/g, '+').replace(/_/g, '/');
}

/**
 * parseJwt – parse JWT payload segment to object.
 * Returns {} on any error (malformed token, invalid base64, missing
 * 2nd segment, no JSON inside). Never throws.
 */
export function parseJwt(token: string): JwtPayload {
  if (!token || typeof token !== 'string') return {};
  const parts = token.split('.');
  if (parts.length < 2) return {};
  try {
    const decoded = atob(b64urlToB64(pad(parts[1])));
    const obj = JSON.parse(decoded);
    return obj && typeof obj === 'object' ? (obj as JwtPayload) : {};
  } catch {
    return {};
  }
}

/**
 * decodeJwtRoles – read `authorities` from JWT, map to FE `Role`.
 * Returns [] on any error or when no `authorities` claim.
 *
 *   "ROLE_BUYER"  → "BUYER"
 *   "ROLE_SELLER" → "SELLER"
 *   "ROLE_ADMIN"  → "ADMIN"
 *   unknown       → "BUYER" (safe default for store display)
 */
export function decodeJwtRoles(token: string): Role[] {
  const payload = parseJwt(token);
  const auths = payload.authorities;
  if (!Array.isArray(auths)) return [];
  const roles: Role[] = [];
  for (const a of auths) {
    if (a === 'ROLE_BUYER' || a === 'BUYER') roles.push('BUYER');
    else if (a === 'ROLE_SELLER' || a === 'SELLER') roles.push('SELLER');
    else if (a === 'ROLE_ADMIN' || a === 'ADMIN') roles.push('ADMIN');
  }
  return roles;
}

/** decodeJwtPrimaryRole – vai trò có độ ưu tiên cao nhất: ADMIN > SELLER > BUYER. */
export function decodeJwtPrimaryRole(token: string): Role {
  const roles = decodeJwtRoles(token);
  if (roles.includes('ADMIN')) return 'ADMIN';
  if (roles.includes('SELLER')) return 'SELLER';
  return roles[0] ?? 'BUYER';
}
