/**
 * Test cho SessionCookieBridge (src/providers/SessionCookieBridge.tsx).
 *
 * Spec: rule auth-jwt.mdc mục 9 + plan 2026-10-16-fix-session-cookie-bridge.md.
 *
 * Requirements:
 * - Sync localStorage `fs_access_token` → cookie `access_token` khi mount.
 * - Listen `storage` event (cross-tab + same-tab dispatch) để auto-sync khi
 *   token thay đổi mà không remount component.
 * - Clear cookie khi token bị xóa khỏi localStorage (vd logout).
 * - Cleanup listener khi unmount (no leak).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, act } from "@testing-library/react";
import { SessionCookieBridge } from "./SessionCookieBridge";
import { STORAGE_KEYS, COOKIE_KEYS } from "@/lib/constants";

/**
 * Helper: đọc giá trị cookie theo key.
 * document.cookie trong jsdom có thể có nhiều cookie, ngăn cách bằng "; ".
 */
function getCookie(name: string): string | null {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  if (!match) return null;
  return decodeURIComponent(match.split("=").slice(1).join("="));
}

/** Helper: tạo JWT giả với exp cụ thể (giây). */
function makeFakeJwt(expSeconds: number): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(
    JSON.stringify({ sub: "user-1", email: "u@e.com", role: "BUYER", exp: expSeconds })
  );
  const sig = "fake-sig";
  return `${header}.${payload}.${sig}`;
}

beforeEach(() => {
  // Reset localStorage + cookie trước mỗi test
  window.localStorage.clear();
  document.cookie = `${COOKIE_KEYS.ACCESS_TOKEN}=; Path=/; Max-Age=0`;
});

afterEach(() => {
  vi.useRealTimers();
});

describe("SessionCookieBridge", () => {
  it("syncs localStorage token to cookie on mount", () => {
    // Arrange: có token trong localStorage, cookie chưa có
    const token = makeFakeJwt(Math.floor(Date.now() / 1000) + 3600);
    window.localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);

    // Act
    render(<SessionCookieBridge />);

    // Assert: cookie phải có token
    expect(getCookie(COOKIE_KEYS.ACCESS_TOKEN)).toBe(token);
  });

  it("syncs cookie when storage event fires (cross-tab token change)", () => {
    // Arrange: bắt đầu KHÔNG có token
    render(<SessionCookieBridge />);
    expect(getCookie(COOKIE_KEYS.ACCESS_TOKEN)).toBeNull();

    // Act: mô phỏng tab khác set token → dispatch storage event ở tab hiện tại
    const token = makeFakeJwt(Math.floor(Date.now() / 1000) + 3600);
    act(() => {
      window.localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: STORAGE_KEYS.ACCESS_TOKEN,
          newValue: token,
          oldValue: null,
          storageArea: window.localStorage,
        })
      );
    });

    // Assert: cookie được sync từ storage event
    expect(getCookie(COOKIE_KEYS.ACCESS_TOKEN)).toBe(token);
  });

  it("clears cookie when localStorage token is removed (logout)", () => {
    // Arrange: có token + cookie
    const token = makeFakeJwt(Math.floor(Date.now() / 1000) + 3600);
    window.localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    render(<SessionCookieBridge />);
    expect(getCookie(COOKIE_KEYS.ACCESS_TOKEN)).toBe(token);

    // Act: mô phỏng logout (xóa localStorage + dispatch storage event)
    act(() => {
      window.localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: STORAGE_KEYS.ACCESS_TOKEN,
          newValue: null,
          oldValue: token,
          storageArea: window.localStorage,
        })
      );
    });

    // Assert: cookie bị xóa
    expect(getCookie(COOKIE_KEYS.ACCESS_TOKEN)).toBeNull();
  });

  it("cleans up storage event listener on unmount (no leak)", () => {
    // Arrange
    const { unmount } = render(<SessionCookieBridge />);
    const token = makeFakeJwt(Math.floor(Date.now() / 1000) + 3600);

    // Act: unmount
    unmount();

    // Dispatch storage event SAU khi unmount
    act(() => {
      window.localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: STORAGE_KEYS.ACCESS_TOKEN,
          newValue: token,
          oldValue: null,
          storageArea: window.localStorage,
        })
      );
    });

    // Assert: cookie KHÔNG được set (vì listener đã bị remove)
    expect(getCookie(COOKIE_KEYS.ACCESS_TOKEN)).toBeNull();
  });
});
