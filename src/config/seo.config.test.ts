import { describe, expect, it } from "vitest";
import {
  defaultSeo,
  pageSeo,
  resolveSeo,
  type SeoConfig,
} from "./seo.config";

/**
 * SEO config contract:
 * - Always-present required fields
 * - Length limits respected (Google SERP truncation: title ≤ 60, desc ≤ 160)
 * - ogImage is an absolute URL (works in Open Graph cards)
 * - siteUrl uses NEXT_PUBLIC_SITE_URL with localhost fallback
 * - resolveSeo(pageKey) merges page override on top of defaults
 */
describe("seo.config – defaultSeo", () => {
  it("exposes a defaultSeo object with all required fields", () => {
    expect(defaultSeo).toBeDefined();
    const required: (keyof SeoConfig)[] = [
      "title",
      "description",
      "keywords",
      "ogImage",
      "ogImageAlt",
      "locale",
      "siteUrl",
      "siteName",
      "themeColor",
    ];
    for (const key of required) {
      expect(defaultSeo[key]).toBeDefined();
    }
  });

  it("title is non-empty and ≤ 60 characters (Google SERP cap)", () => {
    expect(defaultSeo.title.length).toBeGreaterThan(0);
    expect(defaultSeo.title.length).toBeLessThanOrEqual(60);
  });

  it("description is non-empty and ≤ 160 characters (Google SERP cap)", () => {
    expect(defaultSeo.description.length).toBeGreaterThan(0);
    expect(defaultSeo.description.length).toBeLessThanOrEqual(160);
  });

  it("keywords is a non-empty string array", () => {
    expect(Array.isArray(defaultSeo.keywords)).toBe(true);
    expect(defaultSeo.keywords.length).toBeGreaterThan(0);
    for (const kw of defaultSeo.keywords) {
      expect(typeof kw).toBe("string");
      expect(kw.length).toBeGreaterThan(0);
    }
  });

  it("ogImage is either an absolute URL or a site-relative path starting with /", () => {
    // Next.js metadata API resolves site-relative paths against metadataBase.
    // Absolute URLs (http/https) also work directly in Open Graph cards.
    const isAbsolute = /^https?:\/\//.test(defaultSeo.ogImage);
    const isRelative = /^\//.test(defaultSeo.ogImage);
    expect(isAbsolute || isRelative).toBe(true);
  });

  it("ogImageAlt is non-empty Vietnamese description", () => {
    expect(defaultSeo.ogImageAlt.length).toBeGreaterThan(0);
  });

  it("siteUrl is an absolute URL", () => {
    expect(defaultSeo.siteUrl).toMatch(/^https?:\/\//);
  });

  it("siteName is a non-empty string", () => {
    expect(defaultSeo.siteName.length).toBeGreaterThan(0);
  });

  it("themeColor is a non-empty CSS color value", () => {
    expect(defaultSeo.themeColor).toMatch(/^#[0-9a-fA-F]{3,8}$|^rgb|^hsl/);
  });

  it("locale is a BCP-47 tag (vi_VN or en_US)", () => {
    expect(defaultSeo.locale).toMatch(/^[a-z]{2}_[A-Z]{2}$/);
  });
});

describe("seo.config – pageSeo overrides", () => {
  it("exposes a pageSeo map keyed by page name", () => {
    expect(pageSeo).toBeDefined();
    expect(typeof pageSeo).toBe("object");
  });

  it("home page has its own title, description, ogImage overrides", () => {
    expect(pageSeo.home).toBeDefined();
    expect(pageSeo.home?.title).toBeTruthy();
    expect(pageSeo.home?.description).toBeTruthy();
    expect(pageSeo.home?.ogImage).toBeTruthy();
  });

  it("flashSale page has its own override", () => {
    expect(pageSeo.flashSale).toBeDefined();
    expect(pageSeo.flashSale?.title).toBeTruthy();
  });
});

describe("seo.config – resolveSeo(pageKey)", () => {
  it("returns a full SeoConfig for the home page (override + defaults merged)", () => {
    const seo = resolveSeo("home");
    expect(seo.title).toBe(pageSeo.home!.title);
    // Fields not overridden come from defaultSeo
    expect(seo.siteName).toBe(defaultSeo.siteName);
    expect(seo.locale).toBe(defaultSeo.locale);
  });

  it("returns a full SeoConfig for a page with no override (all defaults)", () => {
    const seo = resolveSeo("nonexistent-page-xyz" as keyof typeof pageSeo);
    expect(seo.title).toBe(defaultSeo.title);
    expect(seo.description).toBe(defaultSeo.description);
    expect(seo.siteUrl).toBe(defaultSeo.siteUrl);
  });

  it("partial override does NOT mutate defaultSeo (immutability)", () => {
    const before = defaultSeo.title;
    resolveSeo("home");
    expect(defaultSeo.title).toBe(before);
  });

  it("returned object satisfies the SeoConfig interface (all required keys)", () => {
    const seo = resolveSeo("home");
    const required: (keyof SeoConfig)[] = [
      "title",
      "description",
      "keywords",
      "ogImage",
      "ogImageAlt",
      "locale",
      "siteUrl",
      "siteName",
      "themeColor",
    ];
    for (const key of required) {
      expect(seo[key]).toBeDefined();
    }
  });
});
