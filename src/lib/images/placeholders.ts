/**
 * Placeholder images – URL ảnh fallback khi backend trả imageUrl null/empty.
 *
 * Tại sao cần:
 * - Backend Spring Boot dev (localhost:8080) serialize JPA entity trả
 *   `imageUrl: ""` (chuỗi rỗng) thay vì `null` khi field không được set.
 *   React/Next 16 throw console error: "An empty string ('') was passed
 *   to the src attribute" (xem plan 2026-10-18-fix-empty-image-url-fallback).
 * - Helper `imageUrlWithFallback()` sẽ trỏ về các URL dưới đây khi data lỗi.
 *
 * Quy tắc:
 * - Dùng file LOCAL trong `public/images/` (không cần network, dev offline OK).
 * - Mỗi file 1x1 PNG < 1KB (Next.js optimize sẽ tạo variant lớn hơn).
 * - Khi đổi sang CDN thật, chỉ cần sửa constant này + đảm bảo hostname
 *   trong next.config.ts images.remotePatterns.
 */

export const PLACEHOLDER_PRODUCT = "/images/placeholder-product.png";
export const PLACEHOLDER_AVATAR = "/images/placeholder-avatar.png";
export const PLACEHOLDER_STORE = "/images/placeholder-store.png";

export type ImageKind = "product" | "avatar" | "banner" | "store";

/**
 * Map kind → fallback URL.
 * - "banner" không có placeholder local — caller phải xử lý riêng
 *   (banner section dùng gradient CSS, không cần ảnh fallback).
 *   Helper vẫn return PLACEHOLDER_PRODUCT làm default an toàn.
 */
export const FALLBACK_BY_KIND: Record<ImageKind, string> = {
  product: PLACEHOLDER_PRODUCT,
  avatar: PLACEHOLDER_AVATAR,
  store: PLACEHOLDER_STORE,
  banner: PLACEHOLDER_PRODUCT, // banner section dùng gradient; chỉ là safety net
};
