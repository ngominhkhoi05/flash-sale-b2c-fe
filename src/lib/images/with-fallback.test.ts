/**
 * Test: imageUrlWithFallback – chuẩn hoá URL từ backend.
 *
 * Cover 3 nhánh chính của helper:
 * 1. empty / nullish → fallback theo kind
 * 2. absolute URL → as-is
 * 3. relative URL → ghép với NEXT_PUBLIC_API_URL
 *
 * Lý do test quan trọng:
 * - Bug gốc (2026-10-18): backend Spring Boot dev trả `imageUrl: ""` →
 *   React/Next 16 throw "empty string src" console error.
 * - Helper là defensive layer cuối cùng giữa data BE và <img>/<Image>.
 *   Nếu helper miss 1 case, lỗi sẽ lặp lại trong UI.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { imageUrlWithFallback } from "./with-fallback";
import {
  PLACEHOLDER_PRODUCT,
  PLACEHOLDER_AVATAR,
  PLACEHOLDER_STORE,
} from "./placeholders";

describe("imageUrlWithFallback", () => {
  const originalEnv = process.env.NEXT_PUBLIC_API_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:8080";
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_URL = originalEnv;
  });

  describe("empty / nullish input → fallback", () => {
    it("returns product placeholder for null", () => {
      expect(imageUrlWithFallback(null)).toBe(PLACEHOLDER_PRODUCT);
    });

    it("returns product placeholder for undefined", () => {
      expect(imageUrlWithFallback(undefined)).toBe(PLACEHOLDER_PRODUCT);
    });

    it("returns product placeholder for empty string", () => {
      expect(imageUrlWithFallback("")).toBe(PLACEHOLDER_PRODUCT);
    });

    it("returns product placeholder for whitespace-only string", () => {
      expect(imageUrlWithFallback("   ")).toBe(PLACEHOLDER_PRODUCT);
    });

    it("returns avatar placeholder when kind=avatar", () => {
      expect(imageUrlWithFallback(null, "avatar")).toBe(PLACEHOLDER_AVATAR);
    });

    it("returns store placeholder when kind=store", () => {
      expect(imageUrlWithFallback("", "store")).toBe(PLACEHOLDER_STORE);
    });
  });

  describe("absolute URL input → as-is", () => {
    it("preserves https:// URL", () => {
      expect(imageUrlWithFallback("https://cdn.x.com/img.jpg")).toBe(
        "https://cdn.x.com/img.jpg",
      );
    });

    it("preserves http:// URL (covers localhost dev)", () => {
      expect(
        imageUrlWithFallback("http://localhost:8080/banners/hero-1.jpg"),
      ).toBe("http://localhost:8080/banners/hero-1.jpg");
    });

    it("trims surrounding whitespace before checking", () => {
      expect(imageUrlWithFallback("  https://cdn.x.com/img.jpg  ")).toBe(
        "https://cdn.x.com/img.jpg",
      );
    });

    it("preserves protocol-relative URL (//cdn.x.com/...)", () => {
      expect(imageUrlWithFallback("//cdn.x.com/img.jpg")).toBe(
        "//cdn.x.com/img.jpg",
      );
    });

    it("preserves data: URL (inline SVG / base64)", () => {
      expect(imageUrlWithFallback("data:image/png;base64,iVBOR")).toBe(
        "data:image/png;base64,iVBOR",
      );
    });
  });

  describe("relative URL input → prepend NEXT_PUBLIC_API_URL", () => {
    it("prepends base URL to path with leading slash", () => {
      expect(imageUrlWithFallback("/banners/hero-1.jpg")).toBe(
        "http://localhost:8080/banners/hero-1.jpg",
      );
    });

    it("prepends base URL with / to path without leading slash", () => {
      expect(imageUrlWithFallback("banners/hero-1.jpg")).toBe(
        "http://localhost:8080/banners/hero-1.jpg",
      );
    });

    it("strips trailing slash from base URL", () => {
      process.env.NEXT_PUBLIC_API_URL = "http://localhost:8080/";
      expect(imageUrlWithFallback("/x.jpg")).toBe("http://localhost:8080/x.jpg");
    });

    it("handles multiple trailing slashes on base URL", () => {
      process.env.NEXT_PUBLIC_API_URL = "http://localhost:8080///";
      expect(imageUrlWithFallback("/x.jpg")).toBe("http://localhost:8080/x.jpg");
    });

    it("falls back to relative path when NEXT_PUBLIC_API_URL is empty", () => {
      process.env.NEXT_PUBLIC_API_URL = "";
      // Empty base → return as-is (Next.js sẽ resolve relative về same-origin)
      expect(imageUrlWithFallback("/x.jpg")).toBe("/x.jpg");
    });
  });

  describe("edge cases", () => {
    it("never returns empty string (regression for console error)", () => {
      const inputs: Array<string | null | undefined> = [
        null,
        undefined,
        "",
        "   ",
        "\t\n",
      ];
      for (const input of inputs) {
        const result = imageUrlWithFallback(input);
        expect(result).not.toBe("");
        expect(result.length).toBeGreaterThan(0);
      }
    });

    it("treats newline/tab-only as empty (whitespace guard)", () => {
      expect(imageUrlWithFallback("\t\n")).toBe(PLACEHOLDER_PRODUCT);
    });
  });
});
