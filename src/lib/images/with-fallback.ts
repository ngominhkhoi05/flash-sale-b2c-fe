/**
 * imageUrlWithFallback – Chuẩn hoá imageUrl từ backend về URL hợp lệ.
 *
 * Mục đích (xem plan 2026-10-18-fix-empty-image-url-fallback):
 * - Backend Spring Boot dev local (localhost:8080) có thể trả
 *   `imageUrl: ""` (chuỗi rỗng) khi entity JPA có field null được
 *   serialize không chuẩn. React/Next 16 throw console error:
 *   "An empty string ('') was passed to the src attribute".
 * - Helper này đảm bảo 100% trường hợp đầu vào đều trả về URL hợp lệ:
 *     1. null / undefined / "" / "  " → fallback theo `kind`
 *     2. Absolute URL (https://..., http://...) → as-is
 *     3. Relative URL ("/x.jpg", "x.jpg") → ghép với NEXT_PUBLIC_API_URL
 *
 * KHÔNG BAO GIỜ return "" — React sẽ throw console error.
 *
 * @param url   URL từ backend (có thể null/undefined/empty/relative/absolute)
 * @param kind  Loại ảnh, quyết định fallback nào dùng
 *              ("product" | "avatar" | "banner" | "store")
 * @returns     URL hợp lệ (luôn khác rỗng, luôn hợp lệ cho <img src> / <Image src>)
 *
 * @example
 *   imageUrlWithFallback(null, "product")
 *     → "/images/placeholder-product.png"
 *
 *   imageUrlWithFallback("http://localhost:8080/banners/hero-1.jpg", "product")
 *     → "http://localhost:8080/banners/hero-1.jpg"
 *
 *   imageUrlWithFallback("/banners/hero-1.jpg", "product")
 *     // NEXT_PUBLIC_API_URL = "http://localhost:8080/"
 *     → "http://localhost:8080/banners/hero-1.jpg"
 *
 *   imageUrlWithFallback("banners/hero-1.jpg", "product")
 *     // NEXT_PUBLIC_API_URL = "http://localhost:8080"
 *     → "http://localhost:8080/banners/hero-1.jpg"
 */
import { FALLBACK_BY_KIND, type ImageKind } from "./placeholders";

export function imageUrlWithFallback(
  url: string | null | undefined,
  kind: ImageKind = "product",
): string {
  // Case 1: empty / nullish / whitespace → fallback
  if (!url || url.trim() === "") {
    return FALLBACK_BY_KIND[kind];
  }

  const trimmed = url.trim();

  // Case 2: absolute URL (http://, https://, //, data:, blob:, file:)
  //   - http(s)://... → as-is (cho phép cả localhost dev)
  //   - //cdn.x.com/x.jpg → protocol-relative, trả as-is
  //   - data:, blob:, file: → as-is (đã là URL hợp lệ)
  if (
    /^https?:\/\//i.test(trimmed) ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("file:")
  ) {
    return trimmed;
  }

  // Case 3: relative URL → ghép với NEXT_PUBLIC_API_URL
  const base = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  // base có thể rỗng ở test env (không set env) → return relative path vẫn OK
  // vì Next.js sẽ resolve về same-origin. Helper ưu tiên absolute khi có base.
  return base ? `${base}${path}` : path;
}
