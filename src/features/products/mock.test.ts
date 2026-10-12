/**
 * Sanity test cho mock data — verify structure khớp ProductDetail.
 * Đảm bảo khi BE ready, mock có thể thay bằng API thật mà không phải đổi UI.
 */

import { describe, it, expect } from "vitest";
import { mockProductDetail, mockProductsBySlug, mockAllProductSlugs } from "./mock";

describe("mockProductDetail", () => {
  it("có slug khớp key trong mockProductsBySlug", () => {
    expect(mockProductsBySlug[mockProductDetail.slug]).toBe(mockProductDetail);
    expect(mockAllProductSlugs).toContain(mockProductDetail.slug);
  });

  it("có 5 ảnh (theo Stitch gallery)", () => {
    expect(mockProductDetail.images).toHaveLength(5);
  });

  it("ảnh đầu tiên là primary", () => {
    expect(mockProductDetail.images[0].isPrimary).toBe(true);
  });

  it("imageUrl = ảnh primary", () => {
    expect(mockProductDetail.imageUrl).toBe(mockProductDetail.images[0].url);
  });

  it("có 2 tier variation (Màu Sắc + Kích Thước)", () => {
    expect(mockProductDetail.tierVariationConfigs).toHaveLength(2);
    const names = mockProductDetail.tierVariationConfigs.map((t) => t.name);
    expect(names).toContain("Màu Sắc");
    expect(names).toContain("Kích Thước");
  });

  it("có 12 variants (3 màu x 4 size), 1 disabled (XL)", () => {
    expect(mockProductDetail.variants.length).toBe(12);
    const disabled = mockProductDetail.variants.filter((v) => v.isDisabled);
    expect(disabled).toHaveLength(3); // 3 màu, mỗi màu size XL disabled
    expect(disabled.every((v) => v.attributes["Kích Thước"] === "XL")).toBe(true);
  });

  it("variant ACTIVE có stockQuantity > 0", () => {
    const active = mockProductDetail.variants.filter((v) => v.status === "ACTIVE");
    expect(active.every((v) => v.stockQuantity > 0)).toBe(true);
  });

  it("có flashSale với price < originalPrice", () => {
    expect(mockProductDetail.flashSale).not.toBeNull();
    expect(mockProductDetail.flashSale!.price).toBeLessThan(
      mockProductDetail.flashSale!.originalPrice
    );
  });

  it("có 3 reviews mẫu", () => {
    expect(mockProductDetail.reviews).toHaveLength(3);
  });

  it("review đầu có sellerReply", () => {
    expect(mockProductDetail.reviews[0].sellerReply).not.toBeNull();
  });

  it("review có rating 1-5", () => {
    for (const r of mockProductDetail.reviews) {
      expect(r.rating).toBeGreaterThanOrEqual(1);
      expect(r.rating).toBeLessThanOrEqual(5);
    }
  });

  it("có 4 sản phẩm cùng shop + 3 sản phẩm bán chạy", () => {
    expect(mockProductDetail.relatedSameStore).toHaveLength(4);
    expect(mockProductDetail.relatedBestSellers).toHaveLength(3);
  });

  it("có 3 commitment badges", () => {
    expect(mockProductDetail.commitments).toHaveLength(3);
  });

  it("có 2 vouchers", () => {
    expect(mockProductDetail.vouchers).toHaveLength(2);
  });

  it("có 3 features", () => {
    expect(mockProductDetail.features).toHaveLength(3);
  });

  it("size chart có 4 hàng, M là current", () => {
    expect(mockProductDetail.sizeChart).toHaveLength(4);
    const current = mockProductDetail.sizeChart.filter((r) => r.isCurrent);
    expect(current).toHaveLength(1);
    expect(current[0].size).toBe("M");
  });

  it("XL trong size chart là outOfStock", () => {
    const xl = mockProductDetail.sizeChart.find((r) => r.size === "XL");
    expect(xl?.isOutOfStock).toBe(true);
  });

  it("ratingAvg trong [0, 5]", () => {
    expect(mockProductDetail.ratingAvg).toBeGreaterThanOrEqual(0);
    expect(mockProductDetail.ratingAvg).toBeLessThanOrEqual(5);
  });

  it("image URLs dùng https", () => {
    for (const img of mockProductDetail.images) {
      expect(img.url.startsWith("https://")).toBe(true);
    }
  });
});
