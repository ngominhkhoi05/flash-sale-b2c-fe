"use client";

import { useEffect } from "react";
import { COOKIE_KEYS, STORAGE_KEYS } from "@/lib/constants";

/** Cookie attrs dùng chung cho `access_token`. */
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24; // 24h
const COOKIE_PATH = "/";
const COOKIE_SAME_SITE = "Lax";

/**
 * Set cookie `access_token` nếu token hợp lệ. Pure function — exported for testing.
 * Trả về true nếu set thành công, false nếu bỏ qua.
 */
export function setAccessTokenCookie(token: string | null): boolean {
  if (typeof document === "undefined") return false;
  if (!token) {
    clearAccessTokenCookie();
    return false;
  }
  document.cookie = `${COOKIE_KEYS.ACCESS_TOKEN}=${encodeURIComponent(
    token
  )}; Path=${COOKIE_PATH}; SameSite=${COOKIE_SAME_SITE}; Max-Age=${COOKIE_MAX_AGE_SECONDS}`;
  return true;
}

/** Xoá cookie `access_token`. Pure function — exported for testing. */
export function clearAccessTokenCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_KEYS.ACCESS_TOKEN}=; Path=${COOKIE_PATH}; Max-Age=0`;
}

/**
 * SessionCookieBridge – đồng bộ localStorage "fs_access_token" <-> cookie
 * để Next.js proxy (src/proxy.ts) có thể đọc token phục vụ phân quyền route.
 *
 * KHÔNG dùng để xác thực server-side – backend vẫn verify JWT thật.
 *
 * Flow (rule auth-jwt.mdc mục 9):
 *  1. Mount: copy localStorage token → cookie (nếu cookie chưa có).
 *  2. Listen `storage` event:
 *     - Cùng tab: dispatch thủ công sau khi set localStorage
 *       (vd login form set localStorage xong gọi window.dispatchEvent).
 *     - Cross-tab: browser tự dispatch khi tab khác đổi localStorage.
 *     - Khi token bị xóa (logout) → clear cookie.
 *  3. Cleanup listener khi unmount (no leak).
 */
export function SessionCookieBridge(): null {
  useEffect(() => {
    if (typeof window === "undefined") return;

    /** Sync localStorage token → cookie. */
    const syncFromStorage = () => {
      const token = window.localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      setAccessTokenCookie(token);
    };

    // 1) Sync lần đầu khi mount
    syncFromStorage();

    // 2) Listen `storage` event cho cross-tab + same-tab updates
    const onStorage = (event: StorageEvent) => {
      // Chỉ quan tâm đến key của mình
      if (event.key && event.key !== STORAGE_KEYS.ACCESS_TOKEN) return;
      syncFromStorage();
    };
    window.addEventListener("storage", onStorage);

    // 3) Cleanup khi unmount
    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return null;
}
