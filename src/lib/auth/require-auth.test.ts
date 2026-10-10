import { describe, expect, it } from "vitest";
import { ROUTES } from "@/lib/constants";
import {
  buildLoginUrl,
  sanitizeRedirectPath,
  shouldRequireAuth,
} from "./require-auth";

describe("sanitizeRedirectPath", () => {
  it("returns HOME for null", () => {
    expect(sanitizeRedirectPath(null)).toBe(ROUTES.HOME);
  });

  it("returns HOME for undefined", () => {
    expect(sanitizeRedirectPath(undefined)).toBe(ROUTES.HOME);
  });

  it("returns HOME for empty string", () => {
    expect(sanitizeRedirectPath("")).toBe(ROUTES.HOME);
  });

  it("returns HOME for whitespace only", () => {
    expect(sanitizeRedirectPath("   ")).toBe(ROUTES.HOME);
  });

  it("returns HOME for external URL (https://)", () => {
    expect(sanitizeRedirectPath("https://evil.com/x")).toBe(ROUTES.HOME);
  });

  it("returns HOME for external URL (http://)", () => {
    expect(sanitizeRedirectPath("http://evil.com/x")).toBe(ROUTES.HOME);
  });

  it("returns HOME for protocol-relative URL (//evil.com)", () => {
    expect(sanitizeRedirectPath("//evil.com/x")).toBe(ROUTES.HOME);
  });

  it("returns HOME for javascript: URL", () => {
    expect(sanitizeRedirectPath("javascript:alert(1)")).toBe(ROUTES.HOME);
  });

  it("returns HOME for data: URL", () => {
    expect(sanitizeRedirectPath("data:text/html,<script>alert(1)</script>")).toBe(ROUTES.HOME);
  });

  it("returns HOME for relative path without leading slash", () => {
    expect(sanitizeRedirectPath("gio-hang")).toBe(ROUTES.HOME);
  });

  it("returns the path for valid storefront path", () => {
    expect(sanitizeRedirectPath("/gio-hang")).toBe("/gio-hang");
  });

  it("returns the path for valid account path", () => {
    expect(sanitizeRedirectPath("/tai-khoan")).toBe("/tai-khoan");
  });

  it("returns the path for voucher path", () => {
    expect(sanitizeRedirectPath("/kho-voucher")).toBe("/kho-voucher");
  });

  it("preserves query string in path", () => {
    expect(sanitizeRedirectPath("/san-pham/abc?ref=flash-sale")).toBe(
      "/san-pham/abc?ref=flash-sale",
    );
  });

  it("preserves hash in path", () => {
    expect(sanitizeRedirectPath("/don-hang#active")).toBe("/don-hang#active");
  });

  it("trims whitespace from valid path", () => {
    expect(sanitizeRedirectPath("  /gio-hang  ")).toBe("/gio-hang");
  });
});

describe("buildLoginUrl", () => {
  it("returns plain LOGIN when path is null", () => {
    expect(buildLoginUrl(null)).toBe(ROUTES.LOGIN);
  });

  it("returns plain LOGIN when path is empty", () => {
    expect(buildLoginUrl("")).toBe(ROUTES.LOGIN);
  });

  it("returns plain LOGIN when path is HOME (no need to loop)", () => {
    expect(buildLoginUrl(ROUTES.HOME)).toBe(ROUTES.LOGIN);
  });

  it("returns plain LOGIN when path is external URL (sanitized to HOME)", () => {
    expect(buildLoginUrl("https://evil.com/x")).toBe(ROUTES.LOGIN);
  });

  it("encodes storefront path as redirect query", () => {
    expect(buildLoginUrl("/gio-hang")).toBe(
      `${ROUTES.LOGIN}?redirect=${encodeURIComponent("/gio-hang")}`,
    );
  });

  it("encodes account path as redirect query", () => {
    expect(buildLoginUrl("/tai-khoan")).toBe(
      `${ROUTES.LOGIN}?redirect=${encodeURIComponent("/tai-khoan")}`,
    );
  });

  it("encodes path with query string safely", () => {
    expect(buildLoginUrl("/san-pham/abc?ref=flash")).toBe(
      `${ROUTES.LOGIN}?redirect=${encodeURIComponent("/san-pham/abc?ref=flash")}`,
    );
  });
});

describe("shouldRequireAuth", () => {
  it("returns shouldRedirect=false when not hydrated (avoid flash)", () => {
    const result = shouldRequireAuth(false, false, "/gio-hang");
    expect(result.shouldRedirect).toBe(false);
    expect(result.loginUrl).toBe(
      `${ROUTES.LOGIN}?redirect=${encodeURIComponent("/gio-hang")}`,
    );
  });

  it("returns shouldRedirect=true when hydrated + not authenticated", () => {
    const result = shouldRequireAuth(false, true, "/gio-hang");
    expect(result.shouldRedirect).toBe(true);
    expect(result.loginUrl).toBe(
      `${ROUTES.LOGIN}?redirect=${encodeURIComponent("/gio-hang")}`,
    );
  });

  it("returns shouldRedirect=false when hydrated + authenticated", () => {
    const result = shouldRequireAuth(true, true, "/gio-hang");
    expect(result.shouldRedirect).toBe(false);
  });

  it("builds plain LOGIN url when currentPath is null (no redirect loop)", () => {
    const result = shouldRequireAuth(false, true, null);
    expect(result.shouldRedirect).toBe(true);
    expect(result.loginUrl).toBe(ROUTES.LOGIN);
  });

  it("builds plain LOGIN url when currentPath is empty", () => {
    const result = shouldRequireAuth(false, true, "");
    expect(result.shouldRedirect).toBe(true);
    expect(result.loginUrl).toBe(ROUTES.LOGIN);
  });

  it("ignores external URL in currentPath (sanitized to HOME)", () => {
    const result = shouldRequireAuth(false, true, "https://evil.com/x");
    expect(result.shouldRedirect).toBe(true);
    expect(result.loginUrl).toBe(ROUTES.LOGIN);
  });
});
