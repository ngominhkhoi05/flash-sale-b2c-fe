/**
 * Sanity test cho mock data — verify structure khớp ProductDetail.
 * Đảm bảo khi BE ready, mock có thể thay bằng API thật mà không phải đổi UI.
 *
 * Updated 2026-10-18 — align với BE `ProductDetailResponse` runtime shape:
 *   - `descriptionRich` là object {intro, highlights[], paragraphs[]}
 *   - `specs` là object {origin, weight, material, warranty}
 *   - `features` là string[]
 *   - `sizeChart` là object {large, standard}
 *   - `flashSales` là array ActiveFlashSale[]
 *   - `minPrice`/`maxPrice` có thể null
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

  it("có 2 tier variation (Color + Size) — dùng key BE runtime", () => {
    expect(mockProductDetail.tierVariationConfigs).toHaveLength(2);
    const names = mockProductDetail.tierVariationConfigs.map((t) => t.name);
    expect(names).toContain("Color");
    expect(names).toContain("Size");
    // KHÔNG còn key tiếng Việt (đã chốt với user 2026-10-18).
    expect(names).not.toContain("Màu Sắc");
    expect(names).not.toContain("Kích Thước");
  });

  it("có 12 variants (3 màu x 4 size), 1 disabled (XL)", () => {
    expect(mockProductDetail.variants.length).toBe(12);
    const disabled = mockProductDetail.variants.filter((v) => v.isDisabled);
    expect(disabled).toHaveLength(3); // 3 màu, mỗi màu size XL disabled
    // BE runtime dùng key 'Size' (English) cho attribute.
    expect(disabled.every((v) => v.attributes["Size"] === "XL")).toBe(true);
    // variants có đầy đủ color + size key (BE shape).
    for (const v of mockProductDetail.variants) {
      expect(v.attributes["Color"]).toBeDefined();
      expect(v.attributes["Size"]).toBeDefined();
    }
  });

  it("variant ACTIVE có stockQuantity > 0", () => {
    const active = mockProductDetail.variants.filter((v) => v.status === "ACTIVE");
    expect(active.every((v) => v.stockQuantity > 0)).toBe(true);
  });

  it("có flashSales là array (BE shape), phần tử đầu là ACTIVE với flashSalePrice < originalPrice", () => {
    expect(Array.isArray(mockProductDetail.flashSales)).toBe(true);
    expect(mockProductDetail.flashSales.length).toBeGreaterThan(0);
    const first = mockProductDetail.flashSales[0]!;
    expect(first.flashSalePrice).toBeLessThan(first.originalPrice);
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

  it("có 4 sản phẩm cùng shop + 3 sản phẩm bán chạy (RelatedProductSummary shape)", () => {
    expect(mockProductDetail.relatedSameStore).toHaveLength(4);
    expect(mockProductDetail.relatedBestSellers).toHaveLength(3);
    // RelatedProductSummary: id number (BE int64), không có href
    for (const p of mockProductDetail.relatedSameStore) {
      expect(typeof p.id).toBe("number");
    }
  });

  it("có commitments object với return_days > 0", () => {
    expect(mockProductDetail.commitments).not.toBeNull();
    expect(mockProductDetail.commitments!.return_days).toBeGreaterThan(0);
  });

  it("có 2 vouchers", () => {
    expect(mockProductDetail.vouchers).toHaveLength(2);
  });

  it("có 5 features (string[] theo BE)", () => {
    expect(mockProductDetail.features).toHaveLength(5);
    for (const f of mockProductDetail.features) {
      expect(typeof f).toBe("string");
    }
  });

  it("sizeChart là object {large, standard} (BE shape)", () => {
    expect(typeof mockProductDetail.sizeChart).toBe("object");
    expect(mockProductDetail.sizeChart).not.toBeNull();
    expect(mockProductDetail.sizeChart.large).toBeDefined();
    expect(mockProductDetail.sizeChart.standard).toBeDefined();
    expect(mockProductDetail.sizeChart.large.width_cm).toBeGreaterThan(0);
    expect(mockProductDetail.sizeChart.standard.height_cm).toBeGreaterThan(0);
  });

  it("specs là object BE shape {origin, weight, material, warranty}", () => {
    expect(typeof mockProductDetail.specs).toBe("object");
    expect(mockProductDetail.specs.origin).toBeDefined();
    expect(mockProductDetail.specs.weight).toBeDefined();
    expect(mockProductDetail.specs.material).toBeDefined();
    expect(mockProductDetail.specs.warranty).toBeDefined();
  });

  it("descriptionRich là object {intro, highlights[], paragraphs[]}", () => {
    expect(typeof mockProductDetail.descriptionRich).toBe("object");
    expect(mockProductDetail.descriptionRich).not.toBeNull();
    expect(typeof mockProductDetail.descriptionRich.intro).toBe("string");
    expect(Array.isArray(mockProductDetail.descriptionRich.highlights)).toBe(true);
    expect(Array.isArray(mockProductDetail.descriptionRich.paragraphs)).toBe(true);
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

  it("storeProfile không có joinedAt (BE không trả)", () => {
    expect(
      (mockProductDetail.storeProfile as unknown as Record<string, unknown>)
        .joinedAt,
    ).toBeUndefined();
  });
});