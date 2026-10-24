/**
 * Unit test cho helpers resolve Google OAuth2 redirect URI.
 *
 * Boi canh: `redirectUri` gui len BE o `POST /api/v1/auth/google` PHAI khop
 * 100% voi `redirect_uri` da dung trong consent URL - neu lech, Google tra
 * `invalid_grant` (HTTP 400 / AUTH_502_GOOGLE_EXCHANGE).
 *
 * Thu tu uu tien:
 * 1. sessionStorage (gia tri lay tu consent URL that) -> luon khop tuyet doi.
 * 2. `NEXT_PUBLIC_GOOGLE_REDIRECT_URI` (env public, inline duoc vao browser).
 * 3. `window.location.origin + pathname` (callback page hien tai).
 */
import { describe, it, expect } from "vitest";
import {
  GOOGLE_CALLBACK_PATH,
  GOOGLE_CONSENT_REDIRECT_URI_KEY,
  extractRedirectUriFromConsentUrl,
  resolveGoogleRedirectUri,
} from "./google-redirect-uri";

describe("extractRedirectUriFromConsentUrl", () => {
  it("trich redirect_uri (da decode) tu consent URL cua Google", () => {
    const url =
      "https://accounts.google.com/o/oauth2/v2/auth?client_id=test&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fgoogle%2Fcallback&response_type=code";

    expect(extractRedirectUriFromConsentUrl(url)).toBe(
      "http://localhost:3000/auth/google/callback"
    );
  });

  it("tra null khi consent URL khong co redirect_uri", () => {
    const url = "https://accounts.google.com/o/oauth2/v2/auth?client_id=test";

    expect(extractRedirectUriFromConsentUrl(url)).toBeNull();
  });

  it("tra null khi consent URL khong phai URL hop le", () => {
    expect(extractRedirectUriFromConsentUrl("not-a-url")).toBeNull();
    expect(extractRedirectUriFromConsentUrl("")).toBeNull();
  });

  it("tra null khi redirect_uri la chuoi rong", () => {
    const url = "https://accounts.google.com/o/oauth2/v2/auth?redirect_uri=";

    expect(extractRedirectUriFromConsentUrl(url)).toBeNull();
  });
});

describe("resolveGoogleRedirectUri", () => {
  it("uu tien gia tri luu trong sessionStorage (khop 100% consent URL)", () => {
    const result = resolveGoogleRedirectUri({
      storedValue: "http://localhost:3000/auth/google/callback",
      envValue: "https://vibe-mart-utc2.canluaz.io.vn/auth/google/callback",
      origin: "http://localhost:3000",
      pathname: "/auth/google/callback",
    });

    expect(result).toBe("http://localhost:3000/auth/google/callback");
  });

  it("fallback sang NEXT_PUBLIC_GOOGLE_REDIRECT_URI khi sessionStorage trong", () => {
    const result = resolveGoogleRedirectUri({
      storedValue: null,
      envValue: "https://vibe-mart-utc2.canluaz.io.vn/auth/google/callback",
      origin: "http://localhost:3000",
      pathname: "/auth/google/callback",
    });

    expect(result).toBe(
      "https://vibe-mart-utc2.canluaz.io.vn/auth/google/callback"
    );
  });

  it("bo qua gia tri rong / chi chua whitespace", () => {
    const result = resolveGoogleRedirectUri({
      storedValue: "   ",
      envValue: "",
      origin: "http://localhost:3000",
      pathname: "/auth/google/callback",
    });

    expect(result).toBe("http://localhost:3000/auth/google/callback");
  });

  it("fallback sang origin + pathname khi khong co env lan sessionStorage", () => {
    const result = resolveGoogleRedirectUri({
      origin: "http://localhost:3000",
      pathname: "/auth/google/callback",
    });

    expect(result).toBe("http://localhost:3000/auth/google/callback");
  });

  it("dung GOOGLE_CALLBACK_PATH khi thieu pathname", () => {
    const result = resolveGoogleRedirectUri({
      origin: "http://localhost:3000",
    });

    expect(result).toBe(`http://localhost:3000${GOOGLE_CALLBACK_PATH}`);
  });

  it("bo qua trailing slash cua origin", () => {
    const result = resolveGoogleRedirectUri({
      origin: "http://localhost:3000/",
      pathname: "/auth/google/callback",
    });

    expect(result).toBe("http://localhost:3000/auth/google/callback");
  });

  it("luon tra ve chuoi khong rong (khong de Zod reject voi url rong)", () => {
    const result = resolveGoogleRedirectUri({});

    expect(result.length).toBeGreaterThan(0);
  });
});

describe("GOOGLE_CONSENT_REDIRECT_URI_KEY", () => {
  it("la key sessionStorage on dinh (khong dung key cua flow popup legacy)", () => {
    expect(GOOGLE_CONSENT_REDIRECT_URI_KEY).toBe(
      "google_oauth_consent_redirect_uri"
    );
    // Flow popup legacy (src/app/oauth2/redirect/page.tsx) dung key khac -
    // 2 flow khong duoc tranh nhau key.
    expect(GOOGLE_CONSENT_REDIRECT_URI_KEY).not.toBe("google_oauth_redirect_uri");
  });
});
